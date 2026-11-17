# gruft-des-falschen-koenigs
mobile rpg game

## Die Gruft des falschen Königs

Kooperatives Würfelabenteuer für 3–6 Personen. Ein Gerät leitet die Runde, alle anderen nutzen ihr Handy für Charakter, Inventar und Aktionen. Gewürfelt wird mit einem echten W20.

### Im WLAN starten

Voraussetzung: Node.js 24 oder neuer.

1. `npm run build`
2. `npm run dev`
3. Auf dem Tablet die angezeigte WLAN-Adresse öffnen und einen Gruppenraum erstellen. Mit den Spielerhandys den QR-Code scannen.
4. Für eine Solo-Probe auf dem Rechner `http://localhost:8788` öffnen.

Die Spielelogik speichert gemeinsame Runden auf dem Server. GitHub Pages allein kann diesen Server nicht ausführen.

`node --test` führt die Tests aus. `world.mjs` enthält Spoiler.
