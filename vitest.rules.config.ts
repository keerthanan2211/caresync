import { defineConfig } from 'vitest/config';

// Security-rules tests: run through `npm run test:rules`, which starts the Firestore emulator first
export default defineConfig({ test: { environment: 'node', include: ['tests/rules/**/*.test.ts'], testTimeout: 15000 } });
