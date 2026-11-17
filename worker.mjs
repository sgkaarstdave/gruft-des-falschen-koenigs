import {newRoom,apply,view} from './game.mjs';
import {page,style,client,heroImage} from './assets.mjs';

const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const roomCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(6)),x=>chars[x%chars.length]).join('');
const decodeId=async token=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');

async function api(req,db){
  const token=req.headers.get('X-Gruft-Key')??'';
  if(!/^[a-f0-9]{48}$/.test(token)) return json({error:'Browser-Kennung fehlt. Lade die Seite neu.'},401);
  const id=await decodeId(token);
  const url=new URL(req.url);
  const code=url.pathname.split('/')[3];
  if(req.method==='POST' && !code){
    const d=await req.json();
    for(let i=0;i<4;i++){
      const key=roomCode();
      const state=newRoom(id,d.solo===true);
      const r=await db.prepare('INSERT OR IGNORE INTO rooms (code,state) VALUES (?,?)').bind(key,JSON.stringify(state)).run();
      if(r.meta.changes) return json(view(state,id,key,0),201);
    }
    return json({error:'Kein freier Raumcode. Versuch es noch einmal.'},503);
  }
  if(!code || !/^[A-Z2-9]{6}$/.test(code)) return json({error:'Ungültiger Raumcode.'},400);
  const row=await db.prepare('SELECT version,state FROM rooms WHERE code=?').bind(code).first();
  if(!row) return json({error:'Unter diesem Code gibt es keinen Raum.'},404);
  const state=JSON.parse(row.state);
  if(req.method==='GET'){
    if(id!==state.host && !state.players.some(p=>p.id===id)) return json({error:'Tritt dem Raum zuerst bei.'},403);
    return json(view(state,id,code,row.version));
  }
  if(req.method!=='POST') return json({error:'Unbekannte Anfrage.'},405);
  const data=await req.json();
  if(data.expected!==undefined && data.expected!==row.version && ['move','roll','keep','help','act','use','give','skill','cancel','ghost','skip'].includes(data.type))
    return json({error:'Am Tisch hat sich etwas geändert. Schau kurz auf den aktuellen Stand und versuch es erneut.'},409);
  try{apply(state,id,data);}catch(error){return json({error:error.message},400);}
  const write=await db.prepare('UPDATE rooms SET version=version+1,state=?,saved=unixepoch() WHERE code=? AND version=?')
    .bind(JSON.stringify(state),code,row.version).run();
  if(!write.meta.changes) return json({error:'Zwei Aktionen kamen gleichzeitig an. Versuch deine bitte erneut.'},409);
  return json(view(state,id,code,row.version+1));
}
const headers={'Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com https://*.oaiusercontent.com; base-uri 'none'; form-action 'self'",'X-Content-Type-Options':'nosniff'};
const response=(body,mime)=>new Response(body,{headers:{...headers,'content-type':mime}});
export default {async fetch(req,env){
  const path=new URL(req.url).pathname;
  if(path==='/api/room' || path.startsWith('/api/room/')){
    if(!env.DB) return json({error:'Die Raumdatenbank ist nicht erreichbar.'},503);
    if(Number(req.headers.get('content-length')??0)>2048) return json({error:'Anfrage zu lang.'},413);
    try{return await api(req,env.DB);}catch(error){console.error(error.message);return json({error:'Die Gruft antwortet gerade nicht. Versuch es gleich nochmal.'},500);}
  }
  if(path==='/style.css') return response(style,'text/css; charset=utf-8');
  if(path==='/app.js') return response(client,'text/javascript; charset=utf-8');
  if(path==='/hero.webp' && heroImage) return response(Uint8Array.from(atob(heroImage),c=>c.charCodeAt(0)),'image/webp');
  if(path==='/' || path==='/index.html') return response(page,'text/html; charset=utf-8');
  return new Response('Nicht gefunden',{status:404});
}};
