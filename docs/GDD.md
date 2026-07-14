# GDD — Aura
## Game Design Document v4.2

---

# PILARES DE DISEÑO

**1. El cronómetro es el juego.**
No es una mecánica dentro de un sistema más grande. Es el sistema. Todo lo demás existe para hacer el cronómetro más interesante, variado y personal.

**2. Un personaje, una historia.**
Cada run es la historia de un solo personaje intentando alcanzar su sincronización perfecta. No hay ejércitos ni turnos contra un rival. Hay un personaje y el tiempo.

**3. El progreso nunca retrocede.**
Perder una run da menos recompensa, pero nunca quita lo ganado. El grado solo sube. La colección solo crece.

**4. La colección es del jugador.**
El editor es un juego en sí mismo. Sin límites de franquicia ni temática. Tu primo puede estar en el mismo juego que Goku.

**5. Complejidad servida poco a poco.**
Un personaje nuevo empieza con pruebas simples. A medida que sube de grado aparecen nuevos tipos de prueba, modificadores y habilidades disponibles.

**6. Romper el juego es parte del diseño.**
El jugador debe poder encontrar combos que hagan una prueba trivial. Eso no es un bug, es una recompensa por conocer el sistema.

**7. Fallar debe sentirse como casi ganar.**
Tres estados por prueba, no dos. El Residuo Temporal convierte el fracaso en progreso diferido.

---

# SECCIÓN 1: Concepto

## Qué es el juego
Aura es un roguelite de coleccionismo y cronómetro para un jugador. El jugador crea personajes/cartas de cualquier franquicia, universo o invención propia, y los lleva a runs de sincronización: secuencias de pruebas de timing donde el objetivo es demostrar que conoces a tu personaje lo suficiente como para sincronizarte con él.

El loop central: **crear un personaje → hacer runs con él → subirlo de grado → desbloquear nuevas pruebas → repetir hasta grado 10.**

No hay enemigos. No hay combate por turnos. Hay un personaje y el cronómetro.

## Por qué es adictivo
Tres capas de progreso entrelazadas:

| Tipo | Qué sube | Picador |
|---|---|---|
| **Corto** (esta run) | Vidas, Ecos, racha de pruebas, Residuos Temporales | "Si acierto esta, llego a la 10 con 2 vidas y activo mi combo" |
| **Medio** (este personaje) | Grado (1-10), récord modo infinito, coronas | "Mi personaje está a 1 run del grado 10, necesito la corona dorada" |
| **Largo** (colección) | Nivel de Coleccionista, números de Aura ocupados (00-99), habilidades desbloqueadas | "Solo me falta el 99 para completar la colección; el 99 desbloquea el Editor de Pruebas" |

El pico adictivo ocurre cuando las tres se alinean: run de subida de grado + número de Aura estratégico + combo de Ecos activable.

---

# SECCIÓN 2: El Personaje / Carta

Cada personaje tiene exactamente **4 elementos definidos al crearlo**:

| Campo | Descripción |
|---|---|
| **Imagen** | Foto, ilustración o placeholder. Visual de la carta. |
| **Nombre** | Nombre del personaje. Libre. |
| **Habilidad** | 1 habilidad especial (pasiva o activa). Única — ningún otro personaje de la colección puede tener la misma. |
| **Habilidad Aura** | Efecto que se activa cuando el cronómetro para en X.NN, donde NN es el número de Aura del personaje. |

## El Número de Aura
Cada personaje tiene un **número de Aura del 00 al 99**, asignado al crearlo. Es único en la colección — no puede haber dos personajes con el mismo número. Esto limita la colección a **100 personajes activos** como máximo.

Si el jugador quiere crear un personaje con un número ya ocupado, debe **archivar** el personaje anterior primero. Los personajes archivados conservan su historial, grado y stats, pero liberan su número de Aura.

**Cómo funciona en la run:** si el cronómetro para en cualquier momento donde las centésimas coinciden con el número de Aura del personaje (ej: Aura 47 → parar en 0.47, 1.47, 2.47...), se activa la Habilidad Aura. Es un bonus de oportunidad, no garantizado — el jugador puede intentar buscarlo deliberadamente o ignorarlo y jugar a lo seguro.

## Grado
> → Reemplazado en v4.1 por la sección **Niveles de Prueba y Sincronía**. El grado deja de fijar la config de las pruebas; pasa a ser un número derivado del estado de pistas del personaje. La redacción histórica de la tabla y Run de Misericordia se mantiene como referencia.

El grado va del **1 al 10**. Sube completando runs. Cada grado mejora visualmente la carta y desbloquea tipos de prueba más difíciles y variados.

| Grado | Desbloqueo | Dificultad | Sensación |
|---|---|---|---|
| 1–2 | Familias 4.1 básico + 4.5 básico | Margen ±10 cs, 3 vidas | "Lo entiendo, es fácil" |
| 3 | Primera Pared | Margen ±7 cs, aparece Cadena | "Esto se complica" |
| 4–5 | Familias 4.2 (Predicción) + 4.4 (Percepción Alterada) | Margen ±7 cs, velocidad 1.0x | "Hay pruebas que no entiendo aún" |
| 6 | Segunda Pared | Margen ±5 cs, prueba 10 siempre peso 7+ | "Necesito un personaje bueno" |
| 7–8 | Familias 4.3 (Ritmo) + 4.6 (Pacto) | Margen ±5 cs, velocidad 1.1x | "Mi build importa" |
| 9 | Tercera Pared | Margen ±3 cs, 2 vidas iniciales, sin Ecos de curación en pool | "Solo mi personaje favorito puede pasar esto" |
| 10 | Sincronía Perfecta | Configuración máxima | "Lo he conseguido" |

### Run de Misericordia
Si el jugador falla 3 runs seguidas en el mismo grado (ej: grado 9), la siguiente run activa la **Run de Misericordia**: la prueba 10 se fuerza a ser una prueba donde el personaje tiene habilidad pasiva bonus. No es victoria garantizada, pero elimina la prueba más difícil posible. Se resetea al subir de grado.

---

# SECCIÓN 3: La Run

