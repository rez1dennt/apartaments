import {localToday} from './validation.mjs';

export const datePickerDefaults={placeholder:'TT.MM.JJJJ',open:'Kalender öffnen',previous:'Vorheriger Monat',next:'Nächster Monat',clear:'Datum löschen',title:'Datum auswählen'};
const pad=value=>String(value).padStart(2,'0');
function utcDate(year,month,day){const d=new Date(0);d.setUTCHours(12,0,0,0);d.setUTCFullYear(year,month,day);return d;}
function fromISO(iso){const [y,m,d]=iso.split('-').map(Number);return utcDate(y,m-1,d);}
function isoDate(date){return date.toISOString().slice(0,10);}
export function dateToISO(value){
  const text=String(value??'').trim();if(!text)return '';
  let match=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text);let year,month,day;
  if(match){[,day,month,year]=match;}
  else {match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(text);if(!match)return null;[,year,month,day]=match;}
  const d=utcDate(Number(year),Number(month)-1,Number(day));
  return d.getUTCFullYear()===Number(year)&&d.getUTCMonth()===Number(month)-1&&d.getUTCDate()===Number(day)?`${year}-${month}-${day}`:null;
}
export function formatGermanDate(value){const iso=dateToISO(value);if(!iso)return '';const [y,m,d]=iso.split('-');return `${d}.${m}.${y}`;}
export function nextDay(iso){const d=fromISO(iso);d.setUTCDate(d.getUTCDate()+1);return isoDate(d);}
export function calendarDays(year,month){
  const first=utcDate(year,month,1);first.setUTCDate(1-(first.getUTCDay()+6)%7);
  return Array.from({length:42},(_,i)=>{const d=new Date(first);d.setUTCDate(first.getUTCDate()+i);return isoDate(d);});
}

