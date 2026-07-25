module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-async-storage|@react-navigation|react-native-vector-icons)/)',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
