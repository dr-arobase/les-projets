# Les projets — Portfolio

Site personnel statique contenant des démos et projets.

## Aperçu
Une page HTML/CSS/JS statique avec animations, boutons audio, et divers effets visuels.

## Lancer localement
- Ouvrir `index.html` dans un navigateur.
- Ou servir localement (recommandé) :

```bash
# Python 3
python -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Structure du dépôt
- `index.html` — page principale
- `css/` — feuilles de style
- `js/` — scripts JavaScript
- `asserts/images/` — images et gifs
- `asserts/audio/` — fichiers audio
- `.github/workflows/` — workflows CI (Deno, Pages)

## Développement
- Linter (optionnel) : `deno lint`
- Formattage : `deno fmt`

## Déploiement
Ce dépôt utilise GitHub Pages via `.github/workflows/pages.yml`.

## Licence
Ce projet est sous licence MIT — voir le fichier `LICENSE`.

## Contact
Ouvrez une issue ou créez une PR pour contribution.