Una run es una secuencia de **10 pruebas** con un solo personaje elegido.

- Las pruebas se eligen aleatoriamente del **banco de pruebas activo** según el grado del personaje
- La **prueba 10** es siempre la de mayor peso de dificultad disponible para ese grado
- El jugador empieza con **3 vidas** (2 en grado 9+)
- Fallar una prueba = −1 vida
- Llegar a 0 vidas = run terminada (recompensa reducida, pero se guardan Residuos Temporales)
- Completar las 10 pruebas = **run completada** → corona en la carta + subida de grado + Lereles

## Tres Estados por Prueba

| Estado | Condición | Recompensa |
|---|---|---|
| **Sincronía Perfecta** | Dentro del margen estricto (50% del margen normal) | +1 vida (máx 5), +50% Lereles, activa Habilidad Aura si coincide |
| **Acierto** | Dentro del margen normal | Progresa normal, Lereles base |
| **Fallo** | Fuera del margen | −1 vida, +1 Residuo Temporal |

## Residuo Temporal
Cada fallo genera un fragmento de tiempo roto. **3 Residuos = en la siguiente run, la prueba 1 se supera automáticamente** (sin Sincronía Perfecta, sin bonus). Los Residuos se resetean al completar una run o al archivar el personaje. No se pueden farmear intencionadamente: solo se ganan en runs reales, no en modo práctica.

## Modo Infinito
Tras completar la prueba 10, el jugador puede continuar. Las pruebas se vuelven progresivamente más difíciles (velocidad +0.05x cada 5 pruebas, margen −1 cs cada 10). El modo termina al perder todas las vidas. La puntuación se guarda como récord del personaje.

## Entre Pruebas: Ecos
Cada 3 pruebas superadas, el jugador elige 1 Eco de 3 opciones aleatorias. Máximo **5 Ecos activos** por run. Se resetean al acabar la run.

---

# SECCIÓN 4: El Banco de Pruebas

20 pruebas parametrizables organizadas en 6 familias mecánicas. Cada prueba tiene parámetros escalables por grado y un **peso de dificultad** calculado automáticamente.

## 4.1 Sistema de Pesos de Dificultad

Fórmula base: `PESO = base + modificadores`

| Modificador | Valor |
|---|---|
| Margen ≤ 3 cs | +3 |
| Margen 4-5 cs | +2 |
| Velocidad ≥ 1.2x | +2 |
| Velocidad 1.1x | +1 |
| Sin información visual | +2 |
| Información parcial | +1 |
| Objetivos múltiples (cada uno) | +1 |
| Tiempo límite < 30s | +1 |
| Intentos = 1 | +1 |

La prueba 10 siempre se selecciona del subconjunto con peso ≥ 7 disponible para ese grado.

---

## 4.2 Familia: Cronómetro Clásico

### 1. Bingo a Tiempo
Aparecen N números objetivo en pantalla simultáneamente. Tiempo límite para parar el cronómetro en cada uno. Cada acierto tacha el número.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Números objetivo | 3 | 5 | 6 | 8 |
| Tiempo límite | 60s | 45s | 40s | 30s |
| Margen | ±10 cs | ±7 cs | ±5 cs | ±3 cs |
| Velocidad | 1.0x | 1.0x | 1.1x | 1.2x |
| Fantasmas | 0 | 0 | 1 | 2 |
| Presentación | Todos a la vez | Todos a la vez | Todos a la vez | Todos a la vez |
| Peso base | 3 | 5 | 7 | 10 |

**Configuración:** números objetivo (int), margen (cs), tiempo límite (s), velocidad (float), fantasmas (int), modo secuencial (bool).

**Habilidad Pasiva:** "Tachar un número revela el siguiente más cercano durante 1s"
**Habilidad Activa:** "Congelar todos los números 3s (cronómetro sigue, números no desaparecen)"
**Habilidad Aura:** "Tachar un número en X.NN tacha automáticamente el número más cercano"

---

### 2. X Oportunidades
N números en línea de tiempo. Cronómetro 0→10s. Cada número desaparece al pasar. Parar en al menos M antes del final.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Números generados | 3 | 4 | 5 | 6 |
| Aciertos requeridos | 1 | 1 | 2 | 2 |
| Margen | ±8 cs | ±5 cs | ±4 cs | ±2 cs |
| Velocidad | 1.0x | 1.0x | 1.1x | 1.2x |
| Visibilidad | Siempre | Siempre | Parpadea | Invisible tras 3s |
| Peso base | 2 | 4 | 6 | 9 |

**Configuración:** números generados, aciertos requeridos, duración máxima, margen, velocidad, visibilidad (siempre/parpadeo/invisible).

**Pasiva:** "Objetivos permanecen visibles 0.5s extra tras pasar el tiempo"
**Activa:** "Retroceder cronómetro 1s (una vez por prueba)"
**Aura:** "Si paras en X.NN, el siguiente objetivo visible no desaparece nunca"

---

### 3. Suma 100
Parar suma el valor del segundo actual al marcador. Objetivo: exactamente 100 antes del límite. Superar 100 = reset.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Tiempo límite | 90s | 75s | 60s | 45s |
| Resets permitidos | 3 | 2 | 1 | 0 |
| Velocidad | 1.0x | 1.0x | 1.1x | 1.2x |
| Valor reset | 0 | 25 | 50 | 75 |
| Peso base | 2 | 4 | 6 | 8 |

**Configuración:** objetivo (default 100), tiempo límite, resets permitidos, valor reset, velocidad.

**Pasiva:** "Al pasarse de 100, marcador va a 75 en lugar de 0"
**Activa:** "Dividir valor actual del marcador entre 2 (redondear hacia arriba)"
**Aura:** "Parar en X.NN suma 10 extra al marcador, sin importar el segundo"

---

### 4. Cadena
5 sub-objetivos seguidos. Cada acierto activa el siguiente con menos tiempo. Fallar uno rompe la cadena.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Eslabones | 3 | 4 | 5 | 5 |
| Tiempo por eslabón | 15s | 12s | 10s | 8s |
| Margen | ±10 cs | ±7 cs | ±5 cs | ±3 cs |
| Velocidad | 1.0x | 1.0x | 1.1x | 1.2x |
| Peso base | 3 | 5 | 7 | 10 |

