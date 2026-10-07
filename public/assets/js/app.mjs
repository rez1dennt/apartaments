import { localToday, validateInquiry } from './validation.mjs';
import { normalizePhoto, positionLabel } from './catalogue.mjs';
import { setupGermanDates, dateToISO, nextDay } from './date-picker.mjs';
import {setupPhoneMask} from './phone-input.mjs';
import {setupApartmentPicker} from './apartment-picker.mjs';

document.documentElement.classList.add('js');
const data = JSON.parse(document.querySelector('#site-data').textContent);
const assetBase='/assets/images/';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
let activeDialog = null;
let opener = null;
let savedScroll = 0;
let savedBodyStyle = '';
let savedRootOverflow = '';

function lockScroll() {
  savedScroll = window.scrollY;
  savedBodyStyle = document.body.getAttribute('style') || '';
  savedRootOverflow = document.documentElement.style.overflow;
  const width = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
  document.documentElement.style.setProperty('--scrollbar-compensation', `${width}px`);
  document.body.style.position = 'fixed';
  document.body.style.top = `-${savedScroll}px`;
  document.body.style.left = '0';
  document.body.style.width = '100%';
  document.body.style.paddingRight = `${width}px`;
  document.documentElement.style.overflow = 'hidden';
}
function unlockScroll() {
  document.body.setAttribute('style', savedBodyStyle);
  document.documentElement.style.overflow = savedRootOverflow;
  document.documentElement.style.removeProperty('--scrollbar-compensation');
  const oldBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo({ top: savedScroll, behavior: 'instant' });
  document.documentElement.style.scrollBehavior = oldBehavior;
}
function finishDialogClose(dialog) {
  if (activeDialog !== dialog) return;
  activeDialog = null;
  unlockScroll();
  $('[data-menu-open]')?.setAttribute('aria-expanded','false');
  if (opener?.isConnected) opener.focus({ preventScroll: true });
  opener = null;
}
const closingDialogs = new WeakMap();
function closeDialog(dialog) {
  if (!dialog.open) return Promise.resolve();
  if (closingDialogs.has(dialog)) return closingDialogs.get(dialog);
  const closing = Promise.resolve().then(async () => {
    dialog.dataset.closing = 'true';
    let animation;
    if (!motion.matches) {
      const style=getComputedStyle(dialog);
      const isMenu=dialog.id==='mobile-menu';
      const current=getComputedStyle(dialog);
      animation=dialog.animate([{opacity:current.opacity,transform:current.transform},{opacity:0,transform:isMenu?'translateX(2.5rem)':'translateY(8px)'}],{
        duration:parseFloat(style.getPropertyValue(isMenu?'--duration-menu-close':dialog.id==='inquiry-dialog'?'--duration-normal':'--duration-fast')) || 160,
        easing:style.getPropertyValue(isMenu?'--ease-in':'--ease').trim(),fill:'forwards'
      });
      await animation.finished.catch(()=>{});
    }
    dialog.close();
    // Native close can focus the opener before the queued close event; restore
    // synchronously in the same task to avoid a frame at the top of the page.
    finishDialogClose(dialog);
    animation?.cancel();
    delete dialog.dataset.closing;
    closingDialogs.delete(dialog);
  });
  closingDialogs.set(dialog,closing);
  return closing;
}
async function openDialog(dialog, trigger) {
  if (!dialog || activeDialog === dialog) return;
  if (activeDialog) await closeDialog(activeDialog);
  opener = trigger || document.activeElement;
  activeDialog = dialog;
  lockScroll();
  dialog.showModal();
  if (dialog.id === 'mobile-menu') $('[data-menu-open]')?.setAttribute('aria-expanded','true');
}
$$('dialog').forEach(dialog => {
  dialog.addEventListener('close', () => finishDialogClose(dialog));
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
  // A backdrop click closes only if both press and release originated outside the dialog.
  let downOutside = false;
  const outside = event => {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  };
  dialog.addEventListener('pointerdown', event => { downOutside = event.target === dialog && outside(event); });
  dialog.addEventListener('click', event => { if (downOutside && event.target === dialog && outside(event)) closeDialog(dialog); downOutside = false; });
});
$$('[data-dialog-close]').forEach(button => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));
$('[data-menu-open]')?.addEventListener('click', event => openDialog($('#mobile-menu'),event.currentTarget));
$$('#mobile-menu nav a').forEach(link => link.addEventListener('click', async event => {
  const destination = new URL(link.href);
  const samePage = destination.pathname === location.pathname;
  event.preventDefault();
  await closeDialog($('#mobile-menu'));
  if (samePage && destination.hash) {
    const target = document.getElementById(destination.hash.slice(1));
    if (target) {
      history.replaceState(null,'',destination.hash);
      target.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
      target.setAttribute('tabindex','-1');
      target.focus({ preventScroll:true });
    }
  } else location.assign(link.href);
}));
window.matchMedia('(min-width: 801px)').addEventListener('change', event => {
  if (event.matches && $('#mobile-menu').open) closeDialog($('#mobile-menu'));
});

