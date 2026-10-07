import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { homepage, layout, legalPage } from '../src/templates.mjs';
import { legal } from '../src/legal.mjs';

const originInput = process.env.SITE_ORIGIN || '';
if (originInput) {
  const url = new URL(originInput);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new Error('SITE_ORIGIN must be the final HTTPS origin, without a subdirectory, query or credentials.');
}
const origin = originInput.replace(/\/$/, '');
const publicRoot = resolve('public');
await build({entryPoints:['src/phone-input.mjs'],outfile:resolve(publicRoot,'assets/js/phone-input.mjs'),bundle:true,format:'esm',target:'es2022',minify:true,banner:{js:'/* libphonenumber-js: MIT license in ../licenses/libphonenumber-js.txt */'}});
await mkdir(resolve(publicRoot,'assets/licenses'),{recursive:true});
await copyFile('node_modules/libphonenumber-js/LICENSE',resolve(publicRoot,'assets/licenses/libphonenumber-js.txt'));
const routes=[];
for (const lang of ['de']) {
  const prefix = '';
  const pages = [{slug:'', body:homepage(lang)}, ...Object.entries(legal[lang]).map(([slug,page])=>({slug,body:legalPage(lang,page),title:`${page.title} — Bergedorf Apartments`,description:page.subtitle}))];
  for (const page of pages) {
    const directory=resolve(publicRoot, prefix, page.slug);
    await mkdir(directory,{recursive:true});
    await writeFile(resolve(directory,'index.html'),layout(lang,page.body,{...page,origin}));
    routes.push(`/${prefix}${page.slug ? page.slug + '/' : ''}`);
  }
}
await writeFile(resolve(publicRoot,'robots.txt'),origin ? `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${origin}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n');
await writeFile(resolve(publicRoot,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${origin ? routes.map(r=>`<url><loc>${origin}${r}</loc></url>`).join('') : ''}</urlset>\n`);
console.log(`Built ${routes.length} pages (${origin || 'preview: indexing disabled'}).`);
