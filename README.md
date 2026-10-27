# Hero Card Game

Juego de cartas de superhéroes para móvil, hecho con **Expo / React Native**. Cada partida enfrenta tu mazo contra la CPU en combates de cinco duelos de cualidades.

## Cómo se juega

- Cada combate reparte una **mano nueva de 5 héroes** a cada jugador.
- El tablero tiene **5 duelos**, cada uno con una cualidad distinta al azar: INT, FUE, VEL, RES o CBT.
- Los jugadores colocan **una carta por turno** en cualquier duelo libre.
- Al completar la mesa se revelan los duelos: gana quien tenga el valor más alto en la cualidad de ese duelo.
- Se lleva el combate quien gane **al menos 3 de los 5 duelos**. Si nadie llega a 3, el combate queda nulo.
- Gana la partida quien alcance el objetivo de combates: **10** en la partida clásica o **3** en la rápida.

La cualidad **POD** existe en los datos y en la ficha de cada héroe, pero todavía no se juega. Está preparada para futuras versiones.

## Funcionalidad

- **Inicio**: collage de tu mazo, estado del mazo, récord de victorias/derrotas/tablas y accesos a partida clásica, rápida, compendio y reglas.
- **Compendio**: catálogo completo con búsqueda por nombre/alias, filtros por editorial, orden por nombre o poder, y edición del mazo de hasta 10 héroes.
- **Ficha de héroe**: retrato, cualidades con barras animadas, biografía, aspecto, alias y gestión del mazo. Si hay token de la API oficial, la ficha se refresca contra ella.
- **Partida**: tablero de 5 duelos, revelado escalonado, resumen de combate y pantalla de resultado con revancha.
- **Persistencia**: mazo, récord y caché del catálogo se guardan con AsyncStorage.
- **Sin conexión**: incluye 40 héroes curados; el catálogo remoto se cachea y se refresca cada 24 h.

## Puesta en marcha

Recomendado **Node.js 22.13 o superior**.

```bash
npm install
npm run start        # Expo (elige plataforma)
npm run web          # vista web
npm run android
npm run ios
```

Para un dispositivo físico conviene una development build si añades módulos nativos; para esta app, Expo Go es suficiente.

### Token opcional de Superhero API

Copia `.env.example` a `.env` y completa:

```env
EXPO_PUBLIC_SUPERHERO_API_TOKEN=tu_token
```

Sin token la app funciona igual: usa el catálogo público y los retratos del CDN. Con token, las fichas de detalle se refrescan contra la API oficial de Superhero API.

## Scripts

```bash
npm run typecheck   # TypeScript en modo estricto
npm run lint        # ESLint de Expo
npm run simulate    # 250 partidas automáticas del motor y la IA
```

El script de simulación comprueba invariantes del motor (manos, colocaciones, revelados, marcadores y objetivo) e imprime el balance actual. Sirve como red de seguridad al tocar el motor o la IA.

## Estructura

```
src/
  app/                 Rutas de Expo Router
    (tabs)/            Inicio y compendio
    battle.tsx         Partida
    hero/[id].tsx      Ficha de héroe
  components/          Tarjetas, tablero, resumen y UI base
  data/                Catálogo semilla, API y persistencia
  game/                Motor puro, IA, configuración y tipos
  hooks/useMatch.ts    Orquestación de turnos y animaciones
  providers/           Colección, mazo y récord
  theme/               Colores, tipografías y sombras
scripts/               Simulación y generación del catálogo semilla
```

El motor (`src/game`) no depende de React: recibe estado y devuelve estado nuevo, lo que permite simular partidas, testear y añadir más adelante un modo local para dos jugadores.

## Datos y atribución

- Catálogo y retratos: [Superhero API](https://superheroapi.com/) · espejo público [akabab/superhero-api](https://github.com/akabab/superhero-api).
- Los retratos se sirven desde jsDelivr. La API oficial no ofrece actualmente imágenes estables, así que se conserva siempre el retrato del catálogo.
- Los 40 héroes semilla están normalizados (editorial y alineación) para que el juego sea legible sin conexión.

## Balance y siguientes pasos

La prioridad de esta versión fue completar la funcionalidad. El balance se ajustará después con datos de simulación. En la última ejecución de 250 partidas la IA ganó 153 frente a 97 del jugador.

Ideas previstas:

- Modo local por turnos para dos jugadores.
- Activar la cualidad POD y añadir nuevas cualidades.
- Efectos especiales por héroe y sinergias de equipo.
- Ajuste fino de la IA y del emparejamiento de mazos.
