/**
 * Hash local de prototipo para las cuentas guardadas en el dispositivo.
 * No sustituye una autenticación de servidor: aquí solo evitamos guardar la
 * contraseña en texto plano en AsyncStorage.
 */

function fnv1a(input: string, seed: number): number {
  let hash = seed >>> 0;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSalt(): string {
  return `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function hashPassword(password: string, salt: string): string {
  const input = `${salt}:${password}`;
  let first = fnv1a(input, 2166136261);
  let second = fnv1a(`${input}:${first}`, 2246822519);

  for (let round = 0; round < 4; round += 1) {
    first = fnv1a(`${input}:${second}:${round}`, first);
    second = fnv1a(`${input}:${first}:${round}`, second);
  }

  return `${first.toString(16).padStart(8, '0')}${second
    .toString(16)
    .padStart(8, '0')}`;
}
