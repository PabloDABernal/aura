/**
 * audioEngine.js — Web Audio API motor central. GDD v4.0 §12.
 * Lazy-init AudioContext: requires a user gesture before first sound.
 * All public functions are safe to call even if audio isn't yet available.
 */

let _ctx = null;
let _muted = false;

// Drone state (singleton oscillators)
let _droneStarted = false;
let _droneMainGain = null;
let _droneOsc1 = null;
let _droneOsc2 = null;
let _droneLfoOsc = null;
let _droneLfoGain = null;
let _droneBaseVolume = 0.06;

function getCtx() {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_e) {
      return null;
    }
  }
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
}

// ── Mute control ──────────────────────────────────────────────────────────────

export function setMuted(muted) {
  _muted = muted;
  if (_droneMainGain && _ctx) {
    const target = muted ? 0 : _droneBaseVolume;
    _droneMainGain.gain.setTargetAtTime(target, _ctx.currentTime, 0.3);
  }
}

export function isMuted() { return _muted; }

// ── Primitive tone ────────────────────────────────────────────────────────────

export function playTone(frequency, duration, type = 'sine', volume = 0.25) {
  if (_muted) return;
  const c = getCtx();
  if (!c) return;
  try {
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.value = frequency;
    const now = c.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch (_e) { /* ignore — AudioContext may not be available */ }
}

export function playSequence(notes) {
  if (_muted) return;
  for (const { freq, duration, delay } of notes) {
    setTimeout(() => playTone(freq, duration), delay);
  }
}

// ── Feedback sounds (GDD §12.2) ───────────────────────────────────────────────

/** Acierto (pass): tick simple agudo y corto */
export function playPassSound() {
  playTone(820, 0.05, 'sine', 0.2);
}

/** Fallo: tono descendente dos pasos */
export function playFailSound() {
  playTone(380, 0.1, 'sine', 0.22);
  setTimeout(() => playTone(190, 0.14, 'sine', 0.18), 90);
}

/** Sincronía/Perfecto: arpegio ascendente tipo campana C5→E5→G5 */
export function playPerfectSound() {
  playSequence([
    { freq: 523.25, duration: 0.14, delay: 0   }, // C5
    { freq: 659.25, duration: 0.14, delay: 85  }, // E5
    { freq: 783.99, duration: 0.24, delay: 170 }, // G5
  ]);
}

/** Aura activada: arpegio ascendente desde base determinista por auraNumber */
export function playAuraSound(auraNumber) {
  const base = 220 + ((auraNumber ?? 0) * 4); // 220–616 Hz
  playSequence([
    { freq: base,         duration: 0.13, delay: 0   },
    { freq: base * 1.26,  duration: 0.13, delay: 65  },
    { freq: base * 1.498, duration: 0.22, delay: 130 },
  ]);
}

// ── Probe-specific sounds ─────────────────────────────────────────────────────

/** Ciego: tick periódico en fase oscura */
export function playTickSound() {
  playTone(1100, 0.022, 'sine', 0.09);
}

/** Poliritmo: patrón A, patrón B, y sincronía de ambos */
export function playPoliA()    { playTone(330, 0.055, 'sine', 0.14); }
export function playPoliB()    { playTone(440, 0.055, 'sine', 0.14); }
export function playPoliSync() { playTone(880, 0.13,  'sine', 0.22); }

/** Cuenta Interna: tono de inicio del conteo */
export function playCuentaStart() { playTone(440, 0.07, 'sine', 0.16); }

// ── Ambient drone ─────────────────────────────────────────────────────────────

/**
 * startDrone — dos osciladores en quinta justa (A1+E2) con LFO lento.
 * Seguro llamar múltiples veces: ignora si ya está corriendo.
 */
export function startDrone(baseVolume = 0.06) {
  if (_droneStarted) return;
  const c = getCtx();
  if (!c) return;
  try {
    _droneBaseVolume = baseVolume;

    _droneMainGain = c.createGain();
    _droneMainGain.gain.value = _muted ? 0 : baseVolume;
    _droneMainGain.connect(c.destination);

    _droneOsc1 = c.createOscillator();
    _droneOsc1.type = 'sine';
    _droneOsc1.frequency.value = 55; // A1
    _droneOsc1.connect(_droneMainGain);

    _droneOsc2 = c.createOscillator();
    _droneOsc2.type = 'sine';
    _droneOsc2.frequency.value = 82.41; // E2 (quinta justa)
    _droneOsc2.connect(_droneMainGain);

    // LFO muy lento para modulación sutil de amplitud
    _droneLfoOsc = c.createOscillator();
    _droneLfoOsc.type = 'sine';
    _droneLfoOsc.frequency.value = 0.12; // 0.12 Hz ≈ ciclo de 8 segundos
    _droneLfoGain = c.createGain();
    _droneLfoGain.gain.value = baseVolume * 0.15; // 15% de modulación
    _droneLfoOsc.connect(_droneLfoGain);
    _droneLfoGain.connect(_droneMainGain.gain);

    _droneOsc1.start();
    _droneOsc2.start();
    _droneLfoOsc.start();
    _droneStarted = true;
  } catch (_e) { /* ignore */ }
}

export function stopDrone() {
  if (!_droneStarted) return;
  try {
    _droneOsc1?.stop();
    _droneOsc2?.stop();
    _droneLfoOsc?.stop();
    _droneMainGain?.disconnect();
  } catch (_e) { /* ignore */ }
  _droneOsc1     = null;
  _droneOsc2     = null;
  _droneLfoOsc   = null;
  _droneLfoGain  = null;
  _droneMainGain = null;
  _droneStarted  = false;
}

export function setDroneVolume(volume) {
  _droneBaseVolume = Math.max(0, volume);
  if (!_droneMainGain || !_ctx || _muted) return;
  _droneMainGain.gain.setTargetAtTime(_droneBaseVolume, _ctx.currentTime, 0.5);
}
