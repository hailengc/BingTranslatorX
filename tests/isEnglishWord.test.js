const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const source = fs.readFileSync(path.join(__dirname, "../lib/util.js"), "utf8");
const context = vm.createContext({});
vm.runInContext(source, context);

for (const word of ["hello", "Bing", "don't", "mother-in-law", "rock’n’roll"]) {
  assert.strictEqual(context.isEnglishWord(word), true, `expected English word: ${word}`);
}

for (const text of ["", "你好", "你好hello", "hello你好", "123", "hello!", "hello world"]) {
  assert.strictEqual(context.isEnglishWord(text), false, `expected non-English hover target: ${text}`);
}

console.log("isEnglishWord regression tests passed");
