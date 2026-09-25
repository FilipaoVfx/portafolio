# System Map

Arquitectura interactiva y verificable por proyecto. Cada componente, relación,
flujo y decisión del mapa enlaza a las líneas del repositorio que lo demuestran,
fijadas al commit analizado.

```text
Repositorio ─► análisis estático ─► hechos ─┐
                                            ├─► Architecture IR ─► validación ─► architecture.json ─► portfolio
               interpretation.json ─────────┘
```

Todo ocurre en build/CI. En producción el portfolio solo lee JSON estático: sin
LLM, sin análisis y sin llamadas a GitHub en runtime.

## En el portfolio

Cada tarjeta de proyecto de la home tiene un botón **Ver arquitectura**: la
tarjeta entera gira y el reverso muestra el mapa. Pulsar un componente o una
conexión abre su detalle con la evidencia (extracto + enlace a GitHub en el
commit analizado); **Flujos** resalta un recorrido paso a paso y **Decisiones**
lista el porqué, separando hecho observado, decisión documentada e inferencia.
Escape cierra el detalle y, después, devuelve la tarjeta a su frente.

El mapa (`ArchitectureBack`) y el artefacto
(`/projects/<slug>/architecture.json`) solo se descargan al girar la tarjeta:
la home no carga ningún mapa por adelantado.

## Piezas

| Archivo | Rol |
|---|---|
| `lib/scan.mjs` | Recorre el checkout. Excluye `.git`, `node_modules`, builds, caches, binarios, lockfiles, archivos > 512 KB y secretos (`.env*`, `*.pem`, `*.key`, `secrets/`, `credentials/`…). |
| `lib/extract.mjs` | Análisis estático → **hechos** con archivo y línea: imports (resueltos), rutas HTTP, llamadas HTTP y hosts, tablas y RPC de Supabase, objetos SQL, variables de entorno (solo el nombre), dependencias y scripts, Dockerfiles, docker compose, workflows y secciones de documentación. |
| `lib/interpret.mjs` | Adaptador hechos + interpretación → IR. Detecta relaciones por su cuenta, resuelve la evidencia citada y **calcula** la confianza. |
| `lib/validate.mjs` | Validación del IR: offline (esquema, referencias, confianza, secretos, enlaces fijados al commit, tamaño) y contra el repositorio (cada path, rango y extracto). |
| `lib/model.mjs`, `lib/constants.mjs` | Contrato compartido con el frontend (sin dependencias de Node). |
| `cli.mjs` | `generate`, `validate`, `facts`. |
| `projects/<slug>/project.json` | Repositorio, rama y estado del System Map. |
| `projects/<slug>/interpretation.json` | Interpretación versionada: nombres, grupos, flujos, decisiones. |
| `projects/<slug>/architecture.json` | Artefacto generado. Nunca se edita a mano. |

El renderer (`src/components/system-map/`) solo depende del IR
(`src/lib/system-map/types.ts`). Cambiar el analizador o sustituirlo por otro
(p. ej. Archify) solo exige un adaptador nuevo que produzca el mismo IR.

## Hechos vs. interpretación

El análisis estático no sabe qué es "el knowledge engine"; sabe que
`backend/src/server.js:726` define `POST /search/goal` y que
`web-astro/src/lib/api.ts:668` hace `fetch` a esa ruta. La interpretación pone
los nombres y agrupa módulos. Puede redactarse con ayuda de un LLM, pero fuera
del build y revisada en git. Reglas que el pipeline impone:

- **No puede citar evidencia inexistente.** Cada matcher (`import`, `route`,
  `call`, `table`, `rpc`, `sql`, `dependency`, `script`, `env`, `doc`,
  `pattern`, `file`, `dir`) debe resolverse contra los hechos del commit, o la
  generación falla.
- **No puede subir la confianza.** Se calcula desde la evidencia; la
  interpretación solo puede bajarla (`cap`) y explicar por qué (`caveat`).
- **No puede ocultar relaciones.** Las que los hechos demuestran (HTTP cliente →
  ruta, imports entre componentes, SDKs, acceso a tablas, workflows que ejecutan
  scripts) se publican aunque nadie las describa.
- **No puede contradecir al código.** Si la documentación afirma algo que el
  código desmiente, se registra como hallazgo (`findings`), con evidencia de
  ambos lados. `absent` verifica que un archivo documentado no existe.

### Modelo de confianza

| Nivel | Significado | Regla |
|---|---|---|
| ● `confirmed` | Evidencia directa | Al menos una evidencia de código o configuración ejecutable. Una relación confirmada además debe citar código de uno de sus extremos. |
| ◐ `supported` | Evidencia indirecta | Solo documentación, o `cap` explícito (p. ej. configuración con placeholders). |
| △ `inferred` | Interpretación | Sin evidencia. Las decisiones con `basis: inferred` nunca superan este nivel. |
| ? `unknown` | Sin información | Declarado explícitamente. |

Las decisiones distinguen además su origen: `observed` (el código lo
demuestra), `documented` (el repo explica el porqué) e `inferred` (lo explica
el análisis).

## Comandos

```bash
npm run system-map:generate              # todos los proyectos habilitados
npm run system-map:generate -- indexer   # uno
npm run system-map:generate -- --strict  # falla (exit 1) en vez de conservar el artefacto anterior
npm run system-map:validate -- --deep    # descarga el commit y contrasta cada extracto
npm run system-map:test                  # tests del pipeline
node system-map/cli.mjs facts indexer --kind route   # hechos crudos, para redactar interpretaciones
```

`--repo-dir <path>` usa un checkout local en lugar de clonar en `.cache/`.

## Política de fallo

- `generate` sin `--strict`: si el análisis o la validación fallan, avisa,
  **conserva el último `architecture.json` válido** y termina con éxito. El
  deploy continúa.
- `generate` no reescribe el artefacto si solo cambiaría la hora de generación.
- El build de Astro vuelve a validar cada artefacto (`src/lib/system-map/index.ts`):
  un `architecture.json` inválido rompe el build en vez de publicarse.

## CI

- `deploy-github-pages.yml` regenera los mapas antes del build.
- `system-map.yml`: tests + `validate --deep` en cada PR que toque el pipeline;
  semanalmente, `generate --strict` detecta deriva entre el código de cada
  repositorio y su interpretación.
- El build de Cloudflare publica el artefacto versionado en el repo, validado
  en el propio build.

## Añadir un proyecto

1. `projects/<slug>/project.json` con `slug`, `name`, `repository`, `branch` y
   `systemMap.enabled: true`, `systemMap.artifact: "architecture.json"`. El
   `slug` debe coincidir con el de `src/data/projects.ts`.
2. Inspecciona los hechos: `node system-map/cli.mjs facts <slug>`.
3. Escribe `interpretation.json`: `groups` (filas del mapa, en orden),
   `components` con `paths` (membresía por prefijo más largo), `packages` y
   `hosts` (para detectar SDKs y llamadas), y la evidencia que respalda cada
   afirmación. Describe las relaciones que el generador reporte como "detectada
   sin describir".
4. `npm run system-map:generate -- <slug> --strict` hasta que valide.
5. La tarjeta del proyecto en la home muestra el botón "Ver arquitectura" sola.

## Seguridad

- Nunca se leen `.env*`, llaves, `secrets/` ni `credentials/`.
- De las variables de entorno solo se registra el nombre.
- Cada extracto se sanea (tokens conocidos, asignaciones sensibles, URLs de red
  privada) y el validador escanea el artefacto completo antes de publicarlo.
