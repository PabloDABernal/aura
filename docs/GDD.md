# GDD — Aura
## Game Design Document v1.1

---

# PILARES DE DISEÑO

Estos pilares son los principios innegociables del juego. Cuando una idea nueva choque con un pilar, el pilar gana, o se replantea la idea. Sirven de filtro para no perder el rumbo.

**1. El cronómetro es el corazón.**
Toda la tensión nace de "para el cronómetro en el momento justo". Cualquier mecánica nueva debe reforzar esa emoción, no diluirla. Si algo convierte el cronómetro en un trámite repetitivo, se replantea. El jugador siempre debe poder elegir entre la seguridad y el riesgo de la Vibra.

**2. El progreso nunca retrocede.**
El jugador puede perder una run, pero nunca pierde lo aprendido: la experiencia de las cartas, los desbloqueos y los puntos de Coleccionista solo suben. La dificultad viene de lo que está por delante, nunca de castigar lo conseguido.

**3. El tiempo es temático, no real.**
El tiempo de la Vibración solo avanza cuando el jugador se arriesga al cronómetro. Pensar es gratis. La presión viene de arriesgarse mal, no de tardar en decidir.

**4. La colección es del jugador.**
El editor es un juego en sí mismo. El jugador puede dedicarle el tiempo que quiera, crear lo que quiera y romper el juego como quiera. El juego facilita el camino rápido (autorelleno, sets de ejemplo) pero nunca limita al que quiere profundidad.

**5. Complejidad servida poco a poco.**
El vocabulario del juego (keywords, tipos de lugar, atributos) es amplio, pero nunca se sirve de golpe. Se desbloquea progresivamente y siempre con una explicación en el momento de obtenerlo. El novato ve poco, el veterano lo ve todo.

**6. Aura lo unifica todo.**
Aura es el concepto central y siempre visible. Aunque se descomponga en Presencia, Influencia y Temple, el jugador siempre piensa en términos de Aura. Los tres atributos dan profundidad sin romper la identidad del concepto.

**7. Absurdo con cariño.**
Tu primo puede pelear contra Superman y eso está bien. El juego no se ríe de sus piezas, las celebra. El tono es el de un coleccionista apasionado, nunca la parodia.

---

# SECCIÓN 1: Concepto y Lore

## Qué es el juego
Aura es un juego de cartas roguelite para un jugador. El jugador actúa como un **coleccionista** que da vida a sus colecciones enfrentándolas en combates estratégicos. No hay un universo compartido ni una justificación narrativa profunda: la gracia es precisamente que tu primo puede pelear contra Superman, que Walter White puede enfrentarse a Goku, que las figuras del Mundial Italia 90 pueden conquistar Soul Society.

El juego es un **sandbox de coleccionismo** disfrazado de roguelite. Tú decides qué colecciones tienes, quiénes son tus líderes y cómo construyes tus runs.

## El Coleccionista
El jugador es el coleccionista. No hay protagonista visible, no hay avatar. El coleccionista tiene un **nivel global** que sube creando sets, jugando runs y desbloqueando el potencial de sus cartas. Cuanto más juegas y más completa tienes tu colección, mayor es tu nivel de coleccionista.

El objetivo final del coleccionista es tener todas sus cartas al nivel máximo, todos sus sets completos y todas las runs completadas. Es el PSA 10 del mundo digital.

## Los Sets
Un Set es una **colección temática**: puede ser una franquicia (One Piece, Breaking Bad), un equipo (figuras del Mundial Italia 90), un universo propio o literalmente lo que quieras. Cada Set tiene entre 6 y 20 personajes, con al menos 6 para poder jugar (1 líder + 5 invitados mínimo).

El juego viene con Sets de ejemplo genéricos y editables. El jugador puede editar cualquier personaje, crear Sets desde cero, renombrar, cambiar imágenes y modificar habilidades libremente. Si quieres poner la cara de Superman en un personaje genérico, adelante.

La idea de **héroe/villano** dentro de un Set abre la puerta a dinámicas internas (enfrentamientos internos, sinergias entre villanos) que se desarrollarán en futuras versiones.

## El Grado de las Cartas
Cada carta tiene un **grado del 1 al 10**, inspirado en el sistema de gradación del coleccionismo real (PSA, CGC). Una carta recién creada empieza en grado 1: arte básico, sin historia, sin brillo.

A medida que la carta participa en runs y supera combates, su grado sube. El grado se refleja visualmente en la carta: el gradiente, el borde, el acabado mejoran con cada nivel. Una carta en grado 10 tiene el arte completo, el borde dorado y el acabado perfecto.

El nivel de Coleccionista sube 1 punto por cada Set creado y 1 punto adicional por cada nivel que sube cualquier Set. Con 50 sets al nivel máximo (10) el nivel de Coleccionista puede llegar a 500.

## Checkpoints de Run y Progreso
Una run tiene **3 checkpoints**. El progreso ganado depende de hasta dónde llegas, pero **nunca se pierde lo conseguido**:

- **Antes del primer checkpoint:** si abandonas o pierdes, las cartas ganan la experiencia mínima de los combates jugados. No hay castigo, solo poca recompensa
- **Superar el primer checkpoint:** las cartas consolidan experiencia baja
- **Superar el segundo checkpoint:** las cartas consolidan experiencia media
- **Completar la run entera:** experiencia alta, bonus de grado extra para todas las cartas participantes y corona permanente en el líder

El progreso nunca retrocede. Una run perdida pronto da poco, pero nunca quita. La dificultad viene de lo que está por delante, no de castigar lo logrado.

## El Lore: Las Versiones Corruptas
Cuando el coleccionista sale a una run, sus piezas no se enfrentan a enemigos desconocidos. Se enfrentan a **versiones corruptas de su propia colección**.

La corrupción es la idea de que cualquier personaje, llevado al extremo, se convierte en algo oscuro y distorsionado. Luffy corrompido no es el Luffy que protege a sus nakamas, es una versión que solo busca poder absoluto. Walter White corrompido no es el que cocinaba para su familia, es Heisenberg sin frenos. Tu primo corrompido es lo que el coleccionista decida.

Esto significa que:
- Los **enemigos son siempre versiones corruptas** de personajes de tu colección o de colecciones compatibles
- El enemigo corrupto comparte el Set y las habilidades base del original, pero amplificadas y retorcidas
- Los **lugares también están corrompidos**: son espacios de la colección que la corrupción ha tomado. Liberarlos es parte de la purificación de la run, no solo un objetivo secundario
- La run es un viaje a través de tu propia colección corrompida intentando purificarla

El **tiempo** es el elemento narrativo central: la corrupción avanza con el tiempo. Cuanto más tardas en purificar un lugar o un rival, más se expande. Hay un límite antes de que la corrupción sea irreversible y la run se pierda definitivamente.

El punto culminante de cada run es el **Fusionado**: la corrupción ha llegado tan lejos que los líderes que llevas se han fusionado en una sola entidad distorsionada. Ya no son personajes separados. Derrotar al Fusionado es el acto de purificación definitivo de esa run, el momento en que la colección recupera su equilibrio.

Narrativamente, el coleccionista no destruye a sus piezas al derrotarlas. Las **purifica**. Ganar una run significa haber restaurado el equilibrio de esa colección y haber demostrado que esas cartas merecen subir de grado.

Cuando el coleccionista evita un combate yendo al Mercader, no es cobardía, es pragmatismo. A veces sabe cuándo no es el momento de enfrentarse a la corrupción y prefiere buscar recursos antes de seguir. Pero esa decisión tiene un coste: ese personaje corrupto sigue libre.

## Tono
El juego no se toma demasiado en serio. Es absurdo por naturaleza pero no es un juego de humor explícito. El tono es el de un coleccionista apasionado que disfruta de sus piezas y quiere ver hasta dónde llegan.

Cada personaje tiene su **momento definitorio**: una acción especial, su Ultimate, que representa lo más característico de esa pieza de colección. El momento en que Luffy estira el brazo, en que Walter White dice su nombre, en que tu primo hace esa cosa que solo él sabe hacer. Estas Ultimates cuestan Lereles y son las acciones más poderosas del juego.

Los **Ecos** son los fragmentos de experiencia del coleccionista. No son objetos físicos sino conocimiento acumulado: técnicas aprendidas, intuiciones desarrolladas, manías del coleccionista que afectan a cómo percibe el tiempo y actúa bajo presión. Por eso se resetean al acabar la run pero los más poderosos se desbloquean permanentemente: son lecciones que el coleccionista no olvida.

La jerga refleja este tono:
- **Aura**: la fuerza, el carisma, el peso de un personaje. Universal, funciona para cualquier Set
- **Lereles**: la moneda del juego. Informal, personal, es el sello de Aura
- Las keywords de combate buscan términos universales que funcionen tanto para un ninja como para un futbolista

## Nombre
**Aura.** Sin subtítulo. Limpio, universal, evocador.

---

# SECCIÓN 2: Mecánicas Core

## El Turno
El juego funciona **turno a turno**. No hay rondas, no hay fases de mantenimiento. El jugador hace una acción, luego actúa el rival, indefinidamente hasta que se cumple una condición de victoria o derrota.

El jugador dispone de **1 acción por turno**. La única excepción es la keyword **Emboscada**, que permite encadenar una acción adicional inmediatamente después de la acción que la activa.

El rival dispone de **1 acción por turno**. Sus acciones son anunciadas al inicio de su turno y ejecutadas al final — el jugador puede ver qué va a hacer antes de que lo haga.

## Paradigma central del combate
El cronómetro es el árbitro de todos los intercambios. **No existe daño automático entre jugador y corrupto** salvo `attack_place` (acción especial del corrupto). Todo lo demás pasa por una prueba de timing:

- **Acertar (Vibra o Flow)** → el jugador hace daño al corrupto o reduce la resonancia del lugar
- **Fallar** → el corrupto aplica su efecto de fallo (daño al personaje en el Foso, o resonancia del lugar en Intervención)
- **Pifia** → fallo grave: daño al personaje + pierde 1 punto de atributo

## Las Acciones del Jugador

### Mover
Desplaza un personaje entre cualquier zona: HQ ↔ Foso ↔ Lugar. Movimiento libre entre cualquier combinación. **Consume el turno del jugador.** La keyword Emboscada permite mover sin consumir turno.

### Robar
Roba 1 carta de la baraja y la añade al HQ. Solo disponible si el HQ tiene menos de 5 cartas. Acción automática sin prueba de Vibra. Consume turno.

### Descansar
Solo disponible si el personaje está en el **HQ**. Recarga todos los CDs de habilidades activas y ultimates de ese personaje. Puede triggerear habilidades pasivas con efecto al descansar. **No tiene ningún otro efecto** — no marca exhausted, no restaura atributos. Consume turno.

