// Run through Playwright MCP browser_run_code_unsafe with filename.
async (page) => {
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(10000);
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const touch = await page.context().newCDPSession(page);
  await touch.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
  const activeIndex = () => page.locator('[data-gallery-index][aria-pressed="true"]').getAttribute('data-gallery-index');
  const gesture = async (selector, dx, dy = 0, cancel = false) => {
    const box = await page.locator(selector).boundingBox();
    const x = box.x + box.width * (dx < 0 ? .8 : .2);
    const y = Math.max(120, box.y + box.height / 2);
    const point = (x, y) => ({ x, y, id: 1, radiusX: 1, radiusY: 1, force: 1 });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(x, y)] });
    for (let step = 1; step <= 8; step++) {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(x + dx * step / 8, y + dy * step / 8)] });
      await page.waitForTimeout(16);
    }
    await touch.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
  };
  const results = [];
  for (const base of ['http://127.0.0.1:4173/']) for (const width of [1440, 768, 360, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base);
    if (await page.locator('.cookie-banner').isVisible()) await page.locator('[data-cookie-necessary]').click();
    await page.locator('.feature-photo').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const distance = Math.min(180, (await page.locator('.feature-photo').boundingBox()).width * .6);
    await gesture('.feature-photo', -distance);
    assert(await activeIndex() === '1', `Inline left swipe must select next photo at ${width}px`);
    assert(!await page.locator('#gallery-dialog').evaluate(el => el.open), 'Swipe must not open enlarged gallery');
    assert((await page.locator('.feature-photo img').getAttribute('src')).includes('kitchen-'), 'Swipe must update the main image');
    await gesture('.feature-photo', distance);
    assert(await activeIndex() === '0', 'Right swipe must select previous photo');
    await gesture('.feature-photo', distance);
    assert(await activeIndex() === '6', 'Right swipe from first photo must wrap to last');
    await gesture('.feature-photo', -distance);
    assert(await activeIndex() === '0', 'Left swipe from last photo must wrap to first');
    await gesture('.feature-photo', -distance, 0, true);
    assert(await activeIndex() === '0', 'Cancelled swipe must not change photo');
    await gesture('.feature-photo', -20);
    assert(await activeIndex() === '0', 'Short movement must not change photo');
    assert(!await page.locator('#gallery-dialog').evaluate(el => el.open), 'Short drag must not open gallery');
    const beforeScroll = await page.evaluate(() => scrollY);
    await gesture('.feature-photo', -5, -100);
    assert(await activeIndex() === '0', 'Vertical gesture must not change photo');
    assert(await page.evaluate(() => scrollY) > beforeScroll + 20, 'Vertical page scrolling must remain available');
    await page.locator('[data-gallery-index="2"]').click();
    assert(await activeIndex() === '2', 'Thumbnails must still select photos');
    await page.locator('.feature-photo').click();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#gallery-dialog')).opacity === '1');
    assert((await page.locator('[data-gallery-position]').innerText()) === '03 / 07', 'Enlarge must show selected photo');
    await gesture('.gallery-stage', -distance);
    assert(await activeIndex() === '3', 'Enlarged gallery left swipe must select next photo');
    await gesture('.gallery-stage', distance);
    assert(await activeIndex() === '2', 'Enlarged gallery right swipe must select previous photo');
    await page.locator('[data-photo-next]').click();
    assert(await activeIndex() === '3', 'Gallery arrow must still select photo');
    await page.keyboard.press('ArrowLeft');
    assert(await activeIndex() === '2', 'Gallery keyboard must still select photo');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('#gallery-dialog').open);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}px`);
    await page.locator('.feature-photo img').evaluate(image => image.decode());
    await page.locator('.feature-media').screenshot({ path: `artifacts/gallery-swipe-${base.includes('apartaments')?'wordpress':'static'}-${width}.png` });
    results.push({ base, width, swipe: 'both directions, wraparound, cancelled and short gestures', verticalScroll: 'passed', controls: 'passed' });
  }
  await touch.send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await touch.detach();
  assert(errors.length === 0, 'Browser errors: ' + errors.join('; '));
  return { results, errors };
}
