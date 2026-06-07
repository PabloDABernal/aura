export const COLOR_THEMES = {
  rojo:    { bg: '#1a0505', border: '#E03B3B', glow: 'rgba(224,59,59,0.30)',    text: '#E03B3B' },
  morado:  { bg: '#0d0514', border: '#8B3BE0', glow: 'rgba(139,59,224,0.30)',   text: '#8B3BE0' },
  negro:   { bg: '#0a0a0f', border: '#4a4a5a', glow: 'rgba(74,74,90,0.25)',     text: '#9a9aaa' },
  verde:   { bg: '#051a09', border: '#3BA84F', glow: 'rgba(59,168,79,0.30)',    text: '#3BA84F' },
  naranja: { bg: '#1a0d03', border: '#E0823B', glow: 'rgba(224,130,59,0.30)',   text: '#E0823B' },
};

export function getTheme(colorId) {
  return COLOR_THEMES[colorId] ?? COLOR_THEMES.negro;
}