**Configuración:** eslabones, tiempo por eslabón, margen, velocidad, penalización por fallo (romper/continuar).

**Pasiva:** "Fallar un eslabón no rompe la cadena, añade +2s al siguiente"
**Activa:** "Repetir el eslabón fallido gratis"
**Aura:** "Aciertas el eslabón actual si paras en X.NN, sin importar el objetivo real"

---

### 5. Memoria
Paras una vez. No ves el resultado. Delay. Vuelve a correr. Debes parar en el mismo valor.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Delay | 3s | 4s | 5s | 6s |
| Margen | ±10 cs | ±7 cs | ±5 cs | ±3 cs |
| Velocidad repetición | 1.0x | 1.0x | 1.1x | 1.2x |
| Visibilidad inicial | 2s | 1s | Invisible | Invisible + velocidad variable |
| Peso base | 3 | 5 | 7 | 10 |

**Configuración:** delay, margen, velocidad repetición, visibilidad inicial.

**Pasiva:** "El valor queda visible 1s extra tras la primera parada"
**Activa:** "Revelar el valor guardado 1s en mitad del delay"
**Aura:** "Si paras en X.NN en la repetición, cuenta como acierto aunque no sea el valor original"

---

### 6. Ciego
Cronómetro corre. A los 2s la pantalla se oscurece. Solo feedback auditivo (ticks). Parar en el objetivo.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Tiempo visible inicial | 3s | 2s | 1.5s | 1s |
| Duración total | 10s | 10s | 12s | 15s |
| Margen | ±10 cs | ±7 cs | ±5 cs | ±3 cs |
| Frecuencia tick | 0.1s | 0.2s | 0.3s | 0.5s |
| Peso base | 4 | 6 | 8 | 11 |

**Configuración:** tiempo visible, duración, margen, frecuencia tick, tono audio.

**Pasiva:** "Ticks cada 0.1s (ignora frecuencia de grado), pantalla no oscurece hasta 4s"
**Activa:** "Iluminar pantalla 1s"
**Aura:** "Parar en X.NN en Ciego revela pantalla 2s y da visión normal del siguiente objetivo"

---

### 7. Péndulo
Cronómetro va y vuelve (0→10→0→10...). Objetivo puede estar en cualquier pasada. Parar en cualquier dirección.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Pasadas máximas | 3 | 4 | 5 | 6 |
| Velocidad ida | 1.0x | 1.0x | 1.1x | 1.2x |
| Velocidad vuelta | 0.8x | 1.0x | 1.1x | 1.3x |
| Margen | ±10 cs | ±7 cs | ±5 cs | ±3 cs |
| Peso base | 3 | 5 | 7 | 10 |

**Configuración:** rango, pasadas, velocidad ida, velocidad vuelta, margen, dirección inicial.

**Pasiva:** "Flecha indica dirección actual del cronómetro"
**Activa:** "Invertir dirección del péndulo a voluntad (una vez)"
**Aura:** "Parar en X.NN durante ida cuenta también en vuelta (doble oportunidad)"

---

## 4.3 Familia: Predicción y Duración

### 8. Cuenta Interna
Pantalla oscura. Sonido inicio. Debes reproducir sonido final exactamente X segundos después. Sin referencia visual.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Duración objetivo | 3s | 5s | 7s | 10s |
| Margen | ±0.50s | ±0.30s | ±0.20s | ±0.10s |
| Audio inicial | Sí | Sí | No (tú inicias) | No + ruido fondo |
| Intentos | 3 | 2 | 2 | 1 |
| Peso base | 3 | 5 | 7 | 10 |

**Configuración:** duración objetivo, margen, audio inicial, ruido, intentos.

**Pasiva:** "Pulso muy sulte (háptico/visual mínimo) marca cada segundo durante oscuridad"
**Activa:** "Revelar tiempo objetivo 0.5s antes de empezar"
**Aura:** "Si tu estimación cae en X.NN (cualquier segundo), margen se triplica"

---

### 9. Cadencia Fantasma
Objeto invisible se mueve a velocidad constante por circuito. Ves inicio y final. Clicar cuando crees que llega a meta.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Distancia (tiempo) | 4s | 6s | 8s | 10s |
| Perfil velocidad | Constante | Constante | Aceleración suave | Acel + frenada |
| Margen | ±0.40s | ±0.25s | ±0.15s | ±0.10s |
| Rastro | 0.5s | 0.3s | Sin rastro | Sin rastro + distractor |
| Peso base | 3 | 5 | 7 | 10 |

**Configuración:** duración trayecto, perfil velocidad, margen, rastro, distractores.

**Pasiva:** "Rastro del objeto dura 1s completo"
**Activa:** "Revelar trayectoria completa 2s antes de empezar"
**Aura:** "Clicar en X.NN segundos del inicio (tu Aura como décimas, ej: 4.7s si Aura 47) cuenta como acierto perfecto"

---

### 10. Carga de Energía
Mantén pulsado para cargar. Suelta cuando creas que has cargado X segundos. Barra visual deliberadamente no lineal.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Tiempo objetivo | 3s | 5s | 7s | 10s |
| Curva barra | Lineal | No lineal suave | No lineal + oscilaciones | Invisible tras 2s |
| Margen | ±0.50s | ±0.30s | ±0.20s | ±0.10s |
| Penalización | Reset | Reset | −1 vida | Fail directo |
| Peso base | 2 | 4 | 6 | 9 |

**Configuración:** tiempo objetivo, curva barra, margen, visibilidad, penalización.

**Pasiva:** "Barra es lineal siempre, ignora curva engañosa"
**Activa:** "Barra muestra valor real de tiempo cargado 2s"
**Aura:** "Soltar en X.NN% de la barra (tu Aura como porcentaje) cuenta como acierto exacto"

---

## 4.4 Familia: Ritmo y Sincronización

