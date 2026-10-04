async (page) => {
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://127.0.0.1:4173/');
  if(await page.locator('.cookie-banner').isVisible())await page.locator('[data-cookie-necessary]').click();
  await page.locator('[data-gallery-index="1"]').click();
  const inline=await page.evaluate(()=>({src:document.querySelector('.feature-photo img').src,modal:document.querySelector('#gallery-dialog').open,pressed:document.querySelector('[data-gallery-index="1"]').getAttribute('aria-pressed')}));
  assert(inline.src.includes('kitchen-')&&!inline.modal&&inline.pressed==='true','Thumbnail must change inline photo without opening modal: '+JSON.stringify(inline));
  await page.locator('.feature-photo').click();
  await page.waitForFunction(()=>document.querySelector('#gallery-dialog').open);
  assert((await page.locator('[data-gallery-image]').getAttribute('src')).includes('kitchen-'),'Enlarge should show selected photo');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('#gallery-dialog').open);
  const frameHeight=await page.locator('.feature-photo').evaluate(el=>el.getBoundingClientRect().height);
  for(let index=0;index<7;index++) {
    await page.locator(`[data-gallery-index="${index}"]`).click();
    await page.locator('.feature-photo img').evaluate(image=>image.decode());
    const state=await page.evaluate(()=>({open:document.querySelector('#gallery-dialog').open,height:document.querySelector('.feature-photo').getBoundingClientRect().height,active:document.querySelectorAll('[data-gallery-index][aria-pressed="true"]').length}));
    assert(!state.open&&Math.abs(state.height-frameHeight)<1&&state.active===1,'Photo selection must preserve the frame and one selected thumbnail');
  }
  await page.locator('.faq-list summary').first().click();
  const opening=await page.evaluate(()=>({open:document.querySelector('.faq-list details').open,animations:document.querySelector('.faq-list details').getAnimations().length,expanded:document.querySelector('.faq-list summary').getAttribute('aria-expanded')}));
  assert(opening.open&&opening.animations>0&&opening.expanded==='true','FAQ must animate its opening height: '+JSON.stringify(opening));
  await page.waitForFunction(()=>!document.querySelector('.faq-list details').getAnimations().some(a=>a.playState==='running'));
  await page.locator('.faq-list summary').first().click();
  assert(await page.locator('.faq-list details').first().getAttribute('open')!==null,'FAQ must retain content while closing');
  await page.waitForFunction(()=>!document.querySelector('.faq-list details').open);
  await page.locator('.faq-list summary').first().evaluate(el=>{el.click();el.click();el.click();});
  await page.waitForFunction(()=>!document.querySelector('.faq-list details').getAnimations().some(a=>a.playState==='running'));
  assert(await page.locator('.faq-list details').first().getAttribute('open')!==null,'Rapid FAQ clicks should finish in requested open state');
  await page.locator('.faq-list summary').first().click();
  await page.waitForFunction(()=>!document.querySelector('.faq-list details').open);
  await page.setViewportSize({width:360,height:800});
  await page.locator('[data-menu-open]').click();
  const menu=await page.evaluate(()=>{const el=document.querySelector('#mobile-menu'),cs=getComputedStyle(el);return {animation:cs.animationName,duration:parseFloat(cs.animationDuration),label:document.querySelector('[data-menu-open]').textContent.trim()};});
  assert(menu.animation==='menu-reveal'&&menu.duration>=.5&&menu.label.includes('Menü'),'Menu needs a slower tailored reveal and labelled button: '+JSON.stringify(menu));
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('#mobile-menu').open);
  return {inlinePhoto:inline,faq:'animated open and close',menu};
}
