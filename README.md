# PuenteAgent

Mascota animada para asistentes conversacionales y chats de ayuda. Es un **web component sin dependencias** (`<puente-agent>`) con los estados típicos de un agente, cada uno con su propia animación:

| Estado | Alias en español | Qué se ve |
|---|---|---|
| `idle` | `esperando` | Flota suave y respira |
| `listening` | `escuchando` | Se acerca y emite anillos de "te escucho" |
| `thinking` | `pensando` | Inclina la cabeza; en una nube se arma una hamburguesa capa por capa |
| `responding` | `respondiendo`, `hablando` | Globo de texto; mientras no hay texto, tres mini hamburguesas saltan como "escribiendo…" |
| `ordering` | `tomando-pedido`, `pedido` | Libreta de pedidos con lápiz; muestra los productos con check |
| `success` | `listo`, `exito` | Salto, hamburguesa con destellos e insignia de check |
| `error` | `fallo` | Sacudida e insignia de alerta |

Trae el preset **`delpuente`** (Hamburguesas Del Puente), pero sirve para cualquier mascota: cambias la imagen y los colores.

**Demo:** https://mimergt.github.io/PuenteAgent/examples/demo.html

---

## Instalación

### Con `<script>` (WordPress, HTML, webviews)

```html
<script src="https://cdn.jsdelivr.net/gh/Mimergt/PuenteAgent@main/src/puente-agent.js"></script>
<script src="https://cdn.jsdelivr.net/gh/Mimergt/PuenteAgent@main/presets/delpuente.js"></script>
```

Para producción fija una versión en vez de `@main`, por ejemplo `@v0.1.0`.

### Con npm (directo desde GitHub)

```bash
npm install github:Mimergt/PuenteAgent
```

```js
import 'puente-agent';                    // registra <puente-agent> y window.PuenteAgent
import 'puente-agent/presets/delpuente.js';
```

> Si usas un bundler, copia `assets/delpuente/` a tu carpeta pública o pasa tu propia imagen con `src`.

---

## Uso

```html
<puente-agent id="asistente" preset="delpuente" show-label></puente-agent>

<script>
  const a = document.getElementById('asistente');

  a.listen();                                   // escuchando
  a.think();                                    // pensando
  await a.say('¿Te armo un combo?');            // respondiendo, escribe letra por letra
  a.order(['1× Clásica Smash', '1× Papas']);    // tomando pedido
  a.addItem({ name: 'Frezka Jamaica', qty: 2 });
  await a.success('¡Tu pedido va en camino!');  // listo, con mensaje
  a.idle();
</script>
```

### Como burbuja flotante (widget de ayuda)

```html
<puente-agent preset="delpuente" size="84" floating></puente-agent>
<!-- floating="bottom-left" para la esquina izquierda -->
```

O desde JS:

```js
const agente = PuenteAgent.create({ preset: 'delpuente', size: 84, floating: true });
agente.addEventListener('agent-click', () => abrirChat());
```

### Respuestas en streaming (LLM / agente)

```js
agente.think();
for await (const chunk of streamDeRespuesta) {
  agente.append(chunk);           // pasa a "respondiendo" y va agregando texto
}
```

### Conectarlo a tu agente

```js
socket.on('user_speaking', () => agente.listen());
socket.on('tool_call',     () => agente.think());
socket.on('message',   (m) => agente.say(m.text));
socket.on('cart_item', (i) => agente.addItem(i));
socket.on('order_ok',      () => agente.success('¡Pedido confirmado!'));
socket.on('failure',       () => agente.error('No pude procesarlo, intentemos de nuevo.'));
```

---

## Atributos

