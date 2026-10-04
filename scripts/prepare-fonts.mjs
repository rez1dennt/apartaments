import { readFile, writeFile } from 'node:fs/promises';
const modern = await readFile('scripts/font-source-modern.css','utf8');
const urls = [...new Set([...modern.matchAll(/https:\/\/fonts\.gstatic\.com\/[^)\s]+/g)].map(m=>m[0]))];
const blocks = [...modern.matchAll(/\/\* ([^*]+) \*\/\s*(@font-face\s*\{[^}]+\})/g)];
const selected = [];
const seen = new Set();
for (const [,subset,block] of blocks) {
  if (!['latin-ext','latin'].includes(subset)) continue;
  const url=block.match(/https:\/\/fonts\.gstatic\.com\/[^)\s]+/)[0];
  if(seen.has(url))continue;
  seen.add(url);
  selected.push(block.replace(url,`/assets/fonts/subset-${urls.indexOf(url)+1}.woff2`).replace(/font-weight: \d+;/,block.includes('Manrope')?'font-weight: 400 600;':'font-weight: 400 500;'));
}
const theme=await readFile('public/assets/css/theme.css','utf8');
await writeFile('public/assets/css/theme.css',selected.join('\n')+'\n'+theme.slice(theme.indexOf(':root{')));
const template=await readFile('src/templates.mjs','utf8');
await writeFile('src/templates.mjs',template.replace('/assets/fonts/font-1.ttf','/assets/fonts/subset-5.woff2').replace('/assets/fonts/font-3.ttf','/assets/fonts/subset-11.woff2').replaceAll('type="font/ttf"','type="font/woff2"'));
console.log(`Prepared ${selected.length} local WOFF2 subsets.`);
