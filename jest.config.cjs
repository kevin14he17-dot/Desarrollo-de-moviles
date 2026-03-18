/**
 * Configuración de Jest para Backend con ES Modules
 */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  setupFilesAfterEnv: ['<rootDir>/setup-tests.cjs'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/config/**'
  ],
  coverageDirectory: './coverage',
  verbose: true,
  forceExit: true,
  clearMocks: true,
  testTimeout: 30000,
  maxWorkers: 1
};