### Confrontar
Acción de ataque directo al corrupto desde el **Foso**. Atacan todos los personajes no exhausted del Foso a la vez. El jugador elige entre:

**Vibra**: lanza el cronómetro. El atributo usado es la **suma de Presencia** de todos los personajes no exhausted del Foso.

**Acción Segura**: aplica daño base fijo igual a la suma de Presencia sin cronómetro. Todos los personajes del Foso quedan exhausted.

Todos los personajes del Foso quedan exhausted tras confrontar (con Vibra o Segura).

### Intervenir
Acción de reducción de resonancia en un **Lugar**. Actúan todos los personajes no exhausted del Lugar. El jugador elige entre Vibra y Acción Segura. El atributo usado es la **suma de Influencia** de los personajes del Lugar. Todos quedan exhausted.

### Descartar
Descarta la primera carta del mazo sin verla y gana 1 Lerele. Consume turno.

### Ultimate
La acción definitoria de cada personaje. Cuesta entre 1 y 10 Lereles según su potencia. Tiene cooldown y requiere Descansar para repetirse.

## El Cronómetro — Resultados y Multiplicadores

**Al Confrontar (modo centésimas):**
El objetivo son unas centésimas concretas (ej: .50), siempre visible. El cronómetro corre de 0.00 a 10.00. El jugador puede parar en 0.50, 1.50, 2.50...

Multiplicadores por segundo al que se para:
- 0.XX → daño × 2.0
- 1.XX → daño × 1.8
- 2.XX → daño × 1.6
- 3.XX → daño × 1.4
- 4.XX → daño × 1.2
- 5.XX en adelante → daño × 1.0 (Vibra sin bonus)
- Parada exacta (Flow, diferencia = 0) → daño × 2.0 (igual que 0.XX)

**Al Intervenir (modo punto exacto):**
El objetivo es un punto concreto en el tiempo (ej: 3.50). Parar exacto es Flow (× 2.0). El mismo sistema de multiplicadores aplica según el segundo al que se para.

**Resultados:**
- **Flow** (diferencia = 0 o parada en 0.XX): daño × 2.0
- **Vibra** (dentro del margen): daño × multiplicador por segundo
- **Fallo** (fuera del margen):
  - En Confrontar: el corrupto aplica daño = su Presencia × N personajes a TODOS los personajes del Foso
  - En Intervenir: el corrupto sube la resonancia del Lugar en su Influencia
- **Pifia** (muy lejos del margen):
  - Daño del fallo + el personaje que confrontó/intervino pierde 1 punto de atributo (Temple primero)
- **Timeout**: equivale a Fallo

**El margen es dinámico:** empieza en ±2 al inicio y crece hasta ±max(atributo, 2) a los 5 segundos.

**Revelación progresiva:**
- Barra limpia hasta los 7 últimos segundos
- A los 3 segundos restantes: aparecen los separadores de segundos
- Marca de objetivo: solo si el personaje tiene la habilidad activa que lo permite

## Sistema de Daño a Personajes
Cuando un personaje recibe daño:
1. Pierde **Temple** primero (punto a punto)
2. Cuando Temple = 0, pierde **Presencia o Influencia aleatoriamente** (1 punto por golpe)
3. Atributos nunca bajan de 0. El mínimo de daño/intervención de ese personaje es **2** aunque todos sus atributos sean 0
4. **KO** cuando los tres atributos son 0 y recibe más daño

No hay restauración de atributos al volver al HQ. Los atributos solo se recuperan mediante habilidades especiales con CD.

## Las Acciones del Corrupto
El corrupto tiene tres atributos dinámicos que **crecen durante el combate** si el jugador no lo presiona:
- **Presencia**: daño que causa al fallar una confrontación / al ejecutar `attack_place`
- **Influencia**: resonancia que sube al fallar una intervención / al ejecutar `intervene_place`
- **Temple**: Aura que gana al ejecutar `rest`

Valores iniciales por tipo: básico (1/1/2), élite (2/2/2), boss (3/2/3). Pueden superar su máximo al ganar Aura.

**Acciones disponibles** (anuncia al inicio de su turno, ejecuta al final):
- `rest` — gana Aura = su Temple. Puede superar su máximo
- `presencia_up` — sube Presencia en 1
- `influencia_up` — sube Influencia en 1
- `temple_up` — sube Temple en 1
- `attack_place` — quita su Presencia a un personaje aleatorio del Lugar (daño directo, sin cronómetro del jugador). Solo disponible si hay personajes en el Lugar
- `intervene_place` — sube resonancia del Lugar en su Influencia. Solo si no hay nadie en el Lugar

**Prioridades IA:**
1. Si nadie en Foso Y nadie en Lugar → sube atributo aleatorio
2. Si nadie en Foso → `presencia_up`
3. Si nadie en Lugar → `intervene_place`
4. Si hay alguien en Lugar → `attack_place`
5. Si hay alguien en Foso → `rest` o `temple_up` (alterna)

El corrupto **no ataca directamente al jugador** salvo `attack_place`. El riesgo al jugador viene de fallar el cronómetro o de dejar el Lugar desprotegido.

## KO y Derrota

**KO de un invitado**: cuando sus tres atributos llegan a 0 se descarta permanentemente.

**KO de un líder**: cuando su Aura total llega a 0 vuelve al HQ en estado KO. No puede hacer ninguna acción hasta ser reanimado. Reanimar cuesta **1 acción + 5 Lereles**. Regresa con su Aura base completa.

**Condiciones de derrota:**
- Baraja vacía + todos los líderes en KO + sin Lereles suficientes para reanimar
- El jugador elige Rendirse
- Condiciones especiales del editor

---

# SECCIÓN 3: Personajes

## Tipos de Personaje
Cada personaje existe en tres versiones intrínsecas que se definen en el editor. No es un campo seleccionable, son tres facetas del mismo personaje:

### Líder
La pieza principal del coleccionista. Los líderes son los personajes que el jugador maneja directamente en combate. Empiezan cada combate en el HQ y se despliegan hacia el Foso o los Lugares. Solo los líderes pueden subir de grado, tener corona y desbloquear compañeros de Set.

### Invitado
El resto de la colección. Los invitados se roban de la baraja durante el combate y se despliegan desde el HQ. Solo pueden moverse una vez, desde el HQ al lugar donde quieran participar. No vuelven al HQ salvo habilidad específica. Si su Aura llega a 0 se descartan permanentemente del combate.

### Corrupto
La versión rival del personaje, controlada por la IA. Es el mismo personaje llevado al extremo, distorsionado. Comparte imagen y Set con sus otras versiones pero tiene sus propias reglas de combate definidas en el editor.

## Color y Categoría
Cada personaje pertenece a un **color**, una **categoría** y un **Set**. Esta jerarquía define su identidad y sus sinergias.

**Los 5 colores y sus categorías por defecto:**
- 🔴 Rojo: Anime, Cómics
- 🟣 Morado: Series, Cine
- ⚫ Negro: Videojuegos
- 🟢 Verde: Literatura
- 🟠 Naranja: Deportes, Real

Cada color admite un máximo de **3 categorías**. El jugador puede crear nuevas categorías hasta ese límite. El juego viene con 1 categoría por color como ejemplo.

Cuando se crea un Set se le asigna una categoría, y esa categoría determina el color de todos sus personajes. Un Set es siempre de un solo color y una sola categoría. La única etiqueta que existe es la del Set. No hay etiquetas adicionales.

## Grado y Desbloqueo
El grado va del **1 al 10** y es la única métrica de progreso del personaje.

**Progreso visual por grado:**
- Grado 1-2: arte básico, sin brillo, bordes simples
- Grado 3-4: arte mejorado, primer gradiente de color
- Grado 5-6: arte completo, efectos de brillo
- Grado 7-8: bordados especiales, efectos animados
- Grado 9: borde dorado, arte en máxima calidad
- Grado 10: acabado perfecto, borde dorado animado, PSA 10

**Desbloqueo de compañeros de Set:**
- Al derrotar al Jefe de Área del set de ese personaje: se desbloquea ese mismo Jefe como líder jugable si no lo estaba
- Llegando al grado 5 con el líder actual del Set

**La Corona:**
Aparece permanentemente sobre la carta del líder que completa una run entera. Es independiente del grado.

## Estructura de un Personaje

### Datos básicos
- Nombre
- Frase (opcional, flavor del personaje)
- Imagen
- Set (determina color y categoría automáticamente)

### Como Líder

**Aura base (calculada, no seleccionable):**
- Sin habilidades avanzadas: **Aura 8**
- Con solo habilidadActiva: **Aura 7**
- Con solo habilidadPasiva: **Aura 6**
- Con habilidadActiva + habilidadPasiva: **Aura 5**
- Si Ultimate cuesta 5L o más: **−1 Aura adicional**

Máximo: 1 habilidad Activa + 1 habilidad Pasiva + 1 Ultimate.

**Ultimate:**
- Coste en Lereles proporcional a su potencia (1L a 10L)
- Si cuesta 5L o más: reduce el Aura base del líder en 1
- Puede tener múltiples keywords sin límite de cantidad, solo de coste (máximo 10L)

### Como Invitado

**Aura base (calculada, no seleccionable):**
- Sin habilidades: **Aura 5**
- −1 por cada habilidad presente (heredada activa, heredada pasiva, efectoAlRobarseOEnHQ, efectoAlDescartarse)
- Mínimo: **Aura 1**

**Movimiento del invitado:**
Solo puede moverse una vez, desde el HQ al lugar donde quiera participar (Foso o Lugar).

**Habilidades heredadas:** solo las marcadas como heredables en el líder y compatibles con invitados.

**Efecto al Robarse o En HQ (elegir uno).**

**Efecto al Descartarse:** valor diferente desde HQ vs desde Lugar/Foso.

### Como Corrupto

**Aura como jefe (calculada):**
- Combate normal: Aura Líder × 3
- Élite: Aura Líder × 10
- Jefe de área: Aura Líder × 20
- Fusionado: suma de (Aura Líder × 10) de cada líder de la run

**El Fusionado:**
El último enemigo de cada run es la fusión corrupta de todos los líderes de esa run. Su Aura es la suma de todos sus valores de fusionado. Visualmente es un mashup de sus imágenes.

**Campos del Corrupto:**
- Objetivo Vibra: centésimas 0-99
- Las 4 acciones base:
  - **Atacar Foso**: quita X Aura al personaje en el Foso
  - **Recuperar**: gana X Aura propia
  - **Intervenir en Lugar**: añade X resonancia al lugar
  - **Atacar Lugar**: quita X Aura a personajes en el lugar