let selectedUnit = 0;
let expanded = false;
const cards = $$('[data-unit]');
function expandCatalogue(value) {
  expanded = value;
  $('#apartment-list')?.classList.toggle('is-expanded',expanded);
  const button = $('[data-catalogue-toggle]');
  if (button) {
    button.setAttribute('aria-expanded',String(expanded));
    button.querySelector('span').textContent = expanded ? data.less : data.all;
  }
}
function selectUnit(index, scroll = false) {
  if (!cards.length || !data.apartments.length) return;
  selectedUnit = (index + data.apartments.length) % data.apartments.length;
  const unit = data.apartments[selectedUnit];
  const number=unit.number ? String(unit.number) : String(selectedUnit+1).padStart(2,'0');
  $('[data-unit-label]').textContent = `${data.apartment.toUpperCase()} ${number}`;
  $('[data-unit-title]').textContent = unit.title;
  $('[data-unit-description]').textContent = unit.description;
  $('[data-unit-details]').textContent = unit.details ?? (unit.guests && unit.area ? `${unit.guests} · ${unit.area} m²` : data.details);
  $('[data-unit-price]').textContent = unit.priceLabel ?? (unit.price ? `${unit.price} €` : data.price);
  $('.feature-booking .fineprint').textContent=unit.conditions ?? data.reservation;
  const booking=$('.feature-booking [data-inquiry]');
  booking.dataset.apartment = unit.id;
  const placeholder=$('.photo-placeholder');
  placeholder.hidden = !unit.preview;
  const hasPhotos=currentPhotos().length>0;
  const cover=normalizePhoto(unit.cover,assetBase,data.imageAlts);
  const hasImage=hasPhotos||!!cover;
  placeholder.hidden=hasImage;
  placeholder.querySelector('.placeholder-number').textContent=number;
  $('.feature-photo').hidden = !hasImage;
  $('.feature-photo').disabled = !hasPhotos;
  $('.photo-label').hidden = !hasPhotos;
  $('.photo-expand').hidden = !hasPhotos;
  $('.gallery-thumbnails').hidden = !hasPhotos;
  const note=$('.gallery-footnote');
  note.textContent=unit.galleryNote ?? data.galleryNote;
  note.hidden=!hasPhotos||!note.textContent;
  $('.apartment-feature').setAttribute('aria-label',`${data.apartment} ${number}`);
  cards.forEach((card,i) => { card.classList.toggle('is-selected',i === selectedUnit); card.setAttribute('aria-pressed',String(i === selectedUnit)); });
  $('[data-unit-position]').textContent = positionLabel(selectedUnit,data.apartments.length);
  $('.position-line i').style.width = `${(selectedUnit+1) / data.apartments.length * 100}%`;
  if(Array.isArray(unit.amenities)) {
    const list=$('.amenities');
    $('.amenity-label').hidden=!unit.amenities.length;
    list.replaceChildren(...unit.amenities.map(item=>{
      const row=document.createElement('li');
      const icon=data.iconMarkup?.[item.icon];
      if(icon){const wrapper=document.createElement('span');wrapper.innerHTML=icon;row.append(...wrapper.childNodes);}
      const label=document.createElement('span');label.textContent=item.label;row.append(label);return row;
    }));
  }
  photoIndex=0;
  renderPhotoButtons();
  showPhoto(0);
  if(!hasPhotos&&cover)setInlinePhoto(cover);
  const visibleCount = window.innerWidth <= 600 ? 4 : 5;
  if (selectedUnit >= visibleCount) expandCatalogue(true);
  if (scroll) $('.apartment-feature').scrollIntoView({behavior:motion.matches?'instant':'smooth',block:'start'});
}
cards.forEach(card => {
  card.addEventListener('click',event=>{event.preventDefault();selectUnit(data.apartments.findIndex(unit=>String(unit.id)===card.dataset.unit),true);});
  card.addEventListener('keydown',event=>{if(event.key===' '){event.preventDefault();card.click();}});
});
$('[data-catalogue-toggle]')?.addEventListener('click',()=>expandCatalogue(!expanded));
$('[data-unit-prev]')?.addEventListener('click',()=>selectUnit(selectedUnit-1));
$('[data-unit-next]')?.addEventListener('click',()=>selectUnit(selectedUnit+1));
$$('[data-unit-prev], [data-unit-next]').forEach(button=>{button.disabled=data.apartments.length<2;});