### 11. Eco Visual
3 luces parpadean en secuencia. Tras 3 ciclos, se apagan. Reproducir el ritmo exacto clicando.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Luces | 3 | 3 | 4 | 5 |
| Ciclos muestra | 3 | 2 | 2 | 1 |
| Intervalo base | 1.0s | 0.8s | 0.6s | 0.5s |
| Margen tempo | ±0.20s | ±0.15s | ±0.10s | ±0.07s |
| Visibilidad | Luces visibles | Luces visibles | Luces invisibles | Invisibles + tempo cambia |
| Peso base | 3 | 5 | 7 | 10 |

**Configuración:** luces, ciclos, intervalo base, margen tempo, visibilidad, variación tempo.

**Pasiva:** "Luces dejan rastro fantasma 0.5s"
**Activa:** "Repetir secuencia de muestra una vez más"
**Aura:** "Clicar en ritmo de X.NN segundos (tu Aura como intervalo, ej: 0.47s) durante 3 ciclos = perfecto"

---

### 12. Poliritmo
Dos patrones de sonido simultáneos. Clicar exactamente cuando coinciden.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Patrones | 2 | 2 | 3 | 3 |
| Intervalo A | 0.8s | 0.7s | 0.6s | 0.5s |
| Intervalo B | 1.2s | 1.1s | 1.0s | 0.9s |
| Duración total | 10s | 12s | 15s | 18s |
| Margen | ±0.25s | ±0.20s | ±0.15s | ±0.10s |
| Peso base | 4 | 6 | 8 | 11 |

**Configuración:** patrones, intervalos, duración, margen, audio, visual.

**Pasiva:** "Indicador visual sutil marca próxima coincidencia 1s antes"
**Activa:** "Pausar ambos patrones 3s para calcular"
**Aura:** "Si coincidencia ocurre en X.NN segundos (cualquier segundo), margen se duplica"

---

### 13. Sincronía de Fase
Círculo gira. Clicar cuando punto móvil pasa por punto fijo. Giro no constante.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Revoluciones | 2 | 3 | 4 | 5 |
| Perfil velocidad | Constante | Suave acel | Acel/frenada brusca | Aleatorio cada vuelta |
| Margen angular | ±15° | ±10° | ±7° | ±5° |
| Visual | Círculo completo | Círculo completo | Solo arco visible | Arco + fondo en movimiento |
| Peso base | 3 | 5 | 7 | 10 |

**Configuración:** revoluciones, perfil velocidad, margen angular, visibilidad círculo, distractores.

**Pasiva:** "Línea de predicción muestra dónde estará el punto en 1s"
**Activa:** "Ralentizar rotación al 25% durante 3s"
**Aura:** "Parar en X.NN (tu Aura como décimas de segundo del ciclo) frena rotación 2s y permite reintentar gratis"

---

## 4.5 Familia: Percepción Alterada

### 14. Rebote
Tu clic no para el cronómetro inmediatamente: delay configurable tras soltar. Debes compensar.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Delay | Fijo 0.50s | Fijo 0.50s | Aleatorio 0.3-0.7s | Aleatorio 0.2-0.8s |
| Información delay | Mostrado | Mostrado | Oculto hasta clic | Oculto + cambia cada 2s |
| Margen | ±10 cs | ±7 cs | ±5 cs | ±3 cs |
| Velocidad | 1.0x | 1.0x | 1.1x | 1.2x |
| Peso base | 4 | 6 | 8 | 11 |

**Configuración:** delay, rango delay, información, margen, velocidad.

**Pasiva:** "Delay se muestra como línea de guía en pantalla (ves dónde realmente parará)"
**Activa:** "Anular delay durante siguiente parada"
**Aura:** "Parar en X.NN ignora el delay por completo (cronómetro para exactamente donde clicaste)"

---

### 15. Espejo
Cronómetro corre hacia atrás (10.00→0.00). Parar en objetivo leyendo tiempo invertido.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Inicio | 5.00 | 8.00 | 10.00 | 15.00 |
| Velocidad | 1.0x | 1.0x | 1.1x | 1.2x |
| Margen | ±10 cs | ±7 cs | ±5 cs | ±3 cs |
| Visual números | Normales | Invertidos | Espejo + invertidos | Espejo + invertidos + velocidad variable |
| Peso base | 3 | 5 | 7 | 10 |

**Configuración:** inicio, dirección, visualización números, velocidad, margen.

**Pasiva:** "Números se muestran en ambas direcciones (normal + invertido)"
**Activa:** "Revertir dirección del tiempo 3s (vuelve a correr normal)"
**Aura:** "Parar en X.NN en dirección inversa cuenta como acierto en ambas direcciones"

---

### 16. Parpadeo
Cronómetro solo se ve 0.3s cada 1.5s. Parar en objetivo visible durante destellos.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Duración visible | 0.5s | 0.3s | 0.2s | 0.15s |
| Duración oculto | 1.5s | 1.5s | 2.0s | 2.5s |
| Margen | ±10 cs | ±7 cs | ±5 cs | ±3 cs |
| Velocidad | 1.0x | 1.0x | 1.1x | 1.2x |
| Movimiento objetivo | Fijo | Fijo | Se mueve cada visión | Se mueve + fantasmas |
| Peso base | 4 | 6 | 8 | 11 |

**Configuración:** duración visible, duración oculto, margen, velocidad, movimiento objetivo, fantasmas.

**Pasiva:** "Destellos duran 2x (0.6s en lugar de 0.3s en grado alto)"
**Activa:** "Forzar destello extra a voluntad"
**Aura:** "Parar en X.NN durante destello mantiene pantalla visible 3s más"

---

## 4.6 Familia: Acumulación y Control

### 17. Equilibrio
Empiezas en 50. Parar suma segundo actual. Si paras en impar, resta. Mantenerse entre min-max durante X segundos. Tocar 0 o 100 = fail.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Valor inicial | 50 | 50 | 50 | 50 |
| Rango seguro | 40-60 | 45-55 | 47-53 | 48-52 |
| Duración | 30s | 30s | 25s | 20s |
| Velocidad | 1.0x | 1.0x | 1.1x | 1.2x |
| Regla par/impar | Impar resta | Impar resta x2 | Par resta, impar suma | Alterna cada 5s |
| Peso base | 3 | 5 | 7 | 10 |

