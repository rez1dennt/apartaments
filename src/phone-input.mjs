import {AsYouType} from 'libphonenumber-js/min';

export function phoneCharacters(value){
  const chars=String(value??'').replace(/[^+\d]/g,'');
  const raw=(chars.startsWith('+')?'+':'')+chars.replace(/\+/g,'');
  const international=raw.startsWith('00')?'+'+raw.slice(2):raw;
  return (international.startsWith('+')?'+':'')+international.replace(/\D/g,'').slice(0,15);
}
export function formatPhone(value){return new AsYouType('DE').input(phoneCharacters(value));}
export function phoneCaret(value,count){
  if(count<=0)return 0;
  for(let i=0;i<value.length;i++)if(/[+\d]/.test(value[i])&&--count===0)return i+1;
  return value.length;
}
export function setupPhoneMask(input){
  if(!input||input.dataset.phoneMask)return;
  input.dataset.phoneMask='true';input.inputMode='tel';
  if(input.placeholder==='+49 …'||!input.hasAttribute('placeholder'))input.placeholder='+49 ____ _______';
  const wrapper=document.createElement('div');wrapper.className='phone-control';input.before(wrapper);wrapper.append(input);
  const guide=document.createElement('span');guide.className='phone-mask-guide';guide.setAttribute('aria-hidden','true');guide.hidden=true;
  const prefix=document.createElement('span');prefix.textContent='+49';prefix.style.visibility='hidden';guide.append(prefix,document.createTextNode(' ____ _______'));wrapper.append(guide);
  let automaticPrefix=false;
  const updateGuide=()=>{guide.hidden=!(automaticPrefix&&input.value==='+49');guide.style.font=getComputedStyle(input).font;};
  let previous=phoneCharacters(input.value);
  const format=event=>{
    if(event?.isComposing)return;
    let chars=phoneCharacters(input.value);
    let position=phoneCharacters(input.value.slice(0,input.selectionStart??input.value.length)).length;
    // Deleting an inserted separator must also delete the adjacent digit.
    if(chars===previous&&event?.inputType?.startsWith('deleteContent')){
      const backward=event.inputType==='deleteContentBackward';
      const index=backward?position-1:position;
      if(index>=0&&index<chars.length){chars=chars.slice(0,index)+chars.slice(index+1);if(backward)position--;}
    }
    input.value=formatPhone(chars);previous=phoneCharacters(input.value);
    automaticPrefix=previous==='+49';
    updateGuide();
    if(document.activeElement===input){const caret=phoneCaret(input.value,position);input.setSelectionRange(caret,caret);}
  };
  input.addEventListener('input',format);
  input.addEventListener('compositionend',format);
  input.addEventListener('focus',()=>{
    if(!input.value){input.value='+49';automaticPrefix=true;format();input.setSelectionRange(3,3);}
  });
  // Paste replaces the suggested prefix. A national/international prefix can
  // likewise replace it by typing 0 or +, without requiring a country selector.
  const replacePrefix=()=>{if(automaticPrefix)input.setSelectionRange(0,input.value.length);};
  input.addEventListener('paste',replacePrefix);
  input.addEventListener('beforeinput',event=>{if(automaticPrefix&&event.inputType==='insertText'&&/^[+0]/.test(event.data||''))replacePrefix();});
  const clearPrefix=()=>{if(automaticPrefix&&input.value==='+49'){input.value='';previous='';}automaticPrefix=false;updateGuide();};
  input.addEventListener('blur',()=>{clearPrefix();format();});
  input.form?.addEventListener('submit',clearPrefix,{capture:true});
  input.form?.addEventListener('reset',()=>queueMicrotask(()=>{previous=phoneCharacters(input.value);automaticPrefix=false;updateGuide();}));
  format();
}