let benefit = 0;
function setBenefit(index) {
  if(!data.benefitTitles.length)return;
  benefit=(index+data.benefitTitles.length)%data.benefitTitles.length;
  $('[data-benefit-title]').textContent=data.benefitTitles[benefit];
  $('[data-benefit-body]').textContent=data.benefitBodies[benefit];
  $('[data-benefit-count]').textContent=positionLabel(benefit,data.benefitTitles.length);
}
$('[data-benefit-prev]')?.addEventListener('click',()=>setBenefit(benefit-1));
$('[data-benefit-next]')?.addEventListener('click',()=>setBenefit(benefit+1));
$$('[data-benefit-prev], [data-benefit-next]').forEach(button=>{button.disabled=data.benefitTitles.length<2;});

let photoIndex=0;
function currentPhotos() {
  return (data.apartments[selectedUnit]?.photos||[]).map(photo=>normalizePhoto(photo,assetBase,data.imageAlts)).filter(Boolean);
}
function renderPhotoButtons() {
  const photos=currentPhotos();
  const photoLabel=(photo,index)=>photo.alt||(data.labels?.gallery_photo??data.gallery).replace('{number}',String(index+1));
  const thumbnails=$('.gallery-thumbnails');
  if(thumbnails)thumbnails.replaceChildren(...photos.map((photo,index)=>{
    const button=document.createElement('button');button.type='button';button.className='thumbnail';button.dataset.galleryIndex=index;
    button.setAttribute('aria-label',photoLabel(photo,index));button.setAttribute('aria-pressed',String(index===photoIndex));
    const image=document.createElement('img');image.src=photo.url;image.srcset=photo.srcset;image.sizes='90px';image.width=photo.width;image.height=photo.height;image.alt=photo.alt;image.loading='lazy';image.decoding='async';button.append(image);return button;
  }));
  $('.gallery-dots')?.replaceChildren(...photos.map((photo,index)=>{
    const button=document.createElement('button');button.type='button';button.dataset.photoGo=index;
    button.setAttribute('aria-label',photoLabel(photo,index));button.setAttribute('aria-pressed',String(index===photoIndex));return button;
  }));
}
function setInlinePhoto(photo) {
  const image=$('.feature-photo img');
  if(!image)return;
  image.srcset=photo.srcset;image.src=photo.url;image.alt=photo.alt;
  image.style.objectPosition={kitchen:'50% 60%',bathroom:'50% 55%','bathroom-detail':'50% 58%',hallway:'50% 48%','single-room':'50% 67%'}[photo.name]||'50% 65%';
  if(!motion.matches) {
    image.getAnimations().forEach(animation=>animation.cancel());
    image.animate([{opacity:.65},{opacity:1}],{duration:parseFloat(getComputedStyle(image).getPropertyValue('--duration-normal')),easing:'ease-out'});
  }
}
function showPhoto(index) {
  const photos=currentPhotos();
  $$('[data-photo-prev], [data-photo-next]').forEach(button=>{button.disabled=photos.length<2;});
  $('[data-gallery-position]').textContent=positionLabel(index,photos.length);
  if(!photos.length){photoIndex=0;return;}
  photoIndex=(index+photos.length)%photos.length;
  const photo=photos[photoIndex];
  const image=$('[data-gallery-image]');
  image.hidden=false;
  const empty=$('[data-gallery-empty]');if(empty)empty.hidden=true;
  image.src=photo.url;
  image.alt=photo.alt;
  $('[data-gallery-caption]').textContent=photo.alt;
  $('[data-gallery-position]').textContent=positionLabel(photoIndex,photos.length);
  $$('[data-photo-go]').forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===photoIndex)));
  $$('[data-gallery-index]').forEach((thumb,i)=>thumb.setAttribute('aria-pressed',String(i===photoIndex)));
  setInlinePhoto(photo);
  const count=$('.photo-label');
  if(count)count.textContent=String(data.galleryCount).replace(/\{count\}/g,photos.length).replace(/^\d+(?=\s)/,photos.length);
  const nextImage=new Image();
  nextImage.src=photos[(photoIndex+1)%photos.length].url;
}
$('.gallery-thumbnails')?.addEventListener('click',event=>{const button=event.target.closest('[data-gallery-index]');if(button)showPhoto(Number(button.dataset.galleryIndex));});
$$('[data-gallery-open]').forEach(button=>button.addEventListener('click',()=>{showPhoto(photoIndex);openDialog($('#gallery-dialog'),button);}));
$('[data-photo-prev]').addEventListener('click',()=>showPhoto(photoIndex-1));
$('[data-photo-next]').addEventListener('click',()=>showPhoto(photoIndex+1));
$('.gallery-dots').addEventListener('click',event=>{const button=event.target.closest('[data-photo-go]');if(button)showPhoto(Number(button.dataset.photoGo));});
$$('[data-photo-prev], [data-photo-next]').forEach(button=>{button.disabled=currentPhotos().length<2;});
$('#gallery-dialog').addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft'){event.preventDefault();showPhoto(photoIndex-1);}
  if(event.key==='ArrowRight'){event.preventDefault();showPhoto(photoIndex+1);}
});
$$('.feature-photo, .gallery-stage').forEach(surface=>{
  let swipeStart=null;
  let suppressClick=false;
  surface.addEventListener('pointerdown',event=>{
    suppressClick=false;
    if(!event.isPrimary){swipeStart=null;return;}
    if(event.button!==0||event.target.closest('[data-photo-prev], [data-photo-next]'))return;
    swipeStart={id:event.pointerId,x:event.clientX,y:event.clientY};
    surface.setPointerCapture(event.pointerId);
  });
  surface.addEventListener('pointerup',event=>{
    if(!swipeStart||event.pointerId!==swipeStart.id)return;
    const dx=event.clientX-swipeStart.x,dy=event.clientY-swipeStart.y;
    swipeStart=null;
    suppressClick=Math.abs(dx)>10||Math.abs(dy)>10;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.5)showPhoto(photoIndex+(dx<0?1:-1));
  });
  const cancelSwipe=event=>{if(event.pointerId===swipeStart?.id)swipeStart=null;};
  surface.addEventListener('pointercancel',cancelSwipe);
  surface.addEventListener('lostpointercapture',cancelSwipe);
  surface.addEventListener('dragstart',event=>event.preventDefault());
  surface.addEventListener('click',event=>{
    if(!suppressClick||event.detail===0)return;
    suppressClick=false;
    event.preventDefault();
    event.stopImmediatePropagation();
  },true);
});

