const action = (name, stat, dc, downside, result, extra = {}) => ({ name, stat, dc, downside, result, ...extra });

export const heroes = {
  Dave: {title:'Schlachtkoch', glyph:'✺', stats:[2,3,1], gear:['Spukball','Rauchdose'], skill:'Oh nein. Er macht’s wieder.', info:'Ein Mitspieler kann deinen nächsten Wurf mit +3 statt +2 unterstützen.'},
  Nico: {title:'Nuggetmönch', glyph:'☾', stats:[1,2,3], gear:['Nugget','Flammenstab'], skill:'Du Geier.', info:'Du pennst weg und erfährst allein einen Hinweis zum aktuellen Raum.'},
  Patrick: {title:'Thekenritter', glyph:'⚔', stats:[3,2,1], gear:['Klinge','Nugget'], skill:'Matschauge', info:'Du fängst dich wieder und regenerierst 3 LP. Klappt auch am Boden.'},
  Melli: {title:'Tintenbändigerin', glyph:'❋', stats:[1,3,2], gear:['Runenkreide','Nugget'], skill:'Den hab ich noch nicht.', info:'Kann ein geschwächtes Monster zähmen. In friedlichen Momenten malt sie einen magischen Köder.'},
  Jenny: {title:'Sonnenpakt-Hexe', glyph:'☀', stats:[1,2,3], gear:['Spukball','Nugget'], skill:'Noch einmal Sonne.', info:'Sonne aktivieren und beim nächsten eigenen Patzer entscheiden, ob du nachlegst.'},
  Gast: {title:'Söldner auf Probe', glyph:'✦', stats:[2,2,2], gear:['Klinge','Runenkreide'], skill:'Das steht im Vertrag.', info:'Einmal pro Dungeon 3 LP regenerieren, auch am Boden.'}
};

export const items = {
  Nugget:'Heilt dich oder einen Gruppenfreund um 2 LP.',
  Klinge:'Angriff mit Kraft. Treffer verursachen 3 Schaden.',
  Spukball:'Angriff mit Geschick. Kann Hebel aus der Ferne treffen.',
  Rauchdose:'Einmal einsetzen. Die Gruppe kann einem Gegner durch den Rauch ausweichen.',
  Runenkreide:'Einmal einsetzen. Öffnet eine markierte Geheimtür oder deckt einen Hinweis auf.',
  Flammenstab:'4 Schaden. Unter Magie 3 trifft eine natürliche 1–5 stattdessen zwei lebende Helden.',
  Riesenschwert:'5 Schaden. Unter Kraft 3 ist der Treffer schwerer. Eine natürliche 1–5 kostet dich 2 LP.',
  Schlummerglöckchen:'Setzt den Gegner für zwei Runden aus. Bei einem schlechten Magiewurf schläfst du selbst ein.',
  'Sporenbeutel':'Einmal einsetzen. Ein magischer Köder lenkt das Monster ab.',
  'Goldener Nugget':'Heilt eine Figur um 4 LP. Schmeckt nach fragwürdigen Entscheidungen.'
};

