// === FICHIER : frontend/jest.config.cjs ===
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          // C'est cette ligne qui indique au compilateur où trouver 'describe', 'it', 'expect' et 'jest'
          types: ["jest", "@testing-library/jest-dom"] 
        },
      },
    ],
  },
};