- 1 keyword activa adicional (de las keywords de corrupto)
- 1 keyword pasiva adicional (de las keywords de corrupto)
- Reacción a Lugar Perdido: efecto cuando pierde el lugar
- Condiciones de turno extra
- Ultimate heredada del líder con condición de activación:
  - Cuando su Aura baja del 50%
  - Cuando llevas X turnos sin confrontarlo
  - Cuando el jugador conquista el lugar
  - Cuando todos los líderes están en KO
- Modificaciones del cronómetro: sin línea de tiempo, sin centésimas, tiempo reducido

## Habilidades por Color
Cada color tiene acceso a un conjunto fijo de keywords. Un personaje solo puede tener habilidades de su color. Ver Sección 8 para el detalle completo.

---

# SECCIÓN 4: Combate

## Estructura General
El tablero tiene tres zonas para el jugador:
- **HQ**: reserva de hasta 5 personajes
- **El Foso**: zona de confrontación directa con el rival
- **Los Lugares**: zonas de intervención con objetivos de resonancia

Máximo 5 personajes por Foso o por Lugar. Si hay dos Fosos se muestran uno al lado del otro. Los Lugares se muestran en horizontal.

## El Tiempo de Vibración
El tiempo es el eje central del juego, pero **no es tiempo real**. Es el tiempo acumulado *dentro de las pruebas de Vibra*: solo avanza mientras el cronómetro corre. Pensar entre turnos es gratis, planificar es gratis. El tiempo solo corre cuando el jugador se arriesga al cronómetro.

Temáticamente, cada prueba de Vibra desestabiliza un poco la Vibración del combate. Si la Vibración acumulada se mantiene demasiado tiempo, se destruye y el jugador pierde.

**Cómo se acumula:**
- Cada prueba de Vibra (Confrontar o Intervenir) suma el tiempo gastado antes de parar el cronómetro
- La Acción Segura suma una cantidad fija de tiempo de Vibración
- El rival no hace pruebas de Vibra pero puede añadir tiempo mediante habilidades
- Cuando se conquista un lugar, el tiempo acumulado en ese lugar se resta del tiempo total

**Umbrales (configurables por dificultad):**
- **5 minutos de Vibración acumulada**: los enemigos aplican el doble de efecto en sus acciones
- **10 minutos de Vibración acumulada**: la Vibración se destruye, derrota automática

El tiempo de Vibración se muestra siempre en grande en la parte superior. Cada Foso y Lugar muestran su propio tiempo acumulado, ya que algunas habilidades del corrupto y temporizadores se activan según el tiempo de zona.

## Tipos de Combate

### Combate Básico
- 1 enemigo corrupto (nunca del set de los líderes)
- 1 Foso + 1 Lugar (el del set del enemigo)
- Objetivo principal: reducir el Aura del enemigo a 0
- Objetivo secundario: conquistar el Lugar (bonus extra)
- Reacción a Lugar Perdido: configurable en el editor

### Combate Élite
- 2 enemigos corruptos del mismo set (nunca del set de los líderes)
- 2 Fosos + 1 Lugar compartido
- Los enemigos actúan como una unidad: 1 acción por turno
- Si se pierde el Lugar: los enemigos pasan a tener un turno cada uno
- Objetivo principal: reducir el Aura de ambos a 0
- Objetivo secundario: conquistar el Lugar

### Conquista
- 1 enemigo corrupto normal
- 1 Foso + 3 Lugares aleatorios (no de sets de los líderes, pueden repetir tipo)
- Objetivo principal: conquistar los 3 Lugares
- Derrotar al enemigo proporciona bonus adicional

### Jefe de Área
- Corrupto del set de uno de los líderes del jugador (uno por área)
- 1 Foso + 2 Lugares: el del set del Jefe y un Lugar Especial de Jefe
- Objetivo principal: reducir el Aura del Jefe a 0
- Objetivo secundario: conquistar ambos lugares (recompensas jugosas)

### Fusionado
- Jefe final de la run
- 1 Foso con el Fusionado (mashup visual de todos los líderes de la run)
- 1 Lugar Fusionado
- Aura = suma de (Aura Líder × 10) de cada líder de la run
- Al 50% de Aura: activa su Ultimate automáticamente

## Tipos de Lugares

### Lugar Básico
- Resonancia inicial = doble del Aura del enemigo
- Prueba de Vibra: **modo punto exacto**, tiempo límite 7 segundos
- Objetivo entre 1.00 y 7.00 segundos
- Límite superior: si el rival lo supera se pierde el combate
- Pifia configurable: perder Aura, aumentar resonancia, descartar carta
- Bonus al conquistar configurable

### Lugar Cronometrado
- Resonancia fija + tiempo límite (mínimo 1 minuto)
- Prueba de Vibra: **modo centésimas** con 10 segundos por intento
- El tiempo gastado en cada prueba se resta al contador del lugar
- El rival resta segundos directamente al contador
- Pifia resta segundos adicionales

### Lugar Completo
- Mezcla de Básico y Cronometrado
- Tiempo límite mínimo 2 minutos
- El rival sube resonancia (no resta segundos)
- Pifias de ambos tipos

### Lugar Carrera de Auras
- Dos marcadores: uno del jugador y uno del rival
- Ambos empiezan en el mismo valor
- El primero en llegar a 0 conquista el lugar
- Pifias pueden subir la resonancia del rival

### Lugar Bastión
- Mientras no esté conquistado: no se puede intervenir en otros lugares ni confrontar
- Funciona como Básico con restricción de bloqueo

### Lugar Espejo
- Cada intervención exitosa del jugador sube la resonancia del rival a la mitad
- El Flow no transfiere bonus al rival

### Lugar Maldito
- Cada X segundos de tiempo global añade resonancia automáticamente

### Lugar Eco
- Al conquistarlo activa un Eco aleatorio (puede ser positivo o negativo)
- El jugador no sabe qué Eco obtendrá hasta conquistarlo

### Lugar Sacrificio
- Para intervenir el jugador debe tener al menos un personaje en KO o descartado en ese combate

### Lugar Resonante
- Dos fases: bajar a la mitad con reglas normales, luego las reglas cambian

### Lugar Fortaleza
- El rival tiene un escudo de resonancia propio
- Hasta romper el escudo no se puede reducir la resonancia del lugar

### Lugar Especial de Jefe
- Solo en Jefe de Área
- Definido al crear el Set con modificadores especiales

### Lugar Fusionado
- Solo en el combate del Fusionado
- Combina reglas de varios tipos según los sets de la run

### Lugar Péndulo
El cronómetro de este lugar no avanza linealmente: oscila entre 0 y el tiempo límite como un péndulo (0→5→0→5→0...). El objetivo está en algún punto del recorrido y el jugador debe parar cuando el péndulo lo alcanza en cualquier dirección. La amplitud se reduce con cada oscilación: la ventana de acierto se estrecha progresivamente. Intervenir aquí premia el ritmo más que la precisión puntual.

## Modificadores de Cronómetro

Además de los estados de lugar, los corruptos y los Ecos pueden aplicar modificadores al cronómetro. Los más relevantes:

**Ventana que se Cierra**
El margen de acierto empieza generoso y se reduce progresivamente. Por ejemplo: margen inicial ±30 centésimas, se reduce en 5 centésimas por segundo transcurrido. A los 6 segundos el margen es ±0. Refuerza el pilar central: cuanto más tardas, menos margen tienes. La ventana de acierto se muestra visualmente reduciéndose en la marca sutil. Configurable: margen inicial, tasa de reducción por segundo, margen mínimo (puede llegar a 0 o quedarse en un mínimo de 5).

**Objetivo Oculto**
El número objetivo no se muestra. El jugador para a ciegas y ve el resultado al parar. Variante más extrema: ni el objetivo ni las zonas se revelan tras parar, solo el resultado (Flow/Vibra/Fallo/Pifia). Reservado para bosses difíciles o Ecos de alto riesgo.

**Acelerón**
El cronómetro empieza a velocidad reducida (×0.5) y acelera progresivamente hasta ×3 o más. Arriesgarse pronto es fácil de precisar pero se obtiene menos bonus de tiempo (el cronómetro corre lento). Esperar da más bonus pero el cronómetro es imposible de controlar.

## Estados de Lugar
Se aplican mediante habilidad de líder, al alcanzar X resonancia, o por dejar el lugar sin personajes X turnos:
- Sin marca de objetivo visible
- Sin centésimas (solo décimas siempre)
- Umbrales de revelación retrasados (centésimas a los 5s, marca a los 8s)
- Velocidad del cronómetro al doble
- Tiempo reducido
- Pifia ampliada / reducida
- Ventana que se Cierra activa (margen configurable)

## Información Visible en Pantalla

**Siempre visible:**
- Tiempo global en grande (verde < 5min, naranja 5-8min, rojo > 8min)
- Fase actual (formato X.Y)
- Lereles actuales
- Cartas en mazo + cartas en descarte
- Aura y estado de cada personaje
- Resonancia de cada lugar en número grande y barra
- Tiempo de zona (Foso y Lugares)
- Intención del rival para su próximo turno

**Panel del enemigo (ocultable):**
- Nombre, imagen, Aura actual / Aura máxima
- Sus acciones con valores
- Intención del próximo turno
- Badge CORRUPTO y tipo

**Panel de personaje seleccionado:**
- Habilidades disponibles
- Estado (activo, agotado, KO)
- Aura actual
- Mover: arrastrando la carta, no como botón

---

# SECCIÓN 5: Roguelite

## Estructura de la Run
Una run se divide en **áreas**. Número de áreas = líderes elegidos + 1 (la del Fusionado).

Cada área tiene **6 nodos** visibles desde el principio. El jugador ve qué enemigo y qué lugar tiene cada nodo antes de decidir.

El último nodo de cada área (excepto la última) es siempre un **Jefe de Área**. El último nodo de la última área es siempre el **Fusionado**. Estos nodos no se pueden saltear.

## Los Nodos

### Combate (nodo estándar)
- Primer nodo de cada área: siempre Combate Básico
- Cada área garantiza mínimo 2 Combates Básicos
- Resto: aleatorio entre Élite, Conquista y Mercader

### Mercader (nodo opcional)
- Alternativa a un nodo de combate no garantizado
- Narrativa: has huido del combate
- No recibes recompensas de combate ni experiencia
- Nunca sustituye a Jefe ni Fusionado

### Jefe de Área (nodo fijo)
- Último de cada área excepto la última
- Nunca salteable

### Fusionado (nodo fijo)
- Último de la run
- Nunca salteable

## La Baraja
- Cada líder aporta 5 invitados de su set
- Con 2 líderes: 10 cartas. Con 3: 15. Con 4: 20. Con 5: 25
- Durante la run se pueden añadir cartas en el Mercader

## Niveles de Carta Durante la Run
Se resetean al acabar la run. Independientes del grado permanente.

