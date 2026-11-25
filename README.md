# Site faire-part — Maëlle & Raphaël

Site statique (HTML/CSS/JS, sans dépendance ni build) du mariage, d'après la maquette V3 (fond blanc cassé `#FAF6EF`).

- `*.html` : pages du site, à la racine
- `css/style.css` : styles, mobile d'abord, mise en page desktop à partir de 900px
- `js/main.js` : menu mobile, formulaire de réponse, page « Vos musiques »
- `assets/` : illustrations et police Milton Two

Pour revenir au fond blanc pur de la maquette V2, changer `--fond` en `#ffffff` dans `css/style.css`.

Pages : accueil (`index.html`), réponse (`rsvp.html`), merci oui / non, vos musiques.

## Limites connues

- Pas de back-end : le formulaire de réponse redirige vers la page de remerciement sans enregistrer les données.
- La recherche de musiques utilise un petit catalogue de démonstration à remplacer par une API.
- Les numéros de téléphone, e-mails et hébergements sont des textes provisoires entre crochets.

## Aperçu en local

```sh
python3 -m http.server
```

puis ouvrir http://localhost:8000.
