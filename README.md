# Site faire-part — Maëlle & Raphaël

Maquettes statiques (HTML/CSS/JS, sans dépendance ni build) du site de mariage.

- `v2/` : version blanc pur
- `v3/` : version blanc cassé (`#FAF6EF`), même code avec la classe `theme-v3` sur `<html>`
- `css/style.css` : styles communs, mobile d'abord, mise en page desktop à partir de 900px
- `js/main.js` : menu mobile, formulaire de réponse, page « Vos musiques »
- `assets/` : illustrations et police Milton Two

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
