const prop = (name, words, description) => ({name, words, description});
export const improvisedItems = {
  Stein:'Ein handlicher Stein. Wirf ihn auf etwas oder verkeile damit einen beweglichen Gegenstand.',
  Seil:'Ein kurzes, ausgefranstes Seil. Zum Festbinden, Klettern oder für eine fragwürdige Falle.',
  Knochen:'Ein leichter Knochen. Wurfgeschoss, Köder oder Hebel für den kleinen Geldbeutel.',
  Stofffetzen:'Ein Lappen aus fragwürdiger Quelle. Dämpft Geräusche und taugt zum Verdecken.',
  Scherbe:'Ein stumpfer Splitter aus Glas. Reflektiert Licht und taugt als Ablenkung.',
  Kerze:'Ein kurzer Kerzenstummel. Kann dunkle Winkel ausleuchten.'
};

const portable = {
  Stein:prop('Stein',/\b(?:(?:n|nen)?stein(?:e|en)?|kiesel(?:stein)?|geroll|felsbrocken)\b/,'Ein handlicher Stein liegt zwischen zwei losen Pflastersteinen.'),
  Seil:prop('Seil',/\b(?:seil\w*|schnur|kordel|strick)\b/,'Ein ausgefranstes Seil liegt zusammengerollt am Rand.'),
  Knochen:prop('Knochen',/\b(?:knochen\w*|knochel)\b/,'Ein einzelner Knochen liegt herum. Er ist offenbar nicht im Dienst.'),
  Stofffetzen:prop('Stofffetzen',/\b(?:stofffetzen|lappen|stoff|fetzen|tuch)\b/,'An einem Haken baumelt ein alter Stofffetzen.'),
  Scherbe:prop('Scherbe',/\b(?:glasscherbe|scherbe[n]?|glasstuck)\b/,'Eine Glasscherbe fängt das Licht auf.'),
  Kerze:prop('Kerze',/\b(?:kerze[n]?|kerzenstummel|wachs)\b/,'Im Staub steckt ein Kerzenstummel.')
};
const objects = {
  tor:{loose:['Stein','Seil'],fixture:prop('Messinggong',/\bgong\w*\b/,'Der Gong hängt an einem Haken. Der Filz auf seiner Rückseite ist schlecht befestigt.')},
  wache:{loose:['Knochen','Scherbe'],fixture:prop('Theke',/\b(?:theke|tresen|flaschenregal)\b/,'Die Theke wackelt. Dahinter stapeln sich leere Flaschen.')},
  pilze:{loose:['Stein','Knochen'],fixture:prop('Pilzregal',/\b(?:regal|pilzregal|pilze)\b/,'Ein niedriges, morsches Regal ist voller Pilze.')},
  saal:{loose:['Stofffetzen','Seil'],fixture:prop('Bettgestell',/\b(?:betten?|bettgestell|matratze)\b/,'Das Bettgestell steht auf einem schiefen Metallbein.')},
  truhe:{loose:['Scherbe','Stofffetzen'],fixture:prop('Wandhaken',/\b(?:wandhaken|haken|vorhang)\b/,'Ein eiserner Haken hält einen schweren alten Vorhang.')},
  kapelle:{loose:['Kerze','Seil'],fixture:prop('Hochzeitsbank',/\b(?:bank|hochzeitsbank|kirchenbank)\b/,'Die Bank ist seit dreihundert Jahren nur an einem Ende verschraubt.')},
  thron:{loose:['Kerze','Knochen'],fixture:prop('Kronleuchter',/\b(?:kronleuchter|leuchter)\b/,'Der Kronleuchter hängt an einer Kette. Ein schwarzer Faden führt zur Krone.')}
};

export const plain = word => word.toLowerCase().replaceAll('ß','ss').normalize('NFD').replace(/\p{M}/gu,'');
const namedIn = (line, value) => {
  const name=plain(value);
  return name && (' '+line.replace(/[^\p{L}\p{N}]+/gu,' ')+' ').includes(' '+name+' ');
};

export const looseObjects = room => objects[room]?.loose ?? [];

