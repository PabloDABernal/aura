/**
 * Paneles de configuración reutilizables para TestBenchScreen y ProbeEditorScreen.
 * Exporta: Slider, Toggle, Select, AuraBox, CONFIG_COMPONENTS y cada panel *Config.
 * AuraBox acepta auraNumber prop; paneles aceptan auraNumber = 99 (fallback genérico).
 */
import { motion } from 'framer-motion';
import {
  COLORS_UI, COLORS_GAME,
  TYPOGRAPHY, SPACING, BORDERS,
} from '../../styles/tokens.js';
import { AURA_DESC } from '../../data/probeEditorData.js';

// ── Controles base ────────────────────────────────────────────────────────────

export function Slider({ label, value, min, max, step = 1, onChange, format }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING[1] }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>
          {label}
        </span>
        <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.bold, color: COLORS_UI.text, minWidth: '60px', textAlign: 'right' }}>
          {format ? format(value) : value}
        </span>
      </div>
      <div style={{ position: 'relative', height: '32px', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: '4px', borderRadius: BORDERS.radius.full, background: COLORS_UI.border }} />
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: '4px', borderRadius: BORDERS.radius.full, background: COLORS_GAME.verde, transition: 'width 0.05s' }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
          style={{ position: 'absolute', left: 0, right: 0, width: '100%', appearance: 'none', background: 'transparent', height: '32px', cursor: 'pointer', accentColor: COLORS_GAME.verde, margin: 0 }} />
      </div>
    </div>
  );
}

export function Toggle({ label, desc, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>{label}</span>
        {desc && <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: COLORS_UI.textMuted }}>{desc}</span>}
      </div>
      <motion.button whileTap={{ scale: 0.95 }} onClick={() => onChange(!value)}
        style={{ width: '52px', height: '28px', borderRadius: BORDERS.radius.full, background: value ? COLORS_GAME.verde : COLORS_UI.border, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '3px', left: value ? '26px' : '3px', width: '22px', height: '22px', borderRadius: BORDERS.radius.full, background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      </motion.button>
    </div>
  );
}

export function Select({ label, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, color: COLORS_UI.textSecondary }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.md, color: COLORS_UI.text, fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.sm, padding: `${SPACING[1]} ${SPACING[2]}`, cursor: 'pointer' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function AuraBox({ probeType, auraNumber }) {
  const num = auraNumber != null ? auraNumber : '??';
  const desc = (AURA_DESC[probeType] ?? '').replace('{n}', String(num).padStart(2, '0'));
  return (
    <div style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: BORDERS.radius.md, padding: SPACING[2], display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <span style={{ fontFamily: TYPOGRAPHY.fontFamilyMono, fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.bold, color: '#FFD700', letterSpacing: '0.08em' }}>
        AURA: #{num}
      </span>
      <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: 'rgba(255,215,0,0.6)', lineHeight: '1.4' }}>
        {desc}
      </span>
    </div>
  );
}

// ── Paneles de configuración ──────────────────────────────────────────────────

export function BingoConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Objetivos de Bingo" value={cfg.targets} min={1} max={9} onChange={v => set({ ...cfg, targets: v })} />
      <Slider label="Margen ±centésimas" value={cfg.margin} min={0} max={15} onChange={v => set({ ...cfg, margin: v })} format={v => v === 0 ? 'exacto' : `±${v}`} />
      <Slider label="Tiempo límite" value={cfg.timeLimitSec} min={5} max={120} step={5} onChange={v => set({ ...cfg, timeLimitSec: v })} format={v => `${v}s`} />
      <Toggle label="Ayuda visual" desc="Objetivos en verde, Aura en amarillo" value={cfg.showVisualAid} onChange={v => set({ ...cfg, showVisualAid: v })} />
      <AuraBox probeType="bingo" auraNumber={auraNumber} />
    </>
  );
}

export function EspejoConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Duración" value={cfg.duration} min={5} max={30} step={1} onChange={v => set({ ...cfg, duration: v })} format={v => `${v}s`} />
      <Slider label="Paradas máximas" value={cfg.maxStops} min={2} max={20} step={1} onChange={v => set({ ...cfg, maxStops: v })} />
      <Slider label="Margen ±centésimas" value={cfg.margin} min={0} max={20} onChange={v => set({ ...cfg, margin: v })} format={v => v === 0 ? 'exacto' : `±${v}`} />
      <AuraBox probeType="espejo" auraNumber={auraNumber} />
    </>
  );
}

