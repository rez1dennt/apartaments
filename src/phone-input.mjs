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
    if(document.activeElement===input){const caret=phoneCaret(input.value,position);input.setSelectionRange(caret,caret);}
  };
  input.addEventListener('input',format);
  input.addEventListener('compositionend',format);
  input.addEventListener('blur',format);
  input.form?.addEventListener('reset',()=>queueMicrotask(()=>{previous=phoneCharacters(input.value);}));
  format();
}
