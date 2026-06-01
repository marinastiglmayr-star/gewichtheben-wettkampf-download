# Gewichtheben Wettkampf-App

Lokale WLAN-App für einen Gewichtheber-Wettkampf mit PC-Hauptprogramm, Kampfrichter-Handys, zweitem PC, automatischer Aufrufreihenfolge, Versuchsuhrzeiten und HTML-Ergebnisliste.

## Starten

```powershell
node server.js
```

Danach am PC die angezeigte PC-Adresse öffnen, zum Beispiel:

```text
http://localhost:8765
```

Die Kampfrichter öffnen auf ihren Handys im gleichen WLAN die angezeigte `/judge`-Adresse und melden sich mit dem Verbindungscode, Namen und Position an.
Auf der PC-Seite wird zusätzlich ein QR-Code angezeigt. Der QR-Code öffnet nur die Kampfrichter-App; der aktuelle Code wird am Handy manuell eingegeben.

Ein zweiter PC kann im gleichen WLAN die angezeigte Wettkampfleitungs-Adresse ohne `/judge` öffnen, zum Beispiel `http://192.168.178.53:8765/`. Beide PCs arbeiten dann live auf demselben lokalen Server. Im Setup wird angezeigt, ob ein weiterer PC online ist. Praktisch sollte trotzdem nur eine Person gleichzeitig denselben Datensatz bearbeiten, weil gleichzeitige Änderungen zuletzt gespeicherte Werte überschreiben können.

Wenn die Adresse am Handy nicht lädt:

- PC und Handy müssen im gleichen WLAN sein. Ein Gast-WLAN blockiert oft andere Geräte.
- Windows kann den Zugriff auf `node.exe` blockieren. Beim ersten Start den Netzwerkzugriff für private Netzwerke erlauben.
- Falls keine Abfrage erscheint: Windows-Sicherheit > Firewall & Netzwerkschutz > App durch Firewall zulassen > `node.exe` für private Netzwerke erlauben.
- Die Adresse muss die WLAN-IP des PCs enthalten, zum Beispiel `http://192.168.178.53:8765/judge`, nicht `localhost`.
- In einem anderen WLAN zeigt die App automatisch eine andere Adresse an. Die Windows-Firewall-Regel muss dieses Netz aber ebenfalls erlauben.

## Ablauf

- Das Setup ist in ein linkes Menü aufgeteilt: Wettkampf & Gruppen, Athleten & Waage, Netzwerk, Relativabzug, Geschlechter/Kategorien, Gewichtscheiben und Hilfe & Kontakt.
- Standardmäßig ist nur Gruppe A vorbereitet. Weitere Gruppen können ergänzt, umbenannt, verschoben und wieder entfernt werden, solange ihnen keine Athleten zugeordnet sind.
- Für den Wettkampf 1 oder 3 Kampfrichter auswählen.
- Athleten können zuerst nur mit Meldedaten angelegt werden. Über den Button `Waage` öffnet sich ein eigenes Fenster, in dem Körpergewicht sowie Anfangsgewichte für Reißen und Stoßen für die bereits gemeldeten Athleten nachgetragen werden.
- Die Startnummer wird intern nur noch als Eingabereihenfolge verwendet und nicht mehr im Setup abgefragt.
- Im Menü `Geschlechter / Kategorien` können die auswählbaren Kategorien, deren Stangengewicht, Gewichtsklassen-Typ, Relativtabelle und Technikwertung angepasst werden. Diese Liste füllt direkt das Athleten-Dropdown.
- Im Menü `Gewichtscheiben` können Gewicht, Farbe und Anzeigegröße der verfügbaren Scheiben bearbeitet, hinzugefügt oder entfernt werden.
- Über `Relativabzug` können die Abzüge für Mann, Frau und Kind bearbeitet werden.
- Die Technikwertung kann im Setup ein- oder ausgeschaltet werden und gilt für Kategorien, bei denen Technik aktiviert ist.
- Wettkampf starten.
- Die App lässt zuerst das Reißen für alle Gruppen laufen: Reißen Gruppe 1, Reißen Gruppe 2 bis Gruppe n. Erst danach wird das Stoßen freigeschaltet und läuft wieder Gruppe 1 bis Gruppe n.
- Innerhalb der aktiven Gruppe ruft die App zuerst alle ersten Versuche nach Startnummer auf, danach alle zweiten Versuche und danach alle dritten Versuche.
- Jeder Kampfrichter sendet auf dem Handy Weiß oder Rot.
- Bei Technikwertung für Kinder erscheinen am Handy zusätzlich Technikpunkte.
- Bei einem Kampfrichter darf dieser am Handy auch `Eintragen` und `Leeren`; bei drei Kampfrichtern darf das der mittlere Hauptkampfrichter.
- Am PC wird pro Position angezeigt, welcher Kampfrichter verbunden ist und welche Stimme Links, Mitte und Rechts abgegeben haben.
- Bei einem einzelnen Kampfrichter wird nur ein Kampfrichterfeld ohne Links/Mitte/Rechts-Position angezeigt.
- Zwei oder drei weiße Stimmen ergeben einen gültigen Versuch.
- Das Scheibenfenster steckt mit der zum Athleten passenden Stange und den im Setup hinterlegten Scheiben; 1,25 kg ist standardmäßig grau.
- Starterlisten und die Ergebnisliste können oben in der Menüleiste als HTML-Datei ausgegeben und gedruckt werden.
- Die Ergebnisliste wird gruppenweise ausgegeben. Darin werden zusätzlich die relativ stärkste Frau und der relativ stärkste Mann gruppenübergreifend ausgewiesen.
- In der Ergebnisliste werden Zweikampf, Relativabzug, Ergebnis nach Abzug sowie bei aktivierter Technikwertung Technikpunkte und Gesamtwertung getrennt angezeigt.
- Die Spalte `Technik` erscheint nur, wenn Technikwertung im Setup aktiv ist und mindestens eine betroffene Kategorie im Menü `Geschlechter / Kategorien` Technikwertung erlaubt.

