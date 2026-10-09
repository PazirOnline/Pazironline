import { chromium } from 'playwright'
import { openApp } from './serve-dist.mjs'

const THEMES = ['noire', 'muse', 'minima', 'verde', 'pulse']
const SIZES = [
  { w: 320, h: 640, m: true, name: 'small' },
  { w: 390, h: 844, m: true, name: 'mobile' },
  { w: 430, h: 932, m: true, name: 'large' },
  { w: 834, h: 1112, m: true, name: 'tablet' },
  { w: 1440, h: 900, m: false, name: 'desktop' },
]

const FA = {
  tuman: '\u062a\u0648\u0645\u0627\u0646', // تومان
  close: '\u0628\u0633\u062a\u0646', // بستن
}

/** Wait until nothing is animating, instead of guessing a duration. */
const settle = (page, ms = 900) =>
  page.evaluate(async (cap) => {
    const done = Promise.all(
      document.getAnimations().map((a) => a.finished.catch(() => {})),
    )
    await Promise.race([done, new Promise((r) => setTimeout(r, cap))])
    await new Promise((r) => requestAnimationFrame(() => r(null)))
  }, ms)

/**
 * Wait for scrolling to actually stop. A category tap on a long page can smooth
 * scroll for well over a second, so a fixed timeout samples mid-flight and
 * reports a correct interaction as a failure.
 */
const settleScroll = (page, cap = 4000) =>
  page.evaluate(async (max) => {
    const start = performance.now()
    let last = window.scrollY
    let still = 0
    while (performance.now() - start < max) {
      await new Promise((r) => setTimeout(r, 60))
      if (Math.abs(window.scrollY - last) < 0.5) {
        if (++still >= 3) break
      } else still = 0
      last = window.scrollY
    }
    await new Promise((r) => requestAnimationFrame(() => r(null)))
  }, cap)

const probe = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s)
    if (!el) return { ok: false, why: 'missing' }
    const bb = el.getBoundingClientRect()
    const vv = window.visualViewport
    const onScreen =
      bb.top >= vv.offsetTop - 1 && bb.bottom <= vv.offsetTop + vv.height + 1
    const hit = document.elementFromPoint(
      (bb.left + bb.right) / 2,
      (bb.top + bb.bottom) / 2,
    )
    return {
      ok: onScreen && !!(hit && el.contains(hit)),
      onScreen,
      hitOk: !!(hit && el.contains(hit)),
      top: Math.round(bb.top),
      bottom: Math.round(bb.bottom),
    }
  }, sel)

const failures = []
const note = (theme, size, msg) => {
  failures.push(`${theme}/${size}: ${msg}`)
  console.log(`  FAIL ${theme}/${size}: ${msg}`)
}

const browser = await chromium.launch()
const counts = { overflow: 0, cta: 0, cartbar: 0, errors: 0, sheets: 0 }

