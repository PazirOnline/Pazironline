import { chromium } from 'playwright'
import { openApp, ORIGIN, serveDist } from './serve-dist.mjs'

const THEMES = ['noire', 'muse', 'minima', 'verde', 'pulse']
const fails = []
const note = (m) => {
  fails.push(m)
  console.log('  FAIL ' + m)
}

const browser = await chromium.launch()

// ---------------------------------------------------------------------------
// 1. Reduced motion (§18): ambient loops must actually STOP, travel must be
//    gone, but state changes must still be visible.
// ---------------------------------------------------------------------------
console.log('\n== reduced motion ==')
for (const theme of THEMES) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'fa-IR',
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await serveDist(page)
  await page.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    (t) => localStorage.setItem('menudigitaly.theme.v1', t),
    theme,
  )
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(700)

  // No animation may be running in a loop.
  const looping = await page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity)
      .map((a) => a.animationName || a.constructor.name),
  )
  if (looping.length) note(`${theme}: ${looping.length} infinite animation(s) still running: ${looping.join(',')}`)

  // Travel tokens must be zeroed.
  const tokens = await page.evaluate(() => {
    const cs = getComputedStyle(document.body)
    return {
      rise: cs.getPropertyValue('--motion-rise').trim(),
      sheet: cs.getPropertyValue('--motion-sheet').trim(),
      countIn: cs.getPropertyValue('--count-in').trim(),
    }
  })
  if (tokens.rise !== '0px') note(`${theme}: --motion-rise is ${tokens.rise}, expected 0px`)
  if (tokens.sheet !== '0px') note(`${theme}: --motion-sheet is ${tokens.sheet}, expected 0px`)
  if (tokens.countIn !== '1') note(`${theme}: --count-in is ${tokens.countIn}, expected 1`)

  // The sheet must still *appear* — a state change with no signal at all
  // would be more confusing than motion.
  await page.evaluate(() => document.getElementById('section-hot')?.scrollIntoView())
  await page.waitForTimeout(300)
  await page.locator('#section-hot button').filter({ hasText: '\u062a\u0648\u0645\u0627\u0646' }).first().click()
  await page.waitForTimeout(120)
  const mid = await page.evaluate(() => {
    const o = document.querySelector('[data-state]')
    const s = o?.querySelector('[class*=sheet]') ?? o
    if (!s) return null
    const cs = getComputedStyle(s)
    return { tf: cs.transform, anim: cs.animationName }
  })
  if (!mid) note(`${theme}: no sheet under reduced motion`)
  else if (mid.tf !== 'none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(mid.tf)) {
    note(`${theme}: sheet still displaced under reduced motion (${mid.tf})`)
  }
  const op = await page.evaluate(() => {
    const o = document.querySelector('[data-state]')
    const s = o?.querySelector('[class*=sheet]') ?? o
    return s ? +(+getComputedStyle(s).opacity).toFixed(2) : null
  })
  if (op !== null && op === 0) note(`${theme}: sheet invisible under reduced motion`)

  // Still usable: the CTA must be reachable and work.
  const cta = await page.evaluate(() => {
    const el = document.querySelector('[data-cta="add-to-cart"]')
    if (!el) return 'missing'
    const bb = el.getBoundingClientRect()
    const hit = document.elementFromPoint((bb.left + bb.right) / 2, (bb.top + bb.bottom) / 2)
    return hit && el.contains(hit) ? 'ok' : 'blocked'
  })
  if (cta !== 'ok') note(`${theme}: CTA ${cta} under reduced motion`)
  await page.locator('[data-cta="add-to-cart"]').first().click()
  await page.waitForTimeout(300)
  const count = await page.evaluate(() => document.querySelector('.cart-count')?.textContent.trim())
  if (!count || !/\u06f1/.test(count)) note(`${theme}: cart did not accept the item under reduced motion (${count})`)

  console.log(`  ${theme.padEnd(7)} loops=${looping.length} rise=${tokens.rise} cta=${cta} count=${count}`)
  await context.close()
}

// ---------------------------------------------------------------------------
// 2. Theme gallery + switching (§13) and cart persistence (§23)
// ---------------------------------------------------------------------------
console.log('\n== gallery / switching / persistence ==')
for (const theme of THEMES) {
  const { context, page } = await openApp(browser, {
    width: 390,
    height: 844,
    mobile: true,
    theme,
  })
  const errs = []
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 80)))

  // Open the gallery.
  await page.locator('button[aria-label]').filter({ hasText: '' }).nth(0).click().catch(() => {})
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) =>
      (x.getAttribute('aria-label') || '').includes('\u0638\u0627\u0647\u0631'),
    )
    b?.click()
  })
  await page.waitForTimeout(600)
  const galleryOpen = await page.evaluate(
    () => document.querySelector('[data-state] [aria-label]') !== null,
  )
  if (!galleryOpen) note(`${theme}: gallery did not open`)

  // Switch to a different theme from inside the gallery. The cards are the
  // buttons carrying aria-pressed; pick one that is not already active.
  const switched = await page.evaluate(() => {
    const before = document.documentElement.dataset.theme
    const cards = Array.from(
      document.querySelectorAll('[role=dialog] button[aria-pressed]'),
    )
    const other = cards.find((c) => c.getAttribute('aria-pressed') === 'false')
    if (!other) return { ok: false, before, cards: cards.length }
    other.click()
    return { ok: true, before }
  })
  if (!switched.ok) note(`${theme}: no selectable theme card found (${switched.cards} cards)`)
  await page.waitForTimeout(900)
  const after = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    overlays: document.querySelectorAll('[data-state]').length,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
  }))
  if (switched.ok && after.theme === switched.before) {
    note(`${theme}: theme did not change from the gallery`)
  }
  if (after.overlays !== 0) note(`${theme}: ${after.overlays} overlay(s) left after switching`)
  if (after.overflow > 1) note(`${theme}: overflow +${after.overflow}px after switching`)

  // Add something, reload, confirm the cart survived (§23).
  await page.evaluate(() => document.getElementById('section-hot')?.scrollIntoView())
  await page.waitForTimeout(300)
  await page.locator('#section-hot button').filter({ hasText: '\u062a\u0648\u0645\u0627\u0646' }).first().click()
  await page.waitForTimeout(500)
  await page.locator('[data-cta="add-to-cart"]').first().click()
  await page.waitForTimeout(600)
  const beforeReload = await page.evaluate(
    () => document.querySelector('.cart-count')?.textContent.trim(),
  )
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  const afterReload = await page.evaluate(
    () => document.querySelector('.cart-count')?.textContent.trim(),
  )
  if (!beforeReload || !afterReload || !/\u06f1/.test(afterReload)) {
    note(`${theme}: cart lost on reload (${beforeReload} -> ${afterReload})`)
  }
  if (errs.length) note(`${theme}: console: ${errs[0]}`)

  console.log(
    `  ${theme.padEnd(7)} gallery=${galleryOpen} ${switched.before}->${after.theme} overlays=${after.overlays} cart=${beforeReload}->${afterReload}`,
  )
  await context.close()
}

console.log('\n' + '-'.repeat(58))
console.log(fails.length === 0 ? 'ALL PASS' : `${fails.length} FAILING:\n` + fails.join('\n'))
await browser.close()
process.exit(fails.length === 0 ? 0 : 1)
