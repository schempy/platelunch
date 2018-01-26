const generateCode = require("../util/generate-code");

describe("Module exports", () => {
  describe("using jest test framework", () => {
    test("should export object", () => {
      const code = `
        function something() { }
  
        module.exports = {
          something: something
        };
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "my-module.js",
        removeWhitespace: true
      });
      const expected = `
        const something = require("my-module").something;

        describe("my-module.js", () => {
          test("something", () => {
            something();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should export variable", () => {
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

    test("should only export one function declaration", () => {
      const code = `
        function add(num1, num2) {
          return num1 + num2;
        }
  
        function subtrack(num1, num2) {
          return num1 - num2;
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
        }); `
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should only export one function expression", () => {
      const code = `
        var add = function(num1, num2) {
          return num1 + num2;
        }
  
        var subtrack = function(num1, num2) {
          return num1 - num2;
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

    test("should export prototype", () => {
      const code = `
        function Util() {}

        Util.prototype.add = function(num1, num2) {
          return num1 + num2;
        }

        module.exports = Util;
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "my-module.js",
        removeWhitespace: true
      });

      const expected = `
        const Util = require("my-module");

        describe("my-module.js", () => {
          let util;
          beforeEach(() => {
            util = new Util();
          });
          test("add", () => {
            const num1 = null;
            const num2 = null;
            const result = util.add(num1, num2);
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should export function when filename does not have a '.js' file extension", () => {
      const code = `
        var add = function(num1, num2) {
          return num1 + num2;
        }
  
        module.exports = add;
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "my-module",
        removeWhitespace: true
      });
      const expected = `
        const add = require("my-module");

        describe("my-module", () => {
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
  });
});
