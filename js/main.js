/* Site faire-part — Maëlle & Raphaël
   Comportements partagés : menu mobile, formulaire de réponse, page musiques. */
(function () {
  'use strict';

  /* ---------- Menu mobile ---------- */
  var boutonMenu = document.querySelector('.bouton-menu');
  var menu = document.getElementById('menu-mobile');
  if (boutonMenu && menu) {
    var basculerMenu = function (ouvrir) {
      boutonMenu.setAttribute('aria-expanded', String(ouvrir));
      boutonMenu.setAttribute('aria-label', ouvrir ? 'Fermer le menu' : 'Ouvrir le menu');
      menu.hidden = !ouvrir;
      document.body.classList.toggle('menu-ouvert', ouvrir);
    };
    boutonMenu.addEventListener('click', function () {
      basculerMenu(boutonMenu.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) {
        basculerMenu(false);
        boutonMenu.focus();
      }
    });
  }

  /* ---------- Autres pages : ordre d'apparition des encarts ---------- */
  if (!document.body.classList.contains('page-accueil')) {
    document.querySelectorAll('.contenu .carte').forEach(function (carte, i) {
      carte.style.setProperty('--i', i);
    });
  }

  /* ---------- Accueil : apparition des encarts au défilement ---------- */
  var contenuAccueil = document.querySelector('.page-accueil .contenu');
  var mouvementReduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (contenuAccueil && 'IntersectionObserver' in window && !mouvementReduit) {
    document.documentElement.classList.add('anim');
    var observateur = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (entree) {
        if (entree.isIntersecting) {
          entree.target.classList.add('visible');
          observateur.unobserve(entree.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(contenuAccueil.children, function (el) { observateur.observe(el); });
  }

  /* ---------- Accueil : défilement par étapes (ordinateur) ----------
     Un geste de molette, de pavé tactile ou une touche fait glisser jusqu'à
     l'encart suivant ou précédent. Un encart plus haut que l'écran se lit
     d'abord normalement, puis on passe au suivant. */
  var etapesPossibles = contenuAccueil && !mouvementReduit &&
    window.matchMedia('(min-width: 900px) and (pointer: fine)').matches;
  if (etapesPossibles) {
    var entete = document.querySelector('.entete');
    var etapes = [document.querySelector('.hero-plein')].concat(
      Array.prototype.slice.call(contenuAccueil.querySelectorAll(':scope > .carte')));
    var enCours = false, indexVise = 0, animation = null;
    var dernierEvenement = 0, dernierSens = 0, pic = 0, creux = 0;

    var hauteurEntete = function () { return entete ? entete.offsetHeight : 0; };
    // Position dans la page sans tenir compte des animations (translate) en cours
    var haut = function (el) { var y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; };
    // Position de défilement qui centre l'encart sous l'en-tête (ou l'aligne en haut s'il est trop grand)
    var cible = function (el) {
      var h = hauteurEntete(), dispo = window.innerHeight - h;
      if (el === etapes[0]) return 0;
      var marge = Math.max(24, (dispo - el.offsetHeight) / 2);
      return Math.max(0, Math.round(haut(el) - h - marge));
    };
    var indexCourant = function () {
      var y = window.scrollY, meilleur = 0, ecart = Infinity;
      etapes.forEach(function (el, i) {
        var d = Math.abs(cible(el) - y);
        if (d < ecart) { ecart = d; meilleur = i; }
      });
      return meilleur;
    };
    // Démarre tout de suite puis freine en douceur : la page réagit dès le geste
    var adoucir = function (t) { return 1 - Math.pow(1 - t, 4); };
    // Glissé vers y ; s'il y en a déjà un en cours, il est réorienté depuis la position actuelle
    var allerA = function (y) {
      if (animation) cancelAnimationFrame(animation);
      var depart = window.scrollY, distance = y - depart;
      if (Math.abs(distance) < 2) { enCours = false; return; }
      var duree = Math.min(800, 480 + Math.abs(distance) * 0.2), debut = null;
      enCours = true;
      var pas = function (t) {
        if (debut === null) debut = t;
        var p = Math.min(1, (t - debut) / duree);
        window.scrollTo({ top: depart + distance * adoucir(p), behavior: 'instant' });
        if (p < 1) animation = requestAnimationFrame(pas);
        else { enCours = false; animation = null; }
      };
      animation = requestAnimationFrame(pas);
    };
    // Renvoie true si le geste a été consommé par la lecture d'un encart trop haut
    var defilerDansEncart = function (sens, delta) {
      var i = indexCourant(), el = etapes[i];
      var h = hauteurEntete(), dispo = window.innerHeight - h;
      if (i === 0 || el.offsetHeight <= dispo + 80) return false;
      var y = window.scrollY, debutEl = haut(el) - h - 24, finEl = haut(el) + el.offsetHeight + 24 - window.innerHeight;
      if (sens > 0 && y < finEl - 2) { window.scrollTo({ top: Math.min(finEl, y + delta), behavior: 'instant' }); return true; }
      if (sens < 0 && y > debutEl + 2) { window.scrollTo({ top: Math.max(debutEl, y + delta), behavior: 'instant' }); return true; }
      return false;
    };
    // Les étapes, plus le bas de page s'il dépasse le dernier encart
    var position = function (i) {
      if (i < etapes.length) return cible(etapes[i]);
      return document.documentElement.scrollHeight - window.innerHeight;
    };
    var nbPositions = function () {
      var bas = document.documentElement.scrollHeight - window.innerHeight;
      return bas > cible(etapes[etapes.length - 1]) + 10 ? etapes.length + 1 : etapes.length;
    };
    // Chaque geste compte : pendant un glissé, un nouveau geste repart de l'étape visée
    var etapeSuivante = function (sens) {
      var base = enCours ? indexVise : indexCourant();
      indexVise = Math.max(0, Math.min(nbPositions() - 1, base + sens));
      allerA(position(indexVise));
    };

    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return; // zoom
      e.preventDefault();
      var maintenant = performance.now();
      var delta = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
      if (!delta) return;
      var sens = delta > 0 ? 1 : -1, fort = Math.abs(delta);
      // Nouveau geste : pause, changement de sens, ou relance (le pavé tactile envoie
      // une traîne d'inertie qui décroît ; un nouveau coup de doigt la fait remonter)
      var nouveau = maintenant - dernierEvenement > 90 || sens !== dernierSens ||
        (creux < pic * 0.6 && fort > creux * 1.8 && fort >= 12);
      if (nouveau) { pic = fort; creux = fort; }
      else { pic = Math.max(pic, fort); creux = fort < pic ? Math.min(creux, fort) : pic; }
      dernierEvenement = maintenant; dernierSens = sens;
      // Encart plus haut que l'écran : on le lit normalement jusqu'à son bord
      if (!enCours && defilerDansEncart(sens, delta)) return;
      if (nouveau) etapeSuivante(sens);
    }, { passive: false });

    document.addEventListener('keydown', function (e) {
      if (e.target.closest('input, textarea, select, [contenteditable]')) return;
      var sens = { ArrowDown: 1, PageDown: 1, ' ': e.shiftKey ? -1 : 1, ArrowUp: -1, PageUp: -1 }[e.key];
      if (!sens) return;
      e.preventDefault();
      etapeSuivante(sens);
    });
  }

  /* ---------- Réponse (RSVP) ---------- */
  var formRsvp = document.getElementById('form-rsvp');
  if (formRsvp) {
    formRsvp.querySelectorAll('.compteur').forEach(function (compteur) {
      var min = Number(compteur.dataset.min);
      var max = Number(compteur.dataset.max);
      var affichage = compteur.querySelector('output');
      var champ = compteur.querySelector('input[type="hidden"]');
      compteur.querySelectorAll('button[data-pas]').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = Math.max(min, Math.min(max, Number(champ.value) + Number(b.dataset.pas)));
          champ.value = v;
          affichage.textContent = v;
        });
      });
    });

    var siPresent = formRsvp.querySelector('.si-present');
    var majPresence = function () {
      var non = formRsvp.querySelector('#presence-non').checked;
      if (siPresent) siPresent.hidden = non;
    };
    formRsvp.querySelectorAll('input[name="presence"]').forEach(function (r) {
      r.addEventListener('change', majPresence);
    });
    majPresence();

    // HYPOTHÈSE : pas encore de back-end. La réponse n'est pas enregistrée,
    // on redirige simplement vers la page de remerciement adaptée.
    formRsvp.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!formRsvp.reportValidity()) return;
      var non = formRsvp.querySelector('#presence-non').checked;
      window.location.href = non ? formRsvp.dataset.merciNon : formRsvp.dataset.merciOui;
    });
  }

  /* ---------- Vos musiques ---------- */
  var formMusiques = document.getElementById('form-musiques');
  if (formMusiques) {
    // HYPOTHÈSE : catalogue de démonstration, à remplacer par une API (iTunes, Deezer…).
    var catalogue = [
      { id: 'a1', titre: 'Dancing Queen', artiste: 'ABBA', couleur: '#d9b3b4' },
      { id: 's3', titre: 'September', artiste: 'Earth, Wind & Fire', couleur: '#e8d88a' },
      { id: 'c1', titre: 'Alexandrie Alexandra', artiste: 'Claude François', couleur: '#a9dcc4' },
      { id: 'm1', titre: 'Les Lacs du Connemara', artiste: 'Michel Sardou', couleur: '#a8c8e0' },
      { id: 'q1', titre: "Don't Stop Me Now", artiste: 'Queen', couleur: '#c2a688' },
      { id: 'u1', titre: 'Uptown Funk', artiste: 'Mark Ronson, Bruno Mars', couleur: '#d9b3b4' },
      { id: 'k1', titre: 'Mr. Brightside', artiste: 'The Killers', couleur: '#a8c8e0' },
      { id: 'd1', titre: 'Dancing in the Moonlight', artiste: 'Toploader', couleur: '#e8d88a' },
      { id: 'c2', titre: 'Cette année-là', artiste: 'Claude François', couleur: '#c2a688' },
      { id: 'b1', titre: 'I Gotta Feeling', artiste: 'The Black Eyed Peas', couleur: '#a9dcc4' }
    ];
    var etat = {
      choisis: [],
      proposees: [
        { id: 'c1', par: 'Julie' }, { id: 'q1', par: 'Thomas' }, { id: 'u1', par: 'Camille' },
        { id: 'm1', par: 'Papy Jean' }, { id: 'k1', par: 'Lucas' }
      ]
    };

    var $ = function (id) { return document.getElementById(id); };
    var champRecherche = $('recherche');
    var listeResultats = $('resultats');
    var listeSelection = $('selection');
    var corpsProposees = $('proposees');
    var blocEnvoye = $('envoye');

    var trouver = function (id) {
      return catalogue.find(function (c) { return c.id === id; });
    };
    var proposeePar = function (id) {
      var p = etat.proposees.find(function (x) { return x.id === id; });
      return p ? p.par : '';
    };
    var el = function (tag, classe, texte) {
      var n = document.createElement(tag);
      if (classe) n.className = classe;
      if (texte !== undefined) n.textContent = texte;
      return n;
    };
    var ICONE_PLUS = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
    var ICONE_OK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>';
    var ICONE_X = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

    var morceau = function (c) {
      var ligne = el('div', 'morceau');
      var pochette = el('span', 'pochette');
      pochette.style.setProperty('--c', c.couleur);
      var infos = el('div', 'infos-morceau');
      infos.appendChild(el('p', 'titre-morceau', c.titre));
      infos.appendChild(el('p', 'artiste', c.artiste));
      ligne.appendChild(pochette);
      ligne.appendChild(infos);
      return { ligne: ligne, infos: infos };
    };

    var basculer = function (id) {
      var i = etat.choisis.indexOf(id);
      if (i >= 0) etat.choisis.splice(i, 1); else etat.choisis.push(id);
      rendu();
    };

    var rendu = function () {
      // Résultats
      var q = champRecherche.value.trim().toLowerCase();
      listeResultats.textContent = '';
      listeResultats.hidden = q === '';
      if (q) {
        var trouves = catalogue.filter(function (c) {
          return (c.titre + ' ' + c.artiste).toLowerCase().indexOf(q) >= 0;
        });
        if (!trouves.length) {
          listeResultats.appendChild(el('li', 'aucun', 'Aucun résultat pour « ' + champRecherche.value.trim() + ' ».'));
        }
        trouves.forEach(function (c) {
          var choisi = etat.choisis.indexOf(c.id) >= 0;
          var m = morceau(c);
          var par = proposeePar(c.id);
          if (par) m.infos.appendChild(el('p', 'deja', 'Déjà proposée par ' + par));
          var b = el('button', 'bouton-ajout');
          b.type = 'button';
          b.setAttribute('aria-pressed', String(choisi));
          b.setAttribute('aria-label', (choisi ? 'Retirer ' : 'Ajouter ') + c.titre);
          b.innerHTML = choisi ? ICONE_OK : ICONE_PLUS;
          b.addEventListener('click', function () { basculer(c.id); });
          m.ligne.appendChild(b);
          var li = el('li');
          li.appendChild(m.ligne);
          listeResultats.appendChild(li);
        });
      }

      // Sélection
      listeSelection.textContent = '';
      $('nb-selection').textContent = etat.choisis.length;
      if (!etat.choisis.length) {
        listeSelection.appendChild(el('li', 'vide', "Aucune chanson pour l'instant."));
      }
      etat.choisis.map(trouver).forEach(function (c) {
        var m = morceau(c);
        var b = el('button', 'bouton-retirer');
        b.type = 'button';
        b.setAttribute('aria-label', 'Retirer ' + c.titre);
        b.innerHTML = ICONE_X;
        b.addEventListener('click', function () { basculer(c.id); });
        m.ligne.appendChild(b);
        var li = el('li');
        li.appendChild(m.ligne);
        listeSelection.appendChild(li);
      });

      // Déjà proposées (les plus récentes en premier)
      corpsProposees.textContent = '';
      $('nb-proposees').textContent = etat.proposees.length;
      etat.proposees.slice().reverse().forEach(function (p) {
        var c = trouver(p.id);
        if (!c) return;
        var tr = el('tr');
        tr.appendChild(el('td', '', c.titre));
        tr.appendChild(el('td', '', c.artiste));
        tr.appendChild(el('td', '', p.par));
        corpsProposees.appendChild(tr);
      });
    };

    champRecherche.addEventListener('input', rendu);

    // HYPOTHÈSE : les propositions ne sont conservées que dans la page (pas de back-end).
    formMusiques.addEventListener('submit', function (e) {
      e.preventDefault();
      var par = $('prenom').value.trim() || 'Anonyme';
      var deja = etat.proposees.map(function (p) { return p.id; });
      etat.choisis.forEach(function (id) {
        if (deja.indexOf(id) < 0) etat.proposees.push({ id: id, par: par });
      });
      formMusiques.hidden = true;
      blocEnvoye.hidden = false;
      rendu();
    });

    $('encore').addEventListener('click', function () {
      etat.choisis = [];
      champRecherche.value = '';
      formMusiques.hidden = false;
      blocEnvoye.hidden = true;
      rendu();
      champRecherche.focus();
    });

    rendu();
  }
})();