**Configuración:** valor inicial, rango seguro, duración, velocidad, regla transformación.

**Pasiva:** "Rango seguro es 2 puntos más ancho en cada lado"
**Activa:** "Congelar valor actual 5s (no suma ni resta)"
**Aura:** "Parar en X.NN (tu Aura como valor, ej: 47) fija marcador en 50 durante 3s"

---

### 18. Banca
N paradas. Cada una guarda valor del segundo actual en slot. Al final, suma debe estar en rango. No ves slots hasta final.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Paradas | 5 | 5 | 4 | 3 |
| Rango objetivo | 80-120 | 90-110 | 95-105 | 98-102 |
| Tiempo límite | 60s | 50s | 40s | 30s |
| Velocidad | 1.0x | 1.0x | 1.1x | 1.2x |
| Descartes | Ilimitados | 2 | 1 | 0 |
| Peso base | 3 | 5 | 7 | 10 |

**Configuración:** paradas, rango objetivo, tiempo límite, velocidad, descartes, visibilidad slots.

**Pasiva:** "Puedes ver el último slot guardado"
**Activa:** "Descartar slot sin penalización (una vez extra)"
**Aura:** "Slot guardado en posición X.NN (tu Aura como posición, ej: 4+7=11→slot 1) se revela y puedes ajustarlo"

---

### 19. Doble o Nada
Paras una vez. Decides: quedarte o volver a parar (se suman). Superar 10.00 = fail. Objetivo: acercarte a 9.99.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Paradas máximas | 3 | 3 | 2 | 2 |
| Límite explosión | 8.00 | 9.00 | 10.00 | 10.00 |
| Objetivo ideal | 7.50 | 8.50 | 9.50 | 9.99 |
| Margen | ±0.50 | ±0.30 | ±0.15 | ±0.05 |
| Velocidad | 1.0x | 1.0x | 1.1x | 1.2x |
| Peso base | 2 | 4 | 6 | 9 |

**Configuración:** paradas máximas, límite explosión, objetivo ideal, margen, velocidad, penalización.

**Pasiva:** "Puedes retirarte tras segunda parada sin penalización"
**Activa:** "Dividir valor actual entre 2 (redondea hacia abajo)"
**Aura:** "Parar en X.NN en cualquier parada bloquea la explosión (puedes seguir sumando sin límite esa vez)"

---

## 4.7 Familia: Azar y Estrategia

### 20. Pacto
Juego elige número objetivo secreto. Tú propones un rango. Cronómetro corre y para solo. Si cae en tu rango, ganas. Cada rango propuesto cuesta "monedas de confianza". Rangos anchos = más coste.

| Parámetro | Grado 1-3 | Grado 4-6 | Grado 7-9 | Grado 10 |
|---|---|---|---|---|
| Monedas iniciales | 5 | 4 | 3 | 2 |
| Coste base por rango | 1 por cada 2.00s | 1 por cada 1.50s | 1 por cada 1.00s | 1 por cada 0.75s |
| Velocidad | 1.0x | 1.0x | 1.1x | 1.2x |
| Información | Ninguna | Color frío/cálido | Color + dirección | Color + dirección + velocidad aprox |
| Intentos | 3 | 2 | 2 | 1 |
| Peso base | 3 | 5 | 7 | 10 |

**Configuración:** monedas iniciales, coste por amplitud, velocidad, información disponible, intentos, duración roll.

**Pasiva:** "+1 moneda de confianza inicial"
**Activa:** "Revelar objetivo secreto 1s (una vez por prueba)"
**Aura:** "Si objetivo secreto está en rango X.NN a X.NN+1.00 (tu Aura como inicio), autowin sin gastar monedas"

---

# SECCIÓN 5: Sistema de Habilidades

## 5.1 Estructura
Cada personaje tiene:
- **1 Habilidad Pasiva:** Siempre activa durante la run. Afecta 1-3 pruebas específicas o mecánicas generales.
- **1 Habilidad Activa:** Usable una vez por run. Botón dedicado en UI.
- **1 Habilidad Aura:** Se activa al parar en X.NN (tu número de Aura).

**Regla de unicidad:** Ningún otro personaje de la colección puede tener la misma combinación de habilidades. Pueden compartir el *efecto* si afecta pruebas distintas (ej: "+5 cs en Bingo" y "+5 cs en Ciego" son habilidades diferentes).

## 5.2 Pool de Habilidades Base (ejemplos por familia)

### Pasivas Generales (disponibles para cualquier personaje)
- "+1 vida al empezar la run"
- "Margen de acierto +5 centésimas en todas las pruebas"
- "Tiempo límite +10 segundos en todas las pruebas"
- "El primer fallo de cada run no quita vida"
- "Residuos Temporales se generan con 2 fallos en lugar de 3"

### Pasivas Específicas (una por prueba, ver Sección 4)
Cada una de las 20 pruebas tiene su propia habilidad pasiva que la rompe. Ver tablas de cada prueba en Sección 4.

### Activas Generales
- "Reducir velocidad del cronómetro al 50% durante 5s"
- "Ver objetivos de próxima prueba 3s antes de empezar"
- "Repetir prueba actual sin perder vida"
- "+15s al tiempo límite de prueba actual"
- "Convertir siguiente fallo en prueba superada (sin bonus)"

### Activas Específicas (una por prueba)
Ver tablas en Sección 4.

### Habilidades Aura Generales
- "Recuperar 1 vida"
- "Activar habilidad activa gratis (sin gastar uso)"
- "El siguiente eco es de rareza superior"
- "+5s al tiempo límite de prueba actual"
- "La próxima prueba cuenta como superada automáticamente si lo consigues 2 veces en la misma run"

### Habilidades Aura Específicas (una por prueba)
Ver tablas en Sección 4.

## 5.3 Desbloqueo de Habilidades
- Nivel de Coleccionista 1: Pool básico (10 habilidades pasivas, 5 activas, 5 auras)
- Nivel 5: Se desbloquean habilidades específicas de Familias 4.1 y 4.5
- Nivel 10: Se desbloquean habilidades específicas de Familias 4.2, 4.3, 4.4
- Nivel 15: Se desbloquean habilidades específicas de Familia 4.6 + Editor de Pruebas
- Nivel 20: Pool completo (60+ habilidades pasivas, 30+ activas, 30+ auras)

