/**
 * jest-expo's preset supplies the React Native transform and the module mocks
 * for expo-* packages. `moduleNameMapper` mirrors the `@/*` alias from
 * tsconfig.json — without it every import inside a test fails to resolve.
 *
 * jest-expo is pinned to an exact version rather than a range: 57.0.5 peers
 * @react-native/jest-preset ^0.86.3, which conflicts with the react-native
 * 0.86.2 that Expo SDK 57 installs.
 */
module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
