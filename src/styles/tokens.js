// Design tokens — Aura

export const COLORS_GAME = {
  rojo:    '#E03B3B',
  morado:  '#8B3BE0',
  negro:   '#2B2B33',
  verde:   '#3BA84F',
  naranja: '#E0823B',
};

export const COLORS_UI = {
  bg:            '#0E0E12',
  bgCard:        '#1A1A22',
  bgElevated:    '#22222E',
  border:        '#2E2E3E',
  borderLight:   '#3E3E52',
  text:          '#F0F0F5',
  textSecondary: '#8888A8',
  textMuted:     '#55556A',
  success:       '#3BA84F',
  warning:       '#E0823B',
  danger:        '#E03B3B',
  flow:          '#FFD700',
  white:         '#FFFFFF',
};

export const TYPOGRAPHY = {
  fontFamily:    "'Inter', system-ui, -apple-system, sans-serif",
  fontFamilyMono:"'JetBrains Mono', 'Courier New', monospace",

  size: {
    xs:   '11px',
    sm:   '13px',
    base: '15px',
    md:   '17px',
    lg:   '20px',
    xl:   '24px',
    '2xl':'30px',
    '3xl':'38px',
    '4xl':'48px',
  },

  weight: {
    regular: 400,
    medium:  500,
    semibold:600,
    bold:    700,
    black:   900,
  },

  lineHeight: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.75,
  },
};

export const SPACING = {
  0:   '0px',
  1:   '4px',
  2:   '8px',
  3:   '12px',
  4:   '16px',
  5:   '20px',
  6:   '24px',
  7:   '28px',
  8:   '32px',
  10:  '40px',
  12:  '48px',
  16:  '64px',
  20:  '80px',
};

export const BORDERS = {
  radius: {
    sm:   '4px',
    md:   '8px',
    lg:   '12px',
    xl:   '16px',
    '2xl':'24px',
    full: '9999px',
  },
  width: {
    thin:   '1px',
    normal: '2px',
    thick:  '3px',
  },
};

export const SHADOWS = {
  sm:   '0 1px 3px rgba(0,0,0,0.4)',
  md:   '0 4px 12px rgba(0,0,0,0.5)',
  lg:   '0 8px 24px rgba(0,0,0,0.6)',
  glow: (hex) => `0 0 12px ${hex}66, 0 0 24px ${hex}33`,
};

export const TRANSITIONS = {
  fast:   '0.1s ease',
  normal: '0.2s ease',
  slow:   '0.35s ease',
  spring: '0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
};

// Mínimo táctil GDD sección 11
export const TOUCH = {
  minTarget: '44px',
  cardMinW:  '60px',
  cardMinH:  '80px',
};