- **Común** (base): stats originales, sin borde especial
- **Infrecuente**: Aura +50%, habilidades ×2. Borde verde
- **Rara**: Aura +100%, habilidades ×3. Borde azul
- **Legendaria**: Aura +150%, habilidades ×4. Borde dorado animado

## El Mercader
Vende:
- Cartas de invitados de otros sets del mismo color
- Ecos (según rareza disponible)
- Mejoras de personaje (subir nivel de run, mejorar habilidades, aumentar Aura)

El jugador puede vender Ecos a cambio de Lereles.

## Recompensas Entre Nodos

**Lereles:** cartas restantes en la baraja × 2

**Eco:** 1 Eco aleatorio elegido entre 3 opciones:
- Combate Básico: Ecos normales
- Élite / Conquista: normales e infrecuentes
- Jefe de Área: infrecuentes y raros
- Fusionado: solo raros

**Mejora de personaje**
Opción de subir el nivel de run de un personaje elegido (Común → Infrecuente → Rara → Legendaria) o subir un atributo concreto (Presencia, Influencia o Temple) de forma permanente para esa run. El jugador elige a qué atributo asigna los puntos.

**Desbloqueo:** al derrotar Jefe de Área se desbloquea ese Jefe como líder jugable si no lo estaba

## Experiencia y Nivel Permanente de Líder
Nivel de 1.00 a 10.00:
- 1.00 a 9.00: experiencia ganada en combates según checkpoints superados
- 9.00 a 10.00: solo con coronas (+0.25 por corona, 4 coronas para llegar al 10.00)

## Las Coronas
- 👑 Corona de 2: completar run con 2 líderes
- 👑👑 Corona de 3: completar run con 3 líderes
- 👑👑👑 Corona de 4: completar run con 4 líderes
- 👑👑👑👑 Corona de 5: completar run con 5 líderes

Cada corona aporta +0.25 al nivel permanente del líder.

## Recompensas al Completar la Run
- Desbloqueo libre de cualquier personaje de los sets participantes
- Desbloqueo de Ecos especiales bajo condiciones específicas
- Subida de grado permanente según checkpoints superados

## Progresión del Coleccionista
- +1 por cada Set creado
- +1 por cada nivel que sube cualquier Set
- Máximo teórico: 500 (50 sets al nivel 10)

---

# SECCIÓN 6: Ecos

## Qué son los Ecos
Los Ecos son mejoras pasivas que el jugador acumula durante la run y que modifican las reglas del juego de formas creativas. Son el motor de las builds rotas y los combos inesperados.

El jugador puede llevar hasta **10 Ecos simultáneamente**. Los Ecos no se pueden vender pero se pueden descartar en cualquier momento, incluso al recibir uno nuevo si no hay hueco.

Los Ecos duran toda la run y se resetean al acabar.

## Rarezas
- **Normal**: combates básicos, Élite y Conquista
- **Infrecuente**: Élite, Conquista y Jefe de Área
- **Raro**: Jefe de Área y Fusionado
- **Especial**: se desbloquean completando runs bajo condiciones específicas

## Categorías de Ecos

### Ecos de Vibra
Modifican el cronómetro y las pruebas de Vibra.

**Normales:**
- **Pulso Estable**: margen de acierto +5 centésimas permanente
- **Calma**: cronómetro 20% más lento
- **Primer Golpe**: primera prueba de cada combate es Vibra automática
- **Memoria Muscular**: parar en el mismo segundo que la prueba anterior da +2 Aura temporal

**Infrecuentes:**
- **Adrenalina**: cada Flow consecutivo +3 centésimas de margen acumulable
- **Zona**: parar antes de 2s da ×1.5 adicional
- **Doble Filo** *(doble filo)*: margen ×2 pero zona de Pifia a la mitad
- **Inversión** *(doble filo)*: cronómetro de 10 a 0, bonus de tiempo invertido
- **Segunda Intención**: tras parar puedes relanzar el cronómetro hasta 2 veces por prueba (continúa desde donde paró, no desde 0). Cada relanzamiento consume tiempo de Vibración adicional. *(doble filo)*: más intentos pero más tiempo gastado
- **Ventana Activa** *(doble filo)*: el margen de todas las pruebas empieza en ×3 pero se reduce 5 centésimas por segundo. Si esperas demasiado el margen llega a 0

**Raros:**
- **Modo Espejo**: centésimas ↔ punto exacto en todas las pruebas
- **Resonancia Perfecta**: cada Flow da ×2 + bonus máximo siempre
- **Caos Controlado**: objetivo cambia aleatoriamente, si aciertas ×3
- **Flujo Inverso** *(doble filo)*: bonus tiempo ×3 pero margen a la mitad
- **Contrato** *(doble filo)*: antes de cada prueba apuestas un rango de tiempo (ej: "pararé entre 2s y 3s"). Si cumples el contrato Y aciertas: recompensa ×2. Si cumples el contrato pero fallas: resultado normal. Si no cumples el contrato: Pifia automática independientemente de dónde paraste. El rango se elige entre 3 opciones aleatorias antes de cada prueba
- **Doble Toque** *(doble filo)*: primer toque congela el display (el cronómetro sigue corriendo internamente pero no lo ves). Segundo toque para definitivamente. Recompensa ×3 si aciertas, pero si estás en zona de Pifia al segundo toque recibes doble penalización

### Ecos de Personaje

**Normales:**
- **Colectivo**: invitados +1 Aura al inicio del combate
- **Veterano**: líderes +2 Aura temporal al inicio del combate
- **Sacrificio Rentable**: descartar desde lugar o Foso da 2L en lugar de 1
- **Resistencia**: líderes KO cuestan 1L menos para reanimar

**Infrecuentes:**
- **Última Bala** *(doble filo)*: último invitado Aura ×3, resto -1 Aura
- **Sincronía**: 2 personajes mismo set en misma zona +2 Aura temporal por turno
- **Cadena**: usar habilidad activa resetea cooldown del siguiente personaje usado

**Raros:**
- **Fusión Prematura**: fusionar 2 invitados mismo color en 1 con suma de Auras
- **Inmortalidad** *(doble filo)*: líderes no mueren pero no pueden confrontar
- **El Elegido** *(doble filo)*: 1 líder aleatorio Aura ×2, si cae en KO derrota automática

### Ecos de Lugar

**Normales:**
- **Terreno Conocido**: entrar en lugar +1 Aura temporal
- **Liberador**: conquistar lugar +1 Aura permanente a todos los personajes
- **Eficiencia**: intervención exitosa reduce 0.5s del contador del lugar

**Infrecuentes:**
- **Contaminación** *(doble filo)*: conquistar lugar -1 minuto tiempo global
- **Bastión Propio**: designar 1 lugar como bastión propio
- **Rebote**: Pifia en lugar resta resonancia al rival en ese lugar

**Raros:**
- **Terraformar**: cambiar tipo de un lugar por otro conquistado anteriormente
- **Tiempo Prestado** *(doble filo)*: conquistar lugar +2min global pero resonancia restantes +50%
- **Resonancia Compartida**: aportación a lugar se aplica también a la mitad en otro lugar aleatorio

### Ecos de Economía

**Normales:**
- **Ahorrador**: al acabar combate +1L por cada Eco equipado
- **Inversor**: llegar con 10+ Lereles al combate da el doble al acabarlo
- **Reciclaje**: descartar un Eco da +3L

**Infrecuentes:**
- **Banquero** *(doble filo)*: pierdes todos los Lereles al inicio de combate, ganas el doble al acabarlo
- **Mercado Negro**: precios del Mercader a la mitad pero no puedes vender Ecos

**Raros:**
- **Todo o Nada** *(doble filo)*: sin Mercader en el área +20L al llegar al Jefe, con Mercader el Jefe Aura ×2

### Ecos de Sinergia
Por sí solos hacen algo muy pequeño. Su valor real aparece al combinarlos.

**Normales:**
- **Número de la Suerte**: parar en X.07 exacto da +1L
- **Impar Wins**: parar en segundo impar +1 Aura al efecto
- **Par Perfecto**: parar en segundo par -0.3s tiempo global

**Infrecuentes:**
- **Coleccionista de Flows**: cada 5 Flows en la run +1L
- **Marcador**: primera vez en cada segundo distinto en un combate +0.5 Aura temporal
- **Obsesión**: elegir centésimas al inicio de run, acertar exactamente da +2L

**Raros:**
- **Multiplicador Oculto**: cada Eco de Sinergia equipado duplica efectos de todos los Ecos de Sinergia
- **Catalizador**: con 3+ Ecos de Vibra, sus efectos aplican también al rival
- **El Colmo**: no hace nada salvo con 10 Ecos → al inicio del Fusionado todos los personajes suben a Legendario

### Eco Especial
- **Huevo de Oro**: ocupa los 10 slots. Si completas la run los Lereles restantes se guardan para la siguiente run

### Ecos Especiales Desbloqueables
- **Manos Limpias**: completar run sin Pifias → zona de Pifia desaparece en siguiente run
- **Relámpago**: completar run con < 3min tiempo global → bonus tiempo máximo siempre
- **El Archivo**: tener 10 Ecos al ganar → elegir 1 Eco conocido al inicio de cada run
- **Abraza el Caos**: completar run con 3+ Ecos de doble filo → efecto aleatorio al cronómetro cada combate

## La Colección de Ecos
Accesible desde el menú **Coleccionista**.

Muestra todos los Ecos con su estado:
- **Desbloqueado**: imagen completa, nombre, descripción, rareza
- **Bloqueado**: imagen con interrogante, nombre visible, condición de desbloqueo visible
- **Maestría**: usado para ganar con las 4 coronas → indicador especial

**Estadísticas por Eco:**
- Veces usado en runs
- Veces usado al ganar con cada tipo de corona (2/3/4/5)

## Editor de Ecos
Accesible desde el menú Coleccionista. Permite crear Ecos personalizados:
- Elegir categoría y rareza
- Definir efecto dentro de los parámetros disponibles
- Definir penalización si es doble filo
- Los Ecos creados entran al pool general

---

# SECCIÓN 7: Lereles y Economía

## Qué son los Lereles
Los Lereles son la moneda del juego. Se acumulan a lo largo de toda la run y se gastan en momentos clave. Son escasos por diseño.

## Fuentes de Lereles

**Durante el combate:**
- Descartar carta del mazo: +1L
- Completar objetivos secundarios: cantidad configurable en el editor
- Ecos de economía

**Entre combates:**
- Cartas restantes en la baraja × 2

**En el Mercader:**
- Vender un Eco: cantidad a definir en balance

## Gastos de Lereles

