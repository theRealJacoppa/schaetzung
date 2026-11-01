# Schätzung

Kleine Web-App für das Team an der Bar: Vor der Schicht schätzt jede Person,
was pro Person an Trinkgeld rauskommt. Nach der Schicht wird aufgelöst, wer am
nächsten dran war. Läuft offline und speichert lokal im Browser.

## Ablauf

1. **Vor der Schicht:** Titel und Bar eintragen (Vorschläge kommen von den
   Motorworld-Events der nächsten Tage), Schichtplan fotografieren, neben jedem
   Namen die Schätzung eintragen, „Weiter“.
2. **Nach der Schicht:** Trinkgeld pro Person eintragen, „Auflösen“.
3. **Ergebnis:** Rangliste nach Abstand zum Ist, als Text teilen (WhatsApp).

Zwei Personen können nicht exakt denselben Betrag schätzen. Wer zuerst
eingetragen hat, behält ihn.

## Texterkennung

Die Namen werden mit [Tesseract.js](https://github.com/naptha/tesseract.js)
direkt auf dem Gerät aus dem Foto gelesen. Das Foto verlässt das Gerät nicht.
Eine Personenzeile ist eine Zeile, die mit einer Telefonnummer aus mindestens
neun Ziffern endet. Die zwei Wörter davor sind Vor- und Nachname.

Programm, Kern und deutsche Sprachdaten liegen unter `vendor/`, damit sie
offline aus dem Cache kommen:

| Datei | Quelle |
|---|---|
| `tesseract.min.js`, `worker.min.js` | `tesseract.js@5.1.1` |
| `tesseract-core-*.wasm.js` | `tesseract.js-core@5.1.1` |
| `deu.traineddata.gz` | `@tesseract.js-data/deu` 4.0.0_best_int |

Tesseract.js steht unter der Apache-Lizenz 2.0.

## Dateien

| Datei                  | Zweck                                  |
|------------------------|----------------------------------------|
| `index.html`           | die komplette App                      |
| `manifest.webmanifest` | Name, Farben, Icons für die Installation |
| `sw.js`                | Service Worker für den Offline-Betrieb |
| `icon-*.png`           | Icons                                  |
| `vendor/`              | Texterkennung, siehe oben              |

## Veröffentlichen

Läuft über GitHub Pages aus `main` / `/ (root)`. Auf dem iPhone in Safari
öffnen und „Zum Home-Bildschirm“ wählen. Erst als Homescreen-App bleiben die
Daten dauerhaft erhalten. Safari löscht den Speicher normaler Webseiten nach
sieben Tagen ohne Besuch.

## Aktualisieren

In der Regel reicht es, `index.html` zu ersetzen. Die Seite lädt netzwerk-zuerst
und fällt nur offline auf den Cache zurück. Wenn sich `sw.js`, das Manifest, die
Icons oder `vendor/` ändern, zusätzlich in `sw.js` die Zeile
`const VERSION = "schaetzung-v1";` hochzählen.

## Daten

Alles liegt in `localStorage` auf dem jeweiligen Gerät. Unten in der App gibt
es „Backup speichern“ und „Backup laden“. Laden führt zusammen und ersetzt
nichts.