// Keep native details/summary semantics while animating the actual document flow.
$$('.faq-list details').forEach(detail=>{
  const summary=detail.querySelector('summary');
  let expanded=detail.open;
  let animation=null;
  let revision=0;
  summary.setAttribute('aria-expanded',String(expanded));
  summary.addEventListener('click',event=>{
    event.preventDefault();
    const currentHeight=detail.getBoundingClientRect().height;
    expanded=!expanded;
    const operation=++revision;
    animation?.cancel();
    detail.dataset.expanded=String(expanded);
    summary.setAttribute('aria-expanded',String(expanded));
    if(motion.matches) {
      detail.open=expanded;
      detail.style.height='';
      delete detail.dataset.animating;
      return;
    }
    // Remain open through closing; remove open only after the height settles.
    detail.style.height='';
    detail.open=true;
    const borders=getComputedStyle(detail);
    const border=(parseFloat(borders.borderBottomWidth)||0)+(parseFloat(borders.borderTopWidth)||0);
    const targetHeight=expanded?detail.getBoundingClientRect().height:summary.getBoundingClientRect().height+border;
    detail.dataset.animating='true';
    const style=getComputedStyle(detail);
    animation=detail.animate([{height:`${currentHeight}px`},{height:`${targetHeight}px`}],{
      duration:parseFloat(style.getPropertyValue('--duration-disclosure')),
      easing:style.getPropertyValue('--ease-out').trim(),fill:'both'
    });
    animation.finished.then(()=>{
      if(operation!==revision)return;
      detail.open=expanded;
      animation.cancel();
      animation=null;
      detail.style.height='';
      delete detail.dataset.animating;
    }).catch(()=>{});
  });
});