**Durante el combate:**
- Reanimar líder KO: coste = 5 Lereles (fijo)
- Activar Ultimate: coste = 1 a 10L según la Ultimate

**En el Mercader:**
- Comprar carta invitado, Ecos, mejoras de personaje

**Por Ecos de doble filo:**
Algunos Ecos tienen coste en Lereles por acción.

## El Huevo de Oro
Eco especial que ocupa los 10 slots. Si completas la run con él equipado, los Lereles restantes se guardan para la siguiente run.

## Balance
Los valores de precios y recompensas se ajustarán durante las pruebas del juego.

---

# SECCIÓN 8: Keywords y Efectos

## Sistema de Niveles
Las keywords con valor numérico (X) escalan con el nivel de la carta durante la run. El nivel 1 es el valor base y no muestra el número. Los niveles 2, 3 y 4 muestran el valor explícito.

Las keywords sin valor numérico no escalan.

## Desbloqueo Progresivo de Keywords
Para no abrumar al jugador, las keywords no están todas disponibles desde el principio. Se desbloquean según el nivel alcanzado en los Sets de cada color: al llegar a cierto nivel de Set en un color se desbloquea una keyword nueva de ese color. Al desbloquearla aparece una explicación, y desde ese momento está siempre disponible en el editor para ese color.

Los Sets de ejemplo iniciales usan solo las keywords básicas de cada color. Las keywords más potentes y complejas se ganan jugando.

## Las habilidades suben atributos concretos
Con el sistema de tres atributos (Presencia, Influencia, Temple), las keywords que antes daban "+X Aura" ahora especifican qué atributo afectan. Por ejemplo Viral puede dar Presencia, Tendencia puede dar Temple, etc. El editor permite elegir qué atributo sube cada keyword aplicable dentro de los límites del color.

## Coste en Lereles de las Activas
- Cada keyword añadida a una habilidad activa: +1L
- Mínimo: 1L (al menos 1 keyword)
- Máximo activa: 3L
- Máximo Ultimate: 10L
- Descansar: siempre 0L (única excepción)

## Keywords de Habilidades Activas y Ultimates

| Keyword | Efecto | Niveles | Colores |
|---|---|---|---|
| **Emboscada** | Turno extra tras usar esta habilidad | No escala | Rojo |
| **Viral** | +X Aura por aliado en zona (no HQ) | 1/2/3/4 | Rojo |
| **Polémico** | +X Aura propia, rival menos Aura +X/2 | 2/6/8/12 | Morado, Naranja |
| **Inspirador** | Aliado en zona +X Aura (no HQ) | 2/4/7/10 | Verde |
| **Desenmascarado** | Enemigo elegido -X Aura sin Vibra | 1/3/5/7 | Rojo |
| **Aplacador** | Siguiente turno rival sin efecto | No escala | Morado |
| **Rumor** | Rival Cancelado X turnos (valor Cancelado sube por nivel) | Turnos 2/5/8/10, Cancelado 1/2/3/4 | Morado |
| **Ganar Lereles** | +X Lereles netos | 1/2/3/4 | Verde |
| **Resonancia** | -X resonancia en lugar sin Vibra | 2/4/6/8 | Morado |
| **Comunidad** | +X Aura por compañero del Set en zona (incluye HQ) | 1/2/3/4 | Verde, Naranja |
| **Robar** | Roba 1 carta si HQ < 5 | No escala | Negro |

## Keywords de Activas de Intervención/Confrontación
Se usan en lugar de hacer la acción. Solo disponibles en posición de Intervenir o Confrontar.

| Keyword | Efecto | Niveles | Colores |
|---|---|---|---|
| **Precisión** | +X centésimas de margen en siguiente Vibra | 5/10/15/20 | Negro |
| **Aceleración** | +X bonus por segundo ahorrado en siguiente Vibra | 1/2/3/4 | Negro |
| **Doble Intento** | 2 intentos en siguiente Vibra, segundo no puede ser Pifia | No escala | Rojo, Naranja |
| **Anular Pifia** | Siguiente Vibra no puede ser Pifia | No escala | Negro |
| **Amplificar** | Flow da ×3 en lugar de ×2 en siguiente Vibra | No escala | Rojo |
| **Ralentizar** | Cronómetro 50% más lento en siguiente Vibra | No escala | Negro |

## Keywords de Habilidades Pasivas

| Keyword | Efecto | Niveles | Colores |
|---|---|---|---|
| **Protector** | Daño a aliados en tu zona recae sobre ti | No escala | Verde |
| **Omnipresente** | Actúa desde cualquier zona incluyendo HQ | No escala | Negro |
| **Tendencia** | Al Descansar +X Aura | 1/3/5/7 | Verde |
| **Afinidad de Color** | +X Aura por aliado mismo color en zona (incluye HQ) | 1/2/3/4 | Negro |
| **Afinidad de Categoría** | +X Aura por aliado mismo color Y categoría en zona | 1/2/3/4 | Morado |
| **Resistencia** | Daño recibido -X (mínimo 1) | 1/2/3/4 | Morado, Naranja |
| **Regeneración** | Inicio de turno +X Aura si estás en Lugar o Foso | 1/2/3/4 | Rojo, Naranja |
| **Escudo** | Una vez por combate Aura no baja de 1 | No escala | Verde, Naranja |
| **Intimidación** | Rival -X Aura inicio de su turno mientras estés en Foso | 1/2/3/4 | Rojo |

## Keywords de Al Robarse / En HQ

| Keyword | Trigger | Efecto | Niveles | Colores |
|---|---|---|---|---|
| **Impulso** | Al Robarse | +X Aura inmediatamente | 1/2/3/4 | Rojo, Naranja |
| **Provisiones** | Al Robarse | +X Lereles | 1/2/3/4 | Negro |
| **Apoyo** | En HQ | Líder elegido en HQ +X Aura temporal | 1/2/3/4 | Verde |
| **Preparación** | En HQ | Próxima activa cuesta X menos (mín 0) | 1/2/3 | Morado |

## Keywords de Al Descartarse

| Keyword | Efecto | Niveles | Colores |
|---|---|---|---|
| **Legado** | Desde HQ: aliado +X Aura. Desde lugar: ×2 | 1/2/3/4 | Verde |
| **Sacrificio** | Desde lugar: todos aliados en zona +X Aura. Desde HQ: 1 aliado | 1/2/3/4 | Rojo |
| **Tesorero** | +X Lereles extra al descartar (además del 1L base) | 1/2/3/4 | Negro, Naranja |
| **Resonancia Final** | Desde Lugar: -X resonancia sin Vibra | 2/4/6/8 | Morado |

## Keywords del Corrupto

**Activas:**

| Keyword | Efecto | Niveles |
|---|---|---|
| **Corrupción** | Acción base del corrupto +X efecto | 1/2/3/4 |
| **Contaminación** | +X segundos al tiempo global | 10/20/30/60 |
| **Dominación** | Si Foso vacío recupera +X Aura además de su acción | 1/2/3/4 |

**Pasivas:**

| Keyword | Efecto | Niveles |
|---|---|---|
| **Corrupto** | +X Aura al inicio de cada turno del rival | 1/2/3/4 |
| **Blindaje** | Daño de Confrontación -X | 1/2/3/4 |
| **Furia** | Tras recibir daño, siguiente acción +X efecto | 1/2/3/4 |

## Estados Alterados

**Cancelado (X durante Y turnos)**
El rival pierde X Aura al inicio de cada turno del jugador durante Y turnos. No se cura descansando, solo expira por turnos. Aplicado por Rumor.

## Reparto de Keywords por Color

**🔴 Rojo** (atacar fuerte y rápido):
- Activas: Emboscada, Viral, Desenmascarado, Amplificar, Doble Intento
- Pasivas: Regeneración, Intimidación
- Al Robarse: Impulso
- Al Descartarse: Sacrificio

**🟣 Morado** (debilitar y controlar):
- Activas: Aplacador, Rumor, Resonancia, Aceleración
- Pasivas: Afinidad de Categoría, Resistencia
- Al Robarse: Preparación
- Al Descartarse: Resonancia Final

**⚫ Negro** (técnico y complejo):
- Activas: Polémico, Robar, Precisión, Ralentizar, Anular Pifia
- Pasivas: Omnipresente, Afinidad de Color
- Al Robarse: Provisiones
- Al Descartarse: Tesorero

**🟢 Verde** (soporte y crecimiento):
- Activas: Inspirador, Comunidad, Ganar Lereles
- Pasivas: Protector, Tendencia, Escudo
- Al Robarse: Apoyo
- Al Descartarse: Legado

**🟠 Naranja** (resistir y contraatacar):
- Activas: Polémico, Comunidad, Doble Intento
- Pasivas: Resistencia, Escudo, Regeneración
- Al Robarse: Impulso
- Al Descartarse: Tesorero, Sacrificio

## Glosario en el Juego
Todas las keywords tienen tooltip al hacer hover. El glosario completo es accesible desde el menú Coleccionista. En las cartas las keywords aparecen con nombre y nivel visible. Al pasar el cursor o mantener pulsado se muestra la descripción completa.

---

## Los Dos Menús Principales

### Aventura
- Iniciar o continuar una run
- Ver el mapa actual
- Historial de runs

### Coleccionista
- Personajes y Sets
- Lugares
- Ecos (colección + editor)
- Estadísticas globales
- Nivel de Coleccionista

---

# SECCIÓN 9: Sets y Lugares

## Estructura de un Set
Un Set es una colección temática con la siguiente jerarquía de creación:

**Color → Categoría → Set → Personajes + Lugar**

El color se elige primero y determina qué keywords pueden tener los personajes del Set. La categoría se elige al crear el Set dentro del color elegido. No hay personajes sin Set.

## Slots de Sets
El jugador empieza con **5 slots activos**, uno por color. Puede desbloquear slots adicionales de cualquier color gastando **20 puntos de Coleccionista** por slot. Los Sets archivados tienen un tope de **50**.

**Organización de slots por color:**
- Cada color tiene sus propios slots independientes
- El jugador elige qué categoría asigna a cada slot al crearlo
- Puede haber varios Sets del mismo color si tiene suficientes slots

## Estados de un Set

**Borrador**
- Recién creado, todo editable
- No aparece en runs
- No da puntos de Coleccionista
- Requiere mínimo: 6 personajes confirmados + 1 lugar confirmado para poder confirmarse

**Confirmado**
- Al confirmar: **+5 puntos de Coleccionista**
- El Set en sí (nombre, color, categoría) ya no se puede modificar
- Aparece disponible para runs
- Se pueden añadir personajes nuevos en borrador y confirmarlos individualmente

**En Uso**
- Se ha usado al menos 1 vez en una run
- Los personajes existentes confirmados no se pueden modificar
- Solo se pueden añadir personajes nuevos

