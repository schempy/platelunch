"use strict";

const difference = require("lodash.difference");

function TestModel() {
  this.filename = "";
  this.importDeclarations = [];
  this.classes = [];
  this.libraries = [];
  this.functions = [];
  this.requireDeclarations = [];
  this.moduleExports = [];
  this.exportDeclarations = [];
}

TestModel.prototype.addFilename = function(filename) {
  this.filename = filename;
};

TestModel.prototype.addImportDeclaration = function(declaration) {
  this.importDeclarations = [...this.importDeclarations, declaration];
};

TestModel.prototype.addClass = function(classDetails) {
  this.classes = [...this.classes, classDetails];
};

TestModel.prototype.addFunction = function(functionDetails) {
  this.functions = [...this.functions, functionDetails];
};

TestModel.prototype.addRequireDeclaration = function(declaration) {
  this.requireDeclarations = [...this.requireDeclarations, declaration];
};

TestModel.prototype.addModuleExports = function(moduleExports) {
  this.moduleExports = moduleExports;
};

TestModel.prototype.addLibrary = function(library) {
  let index = 0;
  const filterLibrary = this.libraries.filter((filter, i) => {
    if (filter.name === library.name) {
      index = i;
      return true;
    }

    return false;
  });

  if (filterLibrary.length > 0) {
    let diffCount = 0;

    filterLibrary[0].paths.forEach(path => {
      const diffArray = difference(path, library.path);

      if (diffArray.length > 0) {
        diffCount++;
      }
    });

    if (diffCount > 0) {
      const updatedLibrary = Object.assign(filterLibrary[0], {
        paths: [...filterLibrary[0].paths, library.path]
      });

      this.libraries = [
        ...this.libraries.slice(0, index),
        updatedLibrary,
        ...this.libraries.slice(index + 1)
      ];
    }
  } else {
    const path = library.path.length > 0 ? [library.path] : [];
    this.libraries = [
      ...this.libraries,
      {
        name: library.name,
        paths: path,
        thisExpression: library.thisExpression
      }
    ];
  }
};

TestModel.prototype.removeLibrary = function(library) {
  const updatedLibraries = this.libraries.reduce((acc, value) => {
    if (library.name !== value.name) {
      acc.push(value);
    }

    return acc;
  }, []);

  this.libraries = updatedLibraries;
};

TestModel.prototype.addExportDeclaration = function(declaration) {
  this.exportDeclarations = [...this.exportDeclarations, declaration];
};

TestModel.prototype.getFilename = function() {
  return this.filename;
};

TestModel.prototype.getImportDeclarations = function() {
  return this.importDeclarations;
};

TestModel.prototype.getClasses = function() {
  return this.classes;
};

TestModel.prototype.getLibraries = function() {
  return this.libraries;
};

TestModel.prototype.getFunctions = function() {
  return this.functions;
};

TestModel.prototype.getRequireDeclarations = function() {
  return this.requireDeclarations;
};

TestModel.prototype.getModuleExports = function() {
  return this.moduleExports;
};

TestModel.prototype.getExportDeclarations = function() {
  return this.exportDeclarations;
};

TestModel.prototype.updateFunction = function(functionUpdate) {
  let updatedFunctionList = this.functions.reduce((acc, functionDetails) => {
    if (functionDetails.name !== functionUpdate.name) {
      acc.push(functionDetails);
    }
    return acc;
  }, []);

  updatedFunctionList = [...updatedFunctionList, functionUpdate];

  this.functions = updatedFunctionList;
};

module.exports = TestModel;
