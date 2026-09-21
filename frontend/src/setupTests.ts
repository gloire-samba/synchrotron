import '@testing-library/jest-dom';

// On utilise le préfixe 'node:' et on demande à TypeScript d'ignorer cette ligne spécifique à l'environnement de test
// @ts-ignore
import { TextEncoder, TextDecoder } from 'node:util';

// On utilise globalThis au lieu de global pour être 100% compatible avec TypeScript
Object.assign(globalThis, { TextDecoder, TextEncoder });