**Archivado**
- No aparece en runs
- Se conservan los puntos de Coleccionista ganados con él
- Desde Archivado se puede **Eliminar** con doble confirmación (escribir el nombre del Set): se pierden todos los puntos asociados
- Tope de 50 Sets archivados

**Eliminado**
- Solo disponible para Sets que nunca han sido usados en una run
- Botón visible solo en Sets en estado Borrador o Confirmado no usados
- Doble confirmación: "¿Seguro?" → escribir nombre del Set
- Se pierden todos los puntos de Coleccionista ganados

## Estados de un Personaje

**Borrador**
- Editable libremente
- No aparece en runs

**Confirmado**
- Al confirmar: **+1 punto de Coleccionista**
- Ya no se puede modificar ni eliminar
- Aparece en runs del Set al que pertenece

## El Onboarding: Los 5 Sets Iniciales
Al crear una cuenta nueva el jugador recibe **5 Sets en borrador**, uno por color, con una categoría por defecto sugerida (editable). Estos Sets no tienen personajes ni lugar: el jugador debe completarlos.

La primera misión del juego es confirmar los 5 Sets iniciales. Esto actúa como tutorial implícito: el jugador aprende el editor creando su primera colección. Cuando los 5 están confirmados puede embarcarse en su primera run.

Hasta tener al menos 2 Sets confirmados no se puede iniciar una run.

## Puntos de Coleccionista por Sets y Lugares

| Acción | Puntos |
|---|---|
| Confirmar un Set | +5 |
| Confirmar un personaje | +1 |
| Confirmar un lugar de Set | +2 |
| Crear un lugar genérico | +3 |
| Subir nivel de un Set | +1 por nivel |
| Eliminar un Set | −todos los puntos ganados con ese Set |

## Estructura de un Lugar

Todo lugar tiene:
- **Nombre**
- **Set** (null si es genérico)
- **Tipo**: uno de los 11 tipos definidos en la Sección 4
- **Resonancia inicial**: valor de partida
- **Límite superior**: valor máximo antes de perder el combate (null si no aplica)
- **Prueba de Vibra**: parámetros configurables según el tipo
- **Pifia**: consecuencia configurable
- **Bonus al conquistar**: Lereles, Aura, Eco aleatorio o recompensa inmediata
- **Pasiva de lugar**: efecto que aplica a los personajes mientras están en él
- **Habilidad de Set**: efecto especial para personajes del mismo Set

## La Habilidad de Set en los Lugares
Cada lugar tiene dos habilidades pasivas relacionadas con el Set:

- **Si ningún líder del jugador coincide con el Set del lugar**: el lugar aplica un efecto a favor del rival (ej: el rival gana +2 Aura al intervenir)
- **Si algún líder del jugador coincide con el Set del lugar**: el lugar aplica un efecto a favor del jugador (ej: los personajes del Set ganan +2 Aura al entrar)

Ambos efectos se configuran en el editor del lugar. Los lugares del set del enemigo son hostiles por defecto, pero si llevas personajes de ese set se vuelven favorables.

## Lugares Genéricos
Los lugares genéricos no pertenecen a ningún Set y aparecen en combates de tipo Conquista.

**22 lugares genéricos intrínsecos** (2 por cada uno de los 11 tipos de lugar). Son contenido base del juego, no modificables ni eliminables.

**Lugares genéricos creados por el jugador:**
- Se crean gastando 5 puntos de Coleccionista
- Al crearse entran en el pool de Conquista
- Una vez creados y usados en una run no se pueden eliminar
- Guardan estadísticas de uso
- Dan +3 puntos de Coleccionista al crearse

## El Editor de Sets
La creación de un Set sigue este flujo obligatorio:

1. **Elegir color** (de los slots disponibles)
2. **Elegir o crear categoría** (dentro del color, máximo 3 categorías por color)
3. **Nombrar el Set**
4. **Añadir personajes** (mínimo 6 confirmados para poder confirmar el Set)
5. **Crear el lugar del Set** (1 obligatorio, desde aquí se crea directamente)
6. **Confirmar el Set** (botón activo solo cuando se cumplen los requisitos mínimos)

Disclaimer visible mientras no se cumplen los requisitos: "Necesitas al menos 6 personajes confirmados y 1 lugar para poder confirmar este Set."

Confirmación del Set: modal con resumen y advertencia: "Una vez confirmado, el nombre, color y categoría del Set no podrán modificarse."

## Estadísticas de un Set
Cada Set confirmado guarda:
- Número de runs jugadas con él
- Número de runs completadas
- Mejor resultado (hasta qué nodo se llegó)
- Personajes más usados
- Lugares conquistados con personajes de ese Set

---

# SECCIÓN 10: Meta-progresión

## Persistencia y Cuenta
Todos los datos del jugador se guardan en la nube mediante **Google OAuth + Firebase**. El jugador inicia sesión con su cuenta de Google y su colección, historial, niveles, Ecos desbloqueados y puntos de Coleccionista están disponibles en cualquier dispositivo.

Sin cuenta iniciada el juego no guarda progreso permanente. Se puede jugar en modo local sin cuenta pero sin persistencia entre sesiones.

## El Nivel de Coleccionista
El nivel de Coleccionista es la métrica global de progreso del jugador. Sube con todas las acciones de coleccionismo y nunca baja.

**Fuentes de puntos:**

| Acción | Puntos |
|---|---|
| Confirmar un Set | +5 |
| Confirmar un personaje | +1 |
| Confirmar un lugar de Set | +2 |
| Crear un lugar genérico | +3 |
| Subir nivel de un Set | +1 por nivel |
| Crear un Eco personalizado | +2 |
| Completar una run | +10 |
| Derrotar un Jefe de Área | +3 |
| Derrotar al Fusionado | +5 |

**Gasto de puntos:**
- Desbloquear un slot adicional de Set (cualquier color): 20 puntos

En el futuro se podrán desbloquear más cosas con puntos. Por ahora solo slots.

## Historial Completo
El historial guarda estadísticas de todas las runs jugadas. Accesible desde el menú Aventura.

**Por run:**
- Fecha y duración total
- Sets y líderes usados
- Nodos completados y tipo de cada uno
- Resultado (victoria, derrota, rendición) y en qué nodo
- Ecos equipados en cada momento
- Checkpoint más alto alcanzado
- Lereles gastados y ganados
- Cartas compradas y vendidas

**Estadísticas globales acumuladas:**
- Runs totales jugadas / completadas / abandonadas
- Tasa de victoria global y por set
- Total de Flows conseguidos
- Total de Pifias cometidas
- Total de tiempo de Vibración acumulado en todas las runs
- Enemigo corrupto más derrotado
- Lugar más conquistado
- Eco más usado
- Personaje más usado como líder / como invitado
- Racha más larga de Flows consecutivos
- Run más rápida completada (menos tiempo de Vibración)
- Run más larga completada
- Total de líderes reanimados
- Total de invitados descartados

**Por personaje:**
- Runs jugadas con él como líder
- Combates completados como invitado
- Total de Presencia infligida (Confrontar)
- Total de Influencia aplicada (Intervenir)
- Flows conseguidos
- Veces en KO
- Nivel actual y grado actual
- Coronas obtenidas

**Por Set:**
- Runs jugadas con él
- Runs completadas
- Mejor resultado
- Lugar del Set más veces conquistado
- Jefe del Set más veces derrotado

## Logros
Todos los logros son visibles desde el principio con su condición. No hay logros ocultos por ahora.

Al desbloquear un logro aparece una notificación y si da recompensa se entrega en ese momento.

**Logros de Run (dan Ecos especiales únicos):**

| Logro | Condición | Recompensa |
|---|---|---|
| Dúo | Completar una run con exactamente 2 líderes | Eco Especial "Dúo" |
| Trío | Completar una run con exactamente 3 líderes | Eco Especial "Trío" |
| Cuarteto | Completar una run con exactamente 4 líderes | Eco Especial "Cuarteto" |
| Quinteto | Completar una run con exactamente 5 líderes | Eco Especial "Quinteto" |

**Logros de Vibra:**

| Logro | Condición | Recompensa |
|---|---|---|
| En el Flow | Conseguir 10 Flows en un solo combate | Eco Especial "En el Flow" |
| Manos Limpias | Completar una run sin ninguna Pifia | Eco Especial "Manos Limpias" |
| Relámpago | Completar una run con menos de 3 minutos de Vibración acumulada | Eco Especial "Relámpago" |
| Perfeccionista | Conseguir Flow en todas las pruebas de un combate | +5 puntos Coleccionista |
| Sin Red | Completar un combate usando solo Vibra, sin ninguna Acción Segura | +3 puntos Coleccionista |

**Logros de Colección:**

| Logro | Condición | Recompensa |
|---|---|---|
| Primer Set | Confirmar tu primer Set | +10 puntos Coleccionista |
| Coleccionista Serio | Tener 5 Sets confirmados simultáneamente | +20 puntos Coleccionista |
| El Archivo | Tener 10 Ecos equipados al ganar una run | Eco Especial "El Archivo" |
| Abraza el Caos | Completar una run con 3 o más Ecos de doble filo | Eco Especial "Abraza el Caos" |

**Logros de Maestría de Ecos:**
Cada Eco del juego tiene su propio logro de Maestría: usarlo para ganar con las 4 coronas (2, 3, 4 y 5 líderes). Al completar la Maestría de un Eco aparece un indicador especial permanente en su carta dentro de la Colección.

**Logros de Corrupción:**

| Logro | Condición | Recompensa |
|---|---|---|
| Purificador | Derrotar al Fusionado por primera vez | +10 puntos Coleccionista |
| Sin Piedad | Derrotar al Fusionado sin que ningún líder caiga en KO | +5 puntos Coleccionista |
| Coleccionista Completo | Tener todos los líderes de un Set al grado 10 | +20 puntos Coleccionista |
| PSA 10 | Tener todos los personajes de todos tus Sets al grado 10 | Indicador especial en el perfil |

## Futuro: Modo Sin Fin
No implementado en esta versión. La idea es un modo donde las runs continúan indefinidamente, enfrentando a todos los jefes de todos los Sets disponibles en secuencia hasta que el jugador caiga. Inspirado en el modo infinito de Balatro.

## Los Dos Menús Revisados

**Aventura:**
- Iniciar nueva run
- Continuar run activa (si existe)
- Historial de runs
- Logros

**Coleccionista:**
- Mis Sets (gestión de Sets, personajes y lugares)
- Ecos (colección + editor)
- Estadísticas globales
- Nivel de Coleccionista y puntos disponibles
- Perfil (cuenta Google, datos de sesión)

---

# SECCIÓN 11: UI/UX y Flujos de Pantalla

