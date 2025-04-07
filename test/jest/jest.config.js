module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.js$': ['babel-jest', { 
      presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
      plugins: ['@babel/plugin-transform-modules-commonjs']
    }]
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'test/jest/mocks/styleMock.js',
    '\\.(gif|ttf|eot|svg|png|webp)$': 'test/jest/mocks/fileMock.js',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,
  verbose: true
};