/** A local German calendar avoids browser/OS localisation of native date controls. */
export function setupGermanDates(form,options={}){
  const labels=Object.fromEntries(Object.entries(datePickerDefaults).map(([key,value])=>[key,options[key]??value]));
  const monthFormatter=new Intl.DateTimeFormat('de-DE',{month:'long',year:'numeric',timeZone:'UTC'});
  const dayFormatter=new Intl.DateTimeFormat('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
  let active=null;
  for(const name of ['arrival','departure']){
    const input=form.elements[name];if(!input||input.dataset.germanDate)continue;
    input.closest('.form-field')?.classList.add('form-field-date');
    input.type='text';input.lang='de-DE';input.placeholder=labels.placeholder;input.inputMode='numeric';input.autocomplete='off';input.maxLength=10;input.dataset.germanDate='true';
    if(input.value)input.value=formatGermanDate(input.value);
    const wrapper=document.createElement('div');wrapper.className='date-control';wrapper.dataset.dateField=name;
    input.before(wrapper);wrapper.append(input);
    const toggle=document.createElement('button');toggle.type='button';toggle.className='date-toggle';toggle.setAttribute('aria-label',labels.open);toggle.setAttribute('aria-haspopup','dialog');toggle.setAttribute('aria-expanded','false');
    toggle.innerHTML='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2ZM7 2v4M17 2v4M3 10h18M7 14h2m2 0h2m2 0h2M7 17h2m2 0h2"/></svg>';
    const popup=document.createElement('div');popup.id=`${input.id}-calendar`;popup.className='date-calendar';popup.hidden=true;popup.lang='de-DE';popup.setAttribute('role','dialog');popup.setAttribute('aria-label',labels.title);toggle.setAttribute('aria-controls',popup.id);
    const header=document.createElement('div');header.className='date-calendar-header';
    const button=(text,label)=>{const el=document.createElement('button');el.type='button';el.textContent=text;if(label)el.setAttribute('aria-label',label);return el;};
    const previous=button('‹',labels.previous),next=button('›',labels.next),title=document.createElement('span');title.className='date-calendar-title';title.setAttribute('aria-live','polite');
    header.append(previous,title,next);
    const grid=document.createElement('div');grid.className='date-calendar-grid';grid.setAttribute('role','grid');grid.setAttribute('aria-label',labels.title);
    const clear=button(labels.clear);clear.className='date-calendar-clear';popup.append(header,grid,clear);wrapper.append(toggle,popup);
    let viewYear,viewMonth,focusDate;
    const minimum=()=>input.min&&input.min>localToday()?input.min:localToday();
    const close=(restore=false)=>{popup.hidden=true;toggle.setAttribute('aria-expanded','false');if(active?.popup===popup)active=null;if(restore)input.focus({preventScroll:true});};
    const focusDay=()=>grid.querySelector(`[data-date-value="${focusDate}"]`)?.focus({preventScroll:true});
    const showMonth=()=>{
      const selected=dateToISO(input.value),min=minimum(),today=localToday();
      title.textContent=monthFormatter.format(utcDate(viewYear,viewMonth,1));
      const lastPrevious=utcDate(viewYear,viewMonth,0);previous.disabled=isoDate(lastPrevious)<min;
      const weekdays=document.createElement('div');weekdays.className='date-calendar-row date-calendar-weekdays';weekdays.setAttribute('role','row');
      for(const text of ['Mo','Di','Mi','Do','Fr','Sa','So']){const cell=document.createElement('span');cell.textContent=text;cell.setAttribute('role','columnheader');weekdays.append(cell);}
      const days=calendarDays(viewYear,viewMonth);const nodes=[weekdays];
      for(let row=0;row<6;row++){
        const line=document.createElement('div');line.className='date-calendar-row';line.setAttribute('role','row');
        for(const iso of days.slice(row*7,row*7+7)){
          const d=fromISO(iso),cell=button(String(d.getUTCDate()),dayFormatter.format(d));cell.dataset.dateValue=iso;cell.setAttribute('role','gridcell');cell.setAttribute('aria-selected',String(iso===selected));cell.disabled=iso<min;cell.tabIndex=iso===focusDate?0:-1;
          if(d.getUTCMonth()!==viewMonth)cell.classList.add('is-other-month');if(iso===today)cell.setAttribute('aria-current','date');line.append(cell);
        }
        nodes.push(line);
      }
      grid.replaceChildren(...nodes);
    };
    const open=()=>{
      form.dispatchEvent(new CustomEvent('inquiry-picker-open',{detail:wrapper}));
      active?.close();focusDate=dateToISO(input.value)||minimum();if(focusDate<minimum())focusDate=minimum();
      const d=fromISO(focusDate);viewYear=d.getUTCFullYear();viewMonth=d.getUTCMonth();showMonth();popup.hidden=false;toggle.setAttribute('aria-expanded','true');active={popup,close};
      popup.classList.remove('is-above');const fieldBox=wrapper.getBoundingClientRect(),box=form.closest('dialog')?.getBoundingClientRect();
      if(box&&box.bottom-fieldBox.bottom<popup.offsetHeight&&fieldBox.top-box.top>popup.offsetHeight)popup.classList.add('is-above');
      popup.scrollIntoView({block:'nearest',behavior:'instant'});focusDay();
    };
    const move=(iso)=>{focusDate=iso<minimum()?minimum():iso;const d=fromISO(focusDate);viewYear=d.getUTCFullYear();viewMonth=d.getUTCMonth();showMonth();focusDay();};
    const monthMove=(direction,focus=true)=>{
      const d=utcDate(viewYear,viewMonth+direction,1),last=utcDate(d.getUTCFullYear(),d.getUTCMonth()+1,0).getUTCDate();
      d.setUTCDate(Math.min(fromISO(focusDate).getUTCDate(),last));
      const iso=isoDate(d);focusDate=iso<minimum()?minimum():iso;const view=fromISO(focusDate);viewYear=view.getUTCFullYear();viewMonth=view.getUTCMonth();showMonth();if(focus)focusDay();
    };
    const choose=(iso)=>{input.value=iso?formatGermanDate(iso):'';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));close(true);};
    toggle.addEventListener('click',()=>popup.hidden?open():close(true));
    input.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();open();}});
    input.addEventListener('blur',()=>{const iso=dateToISO(input.value);if(iso)input.value=formatGermanDate(iso);});
    previous.addEventListener('click',()=>monthMove(-1,false));next.addEventListener('click',()=>monthMove(1,false));clear.addEventListener('click',()=>choose(''));
    grid.addEventListener('click',event=>{const cell=event.target.closest('[data-date-value]');if(cell&&!cell.disabled)choose(cell.dataset.dateValue);});
    popup.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);return;}
      const iso=event.target.dataset.dateValue;if(!iso)return;
      const offset={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[event.key];
      if(offset!==undefined){event.preventDefault();const d=fromISO(iso);d.setUTCDate(d.getUTCDate()+offset);move(isoDate(d));}
      else if(event.key==='Home'||event.key==='End'){event.preventDefault();const d=fromISO(iso),weekday=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()+(event.key==='Home'?-weekday:6-weekday));move(isoDate(d));}
      else if(event.key==='PageUp'||event.key==='PageDown'){event.preventDefault();monthMove(event.key==='PageUp'?-1:1);}
    });
    document.addEventListener('pointerdown',event=>{if(!popup.hidden&&!wrapper.contains(event.target))close();});
    document.addEventListener('focusin',event=>{if(!popup.hidden&&!wrapper.contains(event.target))close();});
    form.addEventListener('reset',()=>close());form.closest('dialog')?.addEventListener('close',()=>close());
    form.addEventListener('inquiry-picker-open',event=>{if(event.detail!==wrapper)close();});
  }
}
