const parser = require("../../src/parser");

describe("parser", () => {
  test("should parse", () => {
    const code = `
      function doSomething() {}
    `;

    expect(() => {
      parser.parse(code);
    }).not.toThrow();
  });

  test("should throw error", () => {
    const code = `
      fun() {}
    `;

    expect(() => {
      parser.parse(code);
    }).toThrow();
  });
});
