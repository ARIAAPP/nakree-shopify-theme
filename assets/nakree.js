
  /* Amelioration progressive. La classe .js est posee AVANT toute autre
     chose : c'est elle qui autorise le CSS a masquer les blocs. Si ce
     script ne s'execute pas, la classe n'existe pas et la page reste
     entierement visible. Un filet de securite reaffiche tout au bout de
     1,5 s au cas ou l'observateur ne repondrait pas. */
  (function () {
    var racine = document.documentElement;
    var cibles = document.querySelectorAll('.nk-rise');
    if (!('IntersectionObserver' in window) || !cibles.length) return;

    racine.classList.add('js');

    var tout = function () {
      for (var i = 0; i < cibles.length; i++) cibles[i].classList.add('on');
    };
    var filet = setTimeout(tout, 1500);

    var obs = new IntersectionObserver(function (entrees) {
      for (var i = 0; i < entrees.length; i++) {
        if (entrees[i].isIntersecting) {
          entrees[i].target.classList.add('on');
          obs.unobserve(entrees[i].target);
        }
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.02 });

    for (var i = 0; i < cibles.length; i++) obs.observe(cibles[i]);
    window.addEventListener('load', function () { clearTimeout(filet); setTimeout(tout, 2500); });
  })();

  /* Mecanique de la carte d'achat : selection du pack, assurance colis,
     recalcul du total et du prix affiche, compte a rebours.
     Meme comportement que sur les autres boutiques. */
  (function () {
    var carte = document.getElementById('achat');
    if (!carte) return;
    var packs = carte.querySelectorAll('[data-pack]');
    var addon = carte.querySelector('[data-addon]');
    var cible = { total: carte.querySelector('[data-total]'), ref: carte.querySelector('[data-ref]'),
                  pct: carte.querySelector('[data-pct]'), eco: carte.querySelector('[data-eco]'),
                  cta: carte.querySelector('[data-cta]') };

    function euro(c) { return (c / 100).toFixed(2).replace('.', ',') + ' €'; }

    function refresh() {
      var actif = carte.querySelector('[data-pack].on') || packs[0];
      var prix = parseInt(actif.dataset.prix, 10);
      var ref = parseInt(actif.dataset.ref, 10);
      var eco = parseInt(actif.dataset.eco, 10);
      var sup = (addon && addon.classList.contains('on') && actif.contains(addon))
        ? parseInt(addon.dataset.prix, 10) : 0;

      cible.total.textContent = euro(prix);
      cible.ref.style.display = ref ? '' : 'none';
      cible.pct.style.display = ref ? '' : 'none';
      if (ref) {
        cible.ref.textContent = euro(ref);
        cible.pct.textContent = '-' + Math.round(((ref - prix) / ref) * 100) + '%';
      }
      cible.eco.style.display = eco ? '' : 'none';
      if (eco) cible.eco.textContent = 'Pack de deux : vous économisez ' + euro(eco);
      cible.cta.textContent = 'Commander maintenant, ' + euro(prix + sup);
    }

    packs.forEach(function (pk) {
      pk.addEventListener('click', function (e) {
        if (addon && addon.contains(e.target)) return;
        packs.forEach(function (o) { o.classList.remove('on'); o.querySelector('input').checked = false; });
        pk.classList.add('on'); pk.querySelector('input').checked = true;
        refresh();
      });
    });

    window.addEventListener('nk:maj', refresh);

    /* Selection sans focus : appelee par le hero. Passer par .click() sur le
       label ferait focaliser le bouton radio, et le navigateur ramenerait
       la section dans le champ de vision, et la page sauterait en bas. */
    window.nkPack = function (montant) {
      var cible = carte.querySelector('[data-pack][data-prix="' + montant + '"]');
      if (!cible) return;
      packs.forEach(function (o) {
        o.classList.remove('on');
        o.querySelector('input').checked = false;
      });
      cible.classList.add('on');
      cible.querySelector('input').checked = true;
      refresh();
      window.dispatchEvent(new Event('nk:maj'));
    };

    var compte = carte.querySelector('[data-compte]');
    if (compte) {
      var reste = 12 * 3600;
      setInterval(function () {
        reste = reste > 0 ? reste - 1 : 12 * 3600;
        var h = String(Math.floor(reste / 3600)).padStart(2, '0');
        var m = String(Math.floor((reste % 3600) / 60)).padStart(2, '0');
        var sec = String(reste % 60).padStart(2, '0');
        compte.textContent = 'Offre de lancement, se termine dans ' + h + ':' + m + ':' + sec;
      }, 1000);
    }

    refresh();
  })();

  /* Assurance colis : les deux cases, celle du hero et celle du selecteur,
     sont un seul et meme reglage. Un seul mecanisme, delegue au document.

     Le hero est un <label> et le selecteur un <span> : le navigateur ne
     bascule donc la case native que d'un cote. On prend la main sur les
     deux, et preventDefault evite l'aller-retour du <label> qui annulait
     notre bascule. C'est ce qui empechait de decocher l'assurance. */
  (function () {
    var cases = document.querySelectorAll('[data-addon]');
    if (!cases.length) return;

    document.addEventListener('click', function (ev) {
      var boite = ev.target.closest('[data-addon]');
      if (!boite) return;
      ev.preventDefault();

      var actif = !boite.classList.contains('on');
      cases.forEach(function (o) {
        o.classList.toggle('on', actif);
        var c = o.querySelector('input');
        if (c) c.checked = actif;
      });
      window.dispatchEvent(new Event('nk:maj'));
    });
  })();

  /* Barre d'achat : elle sort des que le hero quitte l'ecran, sur toutes
     les tailles. Son prix suit le pack et l'assurance. */
  (function () {
    var barre = document.querySelector('[data-barre]');
    var hero = document.querySelector('section');
    if (!barre || !hero) return;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        barre.classList.toggle('on', !e[0].isIntersecting);
      }, { threshold: 0, rootMargin: '-120px 0px 0px 0px' }).observe(hero);
    } else {
      barre.classList.add('on');
    }

    function maj() {
      var pack = document.querySelector('[data-pack].on');
      var add = document.querySelector('[data-addon].on');
      if (!pack) return;
      var prix = parseInt(pack.dataset.prix, 10) + (add ? 495 : 0);
      var ref = parseInt(pack.dataset.ref, 10);
      var e = function (c) { return (c / 100).toFixed(2).replace('.', ',') + ' €'; };
      barre.querySelector('[data-barre-total]').textContent = e(prix);
      var s = barre.querySelector('[data-barre-ref]');
      s.style.display = ref ? '' : 'none';
      if (ref) s.textContent = e(ref);
      barre.querySelector('[data-barre-nom]').textContent =
        (ref ? 'Pack de deux' : 'Une unité') + (add ? ', assurance incluse' : '');
      /* La vignette est celle du pack choisi : on la reprend du selecteur
         plutot que de reecrire un chemin, qui serait faux sous Shopify. */
      var vue = barre.querySelector('[data-barre-vue]');
      var src = pack.querySelector('.nk-pack__vue');
      if (vue && src) vue.src = src.src;
    }
    window.addEventListener('nk:maj', maj);
    document.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-pack]') || ev.target.closest('[data-addon]')) setTimeout(maj, 0);
    });
    maj();
  })();

  /* Galerie du hero. La grande plaque montre la vue active, la petite la
     suivante et sert de bouton. Fleches, vignettes, clavier, glissement.
     Sans JavaScript, la premiere vue reste affichee : rien ne casse. */
  (function () {
    var gal = document.querySelector('[data-gal]');
    if (!gal) return;
    var vues = gal.querySelectorAll('[data-vues] > *');
    var suiv = gal.querySelectorAll('[data-suivantes] > *');
    var vign = gal.querySelectorAll('[data-vign]');
    var n = vues.length, i = 0;

    function pose(k) {
      i = (k + n) % n;
      var j = (i + 1) % n;
      vues.forEach(function (e, x) { e.classList.toggle('on', x === i); });
      suiv.forEach(function (e, x) { e.classList.toggle('on', x === j); });
      vign.forEach(function (e, x) { e.classList.toggle('on', x === i); });
    }

    gal.querySelector('[data-prec]').addEventListener('click', function () { pose(i - 1); });
    gal.querySelector('[data-suiv]').addEventListener('click', function () { pose(i + 1); });
    gal.querySelector('[data-suivantes]').addEventListener('click', function () { pose(i + 1); });
    gal.querySelector('[data-suivantes]').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pose(i + 1); }
    });
    vign.forEach(function (b) {
      b.addEventListener('click', function () { pose(parseInt(b.dataset.vign, 10)); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') pose(i - 1);
      if (e.key === 'ArrowRight') pose(i + 1);
    });

    var x0 = null;
    gal.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    gal.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var d = e.changedTouches[0].clientX - x0;
      if (Math.abs(d) > 45) pose(d < 0 ? i + 1 : i - 1);
      x0 = null;
    }, { passive: true });

    window.nkVue = pose;

    /* Defilement automatique. Cinq secondes par vue : le temps de regarder,
       pas celui de s'ennuyer. On suspend des que le visiteur survole ou
       prend la main, et on repart trois secondes apres son dernier geste,
       sinon la galerie se bat contre lui. Rien ne demarre si le systeme
       demande a reduire les animations. */
    var doux = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var minuteur = null, reprise = null;

    function nkDefile() {
      if (doux) return;
      clearInterval(minuteur);
      minuteur = setInterval(function () { pose(i + 1); }, 5000);
    }
    function suspend() { clearInterval(minuteur); clearTimeout(reprise); }
    function differe() {
      suspend();
      if (doux) return;
      reprise = setTimeout(nkDefile, 3000);
    }

    gal.addEventListener('mouseenter', suspend);
    gal.addEventListener('mouseleave', nkDefile);
    gal.addEventListener('focusin', suspend);
    ['click', 'keydown', 'touchstart'].forEach(function (ev) {
      gal.addEventListener(ev, differe, { passive: true });
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) suspend(); else nkDefile();
    });

    pose(0);
    nkDefile();
  })();

  /* Le hero choisit le pack. Cliquer sur une offre ne fait plus defiler la
     page : ca coche le pack dans la carte d'achat, ca met a jour le prix
     affiche ici, et ca amene le carrousel sur la photo de ce pack. */
  (function () {
    var choix = document.querySelectorAll('[data-h-pack]');
    if (!choix.length) return;
    var carte = document.getElementById('achat');
    var barre = document.querySelector('[data-h-barre]'),
        prix  = document.querySelector('[data-h-prix]'),
        pct   = document.querySelector('[data-h-pct]'),
        eco   = document.querySelector('[data-h-eco]');

    function euro(c) { return (c / 100).toFixed(2).replace('.', ',') + ' €'; }

    function peindre(p) {
      var ref = p === 7990 ? 9980 : 0;
      var economie = p === 7990 ? 1990 : 0;
      prix.textContent = euro(p);
      barre.style.display = ref ? '' : 'none';
      pct.style.display = ref ? '' : 'none';
      if (ref) {
        barre.textContent = euro(ref);
        pct.textContent = '-' + Math.round(((ref - p) / ref) * 100) + '%';
      }
      eco.style.display = economie ? '' : 'none';
      if (economie) eco.textContent = 'Pack de deux : vous économisez ' + euro(economie);
      choix.forEach(function (b) {
        b.classList.toggle('on', parseInt(b.dataset.prix, 10) === p);
      });
    }

    function versLaCarte(p) {
      if (window.nkPack) window.nkPack(p);
    }

    choix.forEach(function (b) {
      b.addEventListener('click', function () {
        var p = parseInt(b.dataset.prix, 10);
        peindre(p);
        versLaCarte(p);
        if (window.nkVue) window.nkVue(parseInt(b.dataset.vue, 10));
      });
    });

    /* et dans l'autre sens : choisir en bas met le hero d'accord */
    if (carte) {
      carte.querySelectorAll('[data-pack]').forEach(function (pk) {
        pk.addEventListener('click', function () {
          peindre(parseInt(pk.dataset.prix, 10));
        });
      });
    }

    /* au chargement, le duo est preselectionne : on ouvre sur sa photo */
    var actif = carte && carte.querySelector('[data-pack].on');
    var depart = actif ? parseInt(actif.dataset.prix, 10) : 7990;
    peindre(depart);
    var b = document.querySelector('[data-h-pack][data-prix="' + depart + '"]');
    if (b && window.nkVue) window.nkVue(parseInt(b.dataset.vue, 10));
  })();

  /* Loupe. Les planches portent du texte : a la taille d'une carte il est
     illisible. Un clic ouvre l'image en plein ecran, et on va chercher le
     fichier d'origine plutot que la copie web reduite. */
  (function () {
    var boite = document.querySelector('[data-loupe]');
    if (!boite) return;
    var img = boite.querySelector('[data-loupe-img]');
    var rendu = null;

    var ZOOMABLES = '.nk-galerie img, .nk-planche__vues img, .nk-bien img,' +
                    ' .planche img, .nk-ig__photo, .nk-slot.rempli img';

    function pleine(src) { return src.replace('/images/web/', '/images/').replace('images/web/', 'images/'); }

    function ouvre(src, alt) {
      img.src = pleine(src);
      img.alt = alt || '';
      boite.hidden = false;
      document.body.style.overflow = 'hidden';
    }
    function ferme() {
      boite.hidden = true;
      img.src = '';
      document.body.style.overflow = '';
    }

    document.addEventListener('click', function (e) {
      var c = e.target.closest ? e.target.closest(ZOOMABLES) : null;
      if (c && c.tagName === 'IMG' && !c.closest('[data-vign], .nk-pellicule, .nk-avatars, .nk-ig__anneau')) {
        e.preventDefault();
        ouvre(c.getAttribute('src'), c.getAttribute('alt'));
        return;
      }
      if (e.target === boite || e.target.hasAttribute('data-loupe-x')) ferme();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') ferme(); });
  })();

  /* Mise au panier. Le selecteur porte l'identifiant de variante reel,
     pose par Liquid ; on n'ecrit jamais un identifiant en dur ici.

     Deux boutons declenchent l'ajout : celui du hero et celui du bloc
     « L'offre ». Partout ailleurs, les appels a l'action restent des
     ancres qui ramenent au selecteur.

     L'ajout fait glisser le tiroir, il ne saute pas au paiement : c'est
     le meme parcours que Glosso, Soufflo et Miaeau, et les taux d'une
     boutique a l'autre ne se comparent que si le tunnel est identique.
     Si le tiroir n'a pas pu se charger, on retombe sur /cart. */
  (function () {
    var boutons = document.querySelectorAll('[data-acheter]');
    if (!boutons.length) return;

    function acheter(bouton) {
      var pack = document.querySelector('[data-pack].on') || document.querySelector('[data-pack]');
      if (!pack || !pack.dataset.variant) return;

      var lignes = [{ id: Number(pack.dataset.variant), quantity: 1 }];
      var add = document.querySelector('[data-addon].on');
      if (add && add.dataset.variant) lignes.push({ id: Number(add.dataset.variant), quantity: 1 });

      var libelle = bouton.innerHTML;
      bouton.disabled = true;
      bouton.textContent = 'Un instant…';

      var pose = window.NakreePanier
        ? window.NakreePanier.remplacer(lignes)
        : Promise.reject(new Error('tiroir absent'));

      pose.then(function () {
          /* Le suivi Meta passe par le canal Facebook & Instagram (CAPI). */
          bouton.disabled = false;
          bouton.innerHTML = libelle;
        })
        .catch(function () {
          bouton.disabled = false;
          bouton.innerHTML = libelle;
          window.location.href = '/cart';
        });
    }

    boutons.forEach(function (bouton) {
      bouton.addEventListener('click', function () { acheter(bouton); });
    });
  })();

