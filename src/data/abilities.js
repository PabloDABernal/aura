/**
 * Habilidades activas genéricas. Bloque 2.3.
 * Solo estructura — efectos pendientes de implementación.
 */
export const ABILITIES = {
  emboscada: {
    id:       'emboscada',
    name:     'Emboscada',
    icon:     '🥷',
    desc:     'Mueve sin consumir turno',
    cooldown: 3,
    type:     'active',
  },
  inspirar: {
    id:       'inspirar',
    name:     'Inspirar',
    icon:     '✨',
    desc:     '+1 Temple a un aliado del HQ',
    cooldown: 2,
    type:     'active',
  },
  resistir: {
    id:       'resistir',
    name:     'Resistir',
    icon:     '🛡️',
    desc:     'Reduce el daño del siguiente fallo a la mitad',
    cooldown: 3,
    type:     'active',
  },
  precisar: {
    id:       'precisar',
    name:     'Precisar',
    icon:     '🎯',
    desc:     'La próxima Vibra tiene margen +2',
    cooldown: 2,
    type:     'active',
  },
  provocar: {
    id:       'provocar',
    name:     'Provocar',
    icon:     '💢',
    desc:     'Fuerza al corrupto a ejecutar presencia_up en su próximo turno',
    cooldown: 4,
    type:     'active',
  },
};

export const ABILITY_LIST = Object.values(ABILITIES);
