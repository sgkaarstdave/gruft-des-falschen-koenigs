import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';

const files=await readdir('vendor/qr');
const qrModules=(await Promise.all(files.filter(name=>name.endsWith('.js')).map(async name=>
  JSON.stringify('./'+name.slice(0,-3))+':(module,require)=>{\n'+await readFile('vendor/qr/'+name,'utf8')+'\n}'
))).join(',');
const qrSource='const qrLoader=(()=>{const modules={'+qrModules+'};const cache={};return function load(name){if(!cache[name]){cache[name]={exports:{}};modules[name](cache[name],load);}return cache[name].exports;};})();\n';
const client=qrSource+await readFile('client.js','utf8');
const assets={page:await readFile('index.html','utf8'),style:await readFile('style.css','utf8'),client,heroImage:(await readFile('hero.webp')).toString('base64'),entryImage:(await readFile('entry.webp')).toString('base64')};
await mkdir('dist/server',{recursive:true});
const sources=await Promise.all(['world.mjs','improv.mjs','game.mjs','worker.mjs'].map(path=>readFile(path,'utf8')));
const bundled=sources.map(code=>code.replace(/^import .*;\n/gm,'').replace(/^export (?!default )/gm,'')).join('\n');
await writeFile('dist/server/index.js','const {page,style,client,heroImage,entryImage}='+JSON.stringify(assets)+';\n'+bundled);
