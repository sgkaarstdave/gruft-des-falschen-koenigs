const app=document.querySelector('#app');
const toast=document.querySelector('#message');
const topStatus=document.querySelector('#status');
const read=(key,fallback='')=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
const write=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
const key=read('gruft.key') || Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,'0')).join('');
write('gruft.key',key);
const params=new URLSearchParams(location.search);
const invite=params.get('join')?.toUpperCase();
let state=null;
let sending=false;
let toastTimer;
const stats=['Kraft','Geschick','Magie'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=esc;
const button=(text,type,value='',cls='',disabled=false)=>'<button type="button" class="'+cls+'" data-type="'+attr(type)+'" data-value="'+attr(value)+'" '+(disabled?'disabled':'')+'>'+esc(text)+'</button>';
const panel=(label,content,cls='')=>'<section class="card '+cls+'"><h2>'+esc(label)+'</h2>'+content+'</section>';
const list=(data,cls='')=>'<ul class="list '+cls+'">'+data.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
const pill=(label,cls='')=>'<span class="pill '+cls+'">'+esc(label)+'</span>';
const shareUrl=()=>location.origin+'/?join='+state.code;
let lastQr={url:'',markup:''};
function inviteQr(){
  const url=shareUrl();
  if(lastQr.url===url) return lastQr.markup;
  const QR=qrLoader('./index');
  const qr=new QR(-1,qrLoader('./QRErrorCorrectLevel').M);
  qr.addData(url);
  qr.make();
  const n=qr.getModuleCount();
  let path='';
  for(let y=0;y<n;y++) for(let x=0;x<n;x++) if(qr.isDark(y,x)) path+='M'+(x+4)+' '+(y+4)+'h1v1h-1z';
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(n+8)+' '+(n+8)+'"><rect width="100%" height="100%" fill="white"/><path d="'+path+'"/></svg>';
  const markup='<a href="'+attr(url)+'" target="_blank" rel="noopener"><img class="qr" alt="QR-Code für den Gruppenraum" src="data:image/svg+xml,'+encodeURIComponent(svg)+'"></a>';
  lastQr={url,markup};
  return markup;
}
function say(message){
  clearTimeout(toastTimer);
  toast.textContent=message;
  toast.hidden=false;
  toastTimer=setTimeout(()=>toast.hidden=true,5000);
}
async function ask(code,body){
  const req=await fetch('/api/room'+(code?'/'+encodeURIComponent(code):''),{
    method:body?'POST':'GET',
    headers:{'X-Gruft-Key':key,...(body?{'Content-Type':'application/json'}:{})},
    body:body?JSON.stringify(body):undefined
  });
  if(!req.headers.get('content-type')?.includes('application/json')) throw new Error('Der Server antwortet gerade nicht mit Spielstand.');
  const data=await req.json();
  if(!req.ok) throw new Error(data.error??'Die Gruft antwortet gerade nicht.');
  return data;
}
function update(next,force=false){
  if(!force && state?.code===next.code && state.version>=next.version) return;
  if(!force && ['INPUT','SELECT'].includes(document.activeElement?.tagName)) return;
  state=next;
  render();
}
async function run(body){
  if(sending) return;
  sending=true;
  try {
    const next=await ask(state?.code??null,{...body,expected:state?.version});
    update(next,true);
  } catch(error){say(error.message);}
  finally{sending=false;}
}
async function create(solo){
  if(sending) return;
  sending=true;
  try{
    let next=await ask(null,{solo});
    if(solo) next=await ask(next.code,{type:'join'});
    write('gruft.room',next.code);
    history.replaceState({},'','/?room='+next.code);
    update(next,true);
  }catch(error){say(error.message);}
  finally{sending=false;}
}
async function join(code,alias){
  if(sending) return;
  sending=true;
  try{
    const next=await ask(code,{type:'join',alias});
    write('gruft.room',code);
    history.replaceState({},'','/?room='+code);
    update(next,true);
  }catch(error){say(error.message);}
  finally{sending=false;}
}

function home(){
  const recent=read('gruft.room');
  return '<section class="cover"><div class="cover-inner"><div class="eyebrow">Kooperatives Würfelabenteuer</div><h1>Die Gruft des<br><em>falschen Königs.</em></h1><p>Ein Tablet für die Geschichte, ein Handy pro Held und ein echter W20 auf dem Tisch.</p><div class="controls">'+button('Gruppenraum öffnen','create','','primary')+button('Proberunde allein','solo')+'</div></div></section>'+
    '<div class="columns">'+panel('Einer Gruppe beitreten','<form id="join" class="join-form"><div><label for="code">Raumcode</label><input id="code" name="code" maxlength="6" pattern="[A-Za-z2-9]{6}" placeholder="ABC234" value="'+attr(invite??'')+'" required></div><button class="primary">Beitreten</button></form>')+
    panel('So spielt ihr','<p>Öffne den Raum auf dem Tablet. Die anderen öffnen den Einladungslink oder tippen den Raumcode ein. Auf dem Tablet könnt ihr selbst auch mitspielen.</p>'+(recent?button('Letzten Raum öffnen','resume',recent):''))+'</div>';
}
function party(){
  return panel('Eure Truppe',state.players.length?list(state.players.map(p=>'<span>'+esc(p.alias)+'</span><span>'+esc(p.ghost?'Geist':typeof p.hp==='number' && state.status!=='lobby'?p.hp+' / 8 LP':p.hero??'Wählt …')+'</span>')):'<p>Der Raum ist offen. Sobald jemand beitritt, erscheint er hier.</p>');
}
function lobby(){
  const occupied=new Set(state.players.filter(x=>!x.self).map(p=>p.hero));
  const choose='<div class="roles">'+Object.entries(state.heroes).map(([name,h])=>'<button type="button" data-type="choose" data-value="'+attr(name)+'" class="role '+(state.me?.hero===name?'active':'')+'" '+(occupied.has(name)?'disabled':'')+'><span class="sigil" aria-hidden="true">'+esc(h.glyph)+'</span><strong>'+esc(name)+'</strong><span>'+esc(h.title)+'</span></button>').join('')+'</div>';
  const selected=state.me?.hero?'<p>'+esc(state.heroes[state.me.hero].info)+'</p>':'';
  const ready=state.players.length>=(state.solo?1:3)&&state.players.every(p=>p.hero);
  return '<section class="roomheader"><div class="eyebrow">'+(state.solo?'Proberunde':'Treffpunkt')+'</div><h1>Vor dem Abstieg</h1><p>'+(!state.me?'Öffne diesen Raum auf dem Tablet und lass die Truppe beitreten.':'Wählt eure Rollen. Legt den W20 bereit.')+'</p></section>'+
    '<div class="columns"><div class="stack">'+(state.me?panel('Wähle deine Figur',choose+selected):panel('Raum für deine Freunde','<p>Raumcode</p><div class="code">'+esc(state.code)+'</div>'+inviteQr()+'<label for="share">Einladungslink</label><input id="share" readonly value="'+attr(shareUrl())+'"><p class="line">'+button('Link kopieren','copy')+button('Auf diesem Gerät mitspielen','alsojoin')+'</p>'))+
    (state.host?panel('Aufbruch','<p>'+(ready?'Die Gruppe ist bereit.':'Sobald '+(state.solo?'deine Rolle steht':'mindestens drei Spieler eine Rolle gewählt haben')+', kann die Gruppe los.')+'</p>'+button('Dungeon betreten','start','','primary',!ready)):'')+
    '</div><div class="stack">'+party()+(state.me&&!state.solo?panel('Raumcode','<div class="code">'+esc(state.code)+'</div>'+inviteQr()+button('Einladungslink kopieren','copy')):'')+'</div></div>';
}
function rollPanel(){
  const q=state.pending;
  if(!q) return '';
  const sun=q.stage==='sun';
  const text=sun?'Jenny kann den geretteten Erfolg nehmen. Nachlegen bringt ab 9 einen goldenen Nugget. Bei 1–8 kippt der Erfolg und die Sonne nimmt 2 LP.':q.downside;
  const form='<form id="dice"><div><label for="die">Echter W20</label><input inputmode="numeric" type="number" name="die" id="die" min="1" max="20" required placeholder="1–20"></div><button class="primary">'+(sun?'Nachlegen':'Wurf eintragen')+'</button>'+(sun?button('Erfolg nehmen','keep'):button('Zurück','cancel'))+'</form>';
  return panel(q.name,'<p>'+esc(q.actor)+(q.idea?' · „'+esc(q.idea)+'“':'')+'</p><div class="equation">'+(sun?'Noch einmal Sonne?':'W20 + '+esc(stats[q.stat])+' '+esc(q.bonus)+(q.help?' + '+esc(q.help)+' Hilfe':'')+' · Ziel '+esc(q.dc))+'</div><p>'+esc(text)+'</p>'+(q.mine?form:!sun&&state.me?.hp>0&&!q.help?button('Bei diesem Wurf helfen','help'):'<p>Wartet auf '+esc(q.actor)+'.</p>'),'roll');
}
function gear(){
  const me=state.me;
  if(!me || !me.hero) return '';
  const h=state.heroes[me.hero];
  const pals=state.players.filter(p=>!p.self&&!p.ghost);
  const target=(all=false)=> (all?'<option value="">Selbst</option>':'')+pals.map(p=>'<option value="'+attr(p.id)+'">'+esc(p.alias)+'</option>').join('');
  const inventory=me.gear.map(item=>'<div class="item"><strong>'+esc(item)+'</strong><p>'+esc(state.items[item])+'</p>'+
    (state.status==='play'&&me.hp>0&&!me.sleep&&!state.pending?(item.includes('Nugget')?'<form class="join-form" data-item="'+attr(item)+'" data-form="heal"><select name="target" aria-label="Wer isst das Nugget?">'+target(true)+'</select><button>Heilen</button></form>':(state.improvisedItems?.includes(item)?button('In einer Idee verwenden','ideaItem',item):button('Einsetzen','use',item)))+(pals.length?'<details><summary>Weitergeben</summary><form class="join-form" data-item="'+attr(item)+'" data-form="give"><select name="target" aria-label="Empfänger">'+target()+'</select><button>Geben</button></form></details>':''):'')+'</div>').join('');
  const health=me.ghost?'Geist':me.hp+' / 8 LP';
  return panel(me.hero+' · '+h.title,'<div class="resources">'+pill(health,'hp')+me.stats.map((x,i)=>pill(stats[i]+' '+x)).join('')+'</div>'+
    (me.clue?'<p><strong>Dein Hinweis:</strong> '+esc(me.clue)+'</p>':'')+
    (me.ghost?'<p>Du kannst mit deiner Gruppe sprechen und einmal pro Raum spuken.</p>'+button('Spuken','ghost','', '',!!state.pending):!me.skill?'<p><strong>'+esc(h.skill)+'</strong><br>'+esc(h.info)+'</p>'+button('Fähigkeit einsetzen','skill','','',!!state.pending||state.status!=='play'):'<p>Deine Spezialfähigkeit wurde eingesetzt.</p>')+
    (me.sleep?button('Einmal aussetzen','skip','','',!!state.pending):'')+
    '<h3>Rucksack</h3><div class="inventory">'+(inventory||'<p>Dein Rucksack ist leer.</p>')+'</div>','ability');
}
function reward(){
  const p=state.me;
  if(!p) return '';
  if(p.reward)return panel('Deine Belohnung','<p>'+esc(p.reward)+'</p>');
  return panel('Deine Belohnung','<p>Wähle einen Bonus oder behalte einen Gegenstand als Erbstück.</p><div class="controls">'+stats.map(x=>button('+1 '+x,'upgrade',x)).join('')+'</div>'+
    (p.gear.length?'<form id="reward" class="join-form"><div><label for="relic">Erbstück</label><select name="item" id="relic">'+p.gear.map(i=>'<option>'+esc(i)+'</option>').join('')+'</select></div><button>Behalten</button></form>':''));
}
function panorama(scene){
  const props=[
    scene.rope?'<span class="room-prop prop-rope" role="img" aria-label="Seil am Boden"></span>':'',
    scene.stone?'<span class="room-prop prop-stone" role="img" aria-label="Stein am Boden"></span>':'',
    '<span class="room-prop prop-chest '+(scene.chest==='open'?'prop-open':'')+'" role="img" aria-label="'+(scene.chest==='open'?'Offene Truhe':'Geschlossene Truhe')+'"><span></span></span>',
    scene.loot?'<span class="room-prop prop-loot" role="img" aria-label="Goldener Nugget in der Truhe"></span>':''
  ].join('');
  return '<div class="scene"><div class="panorama" tabindex="0" aria-label="Raumansicht. Wischen oder die Pfeiltasten nutzen, um sich umzusehen."><div class="panorama-content"><img src="/entry.webp" alt="Steinerne Gruft mit Tor und Fackeln" draggable="false">'+props+'</div></div><p>Zum Umschauen wischen oder ziehen</p></div>';
}
function bindPanorama(previous){
  const pane=app.querySelector('.panorama');
  if(!pane) return;
  pane.scrollLeft=previous??(pane.scrollWidth-pane.clientWidth)/2;
  let drag=null;
  pane.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='mouse' || event.button!==0) return;
    drag={start:event.clientX,scroll:pane.scrollLeft};
    pane.setPointerCapture(event.pointerId);
  });
  pane.addEventListener('pointermove',event=>{
    if(drag) pane.scrollLeft=drag.scroll-(event.clientX-drag.start);
  });
  pane.addEventListener('lostpointercapture',()=>{drag=null;});
  pane.addEventListener('keydown',event=>{
    if(event.key!=='ArrowLeft' && event.key!=='ArrowRight') return;
    event.preventDefault();
    pane.scrollLeft+=event.key==='ArrowLeft'?-100:100;
  });
}
function wayPanel(){
  if(!state.paths.length || state.status!=='play') return '';
  const canMove=state.host&&state.me;
  const chooser=canMove?'move':'route';
  const routes=state.paths.map(path=>{
    const votes=(state.routeVotes??[]).filter(id=>id===path.id).length;
    if(!state.me) return esc(path.name)+(votes?' · '+votes+'/'+state.players.length+' Stimmen':'');
    return button(path.name+(votes?' · '+votes+'/'+state.players.length:''),chooser,path.id,state.vote===path.id?'active':'',!!state.pending);
  });
  return panel('Wohin?',state.me?'<div class="actions">'+routes.join('')+'</div>':list(routes)+(state.players.length?' <p>Stimmt auf euren Handys ab.</p>':''));
}
function game(){
  const room=state.room;
  const playing=state.status==='play';
  const can=playing&&state.me?.hp>0&&!state.me?.sleep&&!state.pending;
  const ways=wayPanel();
  const actions=can?panel('Was versuchst du?','<div class="actions">'+room.options.map(a=>button(a.name,'act',a.id)).join('')+
    (room.enemy?button('Mit bloßen Händen angreifen','act','attack'):'')+button('Genauer hinsehen','look')+'</div><form id="idea" class="join-form"><div><label for="phrase">Eigene Idee</label><input name="idea" id="phrase" maxlength="180" placeholder="Ich hebe einen Stein auf …" required></div><button>Versuchen</button></form>'+(state.me.ideaNote?'<p class="idea-note" role="status">'+esc(state.me.ideaNote)+'</p>':'')):'';
  const setting='<section class="roomheader"><div class="eyebrow">'+(state.status==='won'?'Die Krone gehört euch':state.status==='lost'?'Die Gruft hat gewonnen':'Raum '+state.explored.length)+'</div><h1>'+esc(room.name)+'</h1><p>'+esc(state.status==='lost'?'Die Gruft bleibt verschlossen. Eure Sterbeurkunden liegen zur Abholung bereit.':room.story)+'</p>'+
    (room.enemy&&playing?'<div class="resources">'+pill(room.enemy.name+' · '+room.enemy.hp+' LP','enemy')+'</div>':'')+'</section>';
  const tableScene=state.host&&playing&&state.scene?panorama(state.scene):'';
  return setting+tableScene+'<div class="columns"><div class="stack">'+rollPanel()+actions+ways+(state.status==='won'?reward():'')+
    (playing?'':button('Zur Startseite','exit'))+panel('Was passiert ist',list(state.log.map(esc),'story-log'))+'</div><div class="stack">'+gear()+party()+
    panel('Entdeckte Räume',list(state.explored.map(r=>esc((r.here?'◆ ':'◇ ')+r.name))))+'</div></div>';
}
function render(){
  topStatus.textContent=state?'Raum '+state.code+(state.host?' · Spielleitung':''):'3–6 Spieler · 1 echter W20';
  const panScroll=app.querySelector('.panorama')?.scrollLeft;
  const active=document.activeElement;
  const focusId=active?.id;
  const oldValue=focusId&&['INPUT','SELECT'].includes(active.tagName)?active.value:null;
  app.innerHTML=state?(state.status==='lobby'?lobby():game()):home();
  bindPanorama(panScroll);
  if(focusId&&oldValue!==null){
    const next=document.getElementById(focusId);
    if(next){next.value=oldValue;next.focus({preventScroll:true});}
  }
}
async function resume(code,silent=false){
  try{update(await ask(code),true);}catch(error){if(!silent)say(error.message);}
}
app.addEventListener('click',async event=>{
  const target=event.target.closest('button[data-type]');
  if(!target) return;
  const {type,value}=target.dataset;
  if(type==='create'||type==='solo') return create(type==='solo');
  if(type==='resume'){history.replaceState({},'','/?room='+value);return resume(value);}
  if(type==='copy'){
    if(navigator.clipboard) try {await navigator.clipboard.writeText(shareUrl());return say('Einladungslink kopiert.');}catch{}
    const link=document.querySelector('#share');
    if(link){link.focus();link.select();return say('Der Link ist markiert. Kopiere ihn über das Menü.');}
    return say(shareUrl());
  }
  if(type==='alsojoin') return run({type:'join'});
  if(type==='ideaItem'){
    const idea=document.querySelector('#phrase');
    if(idea){
      idea.value='Ich nehme '+value+' und ';
      idea.scrollIntoView({block:'center'});
      idea.focus({preventScroll:true});
    }
    return;
  }
  if(type==='exit'){state=null;history.replaceState({},'','/');render();return;}
  const field={choose:'hero',move:'room',route:'room',act:'action',use:'item',upgrade:'reward'}[type];
  return run(field?{type,[field]:value}:{type});
});
app.addEventListener('submit',event=>{
  event.preventDefault();
  const form=event.target;
  const data=Object.fromEntries(new FormData(form));
  if(form.id==='join') return join(data.code.trim().toUpperCase(),'');
  if(form.id==='dice') {document.activeElement.blur();return run({type:'roll',die:data.die});}
  if(form.id==='idea') {document.activeElement.blur();return run({type:'act',idea:data.idea});}
  if(form.id==='reward') return run({type:'upgrade',reward:'Erbstück',item:data.item});
  if(form.dataset.form) return run({type:form.dataset.form==='heal'?'use':'give',item:form.dataset.item,target:data.target});
});
render();
const resumeCode=params.get('room')??invite;
if(resumeCode) resume(resumeCode,true);
let polling=false;
setInterval(async()=>{
  if(!state||sending||polling||document.hidden) return;
  polling=true;
  const code=state.code;
  try{const next=await ask(code);if(state?.code===code&&!sending)update(next);}catch{}finally{polling=false;}
},1200);
