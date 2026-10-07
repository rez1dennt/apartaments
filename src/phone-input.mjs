import {AsYouType} from 'libphonenumber-js/min';

export function phoneCharacters(value){
  const chars=String(value??'').replace(/[^+\d]/g,'');
  const subscriber=chars.startsWith('+49')?chars.slice(3):chars.startsWith('0049')?chars.slice(4):chars;
  return '+49'+subscriber.replace(/\D/g,'').slice(0,13);
}
export function formatPhone(value){return new AsYouType('DE').input(phoneCharacters(value));}
export function serializePhone(value){return phoneCharacters(value)==='+49'?'':formatPhone(value);}
export function phoneCaret(value,count){
  if(count<=3)return 3;
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
  const updateGuide=()=>{guide.hidden=input.value!=='+49';guide.style.font=getComputedStyle(input).font;};
  let previous=phoneCharacters(input.value);
  const format=event=>{
    if(event?.isComposing)return;
    let chars=phoneCharacters(input.value);
    let position=phoneCharacters(input.value.slice(0,input.selectionStart??input.value.length)).length;
    // Deleting an inserted separator must also delete the adjacent digit.
    if(chars===previous&&event?.inputType?.startsWith('deleteContent')){
      const backward=event.inputType==='deleteContentBackward';
      const index=backward?position-1:position;
      if(index>=3&&index<chars.length){chars=chars.slice(0,index)+chars.slice(index+1);if(backward)position--;}
    }
    input.value=formatPhone(chars);previous=phoneCharacters(input.value);
    updateGuide();
    if(document.activeElement===input){const caret=phoneCaret(input.value,position);input.setSelectionRange(caret,caret);}
  };
  input.addEventListener('input',format);
  input.addEventListener('compositionend',format);
  const editableRange=()=>[Math.max(3,input.selectionStart??3),Math.max(3,input.selectionEnd??3)];
  const insert=(digits)=>{
    const [start,end]=editableRange();
    input.value=input.value.slice(0,start)+digits+input.value.slice(end);
    input.setSelectionRange(start+digits.length,start+digits.length);
    input.dispatchEvent(new Event('input',{bubbles:true}));
  };
  input.addEventListener('paste',event=>{
    if(!event.clipboardData)return;
    event.preventDefault();insert(phoneCharacters(event.clipboardData.getData('text')).slice(3));
  });
  input.addEventListener('beforeinput',event=>{
    const [start,end]=editableRange();
    if(event.inputType.startsWith('delete')&&end===3&&((input.selectionStart??3)<3||!['deleteContentForward','deleteWordForward'].includes(event.inputType))){event.preventDefault();return;}
    input.setSelectionRange(start,end);
    if(event.inputType==='deleteWordBackward'&&start===end){
      event.preventDefault();const head=input.value.slice(3,start).replace(/\S+\s*$/,'');
      input.value='+49'+head+input.value.slice(end);input.setSelectionRange(3+head.length,3+head.length);input.dispatchEvent(new Event('input',{bubbles:true}));
    }else if(event.inputType.startsWith('insert')&&/^(?:\+49|0049)/.test(event.data||'')){
      event.preventDefault();insert(phoneCharacters(event.data).slice(3));
    }
  });
  input.addEventListener('keydown',event=>{
    if(event.key==='Home'){event.preventDefault();input.setSelectionRange(3,event.shiftKey?(input.selectionEnd??3):3);}
    if(event.key==='ArrowLeft'&&(input.selectionEnd??3)<=3){event.preventDefault();input.setSelectionRange(3,3);}
  });
  input.addEventListener('focus',format);
  input.addEventListener('blur',format);
  input.form?.addEventListener('reset',()=>queueMicrotask(()=>format()));
  format();
}
