// Run through Playwright MCP browser_run_code_unsafe with filename.
async (page) => {
  page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(10000);
  const results=[], errors=[], failed=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('requestfailed',request=>failed.push(request.url()));
  const base='http://127.0.0.1:4173';
  const routes=['/','/impressum/','/datenschutz/','/einwilligung/','/cookies/'];
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  for(const width of [1440,768,360,320]) {
    await page.setViewportSize({width,height:900});
    for(const route of routes) {
      const response=await page.goto(base+route);
      await page.evaluate(()=>document.fonts.ready);
      const result=await page.evaluate(({width,route,status})=>({width,route,status,h1:document.querySelectorAll('main h1').length,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,headerTop:document.querySelector('header').getBoundingClientRect().top}),{width,route,status:response.status()});
      assert(result.status===200&&result.h1===1&&result.overflow===0&&result.headerTop===0,JSON.stringify(result));
      results.push(result);
    }
  }
  const interactions=[];
  for(const width of [1440,360,320]) {
    await page.setViewportSize({width,height:800});
    await page.goto(base+'/');
    if(await page.locator('.cookie-banner').isVisible())await page.locator('[data-cookie-necessary]').click();
    await page.evaluate(()=>window.scrollTo({top:580,behavior:'instant'}));
    const before=await page.evaluate(()=>({scroll:scrollY,logo:document.querySelector('.wordmark').getBoundingClientRect().x,width:document.querySelector('.container').getBoundingClientRect().width}));
    const opener=width===1440?page.locator('.header-contact'):page.locator('[data-menu-open]');
    await opener.click();
    const id=width===1440?'inquiry-dialog':'mobile-menu';
    await page.waitForFunction(id=>getComputedStyle(document.getElementById(id)).opacity==='1',id);
    const opened=await page.evaluate(()=>({logo:document.querySelector('.wordmark').getBoundingClientRect().x,width:document.querySelector('.container').getBoundingClientRect().width,overflow:getComputedStyle(document.documentElement).overflow}));
    assert(Math.abs(before.logo-opened.logo)<1&&Math.abs(before.width-opened.width)<1&&opened.overflow==='hidden','Unstable scroll lock at '+width);
    await page.keyboard.press('Escape');
    await page.waitForFunction(id=>!document.getElementById(id).open,id);
    const after=await page.evaluate(()=>({scroll:scrollY,focused:document.activeElement.matches('.header-contact,[data-menu-open]')}));
    assert(Math.abs(before.scroll-after.scroll)<1&&after.focused,'Incorrect scroll/focus restoration at '+width);
    interactions.push({width,scroll:after.scroll,restored:true});
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base+'/');
  await page.locator('[data-gallery-open]').click();
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#gallery-dialog')).opacity==='1');
  await page.keyboard.press('ArrowRight');
  assert((await page.locator('[data-gallery-position]').innerText())==='02 / 07','Gallery keyboard failed');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('#gallery-dialog').open);
  await page.locator('[data-catalogue-toggle]').click();
  assert(await page.locator('[data-unit]:visible').count()===15,'15 catalogue cards not present');
  await page.locator('[data-unit="15"]').click();
  await page.route('**/api/contact.php',async route=>{await route.fulfill({status:200,contentType:'application/json',body:route.request().method()==='POST'?'{"success":true,"csrf":"browser-test"}':'{"enabled":true,"csrf":"browser-test"}'});});
  await page.locator('.feature-booking [data-inquiry]').click();
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#inquiry-dialog')).opacity==='1');
  assert(await page.locator('#inquiry-apartment').inputValue()==='15','Apartment selection not propagated');
  await page.locator('#inquiry-form [type=submit]').click();
  assert(await page.locator('.field-error:not([hidden])').count()===3,'Required validation not displayed');
  await page.locator('#inquiry-name').fill('Anna Tester');
  await page.locator('#inquiry-email').fill('anna@example.com');
  await page.locator('input[name=consent]').check();
  await page.locator('#inquiry-form [type=submit]').click();await page.locator('.form-status.is-success').waitFor();
  assert((await page.locator('.form-status').innerText()).includes('Vielen Dank'),'Mail acceptance message');await page.unroute('**/api/contact.php');
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!document.querySelector('#inquiry-dialog').open);
  await page.locator('.faq-list summary').first().click();
  assert(await page.locator('.faq-list details[open]').count()===1,'FAQ did not expand');
  await page.locator('.faq-list summary').first().click();
  await page.locator('.footer-bottom [data-cookie-open]').click();
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#cookie-dialog')).opacity==='1');
  await page.locator('[data-cookie-save]').click();
  await page.waitForFunction(()=>!document.querySelector('#cookie-dialog').open);
  await page.reload();
  assert(!await page.locator('.cookie-banner').isVisible(),'Cookie choice not persisted');
  const api=await page.request.get(base+'/api/contact.php');
  const config=await api.json();
  assert(typeof config.enabled==='boolean' && (config.enabled?typeof config.csrf==='string':config.csrf===null),'API configuration must match transport availability');
  const disabledPost=await page.request.post(base+'/api/contact.php',{data:{name:'Test',email:'test@example.com',consent:true}});
  assert(disabledPost.status()===(config.enabled?403:503),'Untrusted API request must not accept messages');
  const privateFile=await page.request.get(base+'/server/config.example.php');
  assert(privateFile.status()===404,'Private server configuration is exposed');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:360,height:800});
  for (let repeat=0;repeat<3;repeat++) {
    await page.locator('[data-menu-open]').click();
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>!document.querySelector('#mobile-menu').open);
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  assert(errors.length===0,'Page errors: '+errors.join('; '));
  assert(failed.length===0,'Failed requests: '+failed.join('; '));
  return {routeViewportChecks:results.length,viewports:[1440,768,360,320],scrollLock:interactions,gallery:'passed',catalogue:'15 units, selection passed',form:'validation and simulated mail acceptance passed',cookies:'persist and reopen passed',faq:'passed',reducedMotion:'passed',api:'untrusted request and private file blocked',pageErrors:errors,failedRequests:failed};
}