---

# SECCIÓN 6: Sistema de Ecos

## 6.1 Obtención
Cada 3 pruebas superadas, elige 1 Eco de 3 opciones aleatorias. Máximo 5 Ecos activos por run.

## 6.2 Pool de Ecos

### Ecos Básicos (siempre disponibles)
- "Segunda oportunidad": próximo fallo no quita vida
- "Ralentizador": próxima prueba, cronómetro al 75%
- "Objetivo ampliado": próxima prueba, margen de acierto se duplica
- "Vista previa": ves objetivos 3s antes de que empiece la próxima prueba
- "Tiempo extra": +10s a todas las pruebas restantes

### Ecos Avanzados (desbloquean grado 5+)
- "Ojo clínico": en Ciego, pantalla no se oscurece; en Parpadeo, destellos duran 2x
- "Pulso interno": en Cuenta Interna, metrónomo suave durante estimación
- "Seguro": en Doble o Nada, retirarte sin penalización tras segunda parada
- "Radar": en Pacto, ves si objetivo está por encima o debajo de tu rango
- "Cadena dorada": en Cadena, fallar un eslabón no rompe, solo añade +1s
- "Memoria fotográfica": en Memoria, valor guardado parpadea una vez durante delay
- "Espejo roto": en Espejo, números se muestran correctos 50% del tiempo
- "Fantasma visible": en Cadencia Fantasma, objeto es semi-transparente

### Ecos Legendarios (rareza superior, 5% de aparición)
- "Sincronía perfecta": próxima prueba, cualquier parada en X.NN (tu Aura) cuenta como Sincronía Perfecta
- "Tiempo roto": próxima prueba, el cronómetro corre al 50% pero el margen se triplica
- "Eco del pasado": próximo Eco que elijas se duplica (ocupa 1 slot, efecto x2)
- "Último aliento": si llegas a 0 vidas, recuperas 1 vida (una vez por run)

---

# SECCIÓN 7: Sistema de Combos y Roturas Legendarias

## 7.1 Filosofía
"Romper el juego" no es un bug, es una recompensa por conocimiento profundo del sistema. Los combos requieren:
1. Personaje con habilidad específica para una prueba
2. Ecos que sinergicen con esa prueba
3. Activación de Habilidad Aura en el momento correcto

## 7.2 Ejemplos de Combos Legendarios

### Combo "El Fantasma del Tiempo"
- **Personaje:** Habilidad pasiva "En Memoria, el valor queda visible 1s extra"
- **Ecos:** Vista previa + Tiempo extra + Segunda oportunidad
- **Resultado:** En Memoria grado 10, ves el valor 1s extra, tienes 10s más de delay, y si fallas el reintento no pierdes vida. Prueba trivial, pero gastaste 3/5 Ecos.

### Combo "El Banquero"
- **Personaje:** Pasiva "En Banca, puedes ver el último slot guardado" + Activa "Revelar slot aleatorio" + Aura "Slot en posición X.NN se revela y ajusta"
- **Eco:** Seguro (descarte gratis)
- **Resultado:** Con 3 paradas y visibilidad parcial, calculas matemáticamente el rango. En grado 10 (rango 98-102), este combo convierte azar en cálculo puro.

### Combo "El Pacto con el Diablo"
- **Personaje:** Pasiva "+1 moneda" + Activa "Revelar objetivo" + Aura "Si objetivo en X.NN a X.NN+1.00, autowin"
- **Ecos:** Radar + Segunda oportunidad
- **Resultado:** Tienes 3 monedas, sabes el objetivo, y si tu Aura es 47, el rango 4.47-5.47 es autowin. Si el objetivo es 7.20, usas Radar para saber que está por encima, gastas monedas en rangos estrechos hacia arriba.

### Combo "El Ciego que Ve"
- **Personaje:** Pasiva "En Ciego, ticks cada 0.1s y pantalla no oscurece hasta 4s"
- **Ecos:** Ojo clínico + Ralentizador + Tiempo extra
- **Resultado:** En Ciego grado 10, la prueba más difícil se vuelve trivial. Pero has gastado 3 Ecos y tu pasiva solo funciona en esta prueba. ¿Vale la pena? Depende del pool restante.

### Combo "El Equilibrista"
- **Personaje:** Pasiva "Rango seguro +2 en cada lado" + Activa "Congelar valor 5s" + Aura "Parar en X.NN fija marcador en 50 durante 3s"
- **Ecos:** Tiempo extra + Objetivo ampliado
- **Resultado:** En Equilibrio grado 10 (rango 48-52), tu rango efectivo es 46-54. Congelas en 50 durante 5s. Paras en tu Aura (ej: 4.47) y el marcador se fija en 50. Tienes 8s de seguridad absoluta en una prueba de 20s.

## 7.3 Balanceo de Combos
- Ningún combo debe funcionar en más de 2-3 pruebas del pool de 20.
- Ningún combo debe garantizar victoria en la run completa, solo en una prueba concreta.
- El coste de oportunidad (Ecos gastados, habilidad activa usada) debe ser real.
- Los combos legendarios deben requerir Nivel de Coleccionista 10+ para acceder al pool completo de habilidades y Ecos.

---

# SECCIÓN 8: Meta-progresión

## 8.1 Nivel de Coleccionista
Sube creando personajes y completando runs.

