/**
 * Shared probe registry — imported by RunScreen, PracticeScreen, DailyChallengeScreen, etc.
 */
import BingoProbe            from './BingoProbe.jsx';
import XOpportunitiesProbe   from './XOpportunitiesProbe.jsx';
import Suma100Probe          from './Suma100Probe.jsx';
import CadenaProbe           from './CadenaProbe.jsx';
import MemoriaProbe          from './MemoriaProbe.jsx';
import CiegoProbe            from './CiegoProbe.jsx';
import PenduloProbe          from './PenduloProbe.jsx';
import EspejoProbe           from './EspejoProbe.jsx';
import ParpadeoProbe         from './ParpadeoProbe.jsx';
import ReboteProbe           from './ReboteProbe.jsx';
import CuentaInternaProbe    from './CuentaInternaProbe.jsx';
import CadenciaFantasmaProbe from './CadenciaFantasmaProbe.jsx';
import CargaEnergiaProbe     from './CargaEnergiaProbe.jsx';
import EcoVisualProbe        from './EcoVisualProbe.jsx';
import PoliritmoProbe        from './PoliritmoProbe.jsx';
import SincroniaFaseProbe    from './SincroniaFaseProbe.jsx';
import EquilibrioProbe       from './EquilibrioProbe.jsx';
import BancaProbe            from './BancaProbe.jsx';
import DobleNadaProbe        from './DobleNadaProbe.jsx';
import PactoProbe            from './PactoProbe.jsx';

export const PROBE_MAP = {
  bingo: BingoProbe, xopportunities: XOpportunitiesProbe, suma100: Suma100Probe,
  cadena: CadenaProbe, memoria: MemoriaProbe, ciego: CiegoProbe,
  pendulo: PenduloProbe, espejo: EspejoProbe, parpadeo: ParpadeoProbe,
  rebote: ReboteProbe, cuentainterna: CuentaInternaProbe,
  cadenciafantasma: CadenciaFantasmaProbe, cargaenergia: CargaEnergiaProbe,
  ecovisual: EcoVisualProbe, poliritmo: PoliritmoProbe, sincroniafase: SincroniaFaseProbe,
  equilibrio: EquilibrioProbe, banca: BancaProbe, doblenada: DobleNadaProbe, pacto: PactoProbe,
};

export const PROBE_TYPES = Object.keys(PROBE_MAP);

export const PROBE_LABELS = {
  bingo: 'BINGO A TIEMPO', xopportunities: 'X OPORTUNIDADES', suma100: 'SUMA 100',
  cadena: 'CADENA', memoria: 'MEMORIA', ciego: 'CIEGO', pendulo: 'PÉNDULO',
  espejo: 'ESPEJO', parpadeo: 'PARPADEO', rebote: 'REBOTE',
  cuentainterna: 'CUENTA INTERNA', cadenciafantasma: 'CADENCIA FANTASMA',
  cargaenergia: 'CARGA DE ENERGÍA', ecovisual: 'ECO VISUAL', poliritmo: 'POLIRITMO',
  sincroniafase: 'SINCRONÍA DE FASE', equilibrio: 'EQUILIBRIO', banca: 'BANCA',
  doblenada: 'DOBLE O NADA', pacto: 'PACTO',
};
