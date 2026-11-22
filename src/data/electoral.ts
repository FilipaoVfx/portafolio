// Capa editorial sobre el agregado anónimo.
//
// electoral.json lo escribe scripts/build-electoral-dataset.mjs desde el CSV
// crudo, que vive fuera del repositorio. Aquí no se recalcula nada: solo se
// nombra en español lo que el pipeline produjo y se agrupa por origen.

import data from './electoral.json';

export const electoral = data;

export type FieldOrigin = 'capturado' | 'derivado' | 'inferido' | 'trazabilidad';

export const originMeta: Record<FieldOrigin, { label: string; note: string; accent: string }> = {
  capturado: {
    label: 'capturado',
    note: 'Viene tal cual de la YouTube Data API. Si falla, no hay caso.',
    accent: 'electric',
  },
  derivado: {
    label: 'derivado',
    note: 'Lo calcula el workflow con reglas, antes de gastar un solo token.',
    accent: 'lime',
  },
  inferido: {
    label: 'inferido',
    note: 'Lo escribe el modelo. Es una hipótesis con nombre, no un hecho.',
    accent: 'magenta',
  },
  trazabilidad: {
    label: 'trazabilidad',
    note: 'Quién y cuándo produjo la inferencia. Sin esto, el dato no se audita.',
    accent: 'amber',
  },
};

// Los 25 campos de la tabla de hechos, en el orden en que los escribe el
// workflow. La descripción es editorial; el ejemplo y los conteos salen del
// agregado y nunca de una fila con datos personales.
export const fieldDocs: Record<string, { origin: FieldOrigin; desc: string }> = {
  source: { origin: 'capturado', desc: 'Plataforma de origen. El esquema admite más de una; este lote es solo YouTube.' },
  video_title: { origin: 'capturado', desc: 'Título del video. Define el contexto en el que se dijo el comentario.' },
  source_url: { origin: 'capturado', desc: 'URL del video. Es la clave con la que se vuelve a la fuente.' },
  political_cluster: { origin: 'derivado', desc: 'Agrupación temática del lote: a qué pregunta responde este video.' },
  candidate_reference: { origin: 'derivado', desc: 'Referencia de campaña del lote, asignada en la captura.' },
  collection_batch: { origin: 'derivado', desc: 'Identificador de la corrida. Permite comparar fases sin mezclarlas.' },
  author_display_name: { origin: 'capturado', desc: 'Autor del comentario. Dato personal: se usa para deduplicar y nunca se publica.' },
  published_at: { origin: 'capturado', desc: 'Cuándo se comentó. El eje temporal de toda la lectura.' },
  like_count: { origin: 'capturado', desc: 'Likes del comentario. Pesa cuánto respaldo tiene una postura.' },
  reply_count: { origin: 'capturado', desc: 'Respuestas recibidas. Mide discusión, no acuerdo.' },
  text_clean: { origin: 'capturado', desc: 'Texto normalizado. Dato personal: entra al modelo, no sale al repositorio.' },
  word_count: { origin: 'derivado', desc: 'Palabras útiles. Es el filtro barato que decide si vale la pena clasificar.' },
  is_valid_for_analysis: { origin: 'derivado', desc: 'La compuerta: solo lo que pasa aquí llega al nodo que cuesta dinero.' },
  quality_reason: { origin: 'derivado', desc: 'Por qué se descartó. Un descarte sin motivo es un dato que no se puede defender.' },
  political_segment: { origin: 'inferido', desc: 'Qué tipo de votante habla. Es la variable que separa lo movible de lo fijo.' },
  sentiment: { origin: 'inferido', desc: 'Polaridad del comentario. Describe el tono, no el voto.' },
  sentiment_intensity: { origin: 'inferido', desc: 'Fuerza de esa polaridad, 0–100. El modelo la devolvió en dos escalas distintas.' },
  primary_emotion: { origin: 'inferido', desc: 'Emoción dominante. Resultó mejor predictor de dirección que el sentimiento.' },
  emotion_intensity: { origin: 'inferido', desc: 'Fuerza de la emoción, 0–100, normalizada en el agregado.' },
  main_topic: { origin: 'inferido', desc: 'De qué habla. Sirve para saber qué mensaje contestar.' },
  secondary_topic: { origin: 'inferido', desc: 'Tema de fondo. Captura la razón detrás del tema visible.' },
  mobility_score: { origin: 'inferido', desc: 'Qué tan movible es ese voto, 0–100. El campo que define a quién vale la pena hablarle.' },
  transfer_signal: { origin: 'inferido', desc: 'Hacia dónde se iría en segunda vuelta. La respuesta a la pregunta del caso.' },
  model_name: { origin: 'trazabilidad', desc: 'Modelo que clasificó. Cambiarlo invalida la comparación entre lotes.' },
  analyzed_at: { origin: 'trazabilidad', desc: 'Cuándo se infirió. Separa la fecha del dicho de la fecha del juicio.' },
};

