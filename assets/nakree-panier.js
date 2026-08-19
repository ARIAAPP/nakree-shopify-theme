/* Tiroir de panier Nakree.

   L'etat n'est jamais tenu ici : chaque action ecrit dans le panier
   Shopify puis relit /cart.js, qui fait foi. Un onglet laisse ouvert une
   heure affiche donc le vrai panier, et pas un souvenir devenu faux.

   Rien ne casse sans JavaScript : le tiroir reste cache et les boutons
   d'achat retombent sur /cart, qui est une vraie page. */
(function () {
  'use strict';

  var tiroir = document.querySelector('[data-panier]');
  if (!tiroir) return;

  var voile   = document.querySelector('[data-panier-voile]');
  var lignes  = tiroir.querySelector('[data-panier-lignes]');
  var vide    = tiroir.querySelector('[data-panier-vide]');
  var pied    = tiroir.querySelector('[data-panier-pied]');
  var sup     = tiroir.querySelector('[data-panier-sup]');
  var compte  = tiroir.querySelector('[data-panier-compte]');
  var total   = tiroir.querySelector('[data-panier-total]');

  function euro(c) { return (c / 100).toFixed(2).replace('.', ',') + ' €'; }
  function ech(s) { return String(s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  }); }

  function dessiner(panier) {
    var n = panier.item_count;
    compte.textContent = '(' + n + ')';
    vide.hidden = n > 0;
    pied.hidden = n === 0;

    lignes.innerHTML = panier.items.map(function (a) {
      /* Le titre de variante vaut « Default Title » quand le produit n'a
         pas d'option : on ne l'affiche pas au client. */
      var variante = (a.variant_title && a.variant_title.indexOf('Default') === -1)
        ? '<span class="nk-panier__var">' + ech(a.variant_title) + '</span>' : '';
      var vue = a.image
        ? '<img src="' + a.image.replace(/(\.[a-z]+)(\?|$)/i, '_128x$1$2') + '" alt="" loading="lazy">'
        : '<span></span>';
      return '<div class="nk-panier__ligne">' + vue +
        '<div>' +
          '<span class="nk-panier__nom">' + ech(a.product_title) + '</span>' + variante +
          '<span class="nk-panier__qte">' +
            '<button type="button" data-panier-qte="-" data-cle="' + ech(a.key) + '" aria-label="Retirer un">&minus;</button>' +
            '<span>' + a.quantity + '</span>' +
            '<button type="button" data-panier-qte="+" data-cle="' + ech(a.key) + '" aria-label="Ajouter un">+</button>' +
          '</span>' +
        '</div>' +
        '<div style="text-align:right;">' +
          '<span class="nk-panier__prix">' + euro(a.final_line_price) + '</span>' +
          '<button type="button" class="nk-panier__ret" data-panier-retirer="' + ech(a.key) + '">Retirer</button>' +
        '</div>' +
      '</div>';
    }).join('');

    total.textContent = euro(panier.total_price);

    /* Le complement ne s'affiche que s'il n'est pas deja dans le panier. */
    if (sup) {
      var id = Number(sup.dataset.variant);
      var dedans = panier.items.some(function (a) { return a.variant_id === id; });
      sup.hidden = dedans || n === 0;
    }

    document.querySelectorAll('[data-panier-nb]').forEach(function (e) { e.textContent = n; });
    document.querySelectorAll('[data-panier-nb-boite]').forEach(function (e) { e.hidden = n === 0; });
  }

  function relire() {
    return fetch('/cart.js', { headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(dessiner);
  }

  function ecrire(url, corps) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(corps)
    }).then(function (r) {
      if (!r.ok) throw new Error(url + ' a repondu ' + r.status);
      return r.json();
    });
  }

  function ouvrir() {
    voile.hidden = false; tiroir.hidden = false;
    requestAnimationFrame(function () {
      voile.classList.add('on'); tiroir.classList.add('on');
    });
    document.documentElement.style.overflow = 'hidden';
  }

  function fermer() {
    voile.classList.remove('on'); tiroir.classList.remove('on');
    document.documentElement.style.overflow = '';
    setTimeout(function () { voile.hidden = true; tiroir.hidden = true; }, 400);
  }

  window.NakreePanier = {
    ouvrir: function () { return relire().then(ouvrir); },
    fermer: fermer,

    /* Remplacer et non cumuler : un client qui hesite entre les deux packs
       et clique deux fois ne doit pas repartir avec les deux. */
    remplacer: function (items) {
      return ecrire('/cart/clear.js', {})
        .then(function () { return ecrire('/cart/add.js', { items: items }); })
        .then(relire)
        .then(ouvrir);
    },

    ajouter: function (items) {
      return ecrire('/cart/add.js', { items: items }).then(relire).then(ouvrir);
    }
  };

  document.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-panier-fermer]') || ev.target.closest('[data-panier-voile]')) {
      ev.preventDefault(); fermer(); return;
    }
    if (ev.target.closest('[data-panier-ouvrir]')) {
      ev.preventDefault(); window.NakreePanier.ouvrir(); return;
    }
    if (ev.target.closest('[data-panier-payer]')) {
      ev.preventDefault(); window.location.href = '/checkout'; return;
    }

    var ret = ev.target.closest('[data-panier-retirer]');
    if (ret) {
      ecrire('/cart/change.js', { id: ret.dataset.panierRetirer, quantity: 0 }).then(dessiner);
      return;
    }

    var q = ev.target.closest('[data-panier-qte]');
    if (q) {
      var bloc = q.closest('.nk-panier__qte');
      var actuelle = parseInt(bloc.querySelector('span').textContent, 10);
      var voulue = q.dataset.panierQte === '+' ? actuelle + 1 : actuelle - 1;
      ecrire('/cart/change.js', { id: q.dataset.cle, quantity: Math.max(0, voulue) }).then(dessiner);
      return;
    }

    var plus = ev.target.closest('[data-panier-ajout-sup]');
    if (plus && sup) {
      var id = Number(sup.dataset.variant);
      ecrire('/cart/add.js', { items: [{ id: id, quantity: 1 }] })
        .then(function () {
          if (window.fbq) {
            fbq('track', 'AddToCart', {
              content_ids: [String(id)], content_type: 'product',
              value: Number(sup.dataset.prix) / 100, currency: 'EUR'
            });
          }
          return relire();
        });
    }
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !tiroir.hidden) fermer();
  });

  relire();
})();
