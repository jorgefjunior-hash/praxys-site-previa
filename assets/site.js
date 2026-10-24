/* Praxys Assistant · site.js (24/10/2026, card t_b6ab7415)
 * 1. Origem (UTM): guarda no próprio navegador, com a MESMA chave e regra do praxys-tracking.js
 *    (praxys_origem, 30 dias, utm_medium vazio vira "pago"), e só sai daqui dentro da mensagem
 *    que o médico decide mandar no WhatsApp. Não vai a terceiros (regra 7 do aviso de cookies).
 * 2. Botão único: wa.me com o código da página "(site/<página>)" + a origem guardada.
 * 3. Aviso de cookies: GA4 + Pixel (praxys-tracking.js) só carregam depois de "Aceitar",
 *    e só no domínio oficial. Na prévia nunca carregam.
 */
(function () {
  var PROD = /(^|\.)praxys\.med\.br$/.test(location.hostname);
  var ROOT = document.documentElement.getAttribute('data-root') || '';
  var CHAVE = 'praxys_origem', VALIDADE = 30 * 864e5;
  var CONSENT = 'praxys_consent', CONSENT_V = 1, CONSENT_VALIDADE = 365 * 864e5;

  /* ---------- 1. origem ---------- */
  var CAMPOS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
  var q = new URLSearchParams(location.search), d = {}, tem = false;
  CAMPOS.forEach(function (c) { var v = q.get(c); if (v) { d[c] = v.slice(0, 100); tem = true; } });
  if (tem) {
    if (!d.utm_source) d.utm_source = d.fbclid ? 'meta' : 'google';
    if (!d.utm_medium) d.utm_medium = 'pago';
    d.entrada = location.pathname; d.quando = Date.now();
    try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch (e) {}
  }
  function origemTexto() {
    try {
      var o = JSON.parse(localStorage.getItem(CHAVE) || 'null');
      if (!o || Date.now() - o.quando > VALIDADE) return '';
      return ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
        .map(function (c) { return (o[c] || '').toLowerCase().replace(/[^a-z0-9_.\-]/g, '').slice(0, 40); })
        .filter(Boolean).join('/');
    } catch (e) { return ''; }
  }

  /* ---------- 2. botão único ---------- */
  function montaLinks() {
    var orig = origemTexto();
    document.querySelectorAll('a[data-codigo]').forEach(function (a) {
      var cod = 'site/' + a.getAttribute('data-codigo') + (orig ? ' · ' + orig : '') + (PROD ? '' : ' · previa');
      var txt = 'Olá! Vi o site e quero agendar uma demonstração do Praxys Assistant. (' + cod + ')';
      a.href = 'https://wa.me/5521999426534?text=' + encodeURIComponent(txt);
    });
  }

  /* ---------- 3. cookies ---------- */
  function lerConsent() {
    try {
      var c = JSON.parse(localStorage.getItem(CONSENT) || 'null');
      if (c && c.v === CONSENT_V && Date.now() - c.quando < CONSENT_VALIDADE) return c.escolha;
    } catch (e) {}
    return null;
  }
  var medicaoLigada = false;
  function ligaMedicao() {
    if (!PROD || medicaoLigada) return;
    medicaoLigada = true;
    var s = document.createElement('script');
    s.src = ROOT + 'praxys-tracking.js?v=20260921';
    document.head.appendChild(s);
  }
  function salva(escolha) {
    try { localStorage.setItem(CONSENT, JSON.stringify({ v: CONSENT_V, escolha: escolha, quando: Date.now() })); } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    montaLinks();
    var box = document.getElementById('cookies');
    var escolha = lerConsent();
    if (escolha === 'aceito') ligaMedicao();
    else if (!escolha && box) box.hidden = false;
    document.querySelectorAll('[data-consent]').forEach(function (b) {
      b.addEventListener('click', function () {
        var e = b.getAttribute('data-consent');
        salva(e); box.hidden = true;
        if (e === 'aceito') ligaMedicao();
      });
    });
    document.querySelectorAll('[data-cookies]').forEach(function (b) {
      b.addEventListener('click', function () { box.hidden = false; });
    });
    // Contato no Pixel só com aceite (o praxys-tracking.js já conta demo_click pelo data-track)
    document.querySelectorAll('a[data-codigo]').forEach(function (a) {
      a.addEventListener('click', function () {
        try { if (medicaoLigada && typeof fbq === 'function') fbq('track', 'Contact'); } catch (e) {}
      });
    });
    // menu do celular
    var top = document.getElementById('top'), burger = top && top.querySelector('.burger');
    if (burger) {
      burger.addEventListener('click', function () {
        var aberto = top.classList.toggle('open');
        burger.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      });
      top.querySelectorAll('nav a').forEach(function (a) { a.addEventListener('click', function () { top.classList.remove('open'); }); });
    }
  });
})();