export const fields = electoral.fields.map((f) => ({ ...f, ...(fieldDocs[f.name] ?? { origin: 'capturado' as FieldOrigin, desc: '' }) }));

export const label: Record<string, string> = {
  // segmentos
  militante_duro: 'militante duro',
  pro_candidato_a: 'pro candidato A',
  pro_candidato_b: 'pro candidato B',
  anti_candidato_a: 'anti candidato A',
  anti_candidato_b: 'anti candidato B',
  anti_extremos: 'anti extremos',
  centro: 'centro',
  indeciso: 'indeciso',
  no_clasificable: 'no clasificable',
  // señales de transferencia
  hacia_a: 'hacia A',
  hacia_b: 'hacia B',
  indefinido: 'indefinido',
  voto_blanco: 'voto en blanco',
  abstencion: 'abstención',
  no_aplica: 'no aplica',
  // emociones
  confianza: 'confianza',
  esperanza: 'esperanza',
  rabia: 'rabia',
  frustracion: 'frustración',
  miedo: 'miedo',
  incertidumbre: 'incertidumbre',
  indiferencia: 'indiferencia',
  // sentimiento, calidad y temas
  positivo: 'positivo',
  negativo: 'negativo',
  neutral: 'neutral',
  mixto: 'mixto',
  valid_comment: 'comentario válido',
  less_than_5_words: 'menos de 5 palabras',
  commercial_spam: 'spam comercial',
  segunda_vuelta: 'segunda vuelta',
  rechazo_candidato: 'rechazo al candidato',
  polarizacion: 'polarización',
  corrupcion: 'corrupción',
  seguridad: 'seguridad',
  centro_politico: 'centro político',
  instituciones: 'instituciones',
  educacion: 'educación',
  economia: 'economía',
  otro: 'otro',
  indecisos: 'indecisos',
};

export const tr = (v: string) => label[v] ?? v.replace(/_/g, ' ');

// Los nodos del workflow, en el orden en que corren. `cost` marca el único
// nodo que se paga por ítem: todo el diseño existe para que llegue lo menos
// posible a él.
export const workflow = [
  { id: 'cron', type: 'Schedule Trigger', title: 'Corrida por lote', detail: 'Una ejecución por fase de campaña. El lote queda marcado en cada fila.' },
  { id: 'api', type: 'YouTube Data API', title: 'Captura', detail: `${electoral.source.videos} videos públicos, paginados hasta agotar comentarios.` },
  { id: 'split', type: 'Split In Batches', title: 'Ítem por ítem', detail: 'Un comentario = un ítem. Lo que falla, falla solo y se reintenta solo.' },
  { id: 'norm', type: 'Code', title: 'Normaliza', detail: 'Limpia el texto y calcula word_count. Reglas, no modelo.' },
  { id: 'gate', type: 'IF', title: 'Compuerta de calidad', detail: `${electoral.totals.discarded} de ${electoral.totals.captured} no pasan. Nunca se pagan.`, gate: true },
  { id: 'llm', type: 'OpenAI', title: 'Clasificador', detail: `${electoral.source.model} con salida estructurada: 9 campos por comentario.`, cost: true },
  { id: 'guard', type: 'Code', title: 'Contrato de salida', detail: `Valida enums y rangos. Aquí se detectó la intensidad en dos escalas.`, flag: true },
  { id: 'db', type: 'Postgres', title: 'Tabla de hechos', detail: 'Upsert por comentario. Reprocesar un lote no duplica filas.' },
  { id: 'agg', type: 'Code', title: 'Agregado anónimo', detail: 'Conteos y cruces sin texto ni autor. Es lo único que sale del sistema.' },
] as const;
