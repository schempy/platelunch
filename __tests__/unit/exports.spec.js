const generateCode = require("../util/generate-code");

describe("Exports", () => {
  test("should export named class", () => {
    const code = `
      export class TestClass {
        doSomething() { }
    }`;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "TestClass.js",
      removeWhitespace: true
    });

    const expected = `
      import { TestClass } from "TestClass";
      describe("TestClass.js", () => {
        let testClass;
        beforeEach(() => {
          testClass = new TestClass();
        });
        test("doSomething", () => {
          testClass.doSomething();
        });
      });`
      .replace(/ /g, "")
      .trim();

    expect(output).toBe(expected);
  });

  test("should export named class", () => {
    const code = `
      const TestClass = class TestClass {
        doSomething() {}
      };

      export { TestClass }
    `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "TestClass.js",
      removeWhitespace: true
    });

    const expected = `
      import { TestClass } from "TestClass";
      describe("TestClass.js", () => {
        let testClass;
        beforeEach(() => {
          testClass = new TestClass();
        });
        test("doSomething", () => {
          testClass.doSomething();
        });
      });`
      .replace(/ /g, "")
      .trim();

    expect(output).toBe(expected);
  });

  test("should export named classes", () => {
    const code = `
      const Class1 = class Class1 {
        someMethod() {}
      };

      const Class2 = class Class2 {
        someMethod() {}
      };

      export { Class1, Class2 };
    `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "TestClass.js",
      removeWhitespace: true
    });

    const expected = `
      import { Class1, Class2 } from "TestClass";
      describe("TestClass.js", () => {
        let class1;
        let class2;
        beforeEach(() => {
          class1 = new Class1();
          class2 = new Class2();
        });
        test("someMethod", () => {
          class1.someMethod();
        });
        test("someMethod", () => {
          class2.someMethod();
        });
      });`
      .replace(/ /g, "")
      .trim();

    expect(output).toBe(expected);
  });

  test("should export default class", () => {
    const code = `
      export default class TestClass {
        someMethod() {}
      };
    `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "TestClass.js",
      removeWhitespace: true
    });

    const expected = `
      import TestClass from "TestClass";
      describe("TestClass.js", () => {
        let testClass;
        beforeEach(() => {
          testClass = new TestClass();
        });
        test("someMethod", () => {
          testClass.someMethod();
        });
      });`
      .replace(/ /g, "")
      .trim();

    expect(output).toBe(expected);
  });

  test("should export named function that has a name", () => {
    const code = `
      function someFunction() {}

      export { someFunction };
    `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "my-module.js",
      removeWhitespace: true
    });

    const expected = `
      import { someFunction } from "my-module";
      describe("my-module.js", () => {
        test("someFunction", () => {
          someFunction();
        });
      }); `
      .replace(/ /g, "")
      .trim();

    expect(output).toBe(expected);
  });

  test("should export default function with a name", () => {
    const code = `
      export default function someFunction() {};
    `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "my-module.js",
      removeWhitespace: true
    });

    const expected = `
      import someFunction from "my-module";
      describe("my-module.js", () => {
        test("someFunction", () => {
          someFunction();
        });
      });`
      .replace(/ /g, "")
      .trim();

    expect(output).toBe(expected);
  });

  test("should export function expression with a name", () => {
    const code = `
      const someFunction = function() {};

      export { someFunction };
    `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "my-module.js",
      removeWhitespace: true
    });

    const expected = `
    import { someFunction } from "my-module";
    describe("my-module.js", () => {
      test("someFunction", () => {
        someFunction();
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

      export { Util };
    `;

    const output = generateCode({
      code: code,
      testFramework: "jest",
      filename: "my-module.js",
      removeWhitespace: true
    });

    const expected = `
      import { Util } from "my-module";
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

  // TODO add test for exporting default function with no name:
  // export default function() {};
});