export const world = {
  tor:{name:'Das Tor ohne Öffnungszeiten', glyph:'⌂', story:'Am Ende der Treppe blinzelt ein steinernes Gesicht. „Besuch nach Einbruch der Dunkelheit nur in Begleitung eines Verstorbenen.“ Neben dem Tor hängt ein Messinggong. Hinter einem losen Gitter zieht kalte Luft.', clue:'Der Gong ist von innen mit Filz beklebt. Das Gitter hängt schief genug für eine Klinge.', paths:['wache','pilze'],
    actions:{gitter:action('Gitter aufhebeln',0,12,'Du verlierst 1 LP. Der Durchgang gibt trotzdem nach.','Das Schloss gibt mit einem beleidigten „Aua“ nach.',{clear:true,failClear:true}),gong:action('Gong prüfen',1,11,'Der Gong scheppert. Du verlierst 1 LP am scharfen Rand.','Du legst den Mechanismus frei und das Tor schwingt auf.',{clear:true,failClear:true})}},
  wache:{name:'Wachstube der Kurzen',glyph:'⚔',story:'Fünf kniehohe Wodka-Skelette halten euch mit Schnapsgläsern als Helmen auf. Eines klappt die Gästeliste zu. „Na, Schwabbi. Damals schon die Kommentarspalte vollgekotzt.“',clue:'Die Skelette würden für einen guten Trinkspruch sogar ihre eigene Beerdigung unterbrechen.',paths:['saal','truhe','pilze'],enemy:{name:'Die kurzen Wodka-Skelette',hp:8,loot:'Riesenschwert'},
    actions:{prost:action('Einen Trinkspruch halten',0,14,'Die Skelette rempeln dich an und bleiben auf der Gästeliste sitzen.','Die Kurzen liegen sternförmig unter der Theke.',{clear:true,loot:'Riesenschwert',hero:'Patrick',heroBonus:4}),liste:action('Gästeliste frisieren',1,13,'Die Wache reagiert sofort.','Mit fünf gefälschten Geburtstagen gilt die Truppe als geschlossene Gesellschaft.',{clear:true})}},
  pilze:{name:'Keller der schlechten Beichten',glyph:'❋',story:'Zwischen Pilzen flüstern Stimmen Dinge, die du seit Jahren verdrängst. Ein Schamsporenhund knurrt neben einem aufgeplatzten Mauerwerk. Auf seiner Marke steht: „Bitte nicht wieder ins Tierheim bringen.“',clue:'Hinter der rissigen Wand klingt alles dreimal nach. Die Kreidemarkierung daneben zeigt nach oben.',paths:['saal','truhe','wache'],secret:'kapelle',enemy:{name:'Schamsporenhund',hp:7,loot:'Sporenbeutel'},
    actions:{futter:action('Mit einem Geräusch ablenken',1,13,'Das Tier schnappt zu, bevor du deine Hand rausziehst.','Er rennt in den nächsten Gang. Die Pilze bellen prompt im Chor.',{clear:true}),wand:action('Hinter der Mauer suchen',1,12,'Ein Pilz erzählt der ganzen Gruft dein peinlichstes Geheimnis. Du verlierst 1 LP.','Ein verkanteter Stein gibt die Kapelle frei.',{secret:true})}},
  saal:{name:'Schlafsaal der Unruhigen',glyph:'☾',story:'Ein riesiger Wecker auf zwei Beinen stapft um sechs Betten. Er zählt „fünf Minuten länger“ als persönlichen Angriff. Auf seinem Rücken sitzt ein Schalter.',clue:'Auf dem Schalter steht in winziger Schrift „Werktage“. Der Weckermann bucht auch Feiertage als Überstunden.',paths:['truhe','thron'],enemy:{name:'Der Weckermann',hp:10,loot:'Schlummerglöckchen'},
    actions:{sonntag:action('Schalter auf Sonntag stellen',1,14,'Der Weckermann schlägt mit dem Snooze-Knopf nach dir.','„Heute ist frei.“ Der Weckermann kippt in ein Bett und stellt sich selbst auf lautlos.',{clear:true,loot:'Schlummerglöckchen'}),schlaf:action('Sich schlafend stellen',2,12,'Der Wecker stellt sich direkt neben dich.','Ein Wecker mit Tunnelblick. Die anderen kommen an ihm vorbei.',{clear:true,hero:'Nico',heroBonus:4})}},
  truhe:{name:'Kammer der freiwilligen Opfer',glyph:'◇',story:'Eine Truhe schnarcht. Ein Schild sagt: „Die letzte Person hat bis zum Ellbogen gesucht.“ Auf der Rückseite stehen drei eingeritzte Noten.',clue:'Die Truhe grinst nur, wenn die drei Noten rückwärts gesummt werden. Dahinter sieht man einen Türspalt.',paths:['saal','thron'],secret:'kapelle',
    actions:{kiste:action('Truhe öffnen',1,13,'Der Mimic klappt zu. Du verlierst 2 LP, kannst aber nochmal ran.','Du erwischst das Scharnier. Die Truhe bedankt sich höflich für euren Besuch.',{clear:true,loot:'Goldener Nugget',damage:2}),noten:action('Noten rückwärts summen',2,11,'Du triffst eine Note, bei der der Stein beleidigt zurücksummt. Du verlierst 1 LP.','In der Wand klickt ein alter Verschluss. Ein Vorhang fällt aus Stein.',{secret:true})}},
  kapelle:{name:'Kapelle der offenen Rechnungen',glyph:'✦',story:'Schutzgeister in Hochzeitskleidern warten seit drei Jahrhunderten aufs Buffet. Ihre Glocke hat ein Namensschild: „Nur im Fall einer Beschwerde.“',clue:'Der falsche König hat persönlich „Essen für alle“ unterschrieben. Die Geister wissen noch nicht, wer er ist.',paths:['thron','truhe'],actions:{glocke:action('Glocke läuten',2,10,'Ein Geist fordert Trinkgeld. Du verlierst 1 LP, die Hochzeitsgesellschaft zieht trotzdem los.','Ihr zeigt auf den Thronsaal. Vierzig Geister stehen gleichzeitig auf.',{clear:true,blessing:true,failClear:true})}},
  thron:{name:'Thronsaal Ihrer Niedrigkeit',glyph:'♛',story:'Der falsche König sitzt auf einem Teppich, der seine eigene Krönungsurkunde gefressen hat. „Wer mich anfassen will, zieht die Schuhe aus.“ Die Krone schwebt an einem dünnen schwarzen Faden.',clue:'Der Faden hängt am Kronleuchter. Auf seinem Hals trägt der König ein Schild: „Bei Beschwerden nicht direkt an mich wenden.“',paths:['ausgang'],enemy:{name:'Der falsche König',hp:13,loot:'Goldener Nugget'},
    actions:{krone:action('Die Krone herunterholen',1,16,'Der Teppich holt dir die Füße weg. Der König schlägt zurück.','Die Krone fällt in eure Hände. Der Teppich kündigt fristlos.',{clear:true,blessBonus:5}),verhandlung:action('Die Krönung anfechten',2,16,'Seine Niedrigkeit verlangt ein Duell.','Der König weicht vor der Hochzeitsgesellschaft zurück. Die Krone gehört euch.',{clear:true,blessBonus:6})}},
  ausgang:{name:'Luft zum Atmen',glyph:'✶',story:'Ihr stolpert mit der Krone ins Freie. Hinter euch hängt jemand ein Schild ans Tor: „Wegen privater Veranstaltung geschlossen.“',paths:[],actions:{}}
};