| Nivel | Desbloqueo |
|---|---|
| 1 | Pool básico de habilidades y Ecos. Familias 4.1 y 4.5 en banco. |
| 5 | Familias 4.2 (Predicción) y 4.4 (Percepción Alterada). Habilidades específicas de estas familias. |
| 10 | Familias 4.3 (Ritmo) y 4.6 (Pacto). Ecos avanzados. Modo Infinito desbloqueado. |
| 15 | **Editor de Pruebas**: crear configuraciones personalizadas de pruebas desbloqueadas. Guardar 5 configs por familia. Compartir desafíos entre jugadores. |
| 20 | Pool completo. Ecos legendarios en pool. Desafíos diarios con recompensas exclusivas. |
| 25 | Modo "Sincronía Perfecta": runs donde TODAS las pruebas son grado 10. Sin Ecos. Solo habilidad del personaje. Récords globales. |
| 50 | "Maestro del Tiempo": título exclusivo. Skin dorada para cartas. Acceso a beta de nuevas pruebas. |
| 100 | "Aura Completa": todos los números 00-99 ocupados al menos una vez. Recompensa final: personaje secreto con habilidad "Cualquier número de Aura". |

## 8.2 Grado del Personaje (1-10)
- Sube completando runs.
- Mejora visual de la carta (borde, efectos, animación).
- Desbloquea dificultad máxima disponible.
- Grado 10: acabado visual completo (dorado, partículas, sonido único).

## 8.3 Récords
- Mejor puntuación en Modo Infinito por personaje.
- Racha máxima de runs completadas consecutivas.
- Colección de coronas (1 por grado alcanzado, máx 10 por personaje).
- Tiempo total de sincronización perfecta acumulado.

## 8.4 Colección de Números de Aura
Visualización de los 100 slots (00-99):
- **Ocupado:** personaje activo con ese número.
- **Archivado:** personaje guardado, número libre.
- **Libre:** disponible para nuevo personaje.
- **Coronado:** grado 10 alcanzado en ese número.

Completar rangos (00-09, 10-19...) desbloquea paletas de color para el editor de cartas.

---

# SECCIÓN 9: Economía y Recompensas

## 9.1 Lereles (moneda base)
- Ganas al completar pruebas (base) y runs (bonus).
- Cantidad escalada por: grado del personaje, Sincronías Perfectas, racha de aciertos.
- Gastos: crear nuevos personajes (coste base + coste por número de Aura, los números "redondos" 00, 11, 22... cuestan más), reactivar personajes archivados, comprar skins visuales.

## 9.2 Fragmentos de Aura (moneda premium)
- Ganas al completar grado 10, al completar colecciones de números, en desafíos diarios.
- Gastos: desbloquear habilidades específicas antes de tiempo, comprar slots de Ecos extra (máx 7 en lugar de 5), re-roll de opciones de Eco.

## 9.3 Residuos Temporales (recurso de compensación)
- No son gastables. Se acumulan automáticamente con fallos.
- 3 Residuos = prueba 1 gratis en siguiente run.
- Visualización: barra de 3 segmentos junto a las vidas.

---

# SECCIÓN 10: Modos de Juego

## 10.1 Run Estándar
10 pruebas, 3 vidas, Ecos cada 3 pruebas. Grado del personaje determina pool y dificultad.

## 10.2 Modo Infinito
Desbloqueado en grado 7 del personaje. Tras prueba 10, continuar opcional. Velocidad +0.05x cada 5 pruebas, margen −1 cs cada 10. Récord por personaje.

## 10.3 Desafío Diario
Personaje predefinido (aleatorio para todos los jugadores). Run única con condiciones especiales (ej: "Solo pruebas de Percepción Alterada", "Sin Ecos", "Velocidad 1.5x fija"). Récords globales. Recompensa: Fragmentos de Aura.

## 10.4 Modo Sincronía Perfecta (Nivel Coleccionista 25)
Todas las pruebas son grado 10. Sin Ecos. Solo habilidad del personaje. 1 vida. Récords globales por tiempo de completación.

## 10.5 Modo Práctica
Sin vidas, sin recompensas. Probar cualquier prueba desbloqueada con cualquier configuración. Para practicar sin riesgo. No genera Residuos Temporales.

---

# SECCIÓN 11: Interfaz de Usuario

## 11.1 Pantalla Principal
- Colección de personajes (grid 10x10 de números de Aura).
- Personaje seleccionado destacado.
- Botón "Nueva Run", "Modo Infinito", "Desafío Diario", "Práctica".
- Barra de progreso de Nivel de Coleccionista.
- Notificaciones: Residuos Temporales disponibles, desafíos activos, personajes archivables.

## 11.2 Durante la Run
- Cronómetro central grande.
- Vidas arriba izquierda (corazones).
- Residuos Temporales arriba derecha (fragmentos de reloj, 0-3).
- Ecos activos abajo (iconos pequeños, hover para descripción).
- Habilidad activa: botón grande, cooldown visual si ya usada.
- Prueba actual: nombre + número (ej: "Ciego — Prueba 6/10").
- Indicador de Aura: brilla sutilmente cuando el cronómetro pasa por X.NN.

## 11.3 Entre Pruebas (Eco)
- Pantalla de pausa con 3 cartas de Eco boca arriba.
- Descripción al hover.
- Si 5 Ecos activos, debe descartar uno antes de elegir.
- Indicador de próxima prueba (nombre, no configuración exacta).

## 11.4 Editor de Pruebas (Nivel 15)
- Lista de pruebas desbloqueadas.
- Sliders para cada parámetro con rangos validados.
- Preview de peso de dificultad en tiempo real.
- Botón "Probar" (lanza práctica con esa config).
- Botón "Guardar" (máx 5 por familia).
- Botón "Compartir" (genera código alfanumérico).

---

# SECCIÓN 12: Audio y Feedback

## 12.1 Principios
- El audio es información, no solo ambientación.
- Cada familia de pruebas tiene paleta sonora distintiva.
- El feedback de fallo nunca es punzante; es "casi".

## 12.2 Feedback por Estado
| Estado | Visual | Audio |
|---|---|---|
| Sincronía Perfecta | Flash dorado, partículas, carta brilla | Campana cristalina + acorde de Aura |
| Acierto | Flash blanco suave | Tick satisfactorio |
| Fallo | Pantalla tiembla levemente, color se desatura 0.5s | Eco reverberante descendente |
| Aura activada | Borde de carta se ilumina, número de Aura parpadea | Arpegio ascendente único por personaje |

