"use strict";

const fs = require("fs");
const path = require("path");
const parser = require("./src/parser");
const modelUtil = require("./src/model-util");
const testUtil = require("./src/test-util");
const mkdirp = require("mkdirp");
const globby = require("globby");

function getOptions(opts) {
  const defaultTestFramework = opts["test-framework"] ? opts["test-framework"] : "jest";

  return {
    testFramework: defaultTestFramework
  };
}

function eachFilename(patterns, callback) {
  patterns = patterns.concat(["!**/node_modules/**", "!./node_modules/**"]);

  try {
    const filePaths = globby
      .sync(patterns, { dot: true, nodir: true })
      .map(filePath => path.relative(process.cwd(), filePath));

    if (filePaths.length === 0) {
      console.error(`No matching files. Tried: ${patterns.join(" ")}`)
      process.exitCode = 2;
      return;
    }

    filePaths.forEach((filePath) => {
      callback(filePath);
    })

  } catch (err) {
    console.error(`Unable to expand glob patterns: ${patterns.join(" ")}`);
    process.exitCode = 2;
  }
}

function generateTestFileName(filename) {
  const filenameSplit = filename.split(path.sep);
  const sourcefile = filenameSplit[filenameSplit.length - 1];
  const sourcefileSplit = sourcefile.split(".");
  const testDir = [
    "__tests__",
    ...filenameSplit.slice(0, filenameSplit.length - 1)
  ].join(path.sep);

  const testfile = path.join(
    process.cwd(),
    testDir,
    sourcefileSplit[0] + ".spec.js"
  );

  return testfile;
}

function createTestDirectory(testfile) {
  const testfileSplit = testfile.split(path.sep);
  const testDir = [...testfileSplit.slice(0, testfileSplit.length - 1)].join(
    path.sep
  );

  try {
    if (!fs.existsSync(testDir)) {
      mkdirp.sync(testDir);
    }
  } catch (err) {
    throw err;
  }
}

function parseOptions(opts) {
  if (opts["_"].length === 0) {
    const usage = [
      "Usage: platelunch [options] [file/glob]",
      "",
      "Options:",
      "    --test-framework  <jest>   Sets the testing franework for creating the unit tests. Defaults to jest.",
      ""
    ];

    process.stdout.write(usage.join("\n"));
  }
  else {
    generate(opts);
  }
}

function generate(opts) {
  const filepatterns = opts["_"];
  
  eachFilename(filepatterns, filename => {
    const options = getOptions(opts);

    process.stdout.write("Processing...." + filename + "\n");

    try {
      const input = fs.readFileSync(filename, "utf8");
      const testfile = generateTestFileName(filename);
      createTestDirectory(testfile);      
      const ast = parser.parse(input);
      const astModel = modelUtil.generate(ast, filename);
      const output = testUtil.generate(astModel, options);

      fs.writeFileSync(testfile, output, "utf8");
    } catch (err) {
      console.error("Unable to write test file: " + filename + "\n" + err + "\n");
      process.exitCode = 2;

      return;
    }
  });
}

module.exports = {
  parseOptions
};
