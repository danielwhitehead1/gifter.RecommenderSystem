var mysql = require("mysql");
let config = require('./../rdsconfig.json');

let mysqlPool = mysql.createPool({
  connectionLimit : 10,
  host            : config.host,
  user            : config.user,
  password        : config.password,
  database        : config.database
});
module.exports = { mysqlPool: mysqlPool };
