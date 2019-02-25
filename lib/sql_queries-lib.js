let sql = require('./createpool-lib'); 

let pool = sql.mysqlPool;

function saveSuggestion(suggestion) {
  pool.getConnection(function(error, connection) {
    suggestion.createdAt = Date.now();
    if(error) console.log(error)
    connection.query(
      `
        SELECT userCognitoId FROM contacts
        WHERE id = ${suggestion.contactId}
      `, function(error, results) {
        if(error) console.log(error)
        suggestion.userCognitoId = results[0].userCognitoId;
        connection.query(`INSERT INTO suggestions SET ?`
        , suggestion, function(error, results) {
        if(error) console.log(error);
        connection.release();
      })
      }
    )
  })
}

module.exports = {saveSuggestion: saveSuggestion};