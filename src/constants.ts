export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image?: string;
  video?: string;
}

export const MENU_DATA: MenuItem[] = [
  // ENTRADAS
  { id: 'e1', name: 'Rac Papas fritas', price: 6.99, category: 'Entradas' },
  { id: 'e2', name: 'Papas fritas con queso fundido y tocineta', price: 4.99, category: 'Entradas' },
  { id: 'e3', name: 'Papas fritas a la parmesana', price: 4.99, category: 'Entradas' },
  { id: 'e4', name: 'Tenders de Pollo', price: 4.99, category: 'Entradas' },
  { id: 'e5', name: 'Chupetas de pollo', price: 4.99, category: 'Entradas' },
  { id: 'e6', name: 'Mini pizza', price: 4.99, category: 'Entradas' },
  { id: 'e7', name: 'Ración de Nachos con queso', price: 4.99, category: 'Entradas' },
  { id: 'e8', name: 'Ración de Nachos con guacamole', price: 4.99, category: 'Entradas' },
  { id: 'e9', name: 'Ración de Nacho', price: 4.99, category: 'Entradas' },
  { id: 'e10', name: 'Ración de Nachos pico de gallo', price: 4.99, category: 'Entradas' },
  { id: 'e11', name: 'Ración de Tequeños', price: 4.99, category: 'Entradas' },
  { id: 'e12', name: 'Pan de ajo', price: 4.99, category: 'Entradas' },
  { id: 'e13', name: 'Canastas de Camarón', price: 4.99, category: 'Entradas' },
  { id: 'e14', name: 'Canastas de Ceviche', price: 4.99, category: 'Entradas' },
  { id: 'e15', name: 'Brochetas de chorizo y queso', price: 4.99, category: 'Entradas' },

  // BURRITOS
  { id: 'b1', name: 'Tradicional', description: 'Dos suaves tortillas de maíz con base de frijoles, proteína de preferencia (pollo o carne), topping de lechuga, pico de gallo, guacamole, queso y nata.', price: 4.99, category: 'Burritos' },
  { id: 'b2', name: 'Crunch', description: 'Dos suaves tortillas de maíz rellena de cerdo, carne salteada o pollo con cebolla y piña con topping de cilantro, limón, aguacate, nata, queso y pico de gallo.', price: 6.99, category: 'Burritos' },
  { id: 'b3', name: 'Al Pastor', description: 'Dos suaves tortillas de maíz rellenas de camarones enchilados, topping de lechuga, pico de gallo, aguacate, queso y nata.', price: 6.99, category: 'Burritos' },

  // NACHOS
  { id: 'n1', name: 'Normales', description: 'Crujientes tortillas de maíz cubiertas con proteínas, frijoles, pico de gallo, guacamole y queso fundido.', price: 6.99, category: 'Nachos' },
  { id: 'n2', name: 'Con Queso', description: 'Crujientes tortillas de maíz cubiertas con delicioso queso fundido.', price: 4.99, category: 'Nachos' },
  { id: 'n3', name: 'Guacamole', description: 'Crujientes tortillas de maíz cubiertas con delicioso Guacamole.', price: 4.99, category: 'Nachos' },
  { id: 'n4', name: 'Bacon Cheese', description: 'Crujientes tortillas de maíz cubiertas con delicioso queso fundido y tocineta.', price: 6.99, category: 'Nachos' },

  // FAJITAS
  { id: 'f1', name: 'Carne', description: 'Salteado de carne con vegetales y vino blanco, pico e gallo, guacamole. Acompañado de 5 suaves tortillas de trigo. Servido en plancha caliente.', price: 6.99, category: 'Fajitas' },
  { id: 'f2', name: 'Pollo', description: 'Salteado de Pollo con vegetales y vino blanco, pico e gallo, guacamole. Acompañado de 5 suaves tortillas de trigo. Servido en plancha caliente.', price: 4.99, category: 'Fajitas' },
  { id: 'f3', name: 'Mixta', description: 'Salteado de Pollo y carne con vegetales y vino blanco, pico e gallo, guacamole. Acompañado de 5 suaves tortillas de trigo. Servido en plancha caliente.', price: 4.99, category: 'Fajitas' },

  // QUESADILLAS
  { id: 'q1', name: 'Tradicional', description: 'Suave tortilla de trigo rellena de queso derretido a la plancha y topping ahumado.', price: 4.99, category: 'Quesadillas' },
  { id: 'q2', name: 'Sencronizada', description: 'Suave tortilla rellena con la proteína de tu preferencia queso topping de cilantro.', price: 3.50, category: 'Quesadillas' },

  // TACOS
  { id: 't1', name: 'Tradicional', description: 'Dos suaves tortillas de maíz con base de frijoles, proteína de preferencia (pollo o carne), topping de lechuga, pico de gallo, guacamole, queso y nata.', price: 4.99, category: 'Tacos' },
  { id: 't2', name: 'Al Pastor', description: 'Dos suaves tortillas de maíz rellena de cerdo, carne salteada o pollo con cebolla y piña con topping de cilantro, limón, aguacate, nata, queso y pico de gallo.', price: 6.99, category: 'Tacos' },
  { id: 't3', name: 'Camarones Enchilados', description: 'Dos suaves tortillas de maíz rellenas de camarones enchilados, topping de lechuga, pico de gallo, aguacate, queso y nata.', price: 6.99, category: 'Tacos' },

  // OTROS
  { id: 'o1', name: 'Enchilada', description: 'Suave tortilla de trigo con proteína de tu preferencia con topping de cilantro (toque picante), lechuga, pico e gallo.', price: 5.00, category: 'Otros' },
  { id: 'o2', name: 'Tamales', description: 'Delicioso "bollito" de maíz relleno con proteína de tu preferencia, con topping cilantro, pico y gallo.', price: 4.00, category: 'Otros' },
  { id: 'o3', name: 'Tostadas', description: 'Crujiente tortilla de maíz, con base de frijoles refritos, la proteína de tu preferencia, con topping de ahumado pico e gallo, guacamole, queso, nata y maíz.', price: 3.50, category: 'Otros' },
  { id: 'o4', name: 'Flautas', description: 'Crujientes tortillas de maíz fritas rellenas de pollo y queso cubiertas con un topping de guacamole, pico e gallo y nata.', price: 4.50, category: 'Otros' },

  // PEPITOS
  { id: 'p1', name: 'Sinaloa', description: 'Pan artesanal del 30cm - 300g de proteína, queso mozarella, Cebolla caramelizada, queso pecorino, queso fundido, maíz dulce con topping de champiñón salteados.', price: 7.99, category: 'Pepitos' },
  { id: 'p2', name: 'Merida', description: 'Pan artesanal del 30cm - 300g de proteína, queso mozarella, queso pecorino, queso fundido, cebolla caramelizada.', price: 7.99, category: 'Pepitos' },
  { id: 'p3', name: 'Morelia', description: 'Pan artesanal del 30cm - 300g de costillas de cerdo a la BBQ, queso mozarella, Cebolla caramelizada, queso pecorino.', price: 7.99, category: 'Pepitos' },
  { id: 'p4', name: 'Playa el Carmen', description: 'Pan artesanal del 30cm - 300g de proteína, queso mozarella, queso pecorino, rodajas de tomate con salsa pesto.', price: 7.99, category: 'Pepitos' },
  { id: 'p5', name: 'Puerto Vallarta', description: 'Pan artesanal del 30cm - 300g de camarón al ajillo, queso pecorino.', price: 7.99, category: 'Pepitos' },
  { id: 'p6', name: 'Morelos', description: 'Pan artesanal del 30cm - 300g de pernil, queso mozarella, queso fundido y topping de cebolla frita.', price: 7.99, category: 'Pepitos' },

  // HAMBURGUESAS
  { id: 'h1', name: 'Acapulco', description: 'Pan alemán, 150g de punta trasera molida, queso mozarella, cebolla caramelizada, queso fundido, maíz dulce y champiñón salteado con salsa de cilantro.', price: 7.99, category: 'Hamburguesas' },
  { id: 'h2', name: 'Guadalajara', description: 'Pan alemán, 150g de punta trasera molida, queso cheddar fundido, tocineta, cebolla crunch, pepinillo y mayonesa ahumada.', price: 7.99, category: 'Hamburguesas' },
  { id: 'h3', name: 'Guadalupe', description: 'Pan alemán, 150g de churrasco de pollo, tocineta, cebolla frita y queso cheddar fundido.', price: 6.99, category: 'Hamburguesas' },
  { id: 'h4', name: 'Zacateca', description: 'Pan alemán, 150g de punta trasera molida, queso crema y pimientos dulces.', price: 6.99, category: 'Hamburguesas' },
  { id: 'h5', name: 'Querétaro', description: 'Pan alemán, pernil, cebolla crunch y nuestra salsa de cilantro.', price: 7.99, category: 'Hamburguesas' },
  { id: 'h6', name: 'Cancún', description: 'Pan alemán, 150g de punta trasera molida, cebolla crunch, queso cheddar fundido, tocineta y plátano.', price: 6.99, category: 'Hamburguesas' },
  { id: 'h7', name: 'Ciudad de Mexico', description: 'Pan alemán, churrasco de pollo empanizado relleno de queso mozarella, tocineta, cebolla caramelizada, maíz y nuestra salsa de cilantro.', price: 6.99, category: 'Hamburguesas' },

  // CLUB HOUSE
  { id: 'ch1', name: 'Club House', description: 'Pollo, jamón, tocineto, queso, lechuga y tomate, cortado en cuatro porciones triangulares. Con 150g de papas fritas.', price: 7.99, category: 'Club House' },

  // PIZZAS
  { id: 'pi1', name: 'Tijuana', description: 'Salsa napolitana, queso mozarella y jamón de pierna.', price: 7.00, category: 'Pizzas' },
  { id: 'pi2', name: 'Durango', description: 'Salsa napolitana, queso mozarella, cebolla, pimentón, jamón y tocineta.', price: 7.00, category: 'Pizzas' },
  { id: 'pi3', name: 'Tulún', description: 'Salsa napolitana, tomate picado, anchoas y albahaca.', price: 7.00, category: 'Pizzas' },
  { id: 'pi4', name: 'Veracruz', description: 'Salsa napolitana, queso mozarella y tocineta.', price: 7.00, category: 'Pizzas' },
  { id: 'pi5', name: 'Mazatlán', description: 'Salsa napolitana y full queso mozarella.', price: 7.00, category: 'Pizzas' },
  { id: 'pi6', name: 'Toluca', description: 'Salsa napolitana, tomate, huevo, jamón de pierna y tocineta.', price: 7.00, category: 'Pizzas' },
  { id: 'pi7', name: 'Culiacán', description: 'Salsa napolitana, queso mozarella, jamón, maíz y aceitunas negras.', price: 8.00, category: 'Pizzas' },
  { id: 'pi8', name: 'Cuernavaca', description: 'Salsa napolitana, queso y maíz.', price: 7.00, category: 'Pizzas' },
  { id: 'pi9', name: 'Chihuahua', description: 'Salsa napolitana, base blanca, camarones al ajillo y tocineta.', price: 8.00, category: 'Pizzas' },

  // PARRILLAS
  { id: 'pa1', name: 'Mixta Individual', description: 'Carne, pollo, chorizo, morcilla, papas fritas, Tostones y guasacaca.', price: 12.00, category: 'Parrillas' },
  { id: 'pa2', name: 'Mixta Familiar', description: 'Carne, pollo, chorizo, morcilla, papas fritas, Tostones y guasacaca.', price: 24.00, category: 'Parrillas' },

  // TRAGOS
  { id: 'tr1', name: 'Margarita', description: 'Tequila, Triple Sec, limón.', price: 5.00, category: 'Tragos' },
  { id: 'tr2', name: 'Michelada', description: 'Cerveza, limón, picante.', price: 3.00, category: 'Tragos' },
  { id: 'tr3', name: 'Mojito', description: 'Ron blanco, hierva buena, Chinoto.', price: 5.00, category: 'Tragos' },
  { id: 'tr4', name: 'Cuba libre', description: 'Ron Añejo, Pepsi, limón.', price: 5.00, category: 'Tragos' },
  { id: 'tr5', name: 'Piña colada', description: 'Ron blanco, Crema de coco.', price: 7.00, category: 'Tragos' },
  { id: 'tr6', name: 'Daiquiri', description: 'Frutas, Triple Sec, limón, Ron blanco.', price: 5.00, category: 'Tragos' },
  { id: 'tr7', name: 'Gin Tonic', description: 'Ginebra, piel de limón, Aguaquina.', price: 4.00, category: 'Tragos' },
  { id: 'tr8', name: 'Caipiriña', description: 'Limón, azúcar, Cachaza.', price: 4.00, category: 'Tragos' },
  { id: 'tr9', name: 'Tequila sunrise', description: 'Granadina, Tequila, Naranja.', price: 5.00, category: 'Tragos' },
  { id: 'tr10', name: 'Tinto verano', description: 'Frutas, vino, limón, Triple sec.', price: 4.00, category: 'Tragos' },
  { id: 'tr11', name: 'Bandera', description: 'Granadina, Crema de coco, menta.', price: 4.00, category: 'Tragos' },
  { id: 'tr12', name: 'Charro negro', description: 'Pepsi, Tequila, limón.', price: 4.00, category: 'Tragos' },
  { id: 'tr13', name: 'Wiskey Trago de 12 Años', price: 7.00, category: 'Tragos' },
  { id: 'tr14', name: 'Wiskey Trago de 8 Años', price: 6.00, category: 'Tragos' },
  { id: 'tr15', name: 'Copa de vino', price: 4.00, category: 'Tragos' },
];

export const CATEGORIES = [
  'Entradas',
  'Burritos',
  'Nachos',
  'Fajitas',
  'Tacos',
  'Quesadillas',
  'Otros',
  'Pepitos',
  'Hamburguesas',
  'Club House',
  'Pizzas',
  'Parrillas',
  'Tragos',
  'Bebidas',
  'Combos'
];

export const PROMOS = [
  { id: 'p1', image: 'https://picsum.photos/seed/mexican1/800/400', title: '2x1 en Tacos los Martes' },
  { id: 'p2', image: 'https://picsum.photos/seed/mexican2/800/400', title: 'Margaritas al 50% hoy' },
  { id: 'p3', image: 'https://picsum.photos/seed/mexican3/800/400', title: 'Prueba nuestro nuevo Burrito Crunch' },
  { id: 'p4', image: 'https://picsum.photos/seed/mexican4/800/400', title: 'Combo Familiar: Parrilla + Bebida' },
  { id: 'p5', image: 'https://picsum.photos/seed/mexican5/800/400', title: 'Postre gratis en tu primera orden' },
];
