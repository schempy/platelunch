const testUtil = require("../../src/test-util");
const modelUtil = require("../../src/model-util");
const babylon = require("babylon");

function generateCode(opts) {
  const code = opts.code;
  const testFramework = opts.testFramework;
  const filename = opts.filename;
  const removeWhitespace = opts.removeWhitespace;

  const ast = babylon.parse(code, {
    sourceType: "module"
  });
  delete ast.tokens;
  
  const model = modelUtil.generate(ast, filename);
  const unitTestCode = testUtil
    .generate(model, {
      testFramework: testFramework
    });

  const output = removeWhitespace ? unitTestCode.replace(/ /g, "").trim() : unitTestCode; 

  return output;  
}

module.exports = generateCode;