## 12.3 Música
- Menú: ambiental, minimalista, tempo variable según hora real del día.
- Run: música generativa que se intensifica según pruebas superadas y vidas restantes.
- Modo Infinito: música que acelera progresivamente (BPM ligado a velocidad del cronómetro).

---

# SECCIÓN 13: Monetización (Opcional)

## 13.1 Modelo Base
Free-to-play con compras cosméticas y de calidad de vida. Nada que afecte habilidad o progreso base.

## 13.2 Compras
- **Pases de temporada:** nuevas skins, efectos de Aura, marcos de carta.
- **Packs de calidad de vida:** +2 slots de personajes archivados, re-roll diario gratis en Ecos.
- **Donación directa:** "Apoya al desarrollador", recompensa: título exclusivo.

## 13.3 Lo que NUNCA se vende
- Habilidades más fuertes.
- Ecos legendarios.
- Fragmentos de Aura (solo se ganan).
- Acceso a pruebas o modos.

---

---

## Niveles de Prueba y Sincronía (v4.2)

### Modelo
- El nivel vive en el personaje, por tipo de prueba y por parámetro.
- Cada prueba tiene 4 parámetros elegibles que suman exactamente 20 pistas-mejora.
- 20 pruebas × 20 pistas = 400 pistas por carta.
- Modelo de datos: probeProgress[probeType] = { [param]: count }. Cada parámetro lleva su cuenta con su tope (cap/steps del catálogo).
- Nivel 1 = todos los parámetros a 0. Cada subida = +1 en el parámetro elegido por el jugador, permanente para esa carta.

### Elección de pista (al superar prueba en run)
- Al superar una prueba en run, aparece la pantalla de elección: se ofrecen los parámetros de esa prueba que aún NO están al tope. El jugador elige 1; ese parámetro sube +1 para esa carta.
- Un parámetro al tope desaparece de la oferta.
- Si los 4 parámetros están al tope (prueba en MAX), no se ofrece nada y la run sigue.

### Sincronía y Grado (derivados)
- % de Sincronía = (suma de pistas) / 400 × 100. Métrica primaria.
- Grado = 1 + floor(pistas / 40), tope 10. (40 pistas por grado.)
- Cristalización (corona) = 400/400 = 100% = cima del Grado 10.
- El Grado deja de fijar la config; sigue como número derivado 1–10 para gating del pool (getProbePool) y presentación. La config de cada prueba se resuelve del probeProgress del personaje al instanciarla.

### Flujo de Run
- Fallar = −1 vida y se repite la MISMA instancia (mismo objetivo/seed). No avanza hasta superar. 0 vidas = fin.
- Desafío Diario: el reintento mantiene el seed.
- Run = 10 pruebas aleatorias totales, con repetición posible. Cada instancia lee el probeProgress vivo del personaje.

### Reglas globales (por defecto; excepciones por prueba)
1. Ayuda visual: nunca por defecto en run; solo vía habilidad/eco. Excepción: Práctica/Banco libremente activable.
2. Margen: solo a objetivos, nunca a la captura del Aura.
3. Capturar el Aura amplía el margen (parpadeo ±2; bingo/espejo/pendulo +1). Alguna prueba puede hacer otra cosa.
4. Nº de paradas configurable (pista). Alguna prueba puede tenerlas fijas o ser de una sola parada.

### Catálogo de pistas — pruebas definidas (4 de 20)

BingoProbe
- Nivel 1: Objetivos 3 · Margen ±3 · Tiempo 20s · Paradas 20.
- Pistas: targets +1→10 (×7) · margin −1→0 (×3) · timeLimitSec −2→10 (×5) · maxStops −2→10 (×5).
- Aura: +1 margen.

EspejoProbe
- Nivel 1: Aciertos 1 · Paradas 16 · Tiempo 10s · Margen ±2.
- Pistas: requiredHits +1→5 (×4) · margin −1→0 (×2) · duration −1→6 (×4) · maxStops −1→6 (×10).
- Aura: +1 margen.

PenduloProbe
- Nivel 1: Vueltas 5 · Duración media vuelta 5s · Paradas 15 · Margen ±2.
- Pistas: swings −1→2 (×3) · swingDuration −1→2 (×3) · margin −1→0 (×2) · maxStops −1→3 (×12).
- Aura: +1 margen.
- Objetivo: instante = N.aura con N en [0, duración−1] (si aura=00, N en [1, duración−1]). Nunca el extremo superior. Barra: extremos muestran enteros 0 y duración.

ParpadeoProbe (MULTI-PARADA)
- Nivel 1: Duración total 10s · Rango 50cs · Paradas 10 · Margen ±3.
- Pistas: totalSec −1→3 (×7) · range [50→25→20→10] (×3) · margin −1→0 (×3) · maxStops −1→3 (×7).
- requiredHits = 1 fijo (NO es pista). Tienes maxStops intentos; basta 1 acierto sobre el objetivo dentro de su ventana apagada. Menos paradas = más difícil.
- Aura: ±2 margen. El Aura es visible para unos personajes y no para otros (diferencia de valor entre cartas).
- Mecanismo: ciclo on/off de tamaño = rango R; el objetivo SIEMPRE cae en ventana OFF. Nivel 1 = R=50 (una sola ventana OFF [x.50,x.00), más fácil); la pista estrecha 50→25→20→10. R=25 → OFF [x.25,x.50) y [x.75,x.00). R=20 → OFF [x.20,x.40) y [x.60,x.80). R=10 → 5 huecos OFF.

### TBD
- Pistas de las 16 pruebas restantes (cada una suma 20).
- Fase A: paredes de grado → hitos de Sincronía cada 40 pistas (no gating). Run de Misericordia → disparador por racha de fallos.
- Pantalla de elección de pista: diseño visual de las opciones.
- Coexistencia con pantalla de ecos (pruebas 3/6): definir si conviven.
- Ficha de carta: pistas por parámetro + barra de % global.

---

*GDD v4.2 — Sistema completo: 20 pruebas, combos legendarios, meta-progresión triple capa, rotura intencional como feature. v4.2 refina el modelo de pistas: probeProgress por parámetro, elección explícita al superar prueba, parpadeo multi-parada con rango invertido. Rama activa: cronometro-core.*