export function PenduloConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Vueltas" value={cfg.swings} min={1} max={10} step={1} onChange={v => set({ ...cfg, swings: v })} />
      <Slider label="Duración mitad vuelta" value={cfg.swingDuration} min={2} max={10} step={1} onChange={v => set({ ...cfg, swingDuration: v })} format={v => `${v}s`} />
      <Slider label="Margen ±centésimas" value={cfg.margin} min={0} max={20} onChange={v => set({ ...cfg, margin: v })} format={v => v === 0 ? 'exacto' : `±${v}`} />
      <AuraBox probeType="pendulo" auraNumber={auraNumber} />
    </>
  );
}

export function ParpadeoConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Duración total" value={cfg.totalSec} min={5} max={30} step={1} onChange={v => set({ ...cfg, totalSec: v })} format={v => `${v}s`} />
      <Slider label="Tiempo visible (ms)" value={cfg.visibleMs} min={100} max={2000} step={100} onChange={v => set({ ...cfg, visibleMs: v })} format={v => `${v}ms`} />
      <Slider label="Tiempo oculto (ms)" value={cfg.hiddenMs} min={200} max={3000} step={100} onChange={v => set({ ...cfg, hiddenMs: v })} format={v => `${v}ms`} />
      <Slider label="Margen ±centésimas" value={cfg.margin} min={0} max={20} onChange={v => set({ ...cfg, margin: v })} format={v => v === 0 ? 'exacto' : `±${v}`} />
      <AuraBox probeType="parpadeo" auraNumber={auraNumber} />
    </>
  );
}

export function MemoriaConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Duración por intento" value={cfg.totalSec} min={5} max={20} step={1} onChange={v => set({ ...cfg, totalSec: v })} format={v => `${v}s`} />
      <Slider label="Demora entre intentos" value={cfg.delayMs} min={1000} max={8000} step={500} onChange={v => set({ ...cfg, delayMs: v })} format={v => `${(v/1000).toFixed(1)}s`} />
      <Slider label="Tiempo visible (ms)" value={cfg.visibleMs} min={500} max={3000} step={250} onChange={v => set({ ...cfg, visibleMs: v })} format={v => `${(v/1000).toFixed(2)}s`} />
      <Slider label="Margen ±centésimas" value={cfg.margin} min={0} max={15} onChange={v => set({ ...cfg, margin: v })} format={v => v === 0 ? 'exacto' : `±${v}`} />
      <AuraBox probeType="memoria" auraNumber={auraNumber} />
    </>
  );
}

export function CiegoConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Duración total" value={cfg.totalSec} min={5} max={30} step={1} onChange={v => set({ ...cfg, totalSec: v })} format={v => `${v}s`} />
      <Slider label="Segundos visible" value={cfg.visibleSec} min={1} max={Math.min(cfg.totalSec - 2, 10)} step={1} onChange={v => set({ ...cfg, visibleSec: v })} format={v => `${v}s`} />
      <Slider label="Margen ±centésimas" value={cfg.margin} min={0} max={20} onChange={v => set({ ...cfg, margin: v })} format={v => v === 0 ? 'exacto' : `±${v}`} />
      <AuraBox probeType="ciego" auraNumber={auraNumber} />
    </>
  );
}

export function CadenaConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Eslabones" value={cfg.links} min={2} max={8} step={1} onChange={v => set({ ...cfg, links: v })} />
      <Slider label="Tiempo primer eslabón" value={cfg.timeSec} min={5} max={20} step={1} onChange={v => set({ ...cfg, timeSec: v })} format={v => `${v}s`} />
      <Slider label="Reducción por eslabón" value={cfg.reductionSec} min={0} max={5} step={1} onChange={v => set({ ...cfg, reductionSec: v })} format={v => `${v}s`} />
      <Slider label="Margen ±centésimas" value={cfg.margin} min={0} max={20} onChange={v => set({ ...cfg, margin: v })} format={v => v === 0 ? 'exacto' : `±${v}`} />
      <AuraBox probeType="cadena" auraNumber={auraNumber} />
    </>
  );
}

