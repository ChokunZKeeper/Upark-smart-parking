const { randomUUID } = require("node:crypto");

const abc = randomUUID();

console.log(abc.length);