export const dungeonPatches={
 tor:{paths:['gabel'],story:'Die Höhlen unter dem Königsgrab sind viel größer als gedacht. Über einem verschlossenen Tor wacht das Steingesicht. Links hängt ein gedämpfter Gong, rechts liegt ein Messingschlüssel im Becken. Hinter dem Tor führt eine Treppe zur Weggabelung.'},
 gabel:{name:'Weggabelung der schlechten Entscheidungen',image:'gabel',paths:['tor','lager','bruecke','pilze','wache'],objects:['Laterne','Wegweiser','Eichentür','Spuren','drei Höhlengänge'],loot:['Laterne'],story:'Feuchte Höhlengänge verzweigen sich. Links liegt die Vorratsgrotte, rechts die gebrochene Brücke, unten leuchten Pilze. Geradeaus versperrt eine verriegelte Eichentür den Zugang zum Skelettamt. Am Wegweiser hängt eine Laterne. Verschiedene Fußspuren führen in die Gänge.'},
 lager:{name:'Vorratsgrotte der verschollenen Praktikanten',image:'lager',paths:['gabel','falle'],objects:['Vorratskiste','Eisentruhe','hängender Rucksack','Werkbank','Mondrune','Mauerriss'],loot:['Seil','Brett','Brecheisen','Runenkreide'],story:'Zwei verschiedene Behälter stehen zwischen feuchten Felsen: eine einfache Vorratskiste und eine verschlossene Eisentruhe. An einem Haken hängt ein Rucksack. Auf der Werkbank liegen Seil, Brett, Brecheisen und Runenkreide. Eine Mondrune sitzt in einem feinen Mauerriss.'},
 bruecke:{name:'Brücke mit ausstehender TÜV-Prüfung',image:'bruecke',paths:['gabel','schmiede'],objects:['gebrochene Brücke','Eisenhaken','fehlende Planken','Schlucht','lose Steine'],loot:['Stein'],story:'Eine Schlucht schneidet den Gang entzwei. Die Hängebrücke hat mehr Lücken als Günthers Dienstplan. Ein Eisenhaken sitzt fest im Fels. Drüben glimmt die Schmiede. Ein Sprung wäre gefährlich; mit Seil und Brett ließe sich ein sicherer Übergang bauen.'},
 schmiede:{name:'Schmiede zum letzten Feierabend',image:'schmiede',paths:['bruecke','archiv'],objects:['kalter Ofen','Blasebalg','Zahnradfassung','Amboss','Hammer','Eisenluke'],story:'Der Ofen ist kalt, der Blasebalg hat eine leere Zahnradfassung. Ein Hammer liegt am Amboss. Eine schwere Eisenluke führt zum Archiv. Wer die Schmiede repariert, kann Waffen verbessern; das funktioniert einmal pro Held.'},
 pilze:{name:'Schamsporenhöhle',image:'pilze',paths:['gabel','quelle'],objects:['Sporenhund','Pilze','Mondsiegel','Futterschale','Wasserspalt'],story:'Pilze flüstern eure peinlichsten Sprachnachrichten nach. Ein Schamsporenhund namens Brösel der Ungewaschene bewacht ein silbernes Mondsiegel. Neben ihm steht eine leere Futterschale. Rechts hört ihr Wasser hinter einem Spalt.',enemy:{name:'Brösel der Ungewaschene',title:'Schamsporenhund mit Trennungsängsten',hp:10,per:9,defense:12,damage:5,xp:3,pattern:['Schamhaftes Zuschnappen','Sporenschütteln für alle','Peinliche Erinnerung'],weakness:'Brösel bewacht das Mondsiegel. Ein echtes Nugget in der Futterschale kann den Kampf vermeiden. Im Kampf lenken geworfene Pilze ihn ab.'}},
 quelle:{name:'Quelle der einmaligen Kulanz',image:'quelle',paths:['pilze'],objects:['Quelle','Trinkbecken','Schöpfkelle','Ventilrad','Wasserkanäle'],story:'Ein stiller Quellsee füllt ein Trinkbecken. Die Schöpfkelle ist sauberer als alles andere hier. Daneben zweigen Wasserkanäle von einem Ventilrad ab. Eine Inschrift verspricht genau einen Schluck Kulanz für die ganze Truppe: Heilung oder Fokus, nicht beides.'},
 wache:{paths:['gabel','archiv'],story:'Günther von Klammer-zurück, Oberstempelführer dritter Vertretung, bewacht das Sonnensiegel und den Zugang zum Archiv. Sein Stempel ist größer als sein Restgewissen. Hinter ihm hängt ein Fallgitter an einer Kettenwinde. Auf dem Tisch steht eine Flasche.'},
 archiv:{paths:['wache','schmiede','falle','kapelle'],story:'Die Archivtruhe schnarcht. Ihre Scharniere sehen verdächtig nach Zähnen aus. Auf dem Deckel sind drei Noten eingeritzt; eine kleine Glocke hängt daneben. Das Gästebuch mit Wachssiegel versiegelt die Kronentür zur Kapelle. Ein Speerkorridor führt zur Grabkammer, eine Eisenluke zur Schmiede.'},
 falle:{name:'Korridor der freundlich gemeinten Spitzen',image:'falle',paths:['lager','archiv','grabkammer'],objects:['Druckplatte','Wandspeere','Hebel','Gegengewicht','silberne Truhe','Mondrune'],loot:['Stein'],story:'Eine rechteckige Druckplatte unterbricht den Boden. Eingefahrene Speere lauern in den Wänden. Hebel und Gegengewicht sind über eine Rille verbunden. In einer sicheren Nische steht eine silberne Truhe. Die Tür zur Grabkammer liegt hinter der Falle. Erst prüfen, dann auftreten.'},
 grabkammer:{name:'Ossuarium des papierlosen Todes',image:'grabkammer',paths:['falle','thron'],objects:['Skelettwächter','Sargschild','Hellebarde','versiegeltes Grab','Grabessiegel','Dreisiegeltür','Räucherschale'],story:'Erwin von Knochenfrist stemmt einen Sargdeckel als Schild. Er bewacht das Grabessiegel auf einem versiegelten Grab. Eine dicke Steintür trägt drei leere Siegelmulden: Sonne, Mond und Grab. Aus der Räucherschale steigt eine dünne Rauchfahne.',enemy:{name:'Erwin von Knochenfrist',title:'Beauftragter für endgültige Fristverlängerung',hp:18,per:12,defense:14,damage:7,xp:5,pattern:['Hellebardenbescheid','Knochenstaub für alle','Sargdeckel mit Empfangsbestätigung'],weakness:'Die Räucherschale und die Kette am Grab können seinen schweren Schild einklemmen. Nutzt die Einrichtung, statt nur auf den Sargdeckel einzuschlagen.'}},
 kapelle:{paths:['archiv','thron'],objects:['Brautgeist','leere Teller','Buffetglocke','Blumen','Krönungssockel','Dreisiegeltür'],story:'Die Geisterhochzeit wartet seit dreihundert Jahren aufs Buffet. Auf dem Sockel liegt eine Theaterkrone. „Die echte hat Horst“, zischt die Braut. „Bringt meine Einladung. Dann dürft ihr einmal rasten.“ Die schwere Tür zum Thronsaal besitzt drei Mulden: Sonne, Mond und Grab.'},
 thron:{paths:['kapelle','grabkammer','ausgang'],story:'Hinter der Dreisiegeltür herrscht Horst der Vorläufige über Dieter, den Kündigungsteppich. Die echte Krone hängt am Kronleuchter. Links führt eine Kette zur Winde. Nach all den Höhlen wirkt die Einladung „Schuhe aus!“ wie eine persönliche Beleidigung.'}
};
export const dungeonItems={
 Laterne:{kind:'tool',desc:'Beleuchtet dunkle Risse und Runen. Wiederverwendbar.'},
 Seil:{kind:'tool',desc:'Sichert einen Übergang. Wird beim Bau der Brücke fest verbaut.'},
 Brett:{kind:'tool',desc:'Eine stabile Planke. Zum Brückenbau oder zum Abdecken einer Druckplatte.'},
 Brecheisen:{kind:'tool',desc:'Hebelwerkzeug für verklemmte Türen und Mechanismen. Wiederverwendbar.'},
 Runenkreide:{kind:'tool',desc:'Macht verborgene Runenlinien sichtbar. Wiederverwendbar.'},
 Stein:{kind:'tool',desc:'Ein echter loser Stein. Als Gegengewicht oder zum Verkeilen verwendbar.'},
 Zahnrad:{kind:'tool',desc:'Das fehlende Teil des Blasebalgs in der Schmiede.'},
 Eisenschlüssel:{kind:'quest',desc:'Öffnet die Eichentür am Höhlenknoten.'},
 Sonnensiegel:{kind:'quest',desc:'Eines der drei Siegel für die Thronsaaltür. Von Günther bewacht.'},
 Mondsiegel:{kind:'quest',desc:'Eines der drei Siegel für die Thronsaaltür. In der Pilzhöhle bewacht.'},
 Grabessiegel:{kind:'quest',desc:'Eines der drei Siegel für die Thronsaaltür. Von Erwin bewacht.'}
};
export const dungeonPositions={tor:[0,2],gabel:[1,2],lager:[1,0],bruecke:[2,3],schmiede:[3,3],pilze:[2,1],quelle:[2,0],wache:[3,2],archiv:[4,2],falle:[4,0],grabkammer:[5,0],kapelle:[5,3],thron:[6,2],ausgang:[7,2]};
export const dungeonAliases={
 tor:['eingang','tor','anfang','steintor'],gabel:['wegkreuzung','kreuzung','gabelung','weggabelung','hohlenknoten','knoten'],lager:['lager','vorratsgrotte','vorrate','vorratsraum','lagergrotte'],bruecke:['brucke','schlucht','hangebrucke'],schmiede:['schmiede','ofenraum','feierabend'],pilze:['pilze','pilzhohle','schamsporenhohle','sporenhohle'],quelle:['quelle','wasser','quellsee'],wache:['amt','wache','skelettamt','gunther'],archiv:['archiv','aktenraum'],falle:['falle','fallenraum','speerkorridor','korridor','spitzen'],grabkammer:['grabkammer','ossuarium','knochenraum','erwin','gruft'],kapelle:['kapelle','hochzeit','braut'],thron:['thron','thronsaal','bossraum','horst','konig'],ausgang:['ausgang','hinaus','freiheit','freie']
};
export function dungeonPaths(s,rooms,id=s.room){return rooms[id].paths.filter(to=>!((id==='lager'&&to==='falle'||id==='falle'&&to==='lager')&&!s.facts.shortcut));}
export function dungeonGate(s,from,to){
 if(s.expedition){
  if(from==='gabel'&&to==='wache'&&!s.facts.oakDoor)return 'Eine verriegelte Eichentür versperrt den Gang.';
  if(from==='bruecke'&&to==='schmiede'&&!s.facts.bridge)return 'Zwischen euch und der Schmiede klafft ein Abgrund.';
  if(from==='archiv'&&to==='schmiede'&&!s.facts.forgeHatch)return 'Die Eisenluke klemmt im Rahmen.';
  if(from==='falle'&&to==='grabkammer'&&!s.facts.trapSafe)return 'Der Gang zur Grabkammer führt direkt über die gespannte Druckplatte.';
  return null;
 }
 if(from==='gabel'&&to==='wache'&&!s.facts.oakDoor)return 'Die Eichentür ist verriegelt. Ein Eisenschlüssel oder ein angekündigter Versuch mit Brecheisen kann sie öffnen. In der Vorratsgrotte könnten die vermissten Praktikanten etwas hinterlassen haben.';
 if(from==='bruecke'&&to==='schmiede'&&!s.facts.bridge)return 'Die Brücke ist gebrochen. Ein sicherer Übergang braucht Seil und Brett. Ein Sprung ist eine riskante Alternative mit angekündigtem Wurf.';
 if(from==='archiv'&&to==='schmiede'&&!s.facts.forgeHatch)return 'Die Eisenluke ist verklemmt. Ein Brecheisen könnte sie öffnen; von der Schmiedeseite gibt es einen Riegel.';
 if(from==='falle'&&to==='grabkammer'&&!s.facts.trapSafe)return 'Die Druckplatte vor der Grabkammer ist noch scharf. Ihr seht die Speeröffnungen deutlich. Untersucht den Mechanismus oder sichert die Platte, bevor ihr hindurchgeht.';
 if(to==='thron'){
  const missing=['Sonnensiegel','Mondsiegel','Grabessiegel'].filter(x=>!s.quest.includes(x));
  if(missing.length)return 'Die Thronsaaltür verlangt drei echte Siegel. Es fehlen: '+missing.join(', ')+'. Sonne liegt beim Skelettamt, Mond bei den Pilzen, Grab im Ossuarium.';
  if(!s.facts.throneDoor)return 'Ihr habt alle drei Siegel. Setzt sie in die Mulden der Dreisiegeltür ein, um den Mechanismus zu öffnen.';
 }
 return null;
}
export function dungeonMap(s,rooms){
 const known=new Set(Object.keys(s.boards));for(const id of Object.keys(s.boards))for(const n of dungeonPaths(s,rooms,id))known.add(n);
 const nodes=[...known].map(id=>({id,name:s.boards[id]?rooms[id].name:'Unbekannter Gang',...{x:dungeonPositions[id][0],y:dungeonPositions[id][1]},visited:Boolean(s.boards[id]),current:id===s.room,clear:Boolean(s.boards[id]?.clear)}));
 const edges=[];for(const id of Object.keys(s.boards))for(const to of dungeonPaths(s,rooms,id)){const key=[id,to].sort().join(':');if(!edges.some(e=>e.key===key))edges.push({key,from:id,to,locked:Boolean(dungeonGate(s,id,to))});}return {nodes,edges,total:13,visited:Object.keys(s.boards).filter(k=>k!=='ausgang').length};
}
