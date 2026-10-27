const { Pool } = require("pg"); // Choose Client and Pool a libery pg
require("dotenv").config();

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  port: 5432,
  password: process.env.password,
  database: "uparkdb",
});

module.exports = pool;