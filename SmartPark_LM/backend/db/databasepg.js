const { Pool } = require("pg"); // Choose Client and Pool a libery pg
const path = require('path');
require("dotenv").config({path: path.join(__dirname, '../.env')});

const pool = new Pool({
  user: process.env.DB_user,
  host: process.env.DB_host,
  port: parseInt(process.env.DB_port, 10),
  password: process.env.DB_password,
  database: process.env.DB_database,
  max: parseInt(process.env.DB_max,10)
<<<<<<< HEAD

}); 

=======
<<<<<<< HEAD
}); 
=======
});
>>>>>>> 901b25f (update 2)
>>>>>>> 539eb421145c0c811a5dafaaae5746b3176470cd


module.exports = pool;