/*!
 * PuenteAgent · preset "delpuente" (Hamburguesas Del Puente)
 * Cárgalo después (o antes) de src/puente-agent.js y usa <puente-agent preset="delpuente">.
 */
(function (w) {
  'use strict';
  var script = document.currentScript;
  var base = script && script.src ? new URL('../assets/delpuente/', script.src).href : 'assets/delpuente/';

  var preset = {
    name: 'Asistente Del Puente',
    image: base + 'chica.jpg',
    // Poses opcionales por estado; si no existen se usa "image".
    // images: { thinking: base + 'chica-pensando.png', ordering: base + 'chica-libreta.png' },
    colors: {
      accent: '#8E1B22',     // rojo del mandil
      accentInk: '#FFFFFF',
      bg: '#FAEBD8',         // mismo crema del fondo de la imagen
      paper: '#FFF8EE',
      ink: '#1C1A17',
      bun: '#E8A85B',
      bunDark: '#B8742F',
      patty: '#6B3A22',
      cheese: '#F2B705',
      lettuce: '#4E8C2F',
      tomato: '#D9483B',
      ok: '#2E7D4F'
    },
    labels: {
      idle: '',
      listening: 'Te escucho…',
      thinking: 'Pensando en tu antojo…',
      responding: '',
      ordering: 'Tomando tu pedido…',
      success: '¡Pedido listo!',
      error: 'Ups, algo falló'
    },
    text: { orderTitle: 'Tu orden' }
  };

  if (w.PuenteAgent) w.PuenteAgent.registerPreset('delpuente', preset);
  else (w.PuenteAgentPresets = w.PuenteAgentPresets || []).push(['delpuente', preset]);
})(window);
