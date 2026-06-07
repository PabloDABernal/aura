# Balance Check — Fase 1 (corruptAura × 3)

## Stats base

| Personaje | Aura | P   | I   | T   |
|-----------|------|-----|-----|-----|
| Luffy (Líder, rojo) | 7 | 4 | 1 | 2 |
| Corrupto Luffy (7×3) | 21 | 11 | 4 | 6 |

_split('rojo') = 50% P / 20% I / 30% T_

## Turno a turno (mejor caso — Flows en segundo 0)

| # | Quién | Acción | Efecto | Estado Luffy | Estado Corrupto |
|---|-------|--------|--------|--------------|-----------------|
| 1 | Jugador | Luffy → Foso | — | P4 I1 T2 | Aura 21 |
| 2 | Rival | attackPit 2 dmg | T2→T0 | P4 I1 T0 | Aura 21 |
| 3 | Jugador | CONFRONTAR Flow (.78 en 0s) | 4×2+5=13 dmg + Luffy +2 Aura | P5 I1 T1 | Aura 8 |
| 4 | Rival | attackPit 2 dmg | T1→0, P5→P4 | P4 I1 T0 | Aura 8 |
| 5 | Jugador | CONFRONTAR Vibra (.78 en 1s) | 4×1+4=8 dmg + Luffy +1 Aura | P5 I1 T0 | Aura 0 ✓ |

**Victoria en turno 5 (3 turnos jugador, 2 rival).**

## Turno a turno (caso medio — mix Vibra/Fail)

| # | Acción | Efecto | Corrupto |
|---|--------|--------|---------|
| 1 | Luffy → Foso | — | 21 |
| 2 | Rival ataca (2) | Luffy T2→0 | 21 |
| 3 | Vibra (4s, +1) | 4×1+1=5 dmg | 16 |
| 4 | Rival ataca (2) | Luffy P4→P3 | 16 |
| 5 | Vibra (3s, +2) | 3×1+2=5 dmg | 11 |
| 6 | Rival ataca (2) | Luffy P3→P2 | 11 |
| 7 | Fail | 0 dmg | 11 |
| 8 | Rival ataca (2) | Luffy P2→P1 | 11 |
| 9 | Vibra (1s, +4) | 1×1+4=5 dmg | 6 |
| 10 | Rival ataca (2) | Luffy P1→0 → KO | — |

→ Sin revivir, Luffy cae en turno ~10. Necesita Zoro o invitados.

## Cuántos golpes del corrupto matan a Luffy

Luffy: P4+I1+T2 = 7 Aura. Corrupto daña 2/turno.
- 7 / 2 = 3,5 → **4 golpes** para KO (temple primero, luego P/I aleatorio)

## Conclusión

- **Condiciones óptimas (flows)**: victoria en 3 acciones ofensivas / 5 turnos totales ✓
- **Condiciones medias**: 4-6 acciones ofensivas / 8-12 turnos totales ✓
- **Corrupto mata Luffy**: 4 golpes (sin esquivar) — da margen suficiente
- El rango 4-8 turnos es alcanzable en condiciones normales ✓

## Notas

- Con Zoro (P4 I2 T2) el daño por turno sube, la pelea es más corta
- Ganar Aura por Flow (+2) hace snowball suave si hay flows seguidos
- Corrupto se cura 2/turno si el Foso está vacío — incentiva mantener presión
