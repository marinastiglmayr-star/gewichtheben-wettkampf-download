# Hosting der Update-Seite

Empfohlene Variante: GitHub Pages.

Warum diese Variante:

- Die Software braucht fuer automatische Updates eine oeffentlich erreichbare `update.json`.
- Das aktuelle ZIP ist groesser als 25 MiB. Cloudflare Pages passt deshalb nicht gut, weil einzelne Dateien dort im Free-Plan auf 25 MiB begrenzt sind.
- GitHub Pages ist fuer eine einfache statische Downloadseite ausreichend und kann per GitHub Actions automatisch aus `dist/update-site` veroeffentlichen.

## Einmalige Einrichtung

1. Auf GitHub im Account `marinastiglmayr-star` ein Repository anlegen:

```text
gewichtheben-wettkampf-download
```

2. Dieses Projekt in das Repository hochladen.
3. Im GitHub-Repository unter `Settings` > `Pages` als Quelle `GitHub Actions` auswaehlen.
4. Im Reiter `Actions` den Workflow `Publish update website` manuell starten oder auf `main` pushen.
5. Nach erfolgreichem Lauf zeigt GitHub die Seitenadresse an.

Die Update-Adresse fuer die Vereins-Laptops lautet dann:

```text
https://marinastiglmayr-star.github.io/gewichtheben-wettkampf-download/update.json
```

Diese Adresse wird bei der Installation oder in der installierten Datei `update-url.txt` eingetragen.

## Neue Version veroeffentlichen

1. Lokal `Paket-erstellen.ps1` ausfuehren.
2. Die aktualisierten Dateien in GitHub hochladen/pushen.
3. GitHub Actions veroeffentlicht die neue Seite.
4. Beim naechsten Start prueft die App die `update.json` und laedt bei neuer Version automatisch das ZIP.

## Sicherheit

Die Update-Dateien muessen fuer die App ohne Browser-Login erreichbar sein. Deshalb ist die Downloadseite oeffentlich, aber sie enthaelt keine Wettkampfdaten und keine Passwoerter. Zugangsschutz sollte ueber den GitHub-Account fuer das Hochladen erfolgen, nicht ueber ein Passwort auf der Downloadseite.
