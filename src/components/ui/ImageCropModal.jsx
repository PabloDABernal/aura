import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { COLORS_UI, COLORS_GAME, TYPOGRAPHY, SPACING, BORDERS } from '../../styles/tokens.js';

async function getCroppedImg(imageSrc, croppedAreaPixels) {
  const img = new Image();
  if (!imageSrc.startsWith('data:')) img.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  canvas.width  = 400;
  canvas.height = 400;
  canvas.getContext('2d').drawImage(
    img,
    croppedAreaPixels.x, croppedAreaPixels.y,
    croppedAreaPixels.width, croppedAreaPixels.height,
    0, 0, 400, 400,
  );
  return canvas.toDataURL('image/jpeg', 0.88);
}

export default function ImageCropModal({ imageSrc, onConfirm, onCancel }) {
  const [crop,              setCrop]              = useState({ x: 0, y: 0 });
  const [zoom,              setZoom]              = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [loading,           setLoading]           = useState(false);

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(result);
    } catch {
      // CORS bloqueado (URL externa) — guarda URL sin recortar
      onConfirm(imageSrc);
    }
    setLoading(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 600, display: 'flex', flexDirection: 'column' }}>
      {/* Cropper area */}
      <div style={{ position: 'relative', flex: 1 }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: '#000' },
            cropAreaStyle: { border: '2px solid rgba(255,215,0,0.8)', boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)' },
          }}
        />
      </div>

      {/* Controls */}
      <div style={{ background: '#0E0E12', borderTop: '1px solid rgba(255,255,255,0.08)', padding: `${SPACING[3]} ${SPACING[4]} ${SPACING[5]}`, display: 'flex', flexDirection: 'column', gap: SPACING[3] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING[3] }}>
          <span style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '11px', color: COLORS_UI.textMuted, flexShrink: 0 }}>🔍</span>
          <input
            type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#FFD700', cursor: 'pointer' }}
          />
        </div>
        <div style={{ fontFamily: TYPOGRAPHY.fontFamily, fontSize: '10px', color: COLORS_UI.textMuted, textAlign: 'center' }}>
          Arrastra para encuadrar · desliza para hacer zoom
        </div>
        <div style={{ display: 'flex', gap: SPACING[2] }}>
          <button onClick={onCancel}
            style={{ flex: 1, minHeight: '48px', background: COLORS_UI.bgElevated, border: `1px solid ${COLORS_UI.border}`, borderRadius: BORDERS.radius.xl, color: COLORS_UI.textSecondary, fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.sm, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={loading}
            style={{ flex: 2, minHeight: '48px', background: loading ? COLORS_UI.bgElevated : COLORS_GAME.verde, border: 'none', borderRadius: BORDERS.radius.xl, color: loading ? COLORS_UI.textMuted : 'white', fontFamily: TYPOGRAPHY.fontFamily, fontSize: TYPOGRAPHY.size.md, fontWeight: TYPOGRAPHY.weight.black, letterSpacing: '0.1em', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : `0 4px 20px ${COLORS_GAME.verde}60` }}>
            {loading ? '…' : 'CONFIRMAR'}
          </button>
        </div>
      </div>
    </div>
  );
}