const cookieKey='ba-privacy-v1';
let cookieChoice=null;
try {
  const saved=JSON.parse(localStorage.getItem(cookieKey));
  if(saved?.version===1&&saved.expires>Date.now()&&['acknowledged','necessary'].includes(saved.choice))cookieChoice=saved;
  else localStorage.removeItem(cookieKey);
}catch{}
$('.cookie-banner').hidden=!!cookieChoice;
function saveCookies(choice='necessary') {
  cookieChoice={version:1,choice,expires:Date.now()+180*24*60*60*1000};
  try{localStorage.setItem(cookieKey,JSON.stringify(cookieChoice));}catch{}
  $('.cookie-banner').hidden=true;
  if($('#cookie-dialog').open)closeDialog($('#cookie-dialog'));
}
$$('[data-cookie-open]').forEach(button=>button.addEventListener('click',()=>openDialog($('#cookie-dialog'),button)));
$('[data-cookie-accept]').addEventListener('click',()=>saveCookies('acknowledged'));
$('[data-cookie-necessary]').addEventListener('click',()=>saveCookies('necessary'));
$('[data-cookie-save]').addEventListener('click',()=>saveCookies('necessary'));

const form=$('#inquiry-form');
setupPhoneMask(form.elements.phone);
const apartmentPicker=setupApartmentPicker(form.elements.apartment);
const fieldControl=key=>document.querySelector(`[data-field-control="${key}"]`)||form.elements[key];
const status=$('.form-status');
let contactConfig={enabled:false,csrf:null};
const contactEndpoint=data.contactEndpoint||'/api/contact.php';
let configRequest=null;
function setStatus(message, error=false) {
  status.textContent=message;
  status.hidden=false;
  status.classList.toggle('is-error',error);
  status.classList.toggle('is-success',!error);
}
async function loadContactConfig() {
  if(configRequest)return configRequest;
  configRequest=(async()=>{
    try {
      if(!contactEndpoint)throw new Error('Missing endpoint');
      const response=await fetch(contactEndpoint,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(8000)});
      if(!response.ok)throw new Error('Configuration unavailable');
      const json=await response.json();
      contactConfig={enabled:json.enabled===true,csrf:typeof json.csrf==='string'?json.csrf:null};
    }catch{contactConfig={enabled:false,csrf:null};}
    return contactConfig;
  })();
  try{return await configRequest;}finally{configRequest=null;}
}
$$('[data-inquiry]').forEach(link=>link.addEventListener('click',event=>{
  event.preventDefault();
  form.elements.apartment.value=link.dataset.apartment||'';
  apartmentPicker.refresh();
  status.hidden=true;
  openDialog($('#inquiry-dialog'),link);
  loadContactConfig();
}));
const today=localToday();
form.elements.arrival.min=today;
form.elements.departure.min=today;
setupGermanDates(form,data.datePicker);
const updateDepartureMinimum=()=>{const arrival=dateToISO(form.elements.arrival.value);form.elements.departure.min=arrival?nextDay(arrival):localToday();};
form.elements.arrival.addEventListener('change',updateDepartureMinimum);
form.elements.arrival.addEventListener('input',updateDepartureMinimum);
form.addEventListener('reset',()=>queueMicrotask(()=>{form.elements.arrival.min=localToday();form.elements.departure.min=localToday();}));
function clearErrors() {
  $$('.field-error').forEach(error=>{error.hidden=true;error.textContent='';});
  $$('[aria-invalid]').forEach(field=>field.removeAttribute('aria-invalid'));
}
function displayErrors(errors) {
  for(const [key,code] of Object.entries(errors)) {
    const field=fieldControl(key);
    const node=$(`#error-${key}`);
    if(field)field.setAttribute('aria-invalid','true');
    if(node){node.textContent=data.errors[code]||data.error;node.hidden=false;}
  }
  fieldControl(Object.keys(errors)[0])?.focus();
}
form.addEventListener('input',event=>{
  const key=event.target.name;
  const error=$(`#error-${key}`);
  if(error){error.hidden=true;fieldControl(key)?.removeAttribute('aria-invalid');}
  status.hidden=true;
});
form.addEventListener('submit',async event=>{
  event.preventDefault();
  clearErrors();
  status.hidden=true;
  const values=Object.fromEntries(new FormData(form));
  for(const key of ['arrival','departure'])values[key]=dateToISO(values[key])??values[key];
  values.consent=form.elements.consent.checked;
  const errors=validateInquiry(values,localToday(),data.apartments.map(unit=>unit.id));
  if(Object.keys(errors).length){displayErrors(errors);return;}
  const submit=form.querySelector('[type=submit]');
  if(submit.disabled)return;
  submit.disabled=true;
  submit.setAttribute('aria-busy','true');
  $('[data-submit-label]').textContent=data.submitting;
  try {
    await loadContactConfig();
    if(!contactConfig.enabled||!contactConfig.csrf)throw new Error('Mail service unavailable');
    const response=await fetch(contactEndpoint,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':contactConfig.csrf},body:JSON.stringify({...values,language:document.documentElement.lang,consentVersion:'2026-10-01'}),signal:AbortSignal.timeout(15000)});
    const result=await response.json();
    if(response.ok&&result.success===true){form.reset();setStatus(data.success);contactConfig.csrf=result.csrf;}
    else if(result.errors){displayErrors(result.errors);}
    else{setStatus(data.error,true);}
  }catch{setStatus(data.error,true);}
  finally{submit.disabled=false;submit.removeAttribute('aria-busy');$('[data-submit-label]').textContent=data.submit;}
});