| Atributo | Valores | Descripción |
|---|---|---|
| `preset` | `delpuente` o el nombre de tu preset | Imagen, colores y textos |
| `state` | cualquier estado o alias | Estado actual (se puede cambiar desde HTML) |
| `src` | URL | Imagen de la mascota (sobrescribe la del preset) |
| `src-thinking`, `src-ordering`, … | URL | Imagen específica para un estado (opcional) |
| `size` | `160` (px por defecto) o cualquier medida CSS | Tamaño del avatar; los efectos escalan con él |
| `floating` | (vacío), `bottom-right`, `bottom-left` | Lo fija en una esquina de la pantalla |
| `bubble-side` | `left` (defecto), `right` | Hacia dónde salen el globo, la nube y la libreta |
| `shape` | `circle` (defecto), `card` | Forma del avatar |
| `show-label` | booleano | Muestra la etiqueta de estado ("Pensando…") debajo |
| `name` | texto | Nombre accesible para lectores de pantalla |

## Métodos

| Método | Devuelve | Descripción |
|---|---|---|
| `setState(estado)` | el elemento | Cambia de estado; acepta alias en español |
| `idle()` `listen()` `think()` `respond()` | el elemento | Atajos de estado |
| `say(texto, { speed, delay, state })` | `Promise<boolean>` | Escribe un mensaje; `speed` = ms por letra (0 = inmediato), `delay` = ms de "escribiendo…" |
| `append(fragmento)` | el elemento | Agrega texto sin animación (streaming) |
| `clearText()` | el elemento | Vacía el globo |
| `order(items)` | el elemento | Abre la libreta; `items` es un arreglo de textos u objetos `{ name, qty }`. Vacío = garabatos animados |
| `addItem(item)` | el elemento | Agrega un producto a la libreta |
| `clearOrder()` | el elemento | Vacía la libreta |
| `success(texto?)` `error(texto?)` | `Promise<boolean>` | Estados finales, con mensaje opcional |

Propiedades: `state`, `text`, `items`.

## Eventos

| Evento | `detail` |
|---|---|
| `statechange` | `{ state, previous }` |
| `saydone` | `{ text }` |
| `agent-click` | `{ state }` (clic o Enter sobre la mascota) |

---

## Crear tu propia mascota (preset)

```js
PuenteAgent.registerPreset('mi-marca', {
  name: 'Asistente Mi Marca',
  image: '/img/mascota.png',
  images: { thinking: '/img/mascota-pensando.png' },   // opcional, por estado
  colors: { accent: '#0B5FFF', bg: '#EAF1FF', paper: '#FFFFFF' },
  labels: { thinking: 'Buscando…', ordering: 'Anotando…' },
  text:   { orderTitle: 'Tu carrito' }
});
```

```html
<puente-agent preset="mi-marca"></puente-agent>
```

Consejo para la imagen: cuadrada, de la cintura para arriba, con la cara en el tercio superior y fondo liso del mismo color que `colors.bg`.

## Personalizar con CSS

Todas las variables se pueden sobrescribir desde tu hoja de estilos:

```css
puente-agent {
  --pa-size: 120px;
  --pa-accent: #8E1B22;     /* insignias, anillos, encabezado de la libreta */
  --pa-bg: #FAEBD8;         /* fondo del círculo */
  --pa-paper: #FFF8EE;      /* globos y nube */
  --pa-ink: #1C1A17;
  --pa-bun: #E8A85B; --pa-patty: #6B3A22; --pa-cheese: #F2B705; --pa-lettuce: #4E8C2F;
}
puente-agent::part(bubble) { font-size: 15px; }
```

Partes expuestas: `stage`, `body`, `avatar`, `bubble`, `order`, `label`.

## Accesibilidad

- El texto del globo se anuncia a lectores de pantalla (`aria-live="polite"`).
- La mascota se puede enfocar y activar con Enter o espacio.
- Con "reducir movimiento" activado en el sistema, las animaciones se detienen y todo se muestra quieto.

---

## Estructura

```
src/puente-agent.js        librería (un solo archivo)
presets/delpuente.js       preset Del Puente
assets/delpuente/          imágenes de la mascota
examples/demo.html         demo interactiva
```

## Pendiente

- Reemplazar `assets/delpuente/chica.jpg` por la versión en alta resolución (idealmente PNG de 1024 px).
- Poses por estado (`images` del preset) cuando estén listas.

Licencia MIT.
