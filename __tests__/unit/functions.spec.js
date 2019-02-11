const generateCode = require("../util/generate-code");

describe("Function Declaration", () => {
  test("should export function that returns", () => {
    const code = `
      function add(num1, num2) {
        return num1 + num2;
      }

      function subtrack() {
        return true;
      }

      module.exports = add;
    `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "my-module.js",
      removeWhitespace: true
    });

    const expected = `
      const add = require("my-module");

      describe("my-module.js", () => {
        test("add", () => {
          const num1 = null;
          const num2 = null;
          const result = add(num1, num2);
        });
      });`
      .replace(/ /g, "")
      .trim();

    expect(output).toBe(expected);
  });
  test("should export nameless function defined as const ", () => {
    const code = `
      const add = (num1, num2)=> {
        return num1 + num2;
      }

      function subtrack() {
        return true;
      }

      module.exports = add;
    `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "my-module.js",
      removeWhitespace: true
    });

    const expected = `
      const add = require("my-module");

      describe("my-module.js", () => {
        test("add", () => {
          const num1 = null;
          const num2 = null;
          const result = add(num1, num2);
        });
      });`
      .replace(/ /g, "")
      .trim();

    expect(output).toBe(expected);
  });

  test("should export function that does not return", () => {
    const code = `
      function something() { }

      module.exports = something;
    `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "my-module.js",
      removeWhitespace: true
    });

    const expected = `
      const something = require("my-module");

      describe("my-module.js", () => {
        test("something", () => {
          something();
        });
      });`
      .replace(/ /g, "")
      .trim();

    expect(output).toBe(expected);
  });
});

describe("Function Expression", () => {
  test("should export function that returns", () => {
    const code = `
      var add = function(num1, num2) {
        return num1 + num2;
      }

      module.exports = add;
    `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "my-module.js",
      removeWhitespace: true
    });

    const expected = `
      const add = require("my-module");

      describe("my-module.js", () => {
        test("add", () => {
          const num1 = null;
          const num2 = null;
          const result = add(num1, num2);
        });
      });`
      .replace(/ /g, "")
      .trim();

    expect(output).toBe(expected);
  });

  test("should export function that does not return", () => {
    const code = `
      var something = function() { }

      module.exports = something;
    `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "my-module.js",
      removeWhitespace: true
    });

    const expected = `
      const something = require("my-module");

      describe("my-module.js", () => {
        test("something", () => {
          something();
        });
      });`
      .replace(/ /g, "")
      .trim();

    expect(output).toBe(expected);
  });

  test("should export function that is a call expression", () => {
    const code = `
      const util = {};

      util.add = function(num1, num2) {
        return num1 + num2;
      }

      module.exports = util;
    `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "my-module.js",
      removeWhitespace: true
    });

    const expected = `
      const util = require("my-module");

      describe("my-module.js", () => {
        test("add", () => {
          const num1 = null;
          const num2 = null;
          const result = util.add(num1, num2);
        });
      }); `
      .replace(/ /g, "")
      .trim();

    expect(output).toBe(expected);
  });
});

describe("Arrow Function Expression", () => {
  test("should consider direct export functions", () => {
    const code = `
      const add = (num1, num2)=> {
        return num1 + num2;
      }

      function subtrack() {
        return true;
      }

      export default add;
    `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "my-module.js",
      removeWhitespace: true
    });

    const expected = `
      import add from "my-module";
      describe("my-module.js", () => {
        test("add", () => {
          const num1 = null;
          const num2 = null;
          const result = add(num1, num2);
        });
      });`
      .replace(/ /g, "")
      .trim();

    expect(output).toBe(expected);
  });
  test("should consider export const functions", () => {
    const code = `
      export const add = (num1, num2)=> {
        return num1 + num2;
      }
    `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "my-module.js",
      removeWhitespace: true
    });

    const expected = `
      import {add} from "my-module";
      describe("my-module.js", () => {
        test("add", () => {
          const num1 = null;
          const num2 = null;
          const result = add(num1, num2);
        });
      });`
      .replace(/ /g, "")
      .trim();

    expect(output).toBe(expected);
  });
  test("function parameters (assignment, object descturcture, and RestElemtn)", () => {
    const code = `
    export const add = (num1, {num2})=> {
      return num1 + num2;
    }
    export const add2 = (num1, ...args)=> {
      return num1 + num2;
    }
  `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "my-module.js",
      removeWhitespace: true
    });

    const expected = `
    import {add, add2} from "my-module";
    describe("my-module.js", () => {
      test("add", () => {
        const num1 = null;
        const param1 = null;
        const result = add(num1, param1);
      });
      test("add2", () => {
        const num1 = null;
        const args = null;
        const result = add2(num1, args);
      });
    });`
      .replace(/ /g, "")
      .trim();

    expect(output).toBe(expected);
  });
});
