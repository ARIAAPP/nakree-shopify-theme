/* Nakree — Cart Drawer Logic */
(function() {
  'use strict';

  var SHOP_DOMAIN = (window.nakreeTheme && window.nakreeTheme.shopDomain) || (window.Shopify && window.Shopify.shop) || window.location.hostname;
  var fmt = function(n) { return '€' + (parseFloat(n) || 0).toFixed(2).replace('.', ','); };

  var state = {
    isOpen: false,
    items: [],
    addons: [
      { id: 'protection', variantId: 'REPLACE_ASSURANCE_VARIANT', title: 'Assurance colis', price: 4.95, icon: '📦' },
      { id: 'warranty',   variantId: 'REPLACE_GARANTIE_VARIANT', title: 'Garantie 90 jours', price: 6.95, icon: '🛡️' },
      { id: 'priority',   variantId: 'REPLACE_PRIORITAIRE_VARIANT', title: 'Expedition prioritaire', price: 5.95, icon: '🚚' }
    ]
  };

  var $drawer = document.querySelector('[data-cart-drawer]');
  var $overlay = document.querySelector('[data-cart-overlay]');
  var $items = document.querySelector('[data-cart-items]');
  var $empty = document.querySelector('[data-cart-empty]');
  var $footer = document.querySelector('[data-cart-footer]');
  var $count = document.querySelector('[data-cart-item-count]');
  var $headerBadge = document.querySelector('[data-cart-count]');
  var $subtotal = document.querySelector('[data-cart-subtotal]');
  var $upsells = document.querySelector('[data-cart-upsells]');
  var $upsellsList = document.querySelector('[data-cart-upsells-list]');
  var $checkout = document.querySelector('[data-checkout]');
  var $shopPay = document.querySelector('[data-shop-pay]');

  function buildCheckoutUrl(items, opts) {
    opts = opts || {};
    var parts = items.map(function(i) { return i.variantId + ':' + i.quantity; });
    var url = 'https://' + SHOP_DOMAIN + '/cart/' + parts.join(',');
    if (opts.shopPay) url += '?payment=shop_pay';
    return url;
  }

  function totalPrice() {
    return state.items.reduce(function(s, i) { return s + (i.price * i.quantity); }, 0);
  }
  function totalQty() {
    return state.items.reduce(function(s, i) { return s + i.quantity; }, 0);
  }

  function render() {
    if (!$drawer) return;
    var qty = totalQty();
    if ($count) $count.textContent = qty;
    if ($headerBadge) {
      if (qty > 0) {
        $headerBadge.textContent = qty;
        $headerBadge.style.display = 'flex';
      } else {
        $headerBadge.style.display = 'none';
      }
    }

    if (state.items.length === 0) {
      if ($empty) $empty.style.display = '';
      if ($items) $items.innerHTML = '';
      if ($footer) $footer.setAttribute('hidden', '');
      if ($upsells) $upsells.style.display = 'none';
    } else {
      if ($empty) $empty.style.display = 'none';
      if ($footer) $footer.removeAttribute('hidden');
      if ($items) $items.innerHTML = state.items.map(itemHtml).join('');
      if ($subtotal) $subtotal.textContent = fmt(totalPrice());

      var missing = state.addons.filter(function(a) { return !state.items.some(function(i) { return i.id === a.id; }); });
      if (missing.length > 0 && $upsells && $upsellsList) {
        $upsells.style.display = '';
        $upsellsList.innerHTML = missing.map(function(a) {
          return '<button type="button" class="cart-addon-btn" data-add-addon="' + a.id + '" style="width:100%; display:flex; align-items:center; justify-content:space-between; gap:0.75rem; border-radius:8px; border:1px solid var(--color-border); background:var(--color-bg); padding:0.5rem 0.75rem; text-align:left;">' +
            '<div style="display:flex; align-items:center; gap:0.5rem; min-width:0;">' +
              '<span>' + a.icon + '</span>' +
              '<span style="font-size:0.875rem; font-weight:500;">+ ' + a.title + '</span>' +
            '</div>' +
            '<span style="font-size:0.875rem; font-weight:700; color:var(--color-primary); white-space:nowrap;">+' + fmt(a.price) + '</span>' +
          '</button>';
        }).join('');
      } else if ($upsells) {
        $upsells.style.display = 'none';
      }
    }

    if (state.isOpen) {
      $drawer.setAttribute('data-open', 'true');
      $drawer.setAttribute('aria-hidden', 'false');
      if ($overlay) $overlay.setAttribute('data-open', 'true');
      document.body.style.overflow = 'hidden';
    } else {
      $drawer.setAttribute('data-open', 'false');
      $drawer.setAttribute('aria-hidden', 'true');
      if ($overlay) $overlay.setAttribute('data-open', 'false');
      document.body.style.overflow = '';
    }

    document.dispatchEvent(new CustomEvent('nakree:cart-state', { detail: { isOpen: state.isOpen, items: state.items } }));
  }

  function itemHtml(item) {
    var img = item.image
      ? '<img src="' + item.image + '" alt="' + item.title + '" width="80" height="80" loading="lazy" decoding="async" style="height:5rem; width:5rem; border-radius:8px; background:var(--color-muted); object-fit:contain; padding:4px;">'
      : '<div style="height:5rem; width:5rem; border-radius:8px; background:var(--color-muted); display:flex; align-items:center; justify-content:center;"><span style="font-size:1.5rem;">📦</span></div>';
    return '<div class="cart-line-item" style="display:flex; gap:0.75rem; border-bottom:1px solid var(--color-border); padding-bottom:1rem;">' +
        img +
        '<div style="flex:1; min-width:0;">' +
          '<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:0.5rem;">' +
            '<p style="font-size:0.875rem; font-weight:600; line-height:1.25; margin:0;">' + item.title + '</p>' +
            '<button type="button" data-remove="' + item.id + '" aria-label="Retirer" style="color:var(--color-muted-fg);">×</button>' +
          '</div>' +
          '<p style="margin-top:0.25rem; font-size:0.875rem; font-weight:700; color:var(--color-primary);">' + fmt(item.price) + '</p>' +
          '<div style="margin-top:0.5rem; display:flex; align-items:center; justify-content:space-between;">' +
            '<div style="display:inline-flex; align-items:center; border-radius:9999px; border:1px solid var(--color-border);">' +
              '<button type="button" data-qty="dec" data-id="' + item.id + '" aria-label="Diminuer" style="padding:0.25rem 0.5rem; color:var(--color-muted-fg);">−</button>' +
              '<span style="padding:0 0.5rem; font-size:0.875rem; font-weight:600;">' + item.quantity + '</span>' +
              '<button type="button" data-qty="inc" data-id="' + item.id + '" aria-label="Augmenter" style="padding:0.25rem 0.5rem; color:var(--color-muted-fg);">+</button>' +
            '</div>' +
            '<p style="font-size:0.875rem; font-weight:600;">' + fmt(item.price * item.quantity) + '</p>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // Public API
  window.NakreeCart = {
    open: function() { state.isOpen = true; render(); },
    close: function() { state.isOpen = false; render(); },
    toggle: function() { state.isOpen = !state.isOpen; render(); },
    addItem: function(item) {
      if (state.items.some(function(i) { return i.id === item.id; })) return;
      state.items.push(item);
      render();
    },
    removeItem: function(id) {
      state.items = state.items.filter(function(i) { return i.id !== id; });
      render();
    },
    setQuantity: function(id, qty) {
      state.items = state.items
        .map(function(i) { return i.id === id ? Object.assign({}, i, { quantity: Math.max(1, qty) }) : i; })
        .filter(function(i) { return i.quantity > 0; });
      render();
    },
    openWith: function(items) {
      state.items = items;
      state.isOpen = true;
      render();
    },
    getItems: function() { return state.items.slice(); }
  };

  // Event listeners
  document.addEventListener('click', function(e) {
    var toggle = e.target.closest('[data-cart-toggle]');
    if (toggle) { e.preventDefault(); window.NakreeCart.toggle(); return; }
    var close = e.target.closest('[data-cart-close]');
    if (close) { e.preventDefault(); window.NakreeCart.close(); return; }
    var overlay = e.target.closest('[data-cart-overlay]');
    if (overlay) { window.NakreeCart.close(); return; }
    var remove = e.target.closest('[data-remove]');
    if (remove) { window.NakreeCart.removeItem(remove.dataset.remove); return; }
    var qtyBtn = e.target.closest('[data-qty]');
    if (qtyBtn) {
      var id = qtyBtn.dataset.id;
      var item = state.items.find(function(i) { return i.id === id; });
      if (!item) return;
      var newQty = qtyBtn.dataset.qty === 'inc' ? item.quantity + 1 : item.quantity - 1;
      window.NakreeCart.setQuantity(id, newQty);
      return;
    }
    var addAddon = e.target.closest('[data-add-addon]');
    if (addAddon) {
      var addon = state.addons.find(function(a) { return a.id === addAddon.dataset.addAddon; });
      if (addon) {
        window.NakreeCart.addItem({
          id: addon.id,
          variantId: addon.variantId,
          title: addon.title,
          price: addon.price,
          quantity: 1
        });
        if (window.fbq) {
          window.fbq('track', 'AddToCart', {
            value: addon.price,
            currency: 'EUR',
            content_ids: [addon.variantId],
            content_type: 'product',
            num_items: 1
          });
        }
      }
      return;
    }
  });

  if ($checkout) {
    $checkout.addEventListener('click', function() {
      if (state.items.length === 0) return;
      var url = buildCheckoutUrl(state.items);
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          value: +totalPrice().toFixed(2),
          currency: 'EUR',
          content_ids: state.items.map(function(i) { return i.variantId; }),
          content_type: 'product',
          num_items: totalQty()
        });
      }
      setTimeout(function() { window.location.href = url; }, 200);
    });
  }
  if ($shopPay) {
    $shopPay.addEventListener('click', function() {
      if (state.items.length === 0) return;
      var url = buildCheckoutUrl(state.items, { shopPay: true });
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          value: +totalPrice().toFixed(2),
          currency: 'EUR',
          content_ids: state.items.map(function(i) { return i.variantId; }),
          content_type: 'product',
          num_items: totalQty()
        });
      }
      setTimeout(function() { window.location.href = url; }, 150);
    });
  }

  // Close on Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && state.isOpen) window.NakreeCart.close();
  });

  // Initial render
  render();
})();