for (const vp of SIZES) {
  for (const theme of THEMES) {
    const { context, page } = await openApp(browser, {
      width: vp.w,
      height: vp.h,
      mobile: vp.m,
      theme,
    })
    const errs = []
    page.on('pageerror', (e) => errs.push(String(e).slice(0, 100)))
    page.on('console', (m) => {
      if (m.type() === 'error') errs.push(m.text().slice(0, 100))
    })

    // Horizontal overflow (§19)
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    if (over > 1) {
      counts.overflow++
      note(theme, vp.name, `horizontal overflow +${over}px`)
    }

    // Category selection (§9)
    const cats = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.rail [role=tab]'))
        .slice(0, 3)
        .map((c) => c.textContent.trim()),
    )
    // Every category must respond to a SINGLE tap (§9). This is the regression
    // guard for the scroll-spy boundary: when the spy and the browser disagree
    // about where a section comes to rest, the first tap scrolls correctly but
    // highlights the previous chip, and only the second tap appears to work.
    if (cats.length >= 2) {
      const railH = await page.evaluate(() =>
        Math.round(document.querySelector('.rail').getBoundingClientRect().height),
      )
      for (let i = 0; i < cats.length; i++) {
        await page.locator('.rail [role=tab]').nth(i).click()
        await settleScroll(page)
        const st = await page.evaluate((idx) => {
          const secs = Array.from(document.querySelectorAll('[id^=section-]'))
          return {
            active: document.querySelector('.rail [role=tab][data-selected="true"]')
              ?.textContent.trim() ?? null,
            top: secs[idx] ? Math.round(secs[idx].getBoundingClientRect().top) : null,
          }
        }, i)
        if (st.active !== cats[i]) {
          note(theme, vp.name, `chip ${i} needed a second tap (active=${st.active})`)
        }
        // The tapped section must land clear of the sticky rail, not behind it.
        if (st.top !== null && st.top < railH - 2) {
          note(theme, vp.name, `section ${i} hidden behind rail (top=${st.top} rail=${railH})`)
        }
      }
    }

    // Open the product sheet (§7)
    await page.evaluate(() =>
      document.getElementById('section-hot')?.scrollIntoView(),
    )
    await settle(page)
    await page
      .locator('#section-hot button')
      .filter({ hasText: FA.tuman })
      .first()
      .click()
    await settle(page)
    counts.sheets++

    const cta = await probe(page, '[data-cta="add-to-cart"]')
    if (!cta.ok) {
      counts.cta++
      note(theme, vp.name, `CTA unreachable ${JSON.stringify(cta)}`)
    }

    // Add, then verify the count badge animated in (§8)
    await page.locator('[data-cta="add-to-cart"]').first().click()
    await page.waitForTimeout(90)
    const popped = await page.evaluate(() => {
      const el = document.querySelector('.cart-count')
      return el ? getComputedStyle(el).animationName : null
    })
    if (!popped || popped === 'none') {
      note(theme, vp.name, 'cart count did not animate')
    }
    await settle(page)

    // Cart bar reachable (§19). Retried: the bar is mid-entrance right after
    // the add, and a single sample can catch it in flight.
    let bar = { ok: false, why: 'not probed' }
    for (let i = 0; i < 4; i++) {
      bar = await probe(page, '[data-cta="open-cart"]')
      if (bar.ok) break
      await page.waitForTimeout(200)
    }
    if (!bar.ok) {
      counts.cartbar++
      note(theme, vp.name, `cart bar unreachable ${JSON.stringify(bar)}`)
    }

    // Open the cart, change quantity, then close (§8)
    await page.locator('[data-cta="open-cart"]').first().click()
    await settle(page)
    const plus = await page.evaluate(() => {
      const d = document.querySelector('[role=dialog]')
      if (!d) return false
      const b = Array.from(d.querySelectorAll('button')).find((x) =>
        x.querySelector('path[d="M12 5v14M5 12h14"]'),
      )
      if (!b) return false
      b.click()
      return true
    })
    if (!plus) note(theme, vp.name, 'quantity stepper not found')
    await settle(page)
    // MINIMA renders the count inline with its label, so compare the leading
    // digit rather than the whole string.
    const qty = await page.evaluate(() => {
      const el = document.querySelector('.cart-count')
      const m = el?.textContent.trim().match(/[\u06f0-\u06f9]/)
      return m ? m[0] : null
    })
    if (plus && qty !== '\u06f2') {
      note(theme, vp.name, `quantity did not step (count=${qty})`)
    }
    // Guard against a stale duplicate badge left by a key collision.
    const nodes = await page.evaluate(
      () => document.querySelectorAll('.cart-count').length,
    )
    if (nodes !== 1) note(theme, vp.name, `${nodes} count badges in DOM`)
    await settle(page)
    await page.locator('[role=dialog] button[aria-label="' + FA.close + '"]').first().click()
    await page.waitForTimeout(70)
    const closing = await page.evaluate(
      () => document.querySelector('[data-state="closing"]') !== null,
    )
    if (!closing) note(theme, vp.name, 'cart sheet had no exit')
    await settle(page)

    if (errs.length) {
      counts.errors += errs.length
      note(theme, vp.name, `console: ${errs[0]}`)
    }

    await context.close()
  }
  process.stdout.write('.')
}

console.log('\n' + '-'.repeat(58))
console.log(`theme x viewport      : ${THEMES.length * SIZES.length}`)
console.log(`sheets opened+closed  : ${counts.sheets}`)
console.log(`horizontal overflow   : ${counts.overflow}`)
console.log(`CTA unreachable       : ${counts.cta}`)
console.log(`cart bar unreachable  : ${counts.cartbar}`)
console.log(`console/page errors   : ${counts.errors}`)
console.log(failures.length === 0 ? '\nALL PASS' : `\n${failures.length} FAILING:\n` + failures.join('\n'))

await browser.close()
process.exit(failures.length === 0 ? 0 : 1)