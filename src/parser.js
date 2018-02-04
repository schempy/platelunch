"use strict";

const babylon = require("babylon");

function parse(text) {
  const babylonOptions = {
    sourceType: "module",
    allowImportExportEverywhere: false,
    allowReturnOutsideFunction: true,
    plugins: [
      "jsx",
      "flow",
      "doExpressions",
      "objectRestSpread",
      "decorators",
      "classProperties",
      "exportExtensions",
      "asyncGenerators",
      "functionBind",
      "functionSent",
      "dynamicImport"
    ]
  };

  let ast;

  try {
    ast = babylon.parse(text, babylonOptions);
  } catch (err) {
    throw err;
  }

  delete ast.tokens;
  return ast;
}

module.exports = {
  parse
};
