const minimist = require("minimist");
const platelunch = require("../index");

function run(args) {
  const opts = minimist(args);

  platelunch.parseOptions(opts);
}

module.exports = {
  run
};
