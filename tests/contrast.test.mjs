import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
function luminance(hex) {
  return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
}
test('primary and secondary text have AA contrast on the actual light surfaces',async()=>{
  const css=await readFile('public/assets/css/theme.css','utf8');
  const token=name=>css.match(new RegExp(`--${name}:(#[0-9a-fA-F]{6})`))[1];
  for(const [fg,bg] of [['color-text','color-page'],['color-muted','color-page'],['color-muted','color-surface'],['color-muted','color-surface-soft'],['color-on-action','color-action'],['color-on-action','color-action-hover'],['color-error','color-white']]) {
    const a=luminance(token(fg)),b=luminance(token(bg));
    const ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    assert.ok(ratio>=4.5,`${fg} on ${bg}: ${ratio.toFixed(2)}:1`);
  }
});
