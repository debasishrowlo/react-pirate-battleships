const path = require("path")

module.exports = {
  root: path.resolve(__dirname, "../"),
  backend: path.resolve(__dirname, "../../backend"),
  src: path.resolve(__dirname, "../src"),
  build: path.resolve(__dirname, "../build"),
  bundler: path.resolve(__dirname, "../bundler"),
}