# AutoPartSelect — site vitrine (aps-logiciel.fr)

Site statique généré avec [Eleventy](https://www.11ty.dev/).

## Développement local

```bash
npm install
npm run serve
```

Ouvrir `http://localhost:8080`.

## Build de production

```bash
npm run build
```

Sortie dans `_site/` (HTML, CSS, JS, assets — **sans** MP4 dans le passthrough Eleventy).

Artefact GitHub Pages (build, vidéos, réencodage, contrôles) :

```bash
npm run build:pages
```

Variables / secrets CI : `APS_DEMO_VIDEO_URL`, `APS_TESTIMONIAL_VIDEO_URL`. **ffmpeg** est requis en CI pour le réencodage (installé dans le workflow).

Pour les vidéos en local : `assets/videos/*.mp4` (gitignorés). Hors CI, Eleventy copie les MP4 dans `_site` après build pour `npm run serve`.

Les métadonnées vidéo (`src/_data/videos.json`, généré — voir `videos.json.example`) et le JSON-LD `VideoObject` ne sont émis **que** si les MP4 sont présents dans `_site` (pipeline `build:pages`).

Domaine : `CNAME` → `aps-logiciel.fr`. Analytics Plausible optionnel via `site.plausibleDomain` dans `src/_data/site.json` (vide ou retirer pour désactiver).

## Déploiement serveur

Sur la machine qui sert `aps-logiciel.fr` (Apache/Nginx) :

```bash
chmod +x deploy.sh
cp .deploy.env.example .deploy.env   # puis éditer APS_WEB_ROOT
./deploy.sh
```

Le script fait un `git fetch` + `reset --hard` sur `main`, lance `scripts/prepare-pages-artifact.sh` (npm ci, build, minification, vidéos/ffmpeg si disponible, `check-build`), puis `rsync --delete` de `_site/` vers `APS_WEB_ROOT`.

Variables utiles : `APS_DEMO_VIDEO_URL`, `APS_TESTIMONIAL_VIDEO_URL`, `APS_SKIP_GIT=1`, `APS_SKIP_RSYNC=1` (build seul).

## Structure

- `src/` — landing unique (`index.njk`, menu en ancres) + pages légales et 404
- `assets/` — images, polices, vidéos (MP4 gitignorés, injectés en CI)
- Le site est entièrement généré depuis `src/` (plus de `index.html` monolithique à la racine).
