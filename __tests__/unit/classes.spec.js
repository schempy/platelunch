const generateCode = require("../util/generate-code");

describe("Classes", () => {
  describe("using jest test framework", () => {
    test("should initialize class with parameters", () => {
      const code = `
        export class TestClass {
          constructor(name) {
            this.name = name;
          }

          add(num1, num2) {
            return num1 + num2;
          }
        }
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "TestClass.js",
        removeWhitespace: true
      });

      const expected = `
        import { TestClass } from "TestClass.js";
        describe("TestClass.js", () => {
          let testClass;
          beforeEach(() => {
            const name = null;
            testClass = new TestClass(name);
          });
          test("add", () => {
            const num1 = null;
            const num2 = null;
            const result = testClass.add(num1, num2);
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should test class methods", () => {
      const code = `
        export class TestClass {
          add(num1, num2) {
            return num1 + num2;
          }
        }
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "TestClass.js",
        removeWhitespace: true
      });

      const expected = `
        import { TestClass } from "TestClass.js";
        describe("TestClass.js", () => {
          let testClass;
          beforeEach(() => {
            testClass = new TestClass();
          });
          test("add", () => {
            const num1 = null;
            const num2 = null;
            const result = testClass.add(num1, num2);
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should handle class properties", () => {
      const code = `
        export class TestClass {
          constructor(age) {
            this.age = age;
          }

          someMethod() {
            return this.age;
          }
        }
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "TestClass.js",
        removeWhitespace: true
      });

      const expected = `
        import { TestClass } from "TestClass.js";
        describe("TestClass.js", () => {
          let testClass;
          beforeEach(() => {
            const age = null;
            testClass = new TestClass(age);
          });
          test("someMethod", () => {
            const result = testClass.someMethod();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should handle duplicate class properties", () => {
      const code = `
        export class TestClass {
          age;

          constructor(age) {
            this.age = age;
          }

          someMethod() {
            return this.age;
          }
        }
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "TestClass.js",
        removeWhitespace: true
      });

      const expected = `
        import { TestClass } from "TestClass.js";
        describe("TestClass.js", () => {
          let testClass;
          beforeEach(() => {
            const age = null;
            testClass = new TestClass(age);
          });
          test("someMethod", () => {
            const result = testClass.someMethod();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });
  });
});