## Hilfe & Kontakt

Ansprechpartnerin für die Software ist Marina Leonie Stiglmayr, STC Bavaria 20 Landshut e. V.
Kontakt: mls-management@web.de

## Gespeicherte Daten

Der Server speichert den aktuellen Wettkampf lokal in `competition-state.json`. Zusätzlich kann der Wettkampf als JSON exportiert und später wieder importiert werden.

## Windows-Installation für USB-Stick

Auf dem Entwicklungs-PC ein Installationspaket erstellen:

```powershell
.\Paket-erstellen.ps1
```

Das erzeugt `dist\Gewichtheben-Wettkampf-App.zip`. Diese ZIP-Datei auf den Vereins-Laptop kopieren, entpacken und `Installieren.cmd` per Doppelklick starten.

Der Installer:

- kopiert die App nach `%LOCALAPPDATA%\GewichthebenWettkampf`
- nutzt eine gebündelte Node-Laufzeit, falls sie im Paket enthalten ist
- legt Desktop- und Startmenü-Verknüpfungen an
- richtet per Windows-Admin-Abfrage die Firewall für TCP 8765 im jeweils aktuellen lokalen Subnetz ein

Im Vereins-WLAN zeigt die App automatisch die dort gültige Handy-Adresse und den passenden QR-Code an.

## Online-Updates

Beim Start prüft der Launcher optional, ob online eine neuere Version verfügbar ist. Dafür muss auf dem Vereins-Laptop einmal die Update-Adresse in folgender Datei eingetragen werden:

```text
%LOCALAPPDATA%\GewichthebenWettkampf\update-url.txt
```

In diese Datei gehört die vollständige Adresse zur Datei `update.json`, zum Beispiel:

```text
https://marinastiglmayr-star.github.io/gewichtheben-wettkampf-download/update.json
```

Wenn die Datei leer ist, wird die Update-Prüfung übersprungen. Ist eine Update-Adresse eingetragen, lädt die App beim Start automatisch eine neuere Version herunter, prüft die SHA256-Prüfsumme aus dem Manifest, ersetzt die Programmdateien und startet danach normal. Wettkampfdaten, Backups und die Update-Adresse bleiben erhalten.

Beim Erstellen des Pakets wird zusätzlich dieser Ordner erzeugt:

```text
dist\update-site
```

Diesen Ordner kannst du auf eine Webseite oder einen statischen Webspace hochladen. Empfohlen ist GitHub Pages mit dem Workflow `.github/workflows/publish-update-site.yml`; Details stehen in `hosting-github-pages.md`.

Der Ordner enthält:

- `index.html` als Downloadseite für Menschen
- `update.json` als Manifest für den Launcher
- `Gewichtheben-Wettkampf-App.zip` als aktuelle Installationsdatei

Nach dem Hochladen muss die URL zur `update.json` in `update-url.txt` auf den Vereins-Laptops stehen.
