"use strict";

const frameworks = {
  get jest() {
    // eslint-disable-next-line no-eval
    return eval("require")("./test-framework/jest");
  }
};

function getBuilder(opts) {
  return frameworks[opts.testFramework];
}

module.exports = { getBuilder };
