// Small, explicit intent layer: synonymous word forms are separate from game rules.
// It never invents resources or grants success based on wording.
export const dungeonNormalize=t=>String(t??'').toLowerCase().replaceAll('ß','ss').normalize('NFD').replace(/\p{M}/gu,'').replace(/[’']/g,'').replace(/[-–—]/g,' ').replace(/\s+/g,' ').trim();
const Lgroups={
 attack:['angriff','angreifen','attacke','attack','attackieren','zuschlagen','draufhauen','kämpfen','kampf','fight','angreife'],
 inspect:['untersuchen','untersuche','anschauen','ansehen','ansehen','umschauen','umsehen','betrachten','inspizieren','prüfen','nachsehen','durchsuchen','durchsuche','suchen','suche','schauen','schau','checken','kontrollieren','inspiziere','untersuchung','umsehen','gucken','lesen','lese','lies','erforschen','erkunden'],
 take:['nehmen','nehme','nimm','mitnehmen','einsammeln','aufsammeln','aufheben','sammeln','sammle','einstecken','loot','looten','plündern','plündere','aufnehmen','einpacken'],
 open:['öffnen','öffne','aufmachen','öffne','entsperren','aufschließen','entriegeln','auf'],
 force:['aufbrechen','aufbreche','aufhebeln','knacken','zertrümmern','eintreten','aufknacken'],
 defend:['verteidigung','verteidigen','verteidige','blocken','block','abwehren','abwehr','schützen','deckung','defend'],
 move:['gehen','gehe','geh','laufen','laufe','weitergehen','betreten','betrete','zurück','weiter','rein','hinein','raus','verlassen','wechseln'],
 rest:['rasten','raste','ruhen','ruhe','ausruhen','ausruhen','schlafen','schlafe','rast','pause','verschnaufen'],
 use:['benutzen','benutze','nutzen','nutze','verwenden','verwende','einsetzen','kombinieren','kombiniere','verbinden','verbinde','reparieren','repariere','füttern','füttere','füttere','trinken','trinke','gib','gebe','zeige','zeig','einsetzen','setze','drehen','drehe','läuten','läute'],
 talk:['reden','rede','sprechen','spreche','ansprechen','anspreche','verhandeln','verhandle','beschweren','beschwerde'],
 agree:['ja','okay','ok','zustimmen','zustimmung','einverstanden','mitgehen'],
};
const Lwords=Object.fromEntries(Object.entries(Lgroups).map(([k,v])=>[k,v.map(dungeonNormalize)]));
function Ldistance(a,b){const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old;}}return row[b.length];}
export function interpretDungeonInput(raw,context={}){
 let text=dungeonNormalize(raw);if(text.includes('sondern '))text=text.split('sondern ').at(-1);
 const tokens=text.replace(/[^\p{L}\p{N}]+/gu,' ').trim().split(/\s+/);
 const has=re=>re.test(text);
 const exact=k=>tokens.some(t=>Lwords[k].includes(t));
 let kind='unknown',fuzzy=false;
 if(has(/was (?:ware|passiert)|was passiert wenn|angenommen|nur theoretisch/))kind='question';
 else if(has(/\bstimm\w* zu\b|\bbin dabei\b|\bich folge\b/)||exact('agree'))kind='agree';
 else if(exact('inspect')||has(/\b(?:schau|seh|guck)\w*.*\b(?:an|um)\b|\bwas (?:liegt|sehe|siehst|ist|gibt)|\bwo (?:liegt|ist)|\bschau\w* nach|\bsuche\w*/))kind='inspect';
 else if(exact('defend')||has(/in deckung|schutzstellung|schild hoch|ich block/))kind='defend';
 else if(exact('attack')||has(/\bgreif\w*.*\ban\b|\bhau\w*.*(?:drauf|zu|um)|\bschlag\w*|\bstich\w*|\bschiess\w*|\bich kampfe\b|drauf da|auf die fresse/))kind='attack';
 else if(exact('force'))kind='force';
 else if(exact('take')||has(/\bheb\w*.*\bauf\b|\bsteck\w*.*\bein\b|\bnehm\w*|\bhol\w*|\bgreif\w*/))kind='take';
 else if(exact('rest'))kind='rest';
 else if(exact('move')||has(/\bzum?\b.*(?:raum|hohle|archiv|kapelle)|\bhinuber\b/))kind='move';
 else if(exact('open')||has(/\bmach\w*.*\bauf\b|\bschliess\w*.*\bauf\b/))kind='open';
 else if(exact('use'))kind='use';
 else if(exact('talk')||has(/\b(?:sag|frag|beschwer|red|sprech)\w*/))kind='talk';
 if(kind==='unknown'){
  let best=3,match=null;
  for(const t of tokens){if(t.length<5)continue;for(const k of ['attack','inspect','defend','take','open','force','rest'])for(const word of Lwords[k]){
    if(Math.abs(t.length-word.length)>2)continue;const d=Ldistance(t,word);const limit=word.length>=7?2:1;
    if(d>0&&d<=limit&&d<best){best=d;match=k;}
  }}
  if(match){kind=match;fuzzy=true;}
 }
 const negative=has(/\bnicht\b|\bkein(?:e|en)?\b|\bniemals\b/)&&!has(/aber nicht|nur nicht|nicht mit|nicht ohne/);
 if(negative&&kind!=='inspect'&&kind!=='question')kind='negated';
 if(kind==='open'&&has(/\bkann ich\b|\bkonnen wir\b/))kind='inspect';
 const nounOnly=tokens.length<=4&&!tokens.some(t=>['ich','wir'].includes(t));
 const last=context.lastIntent;
 if(kind==='unknown'&&last&&nounOnly&&last.kind!=='unknown')kind=last.kind;
 let target=context.objects?.find(o=>{const aliases=[o.name,...(o.aliases??[])].map(dungeonNormalize);return aliases.some(a=>text.includes(a));})?.id??null;
 if(!target&&has(/\b(?:sie|ihn|es|das|daran|damit|die da)\b/))target=context.lastTarget??null;
 return {kind,text,tokens,target,fuzzy,all:has(/\b(?:alles|alle|samtlich|komplett)\b/)||['loot','beute'].includes(text),question:has(/\?$/)};
}