export function CuentaInternaConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Objetivo (segundos)" value={cfg.targetSec} min={2} max={15} step={1} onChange={v => set({ ...cfg, targetSec: v })} format={v => `${v}s`} />
      <Slider label="Margen (segundos)" value={cfg.margin} min={0.1} max={1.5} step={0.1} onChange={v => set({ ...cfg, margin: v })} format={v => `±${v.toFixed(1)}s`} />
      <Slider label="Intentos" value={cfg.attempts} min={1} max={5} step={1} onChange={v => set({ ...cfg, attempts: v })} />
      <AuraBox probeType="cuentainterna" auraNumber={auraNumber} />
    </>
  );
}

export function CadenciaFantasmaConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Tiempo de vuelo (segundos)" value={cfg.travelSec} min={1} max={10} step={0.5} onChange={v => set({ ...cfg, travelSec: v })} format={v => `${v}s`} />
      <Slider label="Margen (segundos)" value={cfg.margin} min={0.05} max={1.0} step={0.05} onChange={v => set({ ...cfg, margin: v })} format={v => `±${v.toFixed(2)}s`} />
      <AuraBox probeType="cadenciafantasma" auraNumber={auraNumber} />
    </>
  );
}

export function CargaEnergiaConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Objetivo (segundos)" value={cfg.targetSec} min={2} max={15} step={1} onChange={v => set({ ...cfg, targetSec: v })} format={v => `${v}s`} />
      <Slider label="Margen (segundos)" value={cfg.margin} min={0.1} max={1.5} step={0.1} onChange={v => set({ ...cfg, margin: v })} format={v => `±${v.toFixed(1)}s`} />
      <Select label="Curva de la barra"
        value={cfg.barCurve}
        options={[
          { value: 'log',       label: 'Logarítmica (rápido→lento)' },
          { value: 'oscillate', label: 'Oscilante (errática)' },
          { value: 'linear',    label: 'Lineal (honesta)' },
        ]}
        onChange={v => set({ ...cfg, barCurve: v })} />
      <AuraBox probeType="cargaenergia" auraNumber={auraNumber} />
    </>
  );
}

export function EcoVisualConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Luces" value={cfg.lights} min={2} max={5} step={1} onChange={v => set({ ...cfg, lights: v })} />
      <Slider label="Ciclos a observar" value={cfg.cycleMostra} min={1} max={4} step={1} onChange={v => set({ ...cfg, cycleMostra: v })} />
      <Slider label="Intervalo entre luces (ms)" value={cfg.intervalMs} min={300} max={2000} step={100} onChange={v => set({ ...cfg, intervalMs: v })} format={v => `${v}ms`} />
      <Slider label="Margen de timing (ms)" value={cfg.marginMs} min={50} max={500} step={25} onChange={v => set({ ...cfg, marginMs: v })} format={v => `±${v}ms`} />
      <AuraBox probeType="ecovisual" auraNumber={auraNumber} />
    </>
  );
}

export function PoliritmoConfig({ cfg, set, auraNumber = 99 }) {
  const safeSet = patch => {
    const next = { ...cfg, ...patch };
    next.required = Math.min(next.required, 10);
    set(next);
  };
  return (
    <>
      <Slider label="Intervalo A (ms)" value={cfg.intervalA} min={400} max={2000} step={100} onChange={v => safeSet({ intervalA: v })} format={v => `${v}ms`} />
      <Slider label="Intervalo B (ms)" value={cfg.intervalB} min={400} max={2000} step={100} onChange={v => safeSet({ intervalB: v })} format={v => `${v}ms`} />
      <Slider label="Duración" value={cfg.totalSec} min={6} max={30} step={1} onChange={v => safeSet({ totalSec: v })} format={v => `${v}s`} />
      <Slider label="Coincidencias requeridas" value={cfg.required} min={1} max={5} step={1} onChange={v => safeSet({ required: v })} />
      <Slider label="Margen (ms)" value={cfg.marginMs} min={50} max={400} step={25} onChange={v => safeSet({ marginMs: v })} format={v => `±${v}ms`} />
      <AuraBox probeType="poliritmo" auraNumber={auraNumber} />
    </>
  );
}

