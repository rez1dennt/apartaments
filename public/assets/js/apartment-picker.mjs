/** Select-only combobox; the native select remains the authoritative form value. */
export function setupApartmentPicker(select){
  const field=select.closest('.form-field'),label=field.querySelector('label');
  const wrapper=document.createElement('div');wrapper.className='apartment-combobox';
  const trigger=document.createElement('button');trigger.type='button';trigger.id=`${select.id}-control`;trigger.className='apartment-choice';trigger.dataset.fieldControl=select.name;
  trigger.setAttribute('role','combobox');trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-describedby',select.getAttribute('aria-describedby')||'');
  label.id ||= `${select.id}-label`;label.htmlFor=trigger.id;trigger.setAttribute('aria-labelledby',label.id);
  const value=document.createElement('span');value.className='apartment-choice-value';
  const icon=document.createElement('span');icon.className='apartment-choice-arrow';icon.setAttribute('aria-hidden','true');
  trigger.append(value,icon);
  const popup=document.createElement('div');popup.id=`${select.id}-options-popup`;popup.className='apartment-popup';popup.hidden=true;
  const list=document.createElement('div');list.id=`${select.id}-options`;list.className='apartment-options';list.setAttribute('role','listbox');list.setAttribute('aria-labelledby',label.id);popup.append(list);
  trigger.setAttribute('aria-controls',list.id);wrapper.append(trigger,popup);select.after(wrapper);select.hidden=true;
  let opened=false,activeIndex=0,animation=null,generation=0,search='',searchTime=0;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const options=()=>Array.from(select.options).filter(option=>!option.disabled&&!option.hidden);
  const refresh=()=>{
    value.textContent=select.selectedOptions[0]?.textContent||'';trigger.disabled=select.disabled;
    const rows=options().map((option,index)=>{
      const row=document.createElement('div');row.id=`${list.id}-${index}`;row.className='apartment-option';row.setAttribute('role','option');row.setAttribute('aria-selected',String(option.selected));row.dataset.optionIndex=index;row.textContent=option.textContent;
      return row;
    });list.replaceChildren(...rows);
  };
  const focusOption=index=>{
    activeIndex=Math.max(0,Math.min(options().length-1,index));
    for(const [i,row]of Array.from(list.children).entries())row.classList.toggle('is-active',i===activeIndex);
    const row=list.children[activeIndex];if(!row)return;
    trigger.setAttribute('aria-activedescendant',row.id);
    // Scroll the option list only; scrollIntoView could also move the modal.
    if(row.offsetTop<list.scrollTop)list.scrollTop=row.offsetTop;
    else if(row.offsetTop+row.offsetHeight>list.scrollTop+list.clientHeight)list.scrollTop=row.offsetTop+row.offsetHeight-list.clientHeight;
  };
  const animate=closing=>{
    const ticket=++generation;
    const currentStyle=animation?getComputedStyle(popup):null;
    const interrupted=currentStyle?{height:`${popup.offsetHeight}px`,opacity:currentStyle.opacity,transform:currentStyle.transform}:null;
    animation?.cancel();animation=null;
    const hide=()=>{if(ticket===generation&&!opened){popup.hidden=true;popup.inert=false;}};
    if(motion.matches){if(closing)hide();return;}
    const style=getComputedStyle(wrapper),height=popup.offsetHeight;
    const expanded={height:`${height}px`,opacity:1,transform:'translateY(0)'};
    const collapsed={height:'0px',opacity:0,transform:popup.classList.contains('is-above')?'translateY(6px)':'translateY(-6px)'};
    animation=popup.animate([interrupted||(closing?expanded:collapsed),closing?collapsed:expanded],{duration:parseFloat(style.getPropertyValue('--duration-normal'))||280,easing:style.getPropertyValue('--ease-out').trim(),fill:'none'});
    const current=animation;
    current.finished.then(()=>{if(closing)hide();if(animation===current)animation=null;}).catch(()=>{});
  };
  const close=(immediate=false)=>{
    if(immediate){opened=false;++generation;animation?.cancel();animation=null;popup.hidden=true;popup.inert=false;wrapper.classList.remove('is-open');trigger.setAttribute('aria-expanded','false');trigger.removeAttribute('aria-activedescendant');return;}
    if(!opened)return;opened=false;wrapper.classList.remove('is-open');trigger.setAttribute('aria-expanded','false');trigger.removeAttribute('aria-activedescendant');popup.inert=true;animate(true);
  };
  const open=()=>{
    if(opened)return;
    select.form.dispatchEvent(new CustomEvent('inquiry-picker-open',{detail:wrapper}));
    refresh();opened=true;popup.hidden=false;popup.inert=false;wrapper.classList.add('is-open');trigger.setAttribute('aria-expanded','true');popup.classList.remove('is-above');list.style.maxHeight='';
    const bounds=wrapper.getBoundingClientRect(),dialog=select.closest('dialog').getBoundingClientRect();
    const below=dialog.bottom-bounds.bottom-16,above=bounds.top-dialog.top-16;
    if(below<popup.offsetHeight&&above>below)popup.classList.add('is-above');
    const available=popup.classList.contains('is-above')?above:below;
    list.style.maxHeight=`${Math.max(88,Math.min(224,available-14))}px`;
    const selected=options().findIndex(option=>option.selected);focusOption(Math.max(0,selected));animate(false);
  };
  const choose=()=>{
    const option=options()[activeIndex];if(!option)return;
    select.value=option.value;select.dispatchEvent(new Event('input',{bubbles:true}));select.dispatchEvent(new Event('change',{bubbles:true}));close();
  };
  trigger.addEventListener('click',()=>opened?close():open());
  trigger.addEventListener('keydown',event=>{
    const key=event.key;
    if(key==='Escape'&&opened){event.preventDefault();event.stopPropagation();close();return;}
    if(key==='Tab'){if(opened)choose();return;}
    if(key==='Enter'||key===' '){event.preventDefault();opened?choose():open();return;}
    if(['ArrowDown','ArrowUp','Home','End','PageDown','PageUp'].includes(key)){
      event.preventDefault();const wasOpen=opened;open();
      if(event.altKey&&key==='ArrowUp'){choose();return;}
      if(key==='Home')focusOption(0);else if(key==='End')focusOption(options().length-1);
      else if(wasOpen)focusOption(activeIndex+({ArrowDown:1,ArrowUp:-1,PageDown:10,PageUp:-10}[key]||0));
      return;
    }
    if(key.length===1&&!event.altKey&&!event.ctrlKey&&!event.metaKey){
      event.preventDefault();open();const now=Date.now();search=now-searchTime>700?'':search;searchTime=now;
      const char=key.toLocaleLowerCase('de');search=search===char?char:search+char;
      const entries=options(),start=search.length===1?activeIndex+1:activeIndex;
      for(let n=0;n<entries.length;n++){const i=(start+n)%entries.length;if(entries[i].textContent.toLocaleLowerCase('de').startsWith(search)){focusOption(i);break;}}
    }
  });
  list.addEventListener('pointerdown',event=>event.preventDefault());
  list.addEventListener('click',event=>{const row=event.target.closest('[data-option-index]');if(!row)return;focusOption(Number(row.dataset.optionIndex));choose();trigger.focus({preventScroll:true});});
  trigger.addEventListener('blur',()=>{if(opened)choose();});
  document.addEventListener('pointerdown',event=>{if(opened&&!wrapper.contains(event.target))choose();});
  select.addEventListener('change',refresh);
  select.form.addEventListener('reset',()=>{close();queueMicrotask(refresh);});
  select.form.addEventListener('inquiry-picker-open',event=>{if(event.detail!==wrapper)close();});
  select.closest('dialog').addEventListener('close',()=>close(true));
  refresh();return {refresh};
}
