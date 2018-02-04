"use strict";

const template = require("@babel/template").default;
const t = require("babel-types");
const jestUtil = {};

function createSpy(callList) {
  const functionToCall = callList[callList.length - 1];
  const modifiedCallList = [...callList.slice(0, callList.length - 1)];
  const callPath =
    modifiedCallList.length > 0
      ? `${modifiedCallList.join(".")}, "${functionToCall}"`
      : `${functionToCall}`;
  const ast = template.ast(`jest.spyOn(${callPath});`);

  return ast;
}

jestUtil.setup = function(opts) {
  const constructorList = opts.constructorList;
  const blockStatement = constructorList.reduce((acc, constructorDetails) => {
    const params = constructorDetails.params.reduce((acc, param) => {
      acc.push(t.identifier(param));

      return acc;
    }, []);

    const variables = constructorDetails.params.reduce((acc, param) => {
      const variable = t.variableDeclaration("const", [
        t.variableDeclarator(t.identifier(param), t.nullLiteral())
      ]);

      acc.push(variable);

      return acc;
    }, []);

    const init = t.expressionStatement(
      t.assignmentExpression(
        "=",
        t.identifier(constructorDetails.initName),
        t.newExpression(t.identifier(constructorDetails.name), params)
      )
    );

    acc.push(...variables);
    acc.push(init);

    return acc;
  }, []);

  const ast = t.expressionStatement(
    t.callExpression(t.identifier("beforeEach"), [
      t.arrowFunctionExpression([], t.blockStatement(blockStatement))
    ])
  );

  return [ast];
};

jestUtil.teardown = function(opts) {
  const libraries = opts.libraries;
  const imports = opts.imports;

  if (libraries.length === 0 || imports.length === 0) {
    return [];
  }

  const includedList = libraries.reduce((acc, library) => {
    const importExist = imports.some(importDetails => {
      const exists = importDetails.names.some(name => name === library.name);

      return exists;
    });

    if (importExist) {
      acc.push(library);
    }

    return acc;
  }, []);

  const teardownList = includedList.reduce((acc, library) => {
    if (library.paths.length === 0) {
      const ast = template.ast(`${library.name}.mockClear();`);
      acc.push(ast);
    }

    library.paths.forEach(path => {
      const paths = path.length > 0 ? `.${path.join(".")}` : "";
      const ast = template.ast(`${library.name}${paths}.mockClear();`);

      acc.push(ast);
    });

    return acc;
  }, []);

  const ast = t.expressionStatement(
    t.callExpression(t.identifier("afterEach"), [
      t.arrowFunctionExpression([], t.blockStatement(teardownList))
    ])
  );

  return [ast];
};

jestUtil.createMockFromImport = function(opts) {
  const path = opts.path;
  const declarations = opts.declarations;
  const libraries = opts.libraries;
  const type = opts.type;
  let mockImportList = [];

  if (type === "default") {
    const ast = template.ast(`
      jest.mock("${path}", () => ({
        
      }));
    `);

    mockImportList = [ast];
  } else {
    const b = declarations.reduce((acc, declaration) => {
      const libraryFilter = libraries.filter(
        library => library.name.toUpperCase() === declaration.toUpperCase()
      );

      libraryFilter.forEach(library => {
        const callPaths = library.paths.reduce((acc, path) => {
          acc.push(`${path}: jest.fn()`);

          return acc;
        }, []);

        if (callPaths.length > 0) {
          acc.push(`
            ${libraryFilter[0].name}: {
                ${callPaths.join(",")}
            }`);
        } else {
          acc.push(`
            ${libraryFilter[0].name}: jest.fn()
          `);
        }
      });

      return acc;
    }, []);

    const ast = template.ast(`
      jest.mock("${path}", () => ({
        ${b.join(",")}
      }));`);

    mockImportList = [ast];
  }

  return mockImportList;
};

jestUtil.preTest = function(opts) {
  const callExpressions = opts.callExpressions;
  const requireDeclarations = opts.requireDeclarations;
  const imports = opts.imports;

  const spies = callExpressions.reduce((acc, callExpression) => {
    const moduleName =
      callExpression[0] === "this" ? callExpression[1] : callExpression[0];
    const requireDeclarationExist = requireDeclarations.some(
      requireDeclaration => requireDeclaration.name === moduleName
    );
    const importExist = imports.some(importDetails => {
      const exists = importDetails.names.some(name => name === moduleName);

      return exists;
    });

    const thisExpFilter = callExpression.filter(callExp => callExp === this);
    let callCanBeSpied = true;

    // Method/function can be spied if there is a object and method
    // Example: someLibrary.someMethod()
    if (thisExpFilter.length === 0 && callExpression.length === 1) {
      callCanBeSpied = false;
    }

    if ((importExist || requireDeclarationExist) && callCanBeSpied) {
      acc.push(createSpy(callExpression));
    }

    return acc;
  }, []);

  return spies;
};

jestUtil.postTest = function(opts) {
  return [];
};

jestUtil.createTestBlock = function(opts) {
  const description = opts.description;
  const blockStatement = opts.blockStatement;
  const ast = t.expressionStatement(
    t.callExpression(t.identifier("test"), [
      t.stringLiteral(description),
      t.arrowFunctionExpression([], t.blockStatement(blockStatement))
    ])
  );

  return ast;
};

jestUtil.createTestModuleImports = function() {
  return [];
};

module.exports = jestUtil;
