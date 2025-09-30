# Simulador Interactivo TCP/IP

Visualizador paso a paso que ayuda a explicar cómo los protocolos de la pila TCP/IP encapsulan y entregan datos. El proyecto está pensado para acompañar clases de redes y protocolos, permitiendo al alumnado analizar las capas activas, seguir el recorrido del paquete y enfrentarse a retos interactivos.

## Características principales
- **Escenarios guiados**: cada simulación se define mediante pasos ordenados que incluyen título, descripción y eventos clave.
- **Visualización por capas**: muestra qué protocolos intervienen en cada momento y resalta la capa activa dentro de la pila.
- **Detalles del paquete**: expone dirección de envío, campos relevantes y, en modo avanzado, abre un modal con cabeceras completas, representación hexadecimal y estadísticas.
- **Registro de eventos**: facilita una narrativa comprensible de todo lo que ocurre en cada paso.
- **Retos interactivos**: integra juegos tipo ordenamiento, simulaciones guiadas y cuestionarios para reforzar la comprensión.
- **Material de apoyo**: cada escenario puede incluir glosario y referencias externas para continuar investigando.

## Estructura del proyecto
```
.
├── index.html            # Estructura principal y contenedores de la interfaz
├── styles.css            # Hoja de estilos (CSS moderno con diseño responsive)
├── scenarios.json        # Fuente de datos para escenarios, glosario y retos
└── scripts/              # Código JavaScript modular
    ├── main.js           # Punto de entrada, orquesta carga y renderizado
    ├── state.js          # Estado global compartido entre módulos
    ├── dom.js            # Cacheo de referencias del DOM
    ├── scenarios.js      # Normalización y carga de datos desde scenarios.json
    ├── playback.js       # Controles de reproducción automática y velocidad
    ├── view.js           # Render de capas, eventos, detalles y retos
    ├── advanced.js       # Modo avanzado y modal de detalles del paquete
    └── challenges.js     # Implementación de los distintos tipos de retos
```

## Definición de escenarios
El archivo `scenarios.json` expone un objeto con estas claves:

- `defaultScenarioId`: ID que se abrirá por defecto al cargar la aplicación.
- `scenarios`: lista de escenarios disponibles.

Cada escenario acepta:
- `id`, `title`, `summary`: metadatos de identificación.
- `steps`: array de pasos ordenados.
- `glossary`: pares término/definición que se muestran en el panel lateral.
- `references`: enlaces recomendados.

Un paso (`step`) puede contener:
- `title` y `description`.
- `layers`: capas implicadas con `name`, `protocol`, `info` y `active`.
- `packet`: con `direction` y `fields` (lista de `{ label, value }`).
- `events`: lista de mensajes cronológicos.
- `challenge`: bloque opcional para añadir un reto interactivo.

Los retos soportan tres tipos principales:
- `reorder`: pide reorganizar segmentos o paquetes.
- `simulate` / `error-sim`: botones que generan eventos y registran el resultado.
- `quiz`: preguntas de opción múltiple con retroalimentación.

## Puesta en marcha
1. Clona o descarga el repositorio.
2. Sirve la carpeta raíz con cualquier servidor estático (por ejemplo `npx serve`, `python -m http.server` o la extensión *Live Server* de VS Code).
3. Abre `http://localhost:PORT` en un navegador moderno. Tras cargar los datos podrás elegir un escenario, avanzar manualmente o activar la reproducción automática.
4. Activa el **Modo avanzado** para mostrar el botón «Ver detalles», que abre el modal con información extendida del paquete en el paso actual.

## Flujo de desarrollo
- El código está escrito en JavaScript nativo con módulos ES. No se necesita bundler ni proceso de build.
- Para incorporar nuevos escenarios edita `scenarios.json`. El módulo `scenarios.js` se encarga de validar y normalizar los datos al vuelo.
- Las interacciones del usuario se centralizan en `playback.js`, mientras que el render está concentrado en `view.js` y `challenges.js`.
- El estado global mínimo vive en `state.js`, lo que facilita depuración (expuesto también como `window.__tcpipSimulator`).

## Autor
Proyecto educativo mantenido por **Javier Feijóo López** (Docente de informática). Puedes contactar a través de [LinkedIn](https://www.linkedin.com/in/javierfeijoo/).

## Licencia
Contenido liberado bajo licencia **Creative Commons CC BY-SA 4.0**, coherente con el material docente publicado en proyectos anteriores. Si reutilizas o adaptas este simulador, recuerda citar la autoría original y compartir las mejoras con la misma licencia.
