export default {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "./tsconfig.jest.json",
        useESM: false
      }
    ]
  },
  testMatch: ["**/tests/**/*.test.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"]
};