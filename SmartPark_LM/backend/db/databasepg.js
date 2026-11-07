const { Pool } = require("pg"); // Choose Client and Pool a libery pg
const path = require('path');
require("dotenv").config({path: path.join(__dirname, '../.env')});

const pool = new Pool({
  user: process.env.user,
  host: process.env.host,
  port: parseInt(process.env.port, 10),
  password: process.env.password,
  database: process.env.database,
});

module.exports = pool;