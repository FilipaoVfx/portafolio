import { useCallback, useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

// La tarjeta del proyecto se convierte en el panel de arquitectura.
//
// Escritorio: una copia exacta de la tarjeta despega de su sitio y gira hasta
// quedar de canto a mitad de camino; ahí la releva el panel, que termina el
// giro mientras llega a su tamaño final. A 90° ninguna de las dos caras se
// ve, así que el cambio de contenido es invisible.
// Móvil: sin giro. El panel crece desde el rectángulo de la tarjeta.
// Movimiento reducido: fundido.
//
// Es un <dialog> modal: el resto de la página queda inerte y difuminado
// detrás, Escape y el botón Atrás del navegador lo cierran, y el foco vuelve
// a la tarjeta.

type Mode = 'flip' | 'rise' | 'fade';

const P = 'perspective(1800px)';
const IDENTITY = `${P} translate(0px, 0px) scale(1, 1) rotateY(0deg)`;
const OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
const INTO_EDGE = 'cubic-bezier(0.55, 0, 0.85, 0.35)';

function pickMode(): Mode {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'fade';
  return window.matchMedia('(max-width: 767px)').matches ? 'rise' : 'flip';
}

function lerpRect(a: DOMRect, b: DOMRect, t: number) {
  return new DOMRect(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.width + (b.width - a.width) * t, a.height + (b.height - a.height) * t);
}

/** Transform que hace que un elemento maquetado en `laid` se vea en `shown`. */
function place(shown: DOMRect, laid: DOMRect) {
  const dx = shown.x + shown.width / 2 - (laid.x + laid.width / 2);
  const dy = shown.y + shown.height / 2 - (laid.y + laid.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${shown.width / laid.width}, ${shown.height / laid.height})`;
}

/** Recorte del panel (a pantalla completa) que coincide con la tarjeta. */
function insetOf(r: DOMRect) {
  return `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px round 8px)`;
}

type Props = {
  slug: string;
  title: string;
  subtitle: ReactNode;
  accentClass: string;
  source: RefObject<HTMLElement>;
  returnFocus: RefObject<HTMLElement>;
  deepLinked: boolean;
  onClosed: () => void;
  children: ReactNode;
};

export default function ArchitectureDialog({ slug, title, subtitle, accentClass, source, returnFocus, deepLinked, onClosed, children }: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const clone = useRef<HTMLElement | null>(null);
  const mode = useRef<Mode>('fade');
  const busy = useRef(true);
  const pushed = useRef(false);
  const closing = useRef(false);

  const unlock = useCallback(() => {
    const html = document.documentElement;
    html.style.overflow = '';
    html.style.paddingRight = '';
    if (source.current) source.current.style.visibility = '';
    clone.current?.remove();
    clone.current = null;
  }, [source]);

  const finishClose = useCallback(async () => {
    if (closing.current) return;
    closing.current = true;
    busy.current = true;
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    const card = source.current;
    if (dialog && panel && scrim) {
      const anims: Animation[] = [scrim.animate([{ opacity: 1 }, { opacity: 0 }], { duration: mode.current === 'fade' ? 160 : 420, easing: 'ease-in', fill: 'forwards' })];
      if (mode.current === 'flip' && card && clone.current) {
        const first = card.getBoundingClientRect();
        const last = panel.getBoundingClientRect();
        const mid = lerpRect(first, last, 0.5);
        Object.assign(clone.current.style, { left: `${first.left}px`, top: `${first.top}px`, display: '' });
        anims.push(
          panel.animate([{ transform: IDENTITY }, { transform: `${P} ${place(mid, last)} rotateY(-90deg)` }], { duration: 220, easing: INTO_EDGE, fill: 'forwards' }),
          clone.current.animate([{ transform: `${P} ${place(mid, first)} rotateY(90deg)` }, { transform: IDENTITY }], { duration: 280, delay: 220, easing: OUT, fill: 'both' }),
        );
      } else if (mode.current === 'rise' && card) {
        const first = card.getBoundingClientRect();
        anims.push(
          panel.animate([{ clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 }, { clipPath: insetOf(first), opacity: 0.4 }], { duration: 300, easing: INTO_EDGE, fill: 'forwards' }),
        );
        if (clone.current) {
          clone.current.style.display = '';
          anims.push(clone.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: 160, fill: 'both' }));
        }
      } else {
        anims.push(panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }));
      }
      await Promise.allSettled(anims.map((a) => a.finished));
      dialog.close();
    }
    unlock();
    onClosed();
    requestAnimationFrame(() => returnFocus.current?.focus({ preventScroll: true }));
  }, [onClosed, returnFocus, source, unlock]);

  // Cerrar pasa por el historial cuando abrimos una entrada propia: así el
  // botón Atrás y el de cerrar hacen exactamente lo mismo.
  const requestClose = useCallback(() => {
    if (busy.current) return;
    if (pushed.current && history.state?.smArchitecture === slug) {
      history.back();
      return;
    }
    history.replaceState(null, '', `${location.pathname}${location.search}`);
    void finishClose();
  }, [finishClose, slug]);

  useEffect(() => {
    const onPop = () => {
      if (history.state?.smArchitecture !== slug) void finishClose();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [finishClose, slug]);

  // Apertura.
  useEffect(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const scrim = scrimRef.current;
    const card = source.current;
    if (!dialog || !panel || !scrim) return;

    const hash = `#${slug}/arquitectura`;
    if (deepLinked) history.replaceState({ smArchitecture: slug }, '', hash);
    else {
      history.pushState({ smArchitecture: slug }, '', hash);
      pushed.current = true;
    }

    const html = document.documentElement;
    const gutter = window.innerWidth - html.clientWidth;
    html.style.overflow = 'hidden';
    if (gutter > 0) html.style.paddingRight = `${gutter}px`;

    mode.current = pickMode();
    dialog.showModal();
    headingRef.current?.focus({ preventScroll: true });

    const anims: Animation[] = [scrim.animate([{ opacity: 0 }, { opacity: 1 }], { duration: mode.current === 'fade' ? 200 : 480, easing: 'ease-out', fill: 'both' })];

    if (card && mode.current !== 'fade') {
      const first = card.getBoundingClientRect();
      const copy = card.cloneNode(true) as HTMLElement;
      copy.inert = true;
      copy.setAttribute('aria-hidden', 'true');
      copy.removeAttribute('id');
      Object.assign(copy.style, {
        position: 'fixed',
        left: `${first.left}px`,
        top: `${first.top}px`,
        width: `${first.width}px`,
        height: `${first.height}px`,
        margin: '0',
        transformOrigin: 'center',
        pointerEvents: 'none',
        backfaceVisibility: 'hidden',
        visibility: 'visible',
      });
      panel.before(copy);
      clone.current = copy;
      card.style.visibility = 'hidden';

      if (mode.current === 'flip') {
        const last = panel.getBoundingClientRect();
        const mid = lerpRect(first, last, 0.5);
        anims.push(
          copy.animate([{ transform: IDENTITY }, { transform: `${P} ${place(mid, first)} rotateY(90deg)` }], { duration: 300, easing: INTO_EDGE, fill: 'forwards' }),
          panel.animate([{ transform: `${P} ${place(mid, last)} rotateY(-90deg)` }, { transform: IDENTITY }], { duration: 440, delay: 300, easing: OUT, fill: 'backwards' }),
        );
      } else {
        anims.push(
          copy.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }),
          panel.animate([{ clipPath: insetOf(first), opacity: 0.4 }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 }], { duration: 420, easing: OUT, fill: 'backwards' }),
        );
      }
    } else {
      anims.push(panel.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'backwards' }));
    }

    void Promise.allSettled(anims.map((a) => a.finished)).then(() => {
      if (clone.current) clone.current.style.display = 'none';
      busy.current = false;
      // El contenido que quiera animarse (la intro) espera a que el panel
      // haya llegado a su sitio.
      panel.dataset.ready = 'true';
      panel.dispatchEvent(new Event('sm:ready'));
    });

    return unlock;
    // La apertura ocurre una sola vez por montaje.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      className="sm-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
    >
      <div ref={scrimRef} className="sm-scrim" onClick={requestClose} aria-hidden="true" />
      <div
        ref={panelRef}
        data-sm-panel=""
        className="fixed inset-0 m-auto flex h-full w-full flex-col overflow-hidden bg-ink-900 md:h-[min(90vh,980px)] md:w-[min(94vw,1480px)] md:rounded-lg md:border-2 md:border-white/15 md:shadow-[0_40px_120px_rgba(0,0,0,0.6)]"
        style={{ transformOrigin: 'center' }}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-4 pb-3 pt-4 md:px-8 md:pt-5">
          <div className="min-w-0">
            <h2 id={titleId} ref={headingRef} tabIndex={-1} className={`heading-display text-3xl leading-none outline-none md:text-4xl ${accentClass}`}>
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-white/55">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="flex shrink-0 items-center gap-2 border-2 border-white/20 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/75 transition hover:border-white/60 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-lime"
          >
            Cerrar
            <kbd className="hidden border border-white/20 px-1 text-[10px] text-white/45 md:inline">esc</kbd>
          </button>
        </header>
        <div className="min-h-0 flex-1 px-4 pb-3 pt-3 md:px-8 md:pb-4">{children}</div>
      </div>
    </dialog>,
    document.body,
  );
}
