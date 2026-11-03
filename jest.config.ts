import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customConfig: Config = {
  testEnvironment: 'jest-fixed-jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.{test,spec}.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  collectCoverageFrom: ['lib/**/*.ts', 'hooks/**/*.ts', 'components/**/*.tsx', 'app/api/**/*.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

const esmPackages = [
  'msw',
  '@msw',
  '@mswjs',
  '@open-draft',
  'until-async',
  'strict-event-emitter',
  'outvariant',
  'headers-polyfill',
  'is-node-process',
  'rettime',
  'cookie',
];

export default async (): Promise<Config> => {
  const config = await createJestConfig(customConfig)();
  return {
    ...config,
    transformIgnorePatterns: [`/node_modules/(?!(?:\\.pnpm/)?(?:${esmPackages.join('|')})[/@+])`],
  };
};
