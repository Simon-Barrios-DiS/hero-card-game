import fs from 'node:fs/promises';
import path from 'node:path';

const CURATED = [
  // DC
  { id: 70, name: 'Batman' },
  { id: 644, name: 'Superman' },
  { id: 720, name: 'Wonder Woman' },
  { id: 263, name: 'Flash' },
  { id: 38, name: 'Aquaman' },
  { id: 194, name: 'Cyborg' },
  { id: 432, name: 'Martian Manhunter' },
  { id: 156, name: 'Shazam' },
  { id: 643, name: 'Supergirl' },
  { id: 491, name: 'Nightwing' },
  { id: 298, name: 'Green Arrow' },
  { id: 309, name: 'Harley Quinn' },
  { id: 370, name: 'Joker' },
  { id: 405, name: 'Lex Luthor' },
  { id: 204, name: 'Darkseid' },
  { id: 60, name: 'Bane' },
  { id: 216, name: 'Deathstroke' },
  { id: 95, name: 'Black Adam' },
  // Marvel
  { id: 620, name: 'Spider-Man' },
  { id: 346, name: 'Iron Man' },
  { id: 149, name: 'Captain America' },
  { id: 659, name: 'Thor' },
  { id: 332, name: 'Hulk' },
  { id: 107, name: 'Black Widow' },
  { id: 226, name: 'Doctor Strange' },
  { id: 106, name: 'Black Panther' },
  { id: 717, name: 'Wolverine' },
  { id: 213, name: 'Deadpool' },
  { id: 655, name: 'Thanos' },
  { id: 414, name: 'Loki' },
  { id: 579, name: 'Scarlet Witch' },
  { id: 313, name: 'Hawkeye' },
  { id: 687, name: 'Venom' },
  { id: 423, name: 'Magneto' },
  { id: 638, name: 'Storm' },
  { id: 196, name: 'Cyclops' },
  { id: 356, name: 'Jean Grey' },
  { id: 222, name: 'Doctor Doom' },
  { id: 299, name: 'Green Goblin' },
  { id: 598, name: 'Silver Surfer' },
];

const DC_IDS = new Set([
  70, 644, 720, 263, 38, 194, 432, 156, 643, 491, 298, 309, 370, 405, 204, 60,
  216, 95,
]);

const ALIGNMENT_FIX = {
  'Scarlet Witch': 'good',
};

const response = await fetch('https://akabab.github.io/superhero-api/api/all.json');
if (!response.ok) throw new Error(`HTTP ${response.status}`);
const all = await response.json();
const byId = new Map(all.map((h) => [h.id, h]));

const clean = (value, fallback = '—') => {
  if (value === undefined || value === null || value === '' || value === '-') return fallback;
  return String(value);
};

const heroes = CURATED.map(({ id, name }) => {
  const raw = byId.get(id);
  if (!raw) throw new Error(`Missing hero ${id}`);
  const height = Array.isArray(raw.appearance.height) ? raw.appearance.height.join(' / ') : raw.appearance.height;
  const weight = Array.isArray(raw.appearance.weight) ? raw.appearance.weight.join(' / ') : raw.appearance.weight;
  return {
    id: raw.id,
    name,
    fullName: clean(raw.biography.fullName === 'No alter egos found.' ? '' : raw.biography.fullName, ''),
    publisher: DC_IDS.has(raw.id) ? 'DC Comics' : 'Marvel Comics',
    alignment: ALIGNMENT_FIX[name] ?? clean(raw.biography.alignment, 'neutral'),
    imageUrl: raw.images.md,
    stats: {
      intelligence: Number(raw.powerstats.intelligence) || 0,
      strength: Number(raw.powerstats.strength) || 0,
      speed: Number(raw.powerstats.speed) || 0,
      durability: Number(raw.powerstats.durability) || 0,
      power: Number(raw.powerstats.power) || 0,
      combat: Number(raw.powerstats.combat) || 0,
    },
    firstAppearance: clean(raw.biography.firstAppearance),
    aliases: Array.isArray(raw.biography.aliases)
      ? raw.biography.aliases.filter((a) => a && a !== '-' && a !== 'No alter egos found.').slice(0, 6)
      : [],
    occupation: clean(raw.work.occupation),
    base: clean(raw.work.base),
    groupAffiliation: clean(raw.connections.groupAffiliation),
    appearance: {
      gender: clean(raw.appearance.gender),
      race: clean(raw.appearance.race),
      height: clean(height),
      weight: clean(weight),
      eyeColor: clean(raw.appearance.eyeColor),
      hairColor: clean(raw.appearance.hairColor),
    },
  };
});

const header = `// Datos generados por scripts/build-seed.mjs a partir del dataset público
// de Superhero API (https://akabab.github.io/superhero-api). No editar a mano.
import type { Hero } from '../game/types';

export const SEED_HEROES: Hero[] = [
`;

const body = heroes
  .map((hero) => `  ${JSON.stringify(hero)},`)
  .join('\n');

const output = `${header}${body}\n];\n`;
const target = path.join(process.cwd(), 'src', 'data', 'seedHeroes.ts');
await fs.mkdir(path.dirname(target), { recursive: true });
await fs.writeFile(target, output, 'utf8');
console.log(`Wrote ${heroes.length} heroes to ${target}`);
