/*!
 * PuenteAgent v0.1.0
 * Mascota animada para asistentes conversacionales (web component, sin dependencias).
 * https://github.com/Mimergt/PuenteAgent · Licencia MIT
 */
(function (global) {
  'use strict';

  if (!global.customElements || !global.HTMLElement) return;

  var VERSION = '0.1.0';

  // Estados canónicos (en inglés) y alias en español.
  var STATES = ['idle', 'listening', 'thinking', 'responding', 'ordering', 'success', 'error'];
  var ALIASES = {
    esperando: 'idle', reposo: 'idle',
    escuchando: 'listening',
    pensando: 'thinking',
    respondiendo: 'responding', hablando: 'responding', talking: 'responding', speaking: 'responding',
    'tomando-pedido': 'ordering', pedido: 'ordering', order: 'ordering',
    listo: 'success', exito: 'success', 'éxito': 'success', done: 'success',
    fallo: 'error', 'falló': 'error'
  };
  var ONE_SHOT = { success: true, error: true };

  var DEFAULT_LABELS = {
    idle: '',
    listening: 'Escuchando…',
    thinking: 'Pensando…',
    responding: '',
    ordering: 'Tomando tu pedido…',
    success: '¡Listo!',
    error: 'Algo salió mal'
  };

  var presets = {};

  function resolveState(s) {
    if (s == null || s === '') return 'idle';
    s = String(s).toLowerCase().trim();
    if (STATES.indexOf(s) > -1) return s;
    return ALIASES[s] || null;
  }

  function reducedMotion() {
    return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function kebab(k) {
    return k.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); });
  }

  /* ------------------------------------------------------------------ */
  /* Gráficos                                                            */
  /* ------------------------------------------------------------------ */

  var SESAME = function (cx, cy) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="2.2" ry="1.3" style="fill:var(--pa-paper)"/>';
  };

  var BURGER =
    '<svg class="burger" viewBox="0 0 64 52" aria-hidden="true">' +
      '<g class="bl bl0"><rect x="6" y="40" width="52" height="9" rx="4.5" style="fill:var(--pa-bun)"/>' +
        '<rect x="8" y="45" width="48" height="4" rx="2" style="fill:var(--pa-bun-dark)" opacity=".55"/></g>' +
      '<g class="bl bl1"><rect x="4" y="32" width="56" height="9" rx="4.5" style="fill:var(--pa-patty)"/></g>' +
      '<g class="bl bl2"><path d="M6 29H58V33H48L44 39L40 33H22L18 38L14 33H6Z" style="fill:var(--pa-cheese)"/></g>' +
      '<g class="bl bl3"><path d="M3 30q4.75 -5 9.5 0t9.5 0t9.5 0t9.5 0t9.5 0t9.5 0" fill="none" style="stroke:var(--pa-lettuce)" stroke-width="4" stroke-linecap="round"/></g>' +
      '<g class="bl bl4"><path d="M6 27Q6 6 32 6Q58 6 58 27Z" style="fill:var(--pa-bun)"/>' +
        '<path d="M10 27Q12 14 22 10" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2.5" stroke-linecap="round"/>' +
        SESAME(22, 15) + SESAME(32, 11) + SESAME(42, 15) + SESAME(27, 20) + SESAME(37, 20) + SESAME(47, 21) +
      '</g>' +
    '</svg>';

  var MINI_BURGER =
    '<svg viewBox="0 0 20 16" aria-hidden="true">' +
      '<path d="M2 8Q2 1 10 1Q18 1 18 8Z" style="fill:var(--pa-bun)"/>' +
      '<rect x="1" y="8.5" width="18" height="3" rx="1.5" style="fill:var(--pa-patty)"/>' +
      '<rect x="2" y="12" width="16" height="3.5" rx="1.75" style="fill:var(--pa-bun)"/>' +
    '</svg>';

  var PENCIL =
    '<svg class="pencil" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M3 21l1.5-5L16 4.5l3.5 3.5L8 19.5z" style="fill:var(--pa-cheese)"/>' +
      '<path d="M3 21l1.5-5 3.5 3.5z" style="fill:#F3D9B1"/>' +
      '<path d="M3 21l.6-2 1.4 1.4z" style="fill:var(--pa-ink)"/>' +
      '<path d="M16 4.5l2-2 3.5 3.5-2 2z" style="fill:var(--pa-tomato)"/>' +
    '</svg>';

  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var BANG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6v8" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><circle cx="12" cy="18.5" r="1.9" fill="currentColor"/></svg>';
  var SPARK = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0l2.2 7.8L20 10l-7.8 2.2L10 20l-2.2-7.8L0 10l7.8-2.2z" style="fill:var(--pa-cheese)"/></svg>';

  var SCRIBBLE =
    '<svg class="scribble" viewBox="0 0 88 48" aria-hidden="true">' +
      '<path class="ln ln1" pathLength="100" d="M2 10q6 -4 12 0t12 0t12 0t12 0t12 0t12 0t10 0"/>' +
      '<path class="ln ln2" pathLength="100" d="M2 24q6 -4 12 0t12 0t12 0t12 0t12 0t12 0t10 0"/>' +
      '<path class="ln ln3" pathLength="100" d="M2 38q6 -4 12 0t12 0t12 0t12 0t10 0"/>' +
    '</svg>';

  /* ------------------------------------------------------------------ */
  /* Estilos (Shadow DOM)                                                */
  /* ------------------------------------------------------------------ */

  var CSS = [
    ':host{--pa-size:160px;--pa-accent:#8E1B22;--pa-accent-ink:#fff;--pa-ok:#2E7D4F;--pa-paper:#FFF8EE;--pa-ink:#1C1A17;--pa-bg:#F6E7CF;',
    '--pa-bun:#E8A85B;--pa-bun-dark:#B8742F;--pa-patty:#6B3A22;--pa-cheese:#F2B705;--pa-lettuce:#4E8C2F;--pa-tomato:#D9483B;',
    '--u:calc(var(--pa-size) / 160);display:inline-block;position:relative;width:var(--pa-size);height:var(--pa-size);',
    'font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--pa-ink);vertical-align:bottom;-webkit-tap-highlight-color:transparent}',
    ':host([hidden]){display:none}',
    ':host([floating]){position:fixed;z-index:2147483000;right:max(16px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom))}',
    ':host([floating="bottom-left"]){right:auto;left:max(16px,env(safe-area-inset-left))}',
    '*{box-sizing:border-box}',
    '.stage{position:relative;width:100%;height:100%}',

    /* cuerpo + avatar */
    '.body{position:absolute;inset:0;transform-origin:50% 100%;transition:transform .35s cubic-bezier(.3,1.4,.5,1)}',
    '.avatar{position:absolute;inset:0;border-radius:50%;overflow:hidden;background:var(--pa-bg);border:calc(var(--u)*4) solid #fff;',
    'box-shadow:0 calc(var(--u)*6) calc(var(--u)*18) rgba(28,26,23,.22);cursor:pointer;outline:none}',
    '.avatar:focus-visible{box-shadow:0 0 0 3px var(--pa-paper),0 0 0 6px var(--pa-accent)}',
    ':host([shape="card"]) .avatar{border-radius:calc(var(--u)*24)}',
    '.avatar img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 15%;transform-origin:50% 100%;user-select:none;-webkit-user-drag:none}',

    /* anillos (escuchando) */
    '.rings{position:absolute;inset:0;pointer-events:none}',
    '.rings span{position:absolute;inset:0;border-radius:50%;border:calc(var(--u)*3) solid var(--pa-accent);opacity:0}',
    ':host([shape="card"]) .rings span{border-radius:calc(var(--u)*24)}',
    '[data-state="listening"] .rings span{animation:pa-ring 1.8s ease-out infinite}',
    '[data-state="listening"] .rings span:nth-child(2){animation-delay:.6s}',
    '[data-state="listening"] .rings span:nth-child(3){animation-delay:1.2s}',

    /* movimiento del cuerpo por estado */
    '[data-state="idle"] .body{animation:pa-float 4s ease-in-out infinite}',
    '[data-state="idle"] img,[data-state="listening"] img,[data-state="thinking"] img,[data-state="ordering"] img{animation:pa-breathe 3.2s ease-in-out infinite}',
    '[data-state="listening"] .body{transform:translateY(calc(var(--u)*-4)) scale(1.05)}',
    '[data-state="thinking"] .body{animation:pa-ponder 3s ease-in-out infinite}',
    '[data-side="right"][data-state="thinking"] .body{animation-name:pa-ponder-r}',
    '[data-state="responding"] .body{animation:pa-talk .9s ease-in-out infinite}',
    '[data-state="ordering"] .body{animation:pa-write 1.2s ease-in-out infinite}',
    '[data-side="right"][data-state="ordering"] .body{animation-name:pa-write-r}',
    '[data-state="success"] .body{animation:pa-hop .7s cubic-bezier(.3,1.6,.5,1) 2}',
    '[data-state="error"] .body{animation:pa-shake .45s ease-in-out 2}',

    /* capas de efectos */
    '.fx,.bubble,.badge{position:absolute;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .25s ease,visibility .25s ease}',
    '.fx,.bubble{translate:var(--pa-dx,0px) 0}',
    '[data-state="thinking"] .fx-think,[data-state="ordering"] .fx-order,[data-state="success"] .fx-success,',
    '[data-state="responding"] .bubble,.with-text[data-state="success"] .bubble,.with-text[data-state="error"] .bubble,',
    '[data-state="success"] .badge-ok,[data-state="error"] .badge-err{opacity:1;visibility:visible}',
    '.with-text[data-state="success"] .fx-success{opacity:0;visibility:hidden}',

    /* pensando: nube con hamburguesa que se arma */
    '.fx-think{bottom:84%;width:calc(var(--u)*112);height:calc(var(--u)*100)}',
    '[data-side="left"] .fx-think{right:58%}',
    '[data-side="right"] .fx-think{left:58%;transform:scaleX(-1)}',
    '.cloud{position:absolute;left:0;top:0;width:calc(var(--u)*92);height:calc(var(--u)*76);border-radius:50%;background:var(--pa-paper);',
    'box-shadow:0 calc(var(--u)*4) calc(var(--u)*14) rgba(28,26,23,.18);display:grid;place-items:center}',
    '.cloud .burger{width:calc(var(--u)*56);height:auto;overflow:visible}',
    '.puff{position:absolute;border-radius:50%;background:var(--pa-paper);box-shadow:0 calc(var(--u)*2) calc(var(--u)*6) rgba(28,26,23,.16)}',
    '.puff1{width:calc(var(--u)*16);height:calc(var(--u)*16);left:calc(var(--u)*80);top:calc(var(--u)*72)}',
    '.puff2{width:calc(var(--u)*9);height:calc(var(--u)*9);left:calc(var(--u)*98);top:calc(var(--u)*90)}',
    '[data-state="thinking"] .cloud{animation:pa-float 2.6s ease-in-out infinite}',
    '[data-state="thinking"] .puff1{animation:pa-float 2.6s ease-in-out .2s infinite}',
    '[data-state="thinking"] .puff2{animation:pa-float 2.6s ease-in-out .4s infinite}',
    '.fx-think .bl{opacity:0}',
    '[data-state="thinking"] .bl{animation-duration:3.6s;animation-timing-function:ease-out;animation-iteration-count:infinite}',
    '[data-state="thinking"] .bl0{animation-name:pa-b0}',
    '[data-state="thinking"] .bl1{animation-name:pa-b1}',
    '[data-state="thinking"] .bl2{animation-name:pa-b2}',
    '[data-state="thinking"] .bl3{animation-name:pa-b3}',
    '[data-state="thinking"] .bl4{animation-name:pa-b4}',

    /* globo de texto (respondiendo) */
    '.bubble{bottom:calc(100% + var(--u)*12);width:max-content;min-width:64px;max-width:min(300px,78vw);background:var(--pa-paper);color:var(--pa-ink);',
    'border-radius:16px;padding:10px 14px;box-shadow:0 6px 22px rgba(28,26,23,.2);transform:translateY(6px) scale(.96);',
    'transition:opacity .25s ease,visibility .25s ease,transform .3s cubic-bezier(.3,1.4,.5,1)}',
    '[data-side="left"] .bubble{right:30%;transform-origin:100% 100%}',
    '[data-side="right"] .bubble{left:30%;transform-origin:0 100%}',
    '[data-state="responding"] .bubble,.with-text[data-state="success"] .bubble,.with-text[data-state="error"] .bubble{transform:none;pointer-events:auto}',
    '.bubble::after{content:"";position:absolute;bottom:-6px;width:14px;height:14px;background:inherit;transform:rotate(45deg);border-radius:0 0 3px 0}',
    '[data-side="left"] .bubble::after{right:clamp(12px,calc(20px + var(--pa-dx,0px)),calc(100% - 26px))}',
    '[data-side="right"] .bubble::after{left:clamp(12px,calc(20px - var(--pa-dx,0px)),calc(100% - 26px))}',
    '.text{display:none;white-space:pre-wrap;word-break:break-word;position:relative}',
    '.with-text .text{display:block}',
    '.typing{display:none;gap:6px;align-items:flex-end;height:20px;padding:0 2px}',
    '[data-state="responding"]:not(.with-text) .typing{display:flex}',
    '.typing svg{width:18px;height:15px;animation:pa-bounce .9s ease-in-out infinite}',
    '.typing svg:nth-child(2){animation-delay:.15s}',
    '.typing svg:nth-child(3){animation-delay:.3s}',
    '.with-text[data-state="error"] .bubble{box-shadow:0 0 0 2px var(--pa-accent),0 6px 22px rgba(28,26,23,.2)}',

    /* tomando pedido: libreta */
    '.fx-order{bottom:4%;width:calc(var(--u)*108);transition:opacity .25s ease,visibility .25s ease,transform .35s cubic-bezier(.3,1.4,.5,1)}',
    '[data-side="left"] .fx-order{right:calc(100% - var(--u)*16);transform:rotate(-5deg) translateX(calc(var(--u)*12))}',
    '[data-side="right"] .fx-order{left:calc(100% - var(--u)*16);transform:rotate(5deg) translateX(calc(var(--u)*-12))}',
    '[data-side="left"][data-state="ordering"] .fx-order{transform:rotate(-5deg)}',
    '[data-side="right"][data-state="ordering"] .fx-order{transform:rotate(5deg)}',
    '.pad{background:#fff;border-radius:calc(var(--u)*6);box-shadow:0 calc(var(--u)*5) calc(var(--u)*16) rgba(28,26,23,.22);overflow:hidden;padding-bottom:calc(var(--u)*8)}',
    '.pad-head{background:var(--pa-accent);color:var(--pa-accent-ink);font-weight:700;font-size:max(10px,calc(var(--u)*11));',
    'padding:calc(var(--u)*5) calc(var(--u)*8);letter-spacing:.05em;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.pad-body{position:relative;padding:calc(var(--u)*8) calc(var(--u)*8) 0;min-height:calc(var(--u)*56)}',
    '.scribble{display:block;width:calc(var(--u)*88);height:calc(var(--u)*48);overflow:visible}',
    '.ln{fill:none;stroke:var(--pa-ink);stroke-width:1.8;stroke-linecap:round;stroke-dasharray:100;stroke-dashoffset:100;opacity:.75}',
    '[data-state="ordering"] .ln{animation-duration:2.7s;animation-timing-function:linear;animation-iteration-count:infinite}',
    '[data-state="ordering"] .ln1{animation-name:pa-l1}',
    '[data-state="ordering"] .ln2{animation-name:pa-l2}',
    '[data-state="ordering"] .ln3{animation-name:pa-l3}',
    '.pencil{position:absolute;width:calc(var(--u)*22);height:calc(var(--u)*22);left:calc(var(--u)*8);top:calc(var(--u)*-1);overflow:visible}',
    '[data-state="ordering"] .pencil{animation:pa-pencil 2.7s linear infinite}',
    '.items{list-style:none;margin:0;padding:0;display:none;flex-direction:column;gap:calc(var(--u)*5);font-size:max(10px,calc(var(--u)*11));line-height:1.25}',
    '.has-items .items{display:flex}',
    '.has-items .scribble,.has-items .pencil{display:none}',
    '.items li{display:flex;gap:calc(var(--u)*5);align-items:flex-start;opacity:0}',
    '[data-state="ordering"] .items li{animation:pa-item .4s ease-out forwards;animation-delay:calc(var(--i,0) * .35s)}',
    '.items li svg{flex:none;width:max(11px,calc(var(--u)*12));height:max(11px,calc(var(--u)*12));color:var(--pa-ok);margin-top:1px}',

    /* listo: hamburguesa que aparece + destellos */
    '.fx-success{left:50%;bottom:calc(100% - var(--u)*4);width:calc(var(--u)*70);height:calc(var(--u)*60);margin-left:calc(var(--u)*-35)}',
    '.fx-success .burger{position:absolute;left:calc(var(--u)*7);top:calc(var(--u)*8);width:calc(var(--u)*56);height:auto}',
    '[data-state="success"] .fx-success .burger{animation:pa-pop .6s cubic-bezier(.3,1.7,.5,1) both}',
    '.spark{position:absolute;width:calc(var(--u)*14);height:calc(var(--u)*14);opacity:0}',
    '.spark svg{width:100%;height:100%;display:block}',
    '.s1{left:0;top:0}.s2{right:0;top:calc(var(--u)*4)}.s3{left:calc(var(--u)*-4);bottom:0}.s4{right:calc(var(--u)*-6);bottom:calc(var(--u)*6)}',
    '[data-state="success"] .spark{animation:pa-twinkle 1.2s ease-in-out infinite}',
    '[data-state="success"] .s2{animation-delay:.3s}[data-state="success"] .s3{animation-delay:.6s}[data-state="success"] .s4{animation-delay:.9s}',

    /* insignias */
    '.badge{right:0;bottom:2%;width:calc(var(--u)*38);height:calc(var(--u)*38);border-radius:50%;display:grid;place-items:center;',
    'border:calc(var(--u)*3) solid #fff;box-shadow:0 calc(var(--u)*3) calc(var(--u)*8) rgba(28,26,23,.25);transform:scale(.4)}',
    '.badge svg{width:62%;height:62%}',
    '.badge-ok{background:var(--pa-ok);color:#fff}',
    '.badge-err{background:var(--pa-accent);color:var(--pa-accent-ink)}',
    '[data-state="success"] .badge-ok,[data-state="error"] .badge-err{animation:pa-pop .5s cubic-bezier(.3,1.7,.5,1) .1s both}',

    /* etiqueta de estado */
    '.label{position:absolute;top:calc(100% + var(--u)*10);left:50%;transform:translateX(-50%);white-space:nowrap;background:var(--pa-paper);',
    'border-radius:999px;padding:4px 11px 4px 9px;font-size:12px;font-weight:600;box-shadow:0 3px 10px rgba(28,26,23,.14);display:none;align-items:center;gap:6px}',
    ':host([show-label]) .label.has{display:inline-flex}',
    '.label i{width:7px;height:7px;border-radius:50%;background:var(--pa-accent);animation:pa-dot 1.2s ease-in-out infinite}',
    '[data-state="success"] .label i{background:var(--pa-ok);animation:none}',

    /* keyframes */
    '@keyframes pa-ring{0%{transform:scale(1);opacity:.55}100%{transform:scale(1.38);opacity:0}}',
    '@keyframes pa-float{0%,100%{transform:translateY(0)}50%{transform:translateY(calc(var(--u)*-4))}}',
    '@keyframes pa-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.018)}}',
    '@keyframes pa-ponder{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(-1deg) translateY(calc(var(--u)*-2))}}',
    '@keyframes pa-ponder-r{0%,100%{transform:rotate(3deg)}50%{transform:rotate(1deg) translateY(calc(var(--u)*-2))}}',
    '@keyframes pa-talk{0%,100%{transform:translateY(0)}30%{transform:translateY(calc(var(--u)*-3)) rotate(.6deg)}60%{transform:translateY(calc(var(--u)*-1)) rotate(-.4deg)}}',
    '@keyframes pa-write{0%,100%{transform:rotate(-1deg)}50%{transform:rotate(-3deg) translateY(calc(var(--u)*2))}}',
    '@keyframes pa-write-r{0%,100%{transform:rotate(1deg)}50%{transform:rotate(3deg) translateY(calc(var(--u)*2))}}',
    '@keyframes pa-hop{0%{transform:translateY(0) scale(1)}40%{transform:translateY(calc(var(--u)*-16)) scale(1.04)}100%{transform:translateY(0) scale(1)}}',
    '@keyframes pa-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(calc(var(--u)*-6)) rotate(-2deg)}40%{transform:translateX(calc(var(--u)*6)) rotate(2deg)}60%{transform:translateX(calc(var(--u)*-4))}80%{transform:translateX(calc(var(--u)*4))}}',
    '@keyframes pa-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}',
    '@keyframes pa-dot{0%,100%{opacity:.35}50%{opacity:1}}',
    '@keyframes pa-pop{0%{transform:scale(.2);opacity:0}100%{transform:scale(1);opacity:1}}',
    '@keyframes pa-twinkle{0%,100%{transform:scale(.3) rotate(0);opacity:0}50%{transform:scale(1) rotate(45deg);opacity:1}}',
    '@keyframes pa-item{0%{opacity:0;transform:translateX(-6px)}100%{opacity:1;transform:none}}',
    '@keyframes pa-b0{0%{opacity:0;transform:translateY(-14px)}8%,78%{opacity:1;transform:none}88%,100%{opacity:0;transform:none}}',
    '@keyframes pa-b1{0%,10%{opacity:0;transform:translateY(-14px)}18%,78%{opacity:1;transform:none}88%,100%{opacity:0;transform:none}}',
    '@keyframes pa-b2{0%,20%{opacity:0;transform:translateY(-14px)}28%,78%{opacity:1;transform:none}88%,100%{opacity:0;transform:none}}',
    '@keyframes pa-b3{0%,30%{opacity:0;transform:translateY(-14px)}38%,78%{opacity:1;transform:none}88%,100%{opacity:0;transform:none}}',
    '@keyframes pa-b4{0%,40%{opacity:0;transform:translateY(-18px)}48%,78%{opacity:1;transform:none}88%,100%{opacity:0;transform:none}}',
    '@keyframes pa-l1{0%{stroke-dashoffset:100}30%,96%{stroke-dashoffset:0}100%{stroke-dashoffset:100}}',
    '@keyframes pa-l2{0%,33%{stroke-dashoffset:100}63%,96%{stroke-dashoffset:0}100%{stroke-dashoffset:100}}',
    '@keyframes pa-l3{0%,66%{stroke-dashoffset:100}96%{stroke-dashoffset:0}100%{stroke-dashoffset:100}}',
    '@keyframes pa-pencil{0%{transform:translate(0,0)}30%{transform:translate(calc(var(--u)*82),0)}33%{transform:translate(0,calc(var(--u)*14))}',
    '63%{transform:translate(calc(var(--u)*82),calc(var(--u)*14))}66%{transform:translate(0,calc(var(--u)*28))}96%{transform:translate(calc(var(--u)*58),calc(var(--u)*28))}100%{transform:translate(0,0)}}',

    /* movimiento reducido: sin bucles, todo visible y quieto */
    '@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}',
    '.fx-think .bl,.items li,.spark{opacity:1!important}.ln{stroke-dashoffset:0!important}.badge{transform:none}}'
  ].join('\n');

  var TEMPLATE =
    '<style class="vars"></style>' +
    '<div class="stage" part="stage" data-state="idle" data-side="left">' +
      '<div class="rings" aria-hidden="true"><span></span><span></span><span></span></div>' +
      '<div class="body" part="body"><div class="avatar" part="avatar" tabindex="0"><img alt="" draggable="false"></div></div>' +
      '<div class="fx fx-think" aria-hidden="true"><div class="cloud">' + BURGER + '</div><div class="puff puff1"></div><div class="puff puff2"></div></div>' +
      '<div class="fx fx-order" aria-hidden="true"><div class="pad" part="order"><div class="pad-head"></div>' +
        '<div class="pad-body">' + SCRIBBLE + PENCIL + '<ul class="items"></ul></div></div></div>' +
      '<div class="fx fx-success" aria-hidden="true">' + BURGER +
        '<span class="spark s1">' + SPARK + '</span><span class="spark s2">' + SPARK + '</span>' +
        '<span class="spark s3">' + SPARK + '</span><span class="spark s4">' + SPARK + '</span></div>' +
      '<div class="bubble" part="bubble"><div class="typing" aria-hidden="true">' + MINI_BURGER + MINI_BURGER + MINI_BURGER + '</div>' +
        '<div class="text" aria-live="polite"></div></div>' +
      '<div class="badge badge-ok" aria-hidden="true">' + CHECK + '</div>' +
      '<div class="badge badge-err" aria-hidden="true">' + BANG + '</div>' +
      '<div class="label" part="label" aria-hidden="true"><i></i><span></span></div>' +
    '</div>';

  /* ------------------------------------------------------------------ */
  /* Elemento                                                            */
  /* ------------------------------------------------------------------ */

  function normalizeItem(it) {
    if (it == null) return null;
    if (typeof it === 'string' || typeof it === 'number') return { name: String(it) };
    return { name: String(it.name || it.title || ''), qty: it.qty != null ? it.qty : it.quantity };
  }

  function itemText(it) {
    return (it.qty != null && it.qty !== '' ? it.qty + '× ' : '') + it.name;
  }

  class PuenteAgentElement extends HTMLElement {
    static get observedAttributes() {
      return ['state', 'src', 'size', 'preset', 'name', 'bubble-side', 'floating'];
    }

    constructor() {
      super();
      var root = this.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>' + CSS + '</style>' + TEMPLATE;
      this.$ = {
        vars: root.querySelector('style.vars'),
        stage: root.querySelector('.stage'),
        avatar: root.querySelector('.avatar'),
        img: root.querySelector('.avatar img'),
        text: root.querySelector('.text'),
        label: root.querySelector('.label'),
        labelText: root.querySelector('.label span'),
        pad: root.querySelector('.pad'),
        padHead: root.querySelector('.pad-head'),
        items: root.querySelector('.items')
      };
      this._state = 'idle';
      this._text = '';
      this._items = [];
      this._sayToken = 0;
      this._timer = null;

      var self = this;
      this.$.avatar.addEventListener('click', function () {
        self.dispatchEvent(new CustomEvent('agent-click', { bubbles: true, composed: true, detail: { state: self._state } }));
      });
      this.$.avatar.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.$.avatar.click(); }
      });
    }

    connectedCallback() {
      if (!this.hasAttribute('role')) this.setAttribute('role', 'img');
      this._sync();
      var s = resolveState(this.getAttribute('state')) || 'idle';
      this._applyState(s, { initial: true });
      if (!this._onResize) {
        var self = this;
        this._onResize = function () { self._fit(); };
      }
      global.addEventListener('resize', this._onResize);
    }

    disconnectedCallback() {
      this._cancelTyping();
      if (this._onResize) global.removeEventListener('resize', this._onResize);
    }

    /* Desplaza globo, nube y libreta para que no se salgan de la pantalla. */
    _fit() {
      var self = this;
      if (this._fitRaf) cancelAnimationFrame(this._fitRaf);
      this._fitRaf = requestAnimationFrame(function () {
        self._fitRaf = null;
        // Límites: la ventana, o el primer contenedor que recorte (overflow distinto de visible).
        var L = 0, R = document.documentElement.clientWidth || global.innerWidth;
        if (!self.hasAttribute('floating')) {
          var n = self.parentNode;
          while (n && n !== document.body && n !== document.documentElement) {
            if (n.nodeType === 11) { n = n.host; continue; }
            if (getComputedStyle(n).overflowX !== 'visible') {
              var b = n.getBoundingClientRect();
              L = Math.max(L, b.left); R = Math.min(R, b.right);
              break;
            }
            n = n.parentNode;
          }
        }
        var pad = 8;
        var els = self.shadowRoot.querySelectorAll('.bubble,.fx');
        for (var i = 0; i < els.length; i++) {
          var el = els[i];
          el.style.setProperty('--pa-dx', '0px');
          if (getComputedStyle(el).visibility === 'hidden') continue;
          var r = el.getBoundingClientRect(), dx = 0;
          if (r.left < L + pad || r.width > R - L - pad * 2) dx = (L + pad) - r.left;
          else if (r.right > R - pad) dx = (R - pad) - r.right;
          if (dx) el.style.setProperty('--pa-dx', Math.round(dx) + 'px');
        }
      });
    }

    attributeChangedCallback(name) {
      if (!this.isConnected) return;
      if (name === 'state') {
        var s = resolveState(this.getAttribute('state'));
        if (s && s !== this._state) this._applyState(s);
        return;
      }
      this._sync();
    }

    /* ---- configuración ---- */

    get preset() { return presets[this.getAttribute('preset')] || {}; }

    _name() { return this.getAttribute('name') || this.preset.name || 'Asistente'; }

    _labels() {
      var out = {}, k, p = this.preset.labels || {};
      for (k in DEFAULT_LABELS) out[k] = DEFAULT_LABELS[k];
      for (k in p) out[k] = p[k];
      return out;
    }

    _imageFor(state) {
      var p = this.preset;
      var perState = this.getAttribute('src-' + state) || (p.images && p.images[state]);
      return perState || this.getAttribute('src') || p.image || '';
    }

    _sync() {
      var p = this.preset;
      var css = ':host{';
      var colors = p.colors || {};
      for (var k in colors) css += '--pa-' + kebab(k) + ':' + colors[k] + ';';
      var size = this.getAttribute('size');
      if (size) css += '--pa-size:' + (/^\d+(\.\d+)?$/.test(size) ? size + 'px' : size) + ';';
      this.$.vars.textContent = css + '}';

      var floating = this.getAttribute('floating');
      var side = this.getAttribute('bubble-side') || (floating === 'bottom-left' ? 'right' : 'left');
      this.$.stage.dataset.side = side === 'right' ? 'right' : 'left';

      this.$.padHead.textContent = (p.text && p.text.orderTitle) || 'Tu orden';
      this._setImage(this._state);
      this._preload();
      this._updateLabel();
    }

    _setImage(state) {
      var src = this._imageFor(state);
      if (src && this.$.img.getAttribute('src') !== src) this.$.img.setAttribute('src', src);
    }

    _preload() {
      var p = this.preset, seen = {};
      for (var i = 0; i < STATES.length; i++) {
        var src = this._imageFor(STATES[i]);
        if (src && !seen[src]) { seen[src] = 1; var im = new Image(); im.src = src; }
      }
    }

    _updateLabel() {
      var l = this._labels()[this._state] || '';
      this.$.labelText.textContent = l;
      this.$.label.classList.toggle('has', !!l);
      this.setAttribute('aria-label', this._name() + (l ? ' — ' + l : ''));
    }

    /* ---- estados ---- */

    _applyState(s, opts) {
      opts = opts || {};
      var prev = this._state;
      this._state = s;
      if (!opts.keepText) { this._cancelTyping(); this._setText(''); }
      var st = this.$.stage;
      if (opts.replay) { st.removeAttribute('data-state'); void st.offsetWidth; }
      st.dataset.state = s;
      if (this.getAttribute('state') !== s) this.setAttribute('state', s);
      this._setImage(s);
      this._updateLabel();
      this._fit();
      var self = this;
      clearTimeout(this._fitLater);
      this._fitLater = setTimeout(function () { self._fit(); }, 420);
      if (!opts.initial && (prev !== s || opts.replay)) {
        this.dispatchEvent(new CustomEvent('statechange', { bubbles: true, composed: true, detail: { state: s, previous: prev } }));
      }
    }

    get state() { return this._state; }
    set state(v) { this.setState(v); }

    setState(s) {
      var r = resolveState(s);
      if (!r) { console.warn('[PuenteAgent] Estado desconocido:', s); return this; }
      if (r === this._state) {
        if (ONE_SHOT[r]) this._applyState(r, { replay: true });
        return this;
      }
      this._applyState(r);
      return this;
    }

    idle() { return this.setState('idle'); }
    listen() { return this.setState('listening'); }
    think() { return this.setState('thinking'); }
    respond() { return this.setState('responding'); }

    /* ---- texto ---- */

    _setText(t) {
      this._text = t;
      this.$.text.textContent = t;
      var had = this.$.stage.classList.contains('with-text');
      this.$.stage.classList.toggle('with-text', !!t);
      if (this.isConnected && (had !== !!t || t.length % 24 === 1)) this._fit();
    }

    _cancelTyping() {
      this._sayToken++;
      if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    }

    get text() { return this._text; }

    /**
     * Muestra un mensaje en el globo, escribiéndolo letra por letra.
     * opts: { speed: ms por letra (0 = inmediato), delay: ms de "escribiendo…" antes del texto,
     *         state: 'responding' | 'success' | 'error' }
     * Devuelve una promesa que se resuelve en true al terminar (false si se interrumpió).
     */
    say(text, opts) {
      opts = opts || {};
      var self = this;
      var target = resolveState(opts.state || 'responding') || 'responding';
      this._cancelTyping();
      var token = this._sayToken;
      this._setText('');
      if (this._state !== target) this._applyState(target, { keepText: true });
      else if (ONE_SHOT[target]) this._applyState(target, { keepText: true, replay: true });

      var str = String(text == null ? '' : text);
      var delay = opts.delay != null ? opts.delay : (target === 'responding' ? 450 : 0);
      var speed = opts.speed != null ? opts.speed : 22;

      return new Promise(function (resolve) {
        function done() {
          self._timer = null;
          self.dispatchEvent(new CustomEvent('saydone', { bubbles: true, composed: true, detail: { text: str } }));
          resolve(true);
        }
        self._timer = setTimeout(function () {
          if (token !== self._sayToken) return resolve(false);
          if (speed <= 0 || reducedMotion()) { self._setText(str); return done(); }
          var i = 0, chunk = str.length > 240 ? 3 : 1;
          (function step() {
            if (token !== self._sayToken) return resolve(false);
            i = Math.min(str.length, i + chunk);
            self._setText(str.slice(0, i));
            if (i < str.length) self._timer = setTimeout(step, speed);
            else done();
          })();
        }, delay);
      });
    }

    /** Agrega texto al globo sin animación (ideal para respuestas en streaming de un LLM). */
    append(chunk) {
      if (this._state !== 'responding') this._applyState('responding');
      this._cancelTyping();
      this._setText(this._text + String(chunk == null ? '' : chunk));
      return this;
    }

    clearText() { this._cancelTyping(); this._setText(''); return this; }

    success(text, opts) {
      if (text) return this.say(text, Object.assign({ delay: 0 }, opts, { state: 'success' }));
      this.setState('success');
      return Promise.resolve(true);
    }

    error(text, opts) {
      if (text) return this.say(text, Object.assign({ delay: 0 }, opts, { state: 'error' }));
      this.setState('error');
      return Promise.resolve(true);
    }

    /* ---- pedidos ---- */

    get items() { return this._items.slice(); }

    /** Muestra la libreta con estos productos (o garabatos si la lista está vacía). */
    order(items) {
      this._items = (items || []).map(normalizeItem).filter(Boolean);
      this._renderItems(true);
      this.setState('ordering');
      return this;
    }

    addItem(item) {
      var it = normalizeItem(item);
      if (!it) return this;
      this._items.push(it);
      if (this._state !== 'ordering') { this._renderItems(true); this.setState('ordering'); }
      else this._appendItem(it, 0);
      this.$.pad.classList.add('has-items');
      return this;
    }

    clearOrder() {
      this._items = [];
      this._renderItems(true);
      return this;
    }

    _appendItem(it, i) {
      var li = document.createElement('li');
      li.style.setProperty('--i', i);
      li.innerHTML = CHECK;
      var span = document.createElement('span');
      span.textContent = itemText(it);
      li.appendChild(span);
      this.$.items.appendChild(li);
    }

    _renderItems() {
      this.$.items.textContent = '';
      for (var i = 0; i < this._items.length; i++) this._appendItem(this._items[i], i);
      this.$.pad.classList.toggle('has-items', this._items.length > 0);
    }
  }

  /* ------------------------------------------------------------------ */
  /* API global                                                          */
  /* ------------------------------------------------------------------ */

  function registerPreset(name, config) {
    presets[name] = config || {};
    var els = document.querySelectorAll('puente-agent');
    for (var i = 0; i < els.length; i++) {
      if (els[i].getAttribute('preset') === name && els[i]._sync) els[i]._sync();
    }
  }

  function create(opts) {
    opts = opts || {};
    var el = document.createElement('puente-agent');
    ['preset', 'src', 'size', 'state', 'name', 'floating', 'bubble-side', 'shape'].forEach(function (k) {
      var v = opts[k] != null ? opts[k] : opts[k.replace(/-([a-z])/g, function (m, c) { return c.toUpperCase(); })];
      if (v != null && v !== false) el.setAttribute(k, v === true ? '' : v);
    });
    if (opts.showLabel) el.setAttribute('show-label', '');
    var parent = opts.container
      ? (typeof opts.container === 'string' ? document.querySelector(opts.container) : opts.container)
      : document.body;
    parent.appendChild(el);
    return el;
  }

  var api = {
    version: VERSION,
    STATES: STATES.slice(),
    registerPreset: registerPreset,
    getPreset: function (name) { return presets[name]; },
    resolveState: resolveState,
    create: create,
    Element: PuenteAgentElement
  };

  if (!customElements.get('puente-agent')) customElements.define('puente-agent', PuenteAgentElement);

  var queued = global.PuenteAgentPresets;
  global.PuenteAgent = api;
  if (queued && queued.length) for (var q = 0; q < queued.length; q++) registerPreset(queued[q][0], queued[q][1]);
  global.PuenteAgentPresets = { push: function (pair) { registerPreset(pair[0], pair[1]); } };

  try { global.dispatchEvent(new CustomEvent('puente-agent:ready', { detail: api })); } catch (e) { /* noop */ }

  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
