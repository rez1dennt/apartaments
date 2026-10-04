import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { apartments } from '../src/apartments.mjs';
import { legalSlugs } from '../src/legal.mjs';
import { escape } from '../src/templates.mjs';

async function htmlFiles(directory) {
  const out=[];
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    const path=resolve(directory,entry.name);
    if(entry.isDirectory())out.push(...await htmlFiles(path));
    else if(entry.name.endsWith('.html'))out.push(path);
  }
  return out;
}
test('build produces only the German homepage and four legal pages',async()=>{
  for(const slug of ['',...legalSlugs.de])await access(resolve('public',slug,'index.html'));
  assert.equal((await htmlFiles(resolve('public'))).length,5);
  await assert.rejects(access(resolve('public/ru')));
  for(const file of await htmlFiles(resolve('public'))) {
    const html=await readFile(file,'utf8');
    assert.match(html,/<html lang="de">/);
    assert.doesNotMatch(html,/(?:href="\/ru\/|hreflang="ru"|class="language-switch")/);
  }
});
test('generated pages have one h1, unique title and valid local resources',async()=>{
  const titles=new Set();
  for(const file of await htmlFiles(resolve('public'))) {
    const html=await readFile(file,'utf8');
    assert.equal((html.match(/<h1[\s>]/g)||[]).length,1,file);
    const title=html.match(/<title>([^<]+)<\/title>/)[1];
    assert.ok(!titles.has(title),'duplicate title');titles.add(title);
    assert.match(html,/<meta name="description" content="[^"]+">/);
    for(const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      const target=match[1];
      const disk=resolve('public','.'+target,target.endsWith('/')?'index.html':'');
      await assert.doesNotReject(access(disk),`${file}: ${target}`);
    }
    for(const match of html.matchAll(/<script type="application\/(?:ld\+json|json)"[^>]*>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>JSON.parse(match[1]));
  }
});
test('catalogue contains exactly 15 unique units with honest missing facts',()=>{
  assert.equal(apartments.length,15);
  assert.deepEqual(apartments.map(a=>a.id),Array.from({length:15},(_,i)=>i+1));
  assert.equal(apartments.filter(a=>a.preview).length,14);
  assert.equal(apartments[0].photos.length,7);
  for(const unit of apartments){assert.equal(unit.area,null);assert.equal(unit.price,null);assert.equal(unit.guests,null);}
});
test('preview is excluded from indexing and does not invent a public domain',async()=>{
  if(process.env.SITE_ORIGIN)return;
  assert.match(await readFile('public/robots.txt','utf8'),/Disallow: \//);
  for(const file of await htmlFiles(resolve('public')))assert.match(await readFile(file,'utf8'),/noindex, nofollow/);
  assert.doesNotMatch(await readFile('public/sitemap.xml','utf8'),/<loc>/);
});
test('HTML escaping neutralizes untrusted title characters',()=>{
  assert.equal(escape('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