export function interpretIdea({room, board, player, players, enemy, idea}){
  const line=plain(idea);
  const scene=objects[room];
  if(!scene) return null;
  const pool=board.objects ?? scene.loose;
  const fixture=scene.fixture;
  const facility=fixture.words.test(line);
  const gathering=/\b(?:such\w*|nehm\w*|find\w*|samm\w*|greif\w*|hebe\w*|hol\w*|aufsamm\w*)\b/.test(line);
  const looking=/\b(?:schau\w*|seh\w*|untersuch\w*|pruf\w*|lausche\w*|taste\w*|spah\w*)\b/.test(line);
  const throwing=/\b(?:werf\w*|wirf\w*|schleuder\w*|feuer\w*|pfeffer\w*|kick\w*|schiess\w*)\b/.test(line);
  const rigging=/\b(?:binde\w*|knot\w*|verkeil\w*|befestig\w*|kombinier\w*|wickl\w*|stopf\w*|verdeck\w*)\b/.test(line);
  const luring=/\b(?:lock\w*|ablenk\w*|lenk\w*|bestech\w*|tausch\w*|futter\w*)\b/.test(line);
  const ally=players.find(other=>other.id!==player.id && (namedIn(line,other.hero)||namedIn(line,other.alias??'')));
  const opponent=enemy&&(namedIn(line,enemy)||/\b(?:monster|gegner|hund|skelett\w*|wache|wecker\w*|konig|troll)\b/.test(line));
  const found=Object.values(portable).find(item=>item.words.test(line));
  const held=player.gear.filter(item=>namedIn(line,item) || portable[item]?.words.test(line));
  const looseNamed=pool.find(name=>namedIn(line,name));
  const item=found?.name??held[0]??looseNamed;
  const inBag=player.gear.includes(item);
  const canGather=Boolean(item && pool.includes(item) && gathering);
  const fromFloor=!inBag&&canGather;
  const namedButMissing=found&&!inBag&&!pool.includes(item);

  if(throwing && (item || ally || facility)){
    if(!item) return {message:'Was willst du werfen? Sag, was du aus deinem Rucksack nimmst oder wo du im Raum danach suchst.'};
    if(!inBag&&!canGather) return {message:namedButMissing?item+' liegt hier gerade nicht greifbar und ist auch nicht in deinem Rucksack.':item+' liegt hier herum. Sag, wenn du ihn erst aufheben willst.'};
    if(!ally&&!facility&&!opponent) return {message:'Wohin willst du '+item+' werfen? Nenn eine Person, den Gegner oder ein Ziel im Raum.'};
    if(ally&&(ally.hp<=0||ally.ghost)) return {message:ally.hero+' ist gerade kein geeignetes Ziel für den Wurf.'};
    if(ally) {
      const at=ally.alias || ally.hero;
      return {rule:{name:item+' auf '+at+' werfen',stat:1,dc:10,downside:'Du verfehlst '+at+'. '+item+' landet im Raum.',result:'Klack. '+at+' bekommt '+item+' ab und verliert 1 LP.',improv:{kind:'ally',target:ally.id,item,fromFloor}}};
    }
    if(facility && (board.rigged || board.rattled)) return {message:fixture.name+' habt ihr schon untersucht oder verändert. Der Wurf würde daran nichts Weiteres ändern.'};
    return {rule:{name:item+' gegen '+(facility?fixture.name:enemy)+' werfen',stat:1,dc:facility?11:12,downside:'Der Wurf geht daneben. '+item+' landet im Raum.',result:facility?fixture.name+' scheppert. Ihr findet dabei einen Hinweis.':enemy+' wird getroffen und verliert 2 LP.',improv:{kind:facility?'fixture':'enemy',item,fromFloor}}};
  }
  if(rigging && facility && item){
    if(board.rigged) return {message:fixture.name+' ist bereits präpariert.'};
    if(!inBag&&!canGather) return {message:'Das Material '+item+' ist nicht griffbereit. Schau im Raum nach oder versuch es mit etwas aus dem Rucksack.'};
    if(!['Seil','Stofffetzen','Stein','Knochen','Runenkreide'].includes(item)) return {message:item+' hält hier allein nichts fest. Was soll die Verbindung zusammenhalten?'};
    return {rule:{name:fixture.name+' mit '+item+' präparieren',stat:1,dc:11,downside:'Die Verbindung rutscht ab. Du behältst das Material.',result:fixture.name+' ist präpariert. Der nächste Wurf gegen das Hindernis hier bekommt +2.',improv:{kind:'rig',item,fromFloor}}};
  }
  if(luring && opponent && item && (inBag||canGather)){
    return {rule:{name:enemy+' mit '+item+' ablenken',stat:1,dc:12,downside:enemy+' ignoriert den Köder. '+item+' bleibt bei dir, wenn du es schon hattest.',result:enemy+' folgt dem Köder und setzt bei der nächsten Gelegenheit aus.',improv:{kind:'lure',item,fromFloor}}};
  }
  if(gathering && (found || looseNamed)){
    if(pool.includes(item)) return {take:item};
    return {message:item+' ist an dieser Stelle nicht zu finden. In diesem Raum siehst du '+[...new Set([...pool,fixture.name])].join(', ')+'.'};
  }
  if(looking && facility) return {inspect:fixture.description};
  if((looking||gathering)&&!throwing&&!rigging&&!luring){
    return {inspect:[...new Set(pool)].map(name=>portable[name]?.description??name+' liegt auf dem Boden.').concat(fixture.description).join(' ')};
  }
  return null;
}
