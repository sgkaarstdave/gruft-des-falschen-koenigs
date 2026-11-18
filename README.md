# Die Gruft des falschen Königs

## Direkt spielen – ohne Installation

**[▶ Spiel auf Tablet oder Handy öffnen](https://gruft-des-falschen-koenigs.furrybeetle.chatgpt.site)**

1. Auf dem Tablet den Spiel-Link öffnen und „Auf dem Tablet öffnen“ wählen.
2. Die Spieler scannen mit ihren Handys den QR-Code und geben ihren Namen ein.
3. Auf einem Handy die Runde starten und eigene Aktionen in den Chat schreiben.

Für 2–6 Spieler. Das Tablet zeigt die Kulisse, die Handys sind für die Aktionen. Ihr braucht eine Internetverbindung und bei riskanten Versuchen einen echten W20. Ein gemeinsames WLAN oder ein laufender Rechner ist nicht erforderlich.

Das neue Kapitel ist [hier im Quellcode](https://github.com/sgkaarstdave/gruft-des-falschen-koenigs/pull/1) beschrieben. Die Online-Version ist bereits veröffentlicht.

## Älteren lokalen Quellstand starten

Der Hauptzweig enthält noch den vorherigen Prototyp. Für einen lokalen WLAN-Server benötigt er Node.js 24 oder neuer:

1. `npm run build`
2. `npm run dev`
3. Auf dem Tablet die angezeigte WLAN-Adresse öffnen und einen Gruppenraum erstellen. Mit den Spielerhandys den QR-Code scannen.

Die Spielelogik speichert gemeinsame Runden auf dem Server. GitHub Pages allein kann diesen Server nicht ausführen.

`node --test` führt die Tests aus. `world.mjs` enthält Spoiler.