export function SincroniaFaseConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Revoluciones" value={cfg.revolutions} min={1} max={8} step={1} onChange={v => set({ ...cfg, revolutions: v })} />
      <Slider label="Aciertos requeridos" value={Math.min(cfg.required, cfg.revolutions)} min={1} max={cfg.revolutions} step={1} onChange={v => set({ ...cfg, required: v })} />
      <Slider label="Periodo (ms)" value={cfg.periodMs} min={1000} max={6000} step={250} onChange={v => set({ ...cfg, periodMs: v })} format={v => `${(v/1000).toFixed(2)}s`} />
      <Slider label="Margen (ms)" value={cfg.marginMs} min={50} max={400} step={25} onChange={v => set({ ...cfg, marginMs: v })} format={v => `±${v}ms`} />
      <AuraBox probeType="sincroniafase" auraNumber={auraNumber} />
    </>
  );
}

export function ReboteConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Duración total" value={cfg.totalSec} min={5} max={30} step={1} onChange={v => set({ ...cfg, totalSec: v })} format={v => `${v}s`} />
      <Slider label="Delay de rebote (ms)" value={cfg.delayMs} min={100} max={1500} step={50} onChange={v => set({ ...cfg, delayMs: v })} format={v => `${v}ms`} />
      <Slider label="Margen ±centésimas" value={cfg.margin} min={0} max={20} onChange={v => set({ ...cfg, margin: v })} format={v => v === 0 ? 'exacto' : `±${v}`} />
      <Toggle label="Mostrar delay" desc="Informa al jugador del tiempo de delay" value={cfg.showDelay} onChange={v => set({ ...cfg, showDelay: v })} />
      <AuraBox probeType="rebote" auraNumber={auraNumber} />
    </>
  );
}

export function XConfig({ cfg, set, auraNumber = 99 }) {
  const safeSet = patch => set({ ...cfg, ...patch, required: Math.min(patch.required ?? cfg.required, patch.numTargets ?? cfg.numTargets) });
  return (
    <>
      <Slider label="Ventanas" value={cfg.numTargets} min={1} max={8} onChange={v => safeSet({ numTargets: v })} />
      <Slider label="Requeridas para pasar" value={Math.min(cfg.required, cfg.numTargets)} min={1} max={cfg.numTargets} onChange={v => safeSet({ required: v })} />
      <Slider label="Margen ±centésimas" value={cfg.margin} min={0} max={15} onChange={v => safeSet({ margin: v })} format={v => v === 0 ? 'exacto' : `±${v}`} />
      <Slider label="Duración" value={cfg.totalSec} min={5} max={60} step={5} onChange={v => safeSet({ totalSec: v })} format={v => `${v}s`} />
      <Toggle label="Ayuda visual" desc="Barra con zonas verdes y Aura amarilla" value={cfg.showVisualAid} onChange={v => set({ ...cfg, showVisualAid: v })} />
      <AuraBox probeType="xopportunities" auraNumber={auraNumber} />
    </>
  );
}

export function Suma100Config({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Objetivo" value={cfg.targetSum} min={100} max={500} step={100} onChange={v => set({ ...cfg, targetSum: v })} format={v => `${v} pts`} />
      <Slider label="Tiempo límite" value={cfg.timeLimitSec} min={10} max={120} step={5} onChange={v => set({ ...cfg, timeLimitSec: v })} format={v => `${v}s`} />
      <Slider label="Resets permitidos" value={cfg.maxResets} min={0} max={10} onChange={v => set({ ...cfg, maxResets: v })} format={v => v === 0 ? '∞ resets' : `${v}`} />
      <Toggle label="Ayuda visual" desc="Muestra zona objetivo en la barra" value={cfg.showVisualAid} onChange={v => set({ ...cfg, showVisualAid: v })} />
      <AuraBox probeType="suma100" auraNumber={auraNumber} />
    </>
  );
}

export function EquilibrioConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Paradas obligatorias" value={cfg.taps ?? 5} min={1} max={10} onChange={v => set({ ...cfg, taps: v })} />
      <Slider label="Tiempo por parada" value={cfg.tapTimeSec ?? 10} min={5} max={30} step={1} onChange={v => set({ ...cfg, tapTimeSec: v })} format={v => `${v}s`} />
      <Slider label="Descartes disponibles" value={cfg.discards ?? 1} min={0} max={3} onChange={v => set({ ...cfg, discards: v })} format={v => v === 0 ? 'ninguno' : `${v}`} />
      <Slider label="Límite inferior" value={cfg.minVal ?? 40} min={0} max={(cfg.maxVal ?? 60) - 5} step={5} onChange={v => set({ ...cfg, minVal: v })} />
      <Slider label="Límite superior" value={cfg.maxVal ?? 60} min={(cfg.minVal ?? 40) + 5} max={100} step={5} onChange={v => set({ ...cfg, maxVal: v })} />
      <AuraBox probeType="equilibrio" auraNumber={auraNumber} />
    </>
  );
}

