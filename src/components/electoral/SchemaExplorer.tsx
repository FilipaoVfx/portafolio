// Lo que el workflow deja escrito por comentario: los 25 campos de la tabla de
// hechos, agrupados por origen. El JSON de la derecha es una fila real salvo en
// los campos con datos personales o con el nombre de la campaña, que salen
// marcados entre comillas angulares.

import { useMemo, useState } from 'react';
import { electoral, fields, originMeta, type FieldOrigin } from '@/data/electoral';

const ORIGINS = Object.keys(originMeta) as FieldOrigin[];

const accentText: Record<string, string> = {
  electric: 'text-accent-electric',
  lime: 'text-accent-lime',
  magenta: 'text-accent-magenta',
  amber: 'text-accent-amber',
};
const accentBg: Record<string, string> = {
  electric: 'bg-accent-electric',
  lime: 'bg-accent-lime',
  magenta: 'bg-accent-magenta',
  amber: 'bg-accent-amber',
};
const accentBorder: Record<string, string> = {
  electric: 'border-accent-electric',
  lime: 'border-accent-lime',
  magenta: 'border-accent-magenta',
  amber: 'border-accent-amber',
};

// Los ejemplos son todos texto en el CSV; aquí se muestran como lo que son.
const isNumeric = (v: string) => v !== '' && !Number.isNaN(Number(v));
const isBool = (v: string) => v === 'true' || v === 'false';
const renderValue = (v: string) =>
  isBool(v) || isNumeric(v) ? v : `"${v}"`;

export default function SchemaExplorer() {
  const [origin, setOrigin] = useState<FieldOrigin | 'todos'>('todos');
  const [selected, setSelected] = useState(fields.find((f) => f.name === 'transfer_signal')?.name ?? fields[0].name);

  const shown = useMemo(
    () => (origin === 'todos' ? fields : fields.filter((f) => f.origin === origin)),
    [origin],
  );
  const field = fields.find((f) => f.name === selected)!;
  const counts = useMemo(
    () => Object.fromEntries(ORIGINS.map((o) => [o, fields.filter((f) => f.origin === o).length])),
    [],
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOrigin('todos')}
          className={`px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] border transition ${
            origin === 'todos' ? 'border-white bg-white text-ink-950' : 'border-white/15 bg-white/5 text-white/60 hover:border-white/40 hover:text-white'
          }`}
        >
          todos · {fields.length}
        </button>
        {ORIGINS.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setOrigin(o)}
            className={`flex items-center gap-2 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] border transition ${
              origin === o
                ? `${accentBorder[originMeta[o].accent]} bg-white/10 text-white`
                : 'border-white/15 bg-white/5 text-white/60 hover:border-white/40 hover:text-white'
            }`}
          >
            <span className={`inline-block h-2 w-2 ${accentBg[originMeta[o].accent]}`} />
            {originMeta[o].label} · {counts[o]}
          </button>
        ))}
      </div>

      {origin !== 'todos' && (
        <p className="mt-3 text-sm leading-relaxed text-white/55">{originMeta[origin].note}</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <ul className="divide-y divide-white/10 border border-white/10 bg-ink-900/70">
            {shown.map((f) => (
              <li key={f.name}>
                <button
                  type="button"
                  onClick={() => setSelected(f.name)}
                  aria-pressed={selected === f.name}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                    selected === f.name ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={`inline-block h-2 w-2 shrink-0 ${accentBg[originMeta[f.origin].accent]}`} />
                  <span className="font-mono text-[12px] text-white/85">{f.name}</span>
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
                    {f.distinct} val.
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-l-2 border-accent-lime/70 bg-black/25 px-4 py-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-mono text-sm text-white">{field.name}</span>
              <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${accentText[originMeta[field.origin].accent]}`}>
                {originMeta[field.origin].label}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{field.desc}</p>
            <p className="mt-3 font-mono text-[11px] text-white/55">
              {field.filled} de {electoral.totals.captured} filas · {field.distinct} valores distintos
            </p>
          </div>
        </div>

        {/* min-w-0: sin esto el <pre> estira la rejilla y la página entera
            gana scroll horizontal en móvil. */}
        <div className="lg:col-span-7 min-w-0">
          <div className="border border-white/10 bg-[#06060a]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
                fact_comments · una fila
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">json</span>
            </div>
            <pre className="overflow-x-auto px-4 py-4 font-mono text-[12px] leading-[1.9]">
              <code>
                <span className="text-white/55">{'{'}</span>
                {'\n'}
                {shown.map((f, k) => (
                  <span
                    key={f.name}
                    onClick={() => setSelected(f.name)}
                    className={`block cursor-pointer px-2 -mx-2 transition ${
                      selected === f.name ? 'bg-white/10' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    {'  '}
                    <span className={accentText[originMeta[f.origin].accent]}>"{f.name}"</span>
                    <span className="text-white/55">: </span>
                    <span className="text-white/80">{renderValue(f.example)}</span>
                    <span className="text-white/55">{k < shown.length - 1 ? ',' : ''}</span>
                  </span>
                ))}
                <span className="text-white/55">{'}'}</span>
              </code>
            </pre>
          </div>

          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-white/55">
            «autor» y «texto» no se publican · el repositorio solo guarda el agregado
          </p>
        </div>
      </div>
    </div>
  );
}