export function freeAction(room, phrase){
  const word=phrase.toLowerCase();
  const actions={
    tor:[['gong',/gong/,/prüf|läut|klingel|tön/],['gitter',/gitter|schloss|tür|tor/,/aufhebel|hebel|tret|tritt|ramm|drück|bieg|aufbrech|brech.*auf/]],
    wache:[['prost',/trink|prost|wodka|schnaps/,/spruch|toast|trink|sauf|prost/],['liste',/gästeliste|liste|gäste|pass/,/fälsch|änder|frisier|schreib|trag.*ein|verkleid/]],
    pilze:[['wand',/wand|loch|riss|spalt/,/klopf|öffn|aufmach|drück|horch|such/],['futter',/tier|hund|monster/,/lock|ablenk|jaul|bell/]],
    saal:[['sonntag',/schalt|uhr|wecker/,/sonntag|ausmach|abschalt|stell/],['schlaf',/schlaf|penn|schnarch/,/stell|tu so|leg|köder|schnarch/]],
    truhe:[['noten',/noten|melodie/,/sing|summ|pfeif/],['kiste',/truhe|mimic|schloss|kiste/,/öffn|hebel|knack|aufmach/]],
    kapelle:[['glocke',/glock|läut/,/läut|einläut|klingel|schlag.*an/]],
    thron:[['krone',/krone|faden|kronleuchter/,/hol|zieh|schneid|durchtrenn|klau|stehl|schieß/],['verhandlung',/krön|urne|urkunde|könig/,/anfecht|beklag|überred|red|beschwer|widerspr/]]
  };
  if(/\b(?:greif.*an|angreif|schlag zu|hau .*um|attackier|prügel)/.test(word)) return 'attack';
  return actions[room]?.find(([,target,verb])=>target.test(word)&&verb.test(word))?.[0];
}