export function BancaConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Paradas" value={cfg.slots} min={2} max={10} step={1} onChange={v => set({ ...cfg, slots: v })} />
      <Slider label="Suma mínima" value={cfg.minTarget} min={0} max={cfg.maxTarget - 10} step={10} onChange={v => set({ ...cfg, minTarget: v })} />
      <Slider label="Suma máxima" value={cfg.maxTarget} min={cfg.minTarget + 10} max={600} step={10} onChange={v => set({ ...cfg, maxTarget: v })} />
      <Slider label="Duración" value={cfg.totalSec} min={15} max={120} step={5} onChange={v => set({ ...cfg, totalSec: v })} format={v => `${v}s`} />
      <Slider label="Descartes" value={cfg.discards} min={0} max={3} step={1} onChange={v => set({ ...cfg, discards: v })} format={v => v === 0 ? 'ninguno' : `${v}`} />
      <AuraBox probeType="banca" auraNumber={auraNumber} />
    </>
  );
}

export function DobleNadaConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Paradas máximas" value={cfg.maxStops} min={1} max={6} step={1} onChange={v => set({ ...cfg, maxStops: v })} />
      <Slider label="Límite de explosión (s)" value={cfg.explosionLimit} min={3.0} max={20.0} step={0.5} onChange={v => set({ ...cfg, explosionLimit: v })} format={v => `${v.toFixed(1)}s`} />
      <Slider label="Objetivo ideal (s)" value={cfg.targetIdeal} min={1.0} max={cfg.explosionLimit - 0.5} step={0.25} onChange={v => set({ ...cfg, targetIdeal: v })} format={v => `${v.toFixed(2)}s`} />
      <Slider label="Margen (segundos)" value={cfg.margin} min={0.05} max={1.5} step={0.05} onChange={v => set({ ...cfg, margin: v })} format={v => `±${v.toFixed(2)}s`} />
      <Slider label="Duración cronómetro" value={cfg.totalSec} min={5} max={20} step={1} onChange={v => set({ ...cfg, totalSec: v })} format={v => `${v}s`} />
      <AuraBox probeType="doblenada" auraNumber={auraNumber} />
    </>
  );
}

export function PactoConfig({ cfg, set, auraNumber = 99 }) {
  return (
    <>
      <Slider label="Monedas iniciales" value={cfg.coins} min={1} max={10} step={1} onChange={v => set({ ...cfg, coins: v })} />
      <Slider label="Coste por segundo de rango" value={cfg.costPerSec} min={0.5} max={3} step={0.5} onChange={v => set({ ...cfg, costPerSec: v })} format={v => `${v.toFixed(1)}`} />
      <Slider label="Duración máxima" value={cfg.totalSec} min={5} max={30} step={1} onChange={v => set({ ...cfg, totalSec: v })} format={v => `${v}s`} />
      <Slider label="Intentos" value={cfg.attempts} min={1} max={5} step={1} onChange={v => set({ ...cfg, attempts: v })} />
      <AuraBox probeType="pacto" auraNumber={auraNumber} />
    </>
  );
}

export const CONFIG_COMPONENTS = {
  bingo:             BingoConfig,
  espejo:            EspejoConfig,
  pendulo:           PenduloConfig,
  parpadeo:          ParpadeoConfig,
  memoria:           MemoriaConfig,
  ciego:             CiegoConfig,
  cadena:            CadenaConfig,
  cuentainterna:     CuentaInternaConfig,
  cadenciafantasma:  CadenciaFantasmaConfig,
  cargaenergia:      CargaEnergiaConfig,
  ecovisual:         EcoVisualConfig,
  poliritmo:         PoliritmoConfig,
  sincroniafase:     SincroniaFaseConfig,
  rebote:            ReboteConfig,
  xopportunities:    XConfig,
  suma100:           Suma100Config,
  equilibrio:        EquilibrioConfig,
  banca:             BancaConfig,
  doblenada:         DobleNadaConfig,
  pacto:             PactoConfig,
};
