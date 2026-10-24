/* PRÉVIA (github.io): medição desligada. No ar vale o original. */
/* Rastreamento da Praxys: GA4 + Pixel do Meta + origem do lead (UTM).
 * Carregado no <head> de todas as páginas. Para reaproveitar em outro site,
 * basta trocar os dois IDs abaixo.
 *
 * Padrão de UTM combinado (minúsculas, sem acento, "_" no lugar de espaço):
 *   utm_source   de onde veio        meta | google | instagram
 *   utm_medium   pago ou orgânico    pago | organico
 *   utm_campaign campanha + mês      raiox_2026_10
 *   utm_content  qual anúncio        video_drjorge_v1
 */
(() => {
  const GA4_ID        = 'G-1HRT250N3J';
  const META_PIXEL_ID = ''; /* PRÉVIA: Pixel desligado */ // conjunto de dados "Praxys Site" (portfólio Jorge Ferreira)
  const CHAVE         = 'praxys_origem';
  const VALIDADE_DIAS = 30;

  /* ── Google Analytics 4 ─────────────────────────────────────────── */
  const ga = document.createElement('script');
  ga.async = true;
  ga.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  /* PRÉVIA: GA4 desligado */
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA4_ID);

  /* ── Pixel do Meta (só liga quando houver ID) ───────────────────── */
  if (META_PIXEL_ID) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }

  /* ── Origem do lead ─────────────────────────────────────────────────
   * Vale o último clique que trouxe UTM (ou fbclid/gclid), por 30 dias.
   * Visita sem UTM não apaga a origem anterior: quem clicou no anúncio e
   * voltou depois pelo Google continua creditado ao anúncio. */
  const CAMPOS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
  const lerStorage = () => {
    try {
      const o = JSON.parse(localStorage.getItem(CHAVE) || 'null');
      if (o && Date.now() - o.quando < VALIDADE_DIAS * 864e5) return o;
    } catch (_) {}
    return null;
  };
  const params = new URLSearchParams(location.search);
  const daUrl = {};
  CAMPOS.forEach(c => { const v = params.get(c); if (v) daUrl[c] = v.slice(0, 100); });

  let origem = lerStorage();
  if (Object.keys(daUrl).length) {
    if (!daUrl.utm_source) daUrl.utm_source = daUrl.fbclid ? 'meta' : 'google';
    if (!daUrl.utm_medium) daUrl.utm_medium = 'pago';
    origem = { ...daUrl, entrada: location.pathname, quando: Date.now() };
    try { localStorage.setItem(CHAVE, JSON.stringify(origem)); } catch (_) {}
  } else if (!origem) {
    // Sem anúncio: registra só de onde veio (vale para esta visita, não é salvo)
    let ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (_) {}
    const interno = ref === location.hostname;
    origem = { utm_source: ref && !interno ? ref.replace(/^www\./, '') : 'direto', utm_medium: 'organico', entrada: location.pathname };
  }

  // Campos prontos para mandar junto com o lead
  window.praxysOrigem = () => {
    const o = {};
    CAMPOS.forEach(c => { if (origem[c]) o[c] = origem[c]; });
    if (origem.entrada) o.entrada = origem.entrada;
    return o;
  };
  // Linha legível para e-mail e mensagem: "meta / pago / raiox_2026_10 / video_drjorge_v1"
  window.praxysOrigemTexto = () =>
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].map(c => origem[c]).filter(Boolean).join(' / ');

  /* ── Eventos ────────────────────────────────────────────────────────
   * praxysTrack('nome')                  evento comum
   * praxysTrack('raiox_lead', {lead:1})  conversão: vira "Lead" no Meta */
  window.praxysTrack = (ev, opcoes = {}) => {
    try { Promise.resolve(/* PRÉVIA: contador desligado */).catch(() => {}); } catch (_) {}
    try { gtag('event', ev); } catch (_) {}
    try {
      if (typeof fbq === 'function') {
        if (opcoes.lead) fbq('track', 'Lead', { content_name: ev });
        else fbq('trackCustom', ev);
      }
    } catch (_) {}
  };

  // Cliques: data-track="nome" em qualquer elemento; links de WhatsApp sem
  // data-track contam como wa_click. Delegado no document para pegar também
  // os botões que o React desenha depois.
  document.addEventListener('click', (e) => {
    const el = e.target.closest && e.target.closest('[data-track], a[href*="wa.me"], a[href*="chat.whatsapp.com"]');
    if (!el) return;
    window.praxysTrack(el.dataset.track || 'wa_click');
  }, true);
})();
