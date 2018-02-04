const generateCode = require("../util/generate-code");

describe("Mocks", () => {
  describe("using jest test framework", () => {
    test("should mock/spy required module for a function declaration", () => {
      const code = `
        const someLibrary = require("some-library");

        function doSomething() {
          const result = someLibrary();
        }

        module.exports = doSomething;
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "my-module.js",
        removeWhitespace: true
      });

      const expected = `
        const someLibrary = require("some-library");
        
        const doSomething = require("my-module");

        describe("my-module.js", () => {
          test("doSomething", () => {
            doSomething();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should mock/spy required module function for a function declaration", () => {
      const code = `
        const someLibrary = require("some-library");

        function doSomething() {
          const result = someLibrary.someFunction();
        }

        module.exports = doSomething;
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "my-module.js",
        removeWhitespace: true
      });

      const expected = `
        const someLibrary = require("some-library");
        
        const doSomething = require("my-module");

        describe("my-module.js", () => {
          test("doSomething", () => {
            jest.spyOn(someLibrary, "someFunction");
            doSomething();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should not mock/spy required module for a function declaration", () => {
      const code = `
        const someLibrary = require("some-library");

        function doSomething() {
          return true;
        }

        module.exports = doSomething;
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "my-module.js",
        removeWhitespace: true
      });

      const expected = `
        const someLibrary = require("some-library");
        
        const doSomething = require("my-module");

        describe("my-module.js", () => {
          test("doSomething", () => {
            const result = doSomething();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should mock/spy imported module for a function declaration", () => {
      const code = `
        import { someLibrary } from "some-library";

        function doSomething() {
          const result = someLibrary.someMethod();
        }

        module.exports = doSomething;
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "my-module.js",
        removeWhitespace: true
      });

      const expected = `
        import { someLibrary } from "some-library";
        jest.mock("some-library", () => ({
          someLibrary: {
            someMethod: jest.fn()
          }
        }));

        const doSomething = require("my-module");

        describe("my-module.js", () => {
          afterEach(() => {
            someLibrary.someMethod.mockClear();
          });
          test("doSomething", () => {
            jest.spyOn(someLibrary, "someMethod");
            doSomething();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should mock/spy required module for a function expression", () => {
      const code = `
        const someModule = require("some-library");

        const someFunction = function() {
          const result = someModule();
        };

        module.exports = someFunction;
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "my-module.js",
        removeWhitespace: true
      });

      const expected = `
        const someModule = require("some-library");
        
        const someFunction = require("my-module");

        describe("my-module.js", () => {
          test("someFunction", () => {
            someFunction();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should mock/spy imported module for a function expression", () => {
      const code = `
        import { someModule } from "some-library";

        const someFunction = function() {
          const result = someModule();
        };

        module.exports = someFunction;
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "my-module.js",
        removeWhitespace: true
      });

      const expected = `
        import { someModule } from "some-library";
        jest.mock("some-library", () => ({
          someModule: jest.fn()
        }));

        const someFunction = require("my-module");

        describe("my-module.js", () => {
          afterEach(() => {
            someModule.mockClear();
          });
          test("someFunction", () => {
            someFunction();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should mock a default imported module", () => {
      code = `
        import someModule from "some-module";

        function doSomething() {
          someModule();
        }

        module.exports = doSomething;
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "my-module.js",
        removeWhitespace: true
      });

      const expected = `
      import someModule from "some-module";
      jest.mock("some-module", () => ({}));

      const doSomething = require("my-module");

      describe("my-module.js", () => {
        afterEach(() => {
          someModule.mockClear();
        });
        test("doSomething", () => {
          doSomething();
        });
      });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should mock/spy required module for a prototype", () => {
      const code = `
        const someModule = require("some-module");

        function Util () {}

        Util.prototype.someFunction = function() {
          const result = someModule();
        };

        module.exports = Util;
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "my-module.js",
        removeWhitespace: true
      });

      const expected = `
        const someModule = require("some-module");
        
        const Util = require("my-module");

        describe("my-module.js", () => {
          let util;
          beforeEach(() => {
            util = new Util();
          });
          test("someFunction", () => {
            util.someFunction();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should mock/spy a module for a class method", () => {
      const code = `
        import { someModule } from "some-library";

        export class TestClass {
          doSomething() {
            const result = someModule();
          }
        };`;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "TestClass.js",
        removeWhitespace: true
      });

      const expected = `
        import { someModule } from "some-library";
        jest.mock("some-library", () => ({
          someModule: jest.fn()
        }));
        import { TestClass } from "TestClass";
        describe("TestClass.js", () => {
          let testClass;
          beforeEach(() => {
            testClass = new TestClass();
          });
          afterEach(() => {
            someModule.mockClear();
          });
          test("doSomething", () => {
            testClass.doSomething();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should mock/spy a function within a module for a class method", () => {
      const code = `
        import { someModule } from "some-library";

        export class TestClass {
          doSomething() {
            const result = someModule.someFunction();
          }
        };`;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "TestClass.js",
        removeWhitespace: true
      });

      const expected = `
        import { someModule } from "some-library";
        jest.mock("some-library", () => ({
          someModule: {
            someFunction: jest.fn()
          }
        }));
        import { TestClass } from "TestClass";
        describe("TestClass.js", () => {
          let testClass;
          beforeEach(() => {
            testClass = new TestClass();
          });
          afterEach(() => {
            someModule.someFunction.mockClear();
          });
          test("doSomething", () => {
            jest.spyOn(someModule, "someFunction");
            testClass.doSomething();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test('should mock a module that has a "this" context', () => {
      const code = `
        import { someModule } from "some-module";
        
        export class TestClass {
          constructor() {
            this.someModule = someModule;
          }
          someMethod() {
            this.someModule();
          }
        };
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "TestClass.js",
        removeWhitespace: true
      });

      const expected = `
        import { someModule } from "some-module";
        jest.mock("some-module", () => ({
          someModule: jest.fn()
        }));
        import { TestClass } from "TestClass";
        describe("TestClass.js", () => {
          let testClass;
          beforeEach(() => {
            testClass = new TestClass();
          });
          afterEach(() => {
            someModule.mockClear();
          });
          test("someMethod", () => {
            jest.spyOn(this, "someModule");
            testClass.someMethod();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should not spy a class method calling another class method", () => {
      const code = `
        export class TestClass{
          methodOne() {
            this.methodTwo();
          }

          methodTwo() {}
        };
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
          test("methodOne", () => {
            testClass.methodOne();
          });
          test("methodTwo", () => {
            testClass.methodTwo();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should only mock module once", () => {
      const code = `
        import { someModule } from "some-module";
        import { anotherModule } from "another-module";

        function doSomething() {
          someModule();
          anotherModule();
        }

        function doSomethingElse() {
          someModule();
        }

        module.exports = {
          doSomething,
          doSomethingElse
        };
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "my-module.js",
        removeWhitespace: true
      });

      const expected = `
        import { someModule } from "some-module";
        jest.mock("some-module", () => ({
          someModule: jest.fn()
        }));
        import { anotherModule } from "another-module";
        jest.mock("another-module", () => ({
          anotherModule: jest.fn()
        }));

        const doSomething = require("my-module").doSomething;

        const doSomethingElse = require("my-module").doSomethingElse;

        describe("my-module.js", () => {
          afterEach(() => {
            someModule.mockClear();
            anotherModule.mockClear();
          });
          test("doSomething", () => {
            doSomething();
          });
          test("doSomethingElse", () => {
            doSomethingElse();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should not mock call expression that is not a imported module", () => {
      const code = `
        import { someModule } from "some-module";

        function doSomething() {
          someArray.forEach();
          someModule();
        }

        module.exports = doSomething;
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "my-module.js",
        removeWhitespace: true
      });

      const expected = `
        import { someModule } from "some-module";
        jest.mock("some-module", () => ({
          someModule: jest.fn()
        }));

        const doSomething = require("my-module");

        describe("my-module.js", () => {
          afterEach(() => {
            someModule.mockClear();
          });
          test("doSomething", () => {
            doSomething();
          });
        }); `
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should mock two call expressions from the same import", () => {
      const code = `
        import { someModule } from "some-module";

        function doSomething() {
          someModule.one();
          someModule.two();
        }

        module.exports = doSomething;
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "my-module.js",
        removeWhitespace: true
      });

      const expected = `
        import { someModule } from "some-module";
        jest.mock("some-module", () => ({
          someModule: {
            one: jest.fn(),
            two: jest.fn()
          }
        }));

        const doSomething = require("my-module");

        describe("my-module.js", () => {
          afterEach(() => {
            someModule.one.mockClear();
            someModule.two.mockClear();
          });
          test("doSomething", () => {
            jest.spyOn(someModule, "one");
            jest.spyOn(someModule, "two");
            doSomething();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });

    test("should not mock a scope on a required module", () => {
      const code = `
        const someFunction = require("util").someFunction;

        function doSomething() {
          someFunction();
        }

        module.exports = doSomething;
      `;

      const output = generateCode({
        code: code,
        testFramework: "jest",
        filename: "my-module.js",
        removeWhitespace: true
      });

      const expected = `
        const someFunction = require("util").someFunction;

        const doSomething = require("my-module");
        
        describe("my-module.js", () => {
          test("doSomething", () => {
            doSomething();
          });
        });`
        .replace(/ /g, "")
        .trim();

      expect(output).toBe(expected);
    });
  });
});