## Principios de UI
- **Limpio y rápido**: las transiciones son ágiles. El jugador no espera
- **Móvil primero, vertical**: todo el diseño se concibe para pantalla vertical móvil. Lo que funciona en vertical funciona en escritorio, no al revés
- **El cronómetro siempre protagonista**: cuando aparece el TimingChallenge ocupa el centro de la pantalla sin competencia visual
- **Información jerarquizada**: lo crítico (Aura, tiempo de Vibración, intención del rival) siempre visible. Lo secundario, accesible con un toque
- **Feedback inmediato**: cada acción tiene respuesta visual instantánea. El jugador nunca duda si su toque fue registrado

## Flujo General de Pantallas

```
Splash / Logo
    ↓
Login (Google OAuth)
    ↓ [o Saltar → modo local sin persistencia]
Menú Principal
    ├── Aventura
    │     ├── Nueva Run
    │     │     ├── Selección de Sets (2-5)
    │     │     ├── Selección de Líderes (1 por Set)
    │     │     ├── Vista de Baraja
    │     │     └── Mapa
    │     │           └── Nodo
    │     │                 ├── [Combate] → Pantalla de Combate
    │     │                 │                    └── Recompensa
    │     │                 │                          └── Mapa
    │     │                 └── [Mercader] → Pantalla del Mercader
    │     │                                       └── Mapa
    │     ├── Continuar Run (si existe)
    │     ├── Historial
    │     └── Logros
    └── Coleccionista
          ├── Mis Sets
          ├── Ecos
          ├── Estadísticas
          └── Perfil
```

## Pantalla de Login
- Logo de Aura centrado
- Botón "Continuar con Google" prominente
- Botón pequeño "Jugar sin cuenta (progreso local)" debajo
- Sin distracciones. Fondo oscuro con efecto sutil

## Menú Principal
- Dos botones grandes: **Aventura** y **Coleccionista**
- Nivel de Coleccionista visible en la esquina superior
- Si hay una run activa: banner "Continuar Run" sobre el botón Aventura
- Fondo: arte generado desde los Sets del jugador

## Flujo de Nueva Run

**Paso 1: Selección de Sets**
- Grid de Sets disponibles (confirmados)
- Seleccionar entre 2 y 5
- Cada Set muestra: nombre, color, categoría, número de personajes, nivel medio
- Contador visible: "X/5 Sets seleccionados"
- Botón Continuar activo solo con 2 o más

**Paso 2: Selección de Líderes**
- Por cada Set elegido: mostrar sus líderes disponibles
- Elegir 1 por Set
- Cada líder muestra su ficha completa expandible
- El líder muestra su grado, corona si la tiene, y nivel actual
- Botón Continuar cuando hay 1 líder por cada Set

**Paso 3: Vista de Baraja**
- Muestra las cartas que formarán la baraja en orden aleatorio
- Cada carta muestra nombre, imagen, Aura, habilidades heredadas
- Solo lectura por ahora
- Botón "Comenzar Aventura"

**Paso 4: Mapa**
- Ver sección de Mapa más abajo

## El Mapa

**Layout vertical (móvil):**
- El mapa se lee de abajo hacia arriba
- El nodo actual está destacado con borde brillante
- Los nodos completados aparecen con check y desaturados
- Los nodos futuros son visibles pero no pulsables hasta llegar a ellos
- Cada nodo muestra: tipo (icono), enemigo si aplica (imagen pequeña), lugar si aplica (icono)

**Nodo con elección:**
- Los nodos que no son Jefe ni Fusionado muestran dos opciones al pulsar:
  - **Combatir**: entra al combate del nodo
  - **Mercader**: va a la tienda (solo disponible si hay Mercader en ese nodo)
- Jefe y Fusionado: entran directo al combate sin elección

**Transiciones del mapa:**
- Al completar un nodo: animación de check + partículas del color del Set
- Al entrar a un Jefe de Área: intro con nombre del Jefe en grande, 2-3 segundos
- Al entrar al Fusionado: intro elaborada con las imágenes de los líderes fusionándose

## Pantalla de Combate

**Layout vertical (móvil):**
```
┌─────────────────────────────┐
│ HEADER: rival | fase | L    │
├─────────────────────────────┤
│ PANEL RIVAL                 │
│ imagen | nombre | Aura bar  │
│ intención próximo turno     │
├──────────────┬──────────────┤
│              │              │
│  EL FOSO     │  LUGAR(ES)   │
│  personajes  │  resonancia  │
│  aquí        │  barra       │
│              │  efectos     │
│              │              │
├─────────────────────────────┤
│ TIEMPO DE VIBRACIÓN (grande)│
├─────────────────────────────┤
│ TOOLBAR: robar|descartar    │
│          |ver baraja|pasar  │
├─────────────────────────────┤
│ HQ: scroll horizontal       │
│ [carta][carta][carta]...    │
└─────────────────────────────┘
```

**Elementos siempre visibles:**
- Nombre del rival en el header (nunca el nombre del lugar)
- Fase actual formato X.Y
- Lereles actuales
- Intención del rival (badge con icono + texto corto)
- Tiempo de Vibración acumulado con indicador de color (verde < 5min, naranja 5-8min, rojo > 8min)
- Cartas en mazo + en descarte
- Aura de cada personaje sobre su carta (desglosada en P/I/T al tocar)

**Al seleccionar un personaje:**
- Panel de acciones flotante encima de él
- Muestra: habilidades disponibles, botón Confrontar (si aplica), botón Intervenir (si aplica), botón Descansar (si agotado), botón Descartar +1L (si es invitado en HQ)
- Mover: arrastrando la carta al destino

**TimingChallenge:**
- Overlay completo, centra la atención
- Muestra: tipo de acción, personaje, objetivo, margen, bonus de tiempo, zonas de Flow/Vibra/Fallo/Pifia en la barra
- Botón EMPEZAR grande → cambia a PARAR al iniciar
- Resultado con animación 1.5s antes de cerrar

**Feedback visual de acciones:**
- Acción Segura: flash verde rápido, número flotante
- Flow: explosión dorada, número grande flotante
- Vibra: flash verde, número flotante
- Fallo: flash naranja
- Pifia: shake rojo, número en rojo
- Daño recibido: flash rojo sobre el personaje afectado
- Acción del rival: highlight rojo en el objetivo

**Transiciones especiales:**
- Al conquistar un lugar: animación dorada, texto "¡LIBERADO!"
- Al derrotar al rival: pantalla de victoria con partículas del color del Set
- Al KO de un líder: animación de carta cayendo al HQ
- Al entrar a un Jefe de Área: intro de 2-3 segundos

## Pantalla de Recompensa
- Lereles ganados (animación de contador subiendo)
- Selección de Eco: 3 opciones. Si HQ de Ecos lleno: opción de descartar primero
- Mejora de personaje: elegir carta y atributo a subir (Presencia, Influencia o Temple)
- Botón "Continuar" → vuelve al mapa

## Pantalla del Mercader
- Lista de cartas disponibles con precio
- Lista de Ecos disponibles con precio y rareza
- Lista de mejoras disponibles
- Sección "Vender Ecos" con precio de venta
- Lereles actuales siempre visible en el header
- Botón "Salir" → vuelve al mapa

## Pantalla de Fin de Run

**Victoria:**
- Animación de celebración con los líderes de la run
- Resumen: nodos completados, Flows, tiempo de Vibración, Lereles
- Logros desbloqueados en esta run
- Subida de grado de las cartas participantes (animación por carta)
- Coronas nuevas si las hay
- Desbloqueo libre: elegir un personaje de los Sets participantes
- Botón "Volver al menú"

**Derrota:**
- Pantalla más sobria
- Punto más alto alcanzado
- Experiencia ganada por las cartas
- Botón "Intentarlo de nuevo" y "Volver al menú"

## Consideraciones Móvil

**Gestos:**
- Arrastrar carta al destino para mover
- Toque largo en keyword para ver tooltip
- Swipe horizontal en el HQ para ver más cartas
- Swipe vertical en el log para ver historial

**Tamaños táctiles:**
- Botones mínimo 44×44px
- Cartas en HQ mínimo 60×80px
- El botón PARAR del cronómetro especialmente grande (toda la pantalla si es posible)

**Orientación:**
- Solo vertical
- Si el dispositivo rota a horizontal: mensaje pidiendo volver a vertical

---

# SECCIÓN 12: El Editor

## Qué es el Editor
El Editor es el segundo juego dentro de Aura. Es donde el coleccionista construye su mundo: crea Sets, diseña personajes y define lugares. No hay tags, no hay pesos ocultos. Todo lo que hace un personaje está explicado en el glosario y es visible en su carta.

El Editor tiene dos modos de uso:
- **Modo guiado**: el jugador rellena campo por campo con validación en tiempo real
- **Surprise Me**: genera un personaje, lugar o Eco coherente con su color de forma aleatoria. El jugador puede aceptarlo, modificarlo o regenerarlo

## Acceso al Editor
Desde el menú Coleccionista → Mis Sets. Todo empieza con un Set. No hay personajes ni lugares sin Set.

---

## El Editor de Sets

### Flujo de creación de un Set

**Paso 1: Elegir color**
- 5 botones de color con sus slots disponibles visibles
- Si un color no tiene slots libres: botón deshabilitado con texto "Sin slots disponibles (20 puntos para desbloquear)"
- Al elegir color: avanza al paso 2

**Paso 2: Elegir o crear categoría**
- Muestra las categorías existentes de ese color (máximo 3)
- Si hay menos de 3: opción "Nueva categoría" con campo de texto
- Al elegir o crear: avanza al paso 3

**Paso 3: Nombrar el Set**
- Campo de texto: nombre del Set
- Validación en tiempo real: mínimo 2 caracteres, máximo 30, sin caracteres especiales
- Preview del badge del Set actualizado en tiempo real
- Botón "Crear Set" → crea el Set en estado Borrador y entra a la pantalla del Set

### Pantalla del Set
- Header: nombre, color, categoría, estado actual
- Barra de progreso hacia confirmación: "X/6 personajes confirmados · Lugar: sí/no"
- Disclaimer si no cumple mínimos
- Grid de personajes del Set
- Botón "Añadir Personaje"
- Botón "Crear Lugar del Set"
- Botón "Confirmar Set" (activo solo cuando cumple los mínimos)
- Botón "Surprise Me Set" (genera un Set completo aleatorio coherente con el color)

### Confirmar un Set
- Modal de resumen: nombre, color, categoría, número de personajes, lugar
- Advertencia: "Una vez confirmado, el nombre, color y categoría no podrán modificarse"
- Botón "Confirmar" → estado Confirmado, +5 puntos de Coleccionista

---

## El Editor de Personajes

