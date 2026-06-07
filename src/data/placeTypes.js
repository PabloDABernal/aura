// 12 tipos de lugar — GDD sección 4 (Tipos de Lugares)

export const PLACE_TYPES = {
  basico: {
    id: 'basico',
    name: 'Básico',
    description: 'Parada en punto exacto. Resistencia inicial = doble del Aura del enemigo.',
    mechanic: 'Modo punto exacto, tiempo límite 7s. El rival puede hacerlo perder si la resonancia supera el límite.',
    vibraMode: 'punto',
  },
  cronometrado: {
    id: 'cronometrado',
    name: 'Cronometrado',
    description: 'Resonancia fija con temporizador. El tiempo es el recurso clave.',
    mechanic: 'Modo centésimas, 10s por intento. El rival resta segundos directamente al contador.',
    vibraMode: 'centesimas',
  },
  completo: {
    id: 'completo',
    name: 'Completo',
    description: 'Mezcla de Básico y Cronometrado. El reto más equilibrado.',
    mechanic: 'Tiempo límite mínimo 2 minutos. El rival sube resonancia en vez de restar segundos.',
    vibraMode: 'punto',
  },
  carrera: {
    id: 'carrera',
    name: 'Carrera de Auras',
    description: 'Dos marcadores enfrentados. El primero en llegar a 0 conquista el lugar.',
    mechanic: 'Modo centésimas. Las Pifias pueden subir la resonancia del rival en vez de la propia.',
    vibraMode: 'centesimas',
  },
  bastion: {
    id: 'bastion',
    name: 'Bastión',
    description: 'Bloquea todas las demás acciones hasta ser conquistado.',
    mechanic: 'Funciona como Básico pero mientras no esté conquistado impide intervenir en otros lugares y confrontar.',
    vibraMode: 'punto',
  },
  espejo: {
    id: 'espejo',
    name: 'Espejo',
    description: 'Cada intervención exitosa sube la resonancia del rival a la mitad.',
    mechanic: 'El Flow no transfiere bonus al rival. Obliga a elegir cuidadosamente cuándo intervenir.',
    vibraMode: 'centesimas',
  },
  maldito: {
    id: 'maldito',
    name: 'Maldito',
    description: 'La resonancia sube automáticamente cada cierto tiempo global.',
    mechanic: 'Cada X segundos de tiempo global añade resonancia. Requiere atención constante o se desborda.',
    vibraMode: 'centesimas',
  },
  eco: {
    id: 'eco',
    name: 'Eco',
    description: 'Al conquistarlo activa un Eco aleatorio, positivo o negativo.',
    mechanic: 'El jugador no sabe qué Eco obtendrá hasta conquistarlo. Alto riesgo, alta recompensa.',
    vibraMode: 'punto',
  },
  sacrificio: {
    id: 'sacrificio',
    name: 'Sacrificio',
    description: 'Para intervenir se necesita tener algún personaje en KO o descartado.',
    mechanic: 'Requiere sacrificio previo en el combate. Alta recompensa si se logra conquistar.',
    vibraMode: 'centesimas',
  },
  resonante: {
    id: 'resonante',
    name: 'Resonante',
    description: 'Dos fases: primero bajar a la mitad con reglas normales, luego las reglas cambian.',
    mechanic: 'Segunda fase activa nuevos modificadores del cronómetro. Más difícil pero más recompensa.',
    vibraMode: 'centesimas',
  },
  fortaleza: {
    id: 'fortaleza',
    name: 'Fortaleza',
    description: 'El rival tiene un escudo de resonancia que debe romperse antes de reducir el lugar.',
    mechanic: 'Hasta romper el escudo del rival no se puede reducir la resonancia del lugar.',
    vibraMode: 'centesimas',
  },
  pendulo: {
    id: 'pendulo',
    name: 'Péndulo',
    description: 'El cronómetro oscila como un péndulo. Premia el ritmo más que la precisión puntual.',
    mechanic: 'La amplitud se reduce con cada oscilación. La ventana de acierto se estrecha progresivamente.',
    vibraMode: 'punto',
  },
};

export const PLACE_TYPE_IDS  = Object.keys(PLACE_TYPES);
export const PLACE_TYPE_LIST = Object.values(PLACE_TYPES);
