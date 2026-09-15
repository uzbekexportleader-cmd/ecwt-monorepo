/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\.spec\.ts$',
  transform: { '^.+\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@ecwt/types$': '<rootDir>/../../packages/types/src/index.ts',
    '^@ecwt/config$': '<rootDir>/../../packages/config/src/index.ts',
    '^@ecwt/validation$': '<rootDir>/../../packages/validation/src/index.ts',
  },
};