El personaje se crea dentro de un Set. Al pulsar "Añadir Personaje" se abre el editor con 4 secciones navegables.

### Sección 1: Datos Básicos

| Campo | Tipo | Validación |
|---|---|---|
| Nombre | Texto | 2-30 caracteres, obligatorio |
| Frase | Texto | Máximo 80 caracteres, opcional |
| Imagen | URL o subida | Formato imagen válido, opcional |
| Set | Fijo (heredado) | No editable desde aquí |

- Color y categoría mostrados como badge informativo (no editables)
- Preview de la carta actualizado en tiempo real

### Sección 2: Como Líder

**Aura calculada (display, no editable):**
```
Sin habilidades avanzadas    → Aura 8
+ Habilidad Activa           → Aura 7
+ Habilidad Pasiva           → Aura 6
+ Activa y Pasiva            → Aura 5
+ Ultimate ≥ 5L              → Aura -1
```
El Aura se reparte automáticamente en Presencia / Influencia / Temple según el perfil del color.

**Habilidad Activa (opcional, máximo 1):**
- Selector de keywords disponibles para el color (filtrado automático)
- Nivel editable con preview de valores por nivel
- Coste en Lereles calculado automáticamente (1L por keyword, máximo 3L)
- Nombre de la habilidad (opcional, se genera automáticamente si se deja vacío)

**Habilidad Pasiva (opcional, máximo 1):**
- Mismo sistema filtrado a keywords pasivas

**Ultimate (opcional):**
- Mismo sistema, coste máximo 10L
- Si coste ≥ 5L: aviso "Esta Ultimate reducirá el Aura base en 1"
- Puede tener múltiples keywords

**Botón "Surprise Me Líder":** genera habilidades aleatorias coherentes con el color.

### Sección 3: Como Invitado

**Aura calculada:**
```
Sin habilidades    → Aura 5
Por cada habilidad → Aura -1
Mínimo            → Aura 1
```

**Habilidades heredadas:** checkboxes de las del líder marcadas como heredables. Las incompatibles aparecen deshabilitadas con tooltip.

**Efecto al Robarse o En HQ:** selector de trigger + keywords disponibles para ese trigger.

**Efecto al Descartarse:** dos campos (desde HQ / desde Lugar o Foso).

**Botón "Surprise Me Invitado".**

### Sección 4: Como Corrupto

Fondo rojo oscuro. Badge "MODO CORRUPTO".

**Aura como jefe (calculada):**
```
Combate normal    → Aura Líder × 3
Élite             → Aura Líder × 10
Jefe de Área      → Aura Líder × 20
Fusionado         → Aura Líder × 10 (se suma con los demás)
```

**Objetivo Vibra:** slider 0-99 con preview ".XX"

**Las 4 acciones base (valores editables):**
- Atacar Foso: quita X de Temple al personaje en el Foso
- Recuperar: recupera X Aura propia
- Intervenir en Lugar: añade X resonancia al lugar
- Atacar Lugar: quita X de Temple a personajes en el lugar

**Keyword activa del corrupto (1):** selector filtrado a corrupto_activa.

**Keyword pasiva del corrupto (1):** selector filtrado a corrupto_pasiva.

**Reacción a Lugar Perdido:** selector de efecto.

**Condiciones de turno extra:** lista editable con selector de condiciones.

**Condición de Ultimate:** selector (Aura < 50% / X turnos sin confrontar / Lugar conquistado / Todos en KO).

**Modificadores del cronómetro:** checkboxes (Sin línea de tiempo / Sin centésimas / Tiempo reducido).

**Temporizador especial (opcional):** si el jugador acumula X minutos de Vibración en el Foso, el corrupto lanza su Ultimate.

**Botón "Auto-generar desde habilidades".**

### Confirmar un Personaje
- Validación completa al pulsar Confirmar
- Si hay errores: lista de problemas a resolver
- Si todo está bien: preview de la carta en sus 3 versiones (Líder, Invitado, Corrupto)
- Confirmar → +1 punto de Coleccionista

---

## El Editor de Lugares

Los lugares de Set se crean desde la pantalla del Set. Los lugares genéricos desde Coleccionista → Mis Sets → Lugares Genéricos (coste: 5 puntos).

El flujo es idéntico para ambos. Los lugares de Set tienen una sección adicional: la Habilidad de Set.

### Sección 1: Datos Básicos

| Campo | Tipo | Validación |
|---|---|---|
| Nombre | Texto | 2-30 caracteres, obligatorio |
| Emoji / Icono | Selector | Obligatorio |
| Set | Fijo si es de Set / Vacío si es genérico | No editable |
| Tipo de lugar | Selector | Obligatorio |

### Sección 2: Parámetros de Vibra
Los campos varían según el tipo elegido:

**Si tipo = Básico:**
- Objetivo (segundos): slider 1.00 a 7.00
- Margen de Pifia: slider en centésimas

**Si tipo = Cronometrado:**
- Centésimas objetivo: slider 0-99
- Tiempo límite: mínimo 60 segundos

Todos los tipos muestran:
- Resonancia inicial
- Límite superior (opcional)
- Consecuencia de Pifia: selector

### Sección 3: Efectos y Bonus

**Pasiva del lugar (opcional):** descripción + selector de efecto.

**Bonus al conquistar:** tipo (Lereles / Aura / Eco aleatorio / Recompensa inmediata) + valor.

**Temporizador (opcional):** si el jugador acumula X minutos de Vibración aquí: selector de consecuencia.

### Sección 4: Habilidad de Set (solo lugares de Set)

**Si ningún líder del jugador es del Set:**
- Descripción + selector de efecto negativo para el jugador

**Si algún líder del jugador es del Set:**
- Descripción + selector de efecto positivo para el jugador

### Confirmar un Lugar
- Preview visual con todos sus parámetros
- Lugar de Set: +2 puntos de Coleccionista
- Lugar genérico: +3 puntos de Coleccionista

---

## El Editor de Ecos

Desde Coleccionista → Ecos → Crear Eco.

| Campo | Tipo | Validación |
|---|---|---|
| Nombre | Texto | 2-30 caracteres, obligatorio |
| Descripción | Texto | Máximo 120 caracteres, obligatorio |
| Categoría | Selector | Vibra / Personaje / Lugar / Economía / Sinergia |
| Rareza | Selector | Normal / Infrecuente / Raro |
| Doble Filo | Toggle | Si activo: campo de penalización obligatorio |
| Efecto | Selector + valor | Según categoría |
| Penalización | Selector + valor | Solo si Doble Filo activo |

Sin límite artificial de potencia. El jugador puede crear Ecos tan potentes como quiera. Los Ecos creados entran al pool general.

**Botón "Surprise Me Eco":** genera un Eco aleatorio coherente con la categoría elegida.

Al confirmar: +2 puntos de Coleccionista.

---

## Glosario del Editor
Accesible desde cualquier punto del editor con un botón fijo "?" en la esquina.

El glosario explica en lenguaje simple:
- Qué es cada keyword y qué hace en combate
- Qué son Presencia, Influencia y Temple y cómo afectan al cronómetro
- Qué es la Vibra, el Flow, la Pifia
- Qué tipos de lugar existen y cómo funcionan
- Qué son los Ecos y cómo se aplican

Sin pesos, sin fórmulas internas visibles. Solo descripciones claras.

---

---

# BANCO DE IDEAS: Mecánicas de Cronómetro

Ideas catalogadas para futuras versiones. No forman parte del diseño actual pero están documentadas para no perderlas. Se integrarán como Ecos, modificadores de corrupto, tipos de lugar o keywords cuando el juego base esté validado.

## Modificadores de Cronómetro Pendientes

**Objetivo Móvil**
El objetivo se desplaza por la línea de tiempo mientras el cronómetro corre. El jugador debe "cazarlo" parando cuando el objetivo pasa por su posición. Complejidad alta, reservado para bosses muy especiales.

**Parada Forzada**
El cronómetro se para solo en un momento aleatorio. Si el jugador no pulsó antes de ese momento, pierde automáticamente. Mecánica de presión extrema.

**Dos Objetivos**
Hay dos números objetivo. El jugador para una vez. El más cercano de los dos cuenta. Simplifica la decisión pero la hace más estratégica.

**Acelerón Extremo**
Empieza a ×0.1, se acelera agresivamente cada segundo hasta ×5 o más. Versión más extrema del Acelerón ya integrado.

**Ciego Total**
La pantalla se vuelve completamente negra a los 2 segundos. Solo hay feedback auditivo (un tick cada décima). El jugador depende de su ritmo interno. Extremo, reservado para un boss muy concreto.

## Tipos de Lugar Pendientes

**Lugar Bucle**
Cronómetro de 0 a 2 segundos que reinicia instantáneamente en bucle. Corre tan rápido que solo se percibe el color de fondo que cambia. Intervenir requiere sentir el ritmo en lugar de ver el número.

**Lugar Cadena**
5 sub-objetivos seguidos. Parar el primero activa el segundo, y así. Cada acierto reduce la velocidad del siguiente (se vuelve más fácil en racha). Cada fallo la aumenta. Premia la consistencia.

## Mecánicas de Ecos Pendientes

**Eco / Segundo Intento de Memoria**
Paras el cronómetro. No ves el resultado. 3 segundos después vuelve a correr y debes parar en el mismo valor exacto de memoria. Si aciertas: ×5. Muy difícil, muy recompensado.

**Sombra**
Una "sombra" recorre el cronómetro a la velocidad de tu parada anterior. Debes parar cuando tu posición actual se solapa con la sombra. Compites contra ti mismo.

**Suma Perfecta**
Paras dos veces en una prueba. La suma de ambas paradas debe ser exactamente igual al tiempo límite (ej: 10.00). Estrategia: ¿paro en 4.20 y busco 5.80? Mecánica de dos fases.

**Fantasma**
Aparece un cursor fantasma que corre 0.3 segundos adelantado al real. El cerebro tiende a seguirlo. El desfase varía (0.1 a 0.5) para ser inconsistente. Eco de confusión mental.

**Relojero**
3 cronómetros distintos activos simultáneamente (lineal, péndulo, acelerado). Solo 2 toques para pararlos todos en el mismo valor. Mecánica de puzzle extrema.

## Ideas de Duelo PvE Pendientes
*(No PvP, solo para la IA corrupta)*

**Encuentro**
El corrupto también "para el cronómetro" en su turno (resultado aleatorio ponderado por dificultad). El que esté más cerca del objetivo gana ese turno. Añade drama visual al turno del rival.

**Subasta de Tiempo**
El objetivo es visible. Tú y el corrupto parais. El que está más lejos del objetivo sin pasarse gana. Mecánica de farol / lectura del rival.

---

*GDD v1.1 — Documento vivo. Sujeto a cambios durante el desarrollo.*