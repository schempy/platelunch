describe("cli", () => {
  let fs;
  let mkdirp;
  let modelUtil;
  let testUtil;
  let parser;

  beforeEach(() => {
    fs = require("fs");
    mkdirp = require("mkdirp");
    modelUtil = require("../../src/model-util");
    testUtil = require("../../src/test-util");
    parser = require("../..//src/parser");

    jest.spyOn(process.stdout, "write").mockImplementation(text => {});

    jest
      .spyOn(fs, "writeFileSync")
      .mockImplementation((filename, content) => {});
  });

  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
  });

  test("should generate test files", () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(false);
    jest.spyOn(modelUtil, "generate");
    jest.spyOn(testUtil, "generate");
    jest.spyOn(parser, "parse");
    jest.spyOn(mkdirp, "sync").mockReturnValue(true);

    process.argv = [
      "some-directory",
      "some-directory",
      "__tests__/fixtures/*.js",
      "--test-framework",
      "jest"
    ];

    require("../../bin/platelunch");

    expect(parser.parse).toHaveBeenCalled();
    expect(modelUtil.generate).toHaveBeenCalled();
    expect(testUtil.generate).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test("should generate test files when no test framework option is passed", () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(false);
    jest.spyOn(modelUtil, "generate");
    jest.spyOn(testUtil, "generate");
    jest.spyOn(parser, "parse");
    jest.spyOn(mkdirp, "sync").mockReturnValue(true);

    process.argv = [
      "some-directory",
      "some-directory",
      "__tests__/fixtures/*.js"
    ];

    require("../../bin/platelunch");

    expect(parser.parse).toHaveBeenCalled();
    expect(modelUtil.generate).toHaveBeenCalled();
    expect(testUtil.generate).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test("should not create testing directory but generate test files", () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest.spyOn(modelUtil, "generate");
    jest.spyOn(testUtil, "generate");
    jest.spyOn(parser, "parse");
    jest.spyOn(mkdirp, "sync").mockReturnValue(true);

    process.argv = [
      "some-directory",
      "some-directory",
      "__tests__/fixtures/*.js"
    ];

    require("../../bin/platelunch");

    expect(parser.parse).toHaveBeenCalled();
    expect(modelUtil.generate).toHaveBeenCalled();
    expect(testUtil.generate).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  test("should fail when creating test directory", () => {
    jest.spyOn(console, "error");
    jest.spyOn(fs, "existsSync").mockReturnValue(false);
    jest.spyOn(mkdirp, "sync").mockImplementation(dir => {
      throw "error";
    });

    process.argv = [
      "some-directory",
      "some-directory",
      "__tests__/fixtures/file.js",
      "--test-framework",
      "jest"
    ];

    require("../../bin/platelunch");

    expect(console.error).toHaveBeenCalled();
  });

  test("should display command line options", () => {
    process.argv = [];

    require("../../bin/platelunch");

    expect(process.stdout.write).toHaveBeenCalledTimes(1);
  });

  test("should not find matching source files", () => {
    let errorMsg = "";

    jest.spyOn(console, "error").mockImplementation(err => {
      errorMsg = err;
    });

    process.argv = [
      "some-directory",
      "some-directory",
      "__tests__/invalid_dir/file.js",
      "--test-framework",
      "jest"
    ];

    require("../../bin/platelunch");

    const expected =
      "No matching files. Tried: __tests__/invalid_dir/file.js !**/node_modules/** !./node_modules/**";

    expect(errorMsg).toBe(expected);
  });

  test("should error expanding glob pattern", () => {
    let errorMsg = "";

    jest.spyOn(console, "error").mockImplementation(err => {
      errorMsg = err;
    });

    process.argv = [
      "some-directory",
      "some-directory",
      1234,
      "--test-framework",
      "jest"
    ];

    require("../../bin/platelunch");

    const expected =
      "Unable to expand glob patterns: 1234 !**/node_modules/** !./node_modules/**";

    expect(errorMsg).toBe(expected);
  });
});
