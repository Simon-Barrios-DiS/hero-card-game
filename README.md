# Hero Card Game — Beta 1.0

> **Estado: Beta 1.0 · Solo local/offline.** La app funciona en el dispositivo sin backend propio ni sincronización en la nube. Las cuentas, la colección, los mazos, los tokens y el récord se guardan en el almacenamiento local (AsyncStorage). No hay integración de correo ni autenticación remota.

Juego de cartas de superhéroes para móvil, hecho con **Expo / React Native**. Cada partida enfrenta tu mazo contra la CPU en combates de cinco duelos de cualidades.

## Cómo se juega

- Cada combate reparte una **mano nueva de 5 héroes** a cada jugador.
- El tablero tiene **5 duelos**, cada uno con una cualidad distinta al azar: INT, FUE, VEL, RES o CBT.
- Los jugadores colocan **una carta por turno** en cualquier duelo libre.
- Al completar la mesa se revelan los duelos: gana quien tenga el valor más alto en la cualidad de ese duelo.
- Se lleva el combate quien gane **al menos 3 de los 5 duelos**. Si nadie llega a 3, el combate queda nulo.
- Si las **5 cartas colocadas** comparten editorial y alineación moral, cada carta recibe **+5 en todos los duelos**. Ese valor puede superar 100.
- Gana la partida quien alcance el objetivo de combates: **10** en la partida clásica o **3** en la rápida.

La cualidad **POD** existe en los datos y en la ficha de cada héroe, pero todavía no se juega. Está preparada para futuras versiones.

## Funcionalidad

- **Inicio**: collage de tu mazo, estado del mazo, récord de victorias/derrotas/tablas, saldo de tokens y accesos a partida clásica, rápida, compendio y reglas.
- **Mazo**: constructor de 30 héroes con cuotas de rareza (1 SSR, 9 SR y 20 comunes), suma de promedios del mazo, vaciado, relleno aleatorio, búsqueda y filtros por editorial, rareza, héroes propios y cartas en el mazo. Ordena por poder, por cualquiera de las cinco estadísticas o por nombre, y al repetir la opción invierte la dirección.
- **Tienda**: sobres de 1, 3, 5 y 10 (10, 20, 40 y 70 tokens). Cada sobre trae 5 héroes; los repetidos se convierten en tokens (SSR 10, SR 5, comunes 3). Incluye un tutorial discreto de dos pasos para cuentas nuevas.
- **Compendio**: catálogo completo de consulta con búsqueda por nombre/alias, filtros por editorial y orden por nombre, poder o cada estadística, con dirección conmutable. Los héroes que no tienes aparecen en gris y marcados como “No lo tienes”.
- **Ficha de héroe**: retrato, cualidades con barras animadas, biografía, aspecto, alias y gestión del mazo. Si hay token de la API oficial, la ficha se refresca contra ella.
- **Partida**: tablero de 5 duelos, revelado escalonado, resumen de combate y pantalla de resultado con revancha. Cada ronda ganada suma 5 tokens. Si las cinco cartas de una formación comparten editorial y alineación, reciben +5 por duelo.
- **Cuentas locales**: login con usuario y contraseña, registro local y sesión persistente. No hay integración con correo.
- **Persistencia**: cuentas, colección, mazo, tokens, tutorial, récord y caché del catálogo se guardan con AsyncStorage.
- **Sin conexión**: incluye 40 héroes curados; el catálogo remoto se cachea y se refresca cada 24 h.

## Cuentas de prueba

Al primer arranque se crean dos cuentas locales:

| Usuario | Contraseña | Estado |
| --- | --- | --- |
| `coleccion` | `coleccion123` | Todas las cartas, mazo inicial y 1000 tokens |
| `novato` | `novato123` | Cuenta nueva: 0 cartas, 50 tokens y tutorial pendiente |

Los usuarios nuevos empiezan con **50 tokens** y el tutorial pide comprar **1 sobre** y el **pack de 5**. Las primeras compras completan una colección inicial válida para el mazo. Las contraseñas se guardan con un hash local de prototipo; no sustituye una autenticación de servidor.

## Estado de la versión

- **Beta 1.0**: versión de prueba local.
- **Solo local/offline**: no hay backend, sincronización entre dispositivos, correo ni autenticación remota.
- Todos los datos de juego se guardan en **AsyncStorage** del dispositivo.
- El catálogo público de Superhero API es opcional: si hay red se descarga y se cachea; sin red se usan los 40 héroes semilla.
- El login y las contraseñas son locales y de prototipo.

## Cómo iniciar

Requisitos: **Node.js 22.13 o superior** y npm.

```bash
git clone https://github.com/Simon-Barrios-DiS/hero-card-game.git
cd hero-card-game
npm install
npm run web
```

La vista web se abre en `http://localhost:8081`.

Para móvil:

```bash
npm run start        # Expo; escanea el QR con Expo Go o elige plataforma
npm run android      # emulador o dispositivo Android
npm run ios          # simulador iOS (macOS)
```

En el primer arranque se crean las cuentas de prueba (`coleccion` / `coleccion123` y `novato` / `novato123`). La app no necesita un backend ni una base de datos: el estado se guarda en el dispositivo. Para jugar sin conexión usa los 40 héroes semilla; si hay red, el catálogo público se descarga y se cachea.

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
    (tabs)/            Inicio, mazo, tienda y compendio
    battle.tsx         Partida
    hero/[id].tsx      Ficha de héroe
  components/          Tarjetas, tablero, resumen y UI base
  data/                Catálogo semilla, API, cuentas y persistencia
  game/                Motor puro, IA, configuración, rarezas, sobres y tipos
  hooks/useMatch.ts    Orquestación de turnos y animaciones
  providers/           Autenticación, colección, mazo, tienda y récord
  theme/               Colores, tipografías y sombras
scripts/               Simulación y generación del catálogo semilla
```

El motor (`src/game`) no depende de React: recibe estado y devuelve estado nuevo, lo que permite simular partidas, testear y añadir más adelante un modo local para dos jugadores.

## Datos y atribución

- Catálogo y retratos: [Superhero API](https://superheroapi.com/) · espejo público [akabab/superhero-api](https://github.com/akabab/superhero-api).
- Los retratos se sirven desde jsDelivr. La API oficial no ofrece actualmente imágenes estables, así que se conserva siempre el retrato del catálogo.
- Los 40 héroes semilla están normalizados (editorial y alineación) para que el juego sea legible sin conexión.

## Balance y siguientes pasos

La prioridad de esta versión fue completar la funcionalidad. El balance se ajustará después con datos de simulación. En la última ejecución de 250 partidas la IA ganó 158 frente a 92 del jugador.

Ideas previstas:

- Modo local por turnos para dos jugadores.
- Activar la cualidad POD y añadir nuevas cualidades.
- Efectos especiales por héroe y sinergias de equipo.
- Ajuste fino de la IA y del emparejamiento de mazos.
