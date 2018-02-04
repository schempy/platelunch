# Platelunch

<p align="center">
  <a href="https://travis-ci.org/schempy/platelunch">
    <img alt="Travis" src="https://img.shields.io/travis/schempy/platelunch/master.svg?style=flat-square">
  </a>
  <a href="https://codecov.io/gh/schempy/platelunch">
    <img alt="Codecov" src="https://img.shields.io/codecov/c/github/schempy/platelunch.svg?style=flat-square">
  </a>
  <a href="https://www.npmjs.com/package/platelunch">
    <img alt="npm version" src="https://img.shields.io/npm/v/platelunch.svg?style=flat-square">
  </a>
  <a href="#badge">
    <img alt="code style: platelunch" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square">
  </a>
  <a href="#badge">
    <img alt="semantic-release" src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg">
  </a>  
</p>

<p align="center">
	<img src="./.assets/logo.png" height="275" width="415" alt="Platelunch logo"/>
</p>

## Intro
Platelunch generates boilerplate unit test code for javascript source files. Currently it will generate unit test files to be
used with jest only. More testing frameworks will be supported.

## Install
```js
npm install --save-dev platelunch

--- or globally

npm install -g platelunch
```

## CLI
```js
platelunch [opts] [filename ...]
```

Platelunch will create a directory ```__tests__``` where all the generated unit test files will be created.

__WARNING__ If a test file exists in ```__tests__``` it will be overwritten unless the glob or filename does not include that file.

Using glob to find files to generate unit tests
```js
platelunch --test-framework jest "src/**/*.js"
```

Only one unit test file will be generated
```js
platelunch --test-framework jest "src/my-file.js"
```

## Examples
- [`module.exports`](#module_exports)
- [`exports`](#exports)
- [`class (ES2015)`](#class)

### <a id="module_exports"></a> module.exports
#### Source File
```js
function add(num1, num2) {
  return num1 + num2;
}

module.exports = {
  add: add
};
```

#### Generated unit test file
```js
const add = require("src/my-module.js").add;

describe("my-module.js", () => {
  test("add", () => {
    const num1 = null;
    const num2 = null;
    
    const result = add(num1, num2);
  });
});
```

### <a id="exports"></a> exports
#### Source File
```js
function add(num1, num2) {
  return num1 + num2;
}

export { add };
```

#### Generated unit test file
```js
import { add } from "src/my-module.js"

describe("my-module.js", () => {
  test("add", () => {
    const num1 = null;
    const num2 = null;
    
    const result = add(num1, num2);
  });
});
```

### <a id="class"></a> class (ES2015)
#### Source File
```js
export class TestClass {
  add(num1, num2) {
    return num1 + num2;
  }
};
```

#### Generated unit test file
```js
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
});
```

## Licensing

The code in this project is licensed under MIT license.
