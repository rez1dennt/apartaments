// German date controls in a Russian browser; all submissions are intercepted.
async(page)=>{
  const checks=[],errors=[];let payload;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/contact.php',async route=>{
    if(route.request().method()==='POST')payload=route.request().postDataJSON();
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({enabled:true,success:true,csrf:'date-test'})});
  });
  for(const width of [1440,768,360,320]){
    await page.setViewportSize({width,height:800});await page.goto('http://127.0.0.1:4173/');
    if(await page.locator('.cookie-banner').isVisible())await page.locator('[data-cookie-necessary]').click();
    await page.locator('.feature-booking [data-inquiry]').click();
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('#inquiry-dialog')).opacity==='1');
    const arrival=page.locator('#inquiry-arrival'),departure=page.locator('#inquiry-departure');
    if(await arrival.getAttribute('placeholder')!=='TT.MM.JJJJ'||await arrival.getAttribute('type')!=='text')throw Error('German placeholder');
    if(width<=420&&(await arrival.boundingBox()).width<180)throw Error('Date field truncates format');
    const today=await arrival.getAttribute('min');
    await arrival.press('ArrowDown');
    const popup=page.locator('#inquiry-arrival-calendar');
    if((await popup.locator('[role=columnheader]').allTextContents()).join(' ')!=='Mo Di Mi Do Fr Sa So')throw Error('German weekdays');
    const bounds=await popup.boundingBox();if(bounds.x<0||bounds.x+bounds.width>width+1)throw Error('Calendar overflow '+JSON.stringify(bounds));
    await page.screenshot({path:`artifacts/german-calendar-${width}.png`});
    await page.keyboard.press('ArrowRight');await page.keyboard.press('PageDown');
    await page.keyboard.press('Escape');
    if(await popup.isVisible()||!await page.locator('#inquiry-dialog').evaluate(el=>el.open)||!await arrival.evaluate(el=>el===document.activeElement))throw Error('Calendar Escape focus');
    await arrival.fill('10.12.2027');await arrival.press('Tab');
    await page.locator('[data-date-field=departure] .date-toggle').click();
    if(await page.locator('#inquiry-departure-calendar .date-calendar-title').textContent()!=='Dezember 2027')throw Error('German month');
    const calendar=page.locator('#inquiry-departure-calendar');
    if(!await calendar.locator('[data-date-value="2027-12-10"]').isDisabled())throw Error('Departure minimum');
    await calendar.locator('[data-date-value="2027-12-12"]').click();
    if(await departure.inputValue()!=='12.12.2027')throw Error('Selected German value');
    await page.locator('#inquiry-name').fill('Date QA');await page.locator('#inquiry-email').fill('qa@example.invalid');await page.locator('[name=consent]').check();
    await arrival.fill('31.02.2028');await page.locator('#inquiry-form [type=submit]').click();
    if(!await page.locator('#error-arrival').isVisible()||await arrival.inputValue()!=='31.02.2028')throw Error('Invalid manual date not retained');
    await arrival.fill('10.12.2027');payload=null;await page.locator('#inquiry-form [type=submit]').click();
    await page.waitForFunction(()=>document.querySelector('.form-status.is-success'));
    if(payload.arrival!=='2027-12-10'||payload.departure!=='2027-12-12')throw Error('ISO payload '+JSON.stringify(payload));
    if(await arrival.inputValue()!==''||await departure.getAttribute('min')!==today)throw Error('Reset dates');
    await page.keyboard.press('Escape');checks.push({width,german:true,keyboard:true,isoPayload:true});
  }
  await page.unroute('**/api/contact.php');if(errors.length)throw Error(errors.join('; '));
  return {browserLanguage:await page.evaluate(()=>navigator.language),checks,errors};
}
