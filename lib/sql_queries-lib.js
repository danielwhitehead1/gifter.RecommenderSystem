let sql = require('./createpool-lib'); 
let categories = require('./../json/all_categories.json');

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

function getRatings(callback) {
  pool.getConnection(function(error, connection) {
    if(error) console.log(error)
    connection.query(
      `
        SELECT * FROM ratings
      `, function(err, results) {
        if(err) console.log(err)
        connection.release();
        callback(results);
      }
    )
  })
}

function getUsers(callback) {
  pool.getConnection(function(error, connection) {
    if(error) console.log(error)
    connection.query(
      `
        SELECT * FROM contacts
      `, function(err, results) {
        if(err) console.log(err)
        connection.release();
        callback(results);
      }
    )
  })
}

function createContactsAndRatings(numberOfContacts, ratingsPerContact, callback) {
  // Contacts: UserCognitoId?, firstname, surname, gender?, createdAt?
  const contacts = [...Array(numberOfContacts)].map((_, i) => {
    return(['test', 'user']);
  })
  pool.getConnection(function(error, connection) {
    if(error) console.log(error)
    connection.query(
      `
        INSERT INTO contacts (firstname, surname) 
        VALUES ?;
      `, [contacts], function(err, results) {
        if(err) console.log(err)
        let nCategories = categories.all.length
        const ratings = getRandomisedRatings(nCategories, results, ratingsPerContact)
        connection.query(
          `
            INSERT INTO ratings (${['contactId', 'userCognitoId', ...categories.all].join(',')})
            VALUES ?
          `, [ratings], function(err, results) {
            if(err) console.log(err)
            connection.release();
            callback(results);
          }
        )
      }
    )
  })
}

function getRandomisedRatings(nCategories, results, ratingsPerContact) {
  return [...Array(100)].map((_, i) => {
    let ratingVals = new Array(nCategories).fill(null);
    [...Array(ratingsPerContact)].forEach(() => {
      ratingVals[Math.floor(Math.random() * (nCategories -1 ) + 1)] = Math.floor(Math.random() * 5 + 1);
    })
    return([results.insertId + i, results.insertId + i, ...ratingVals])
  })
}

module.exports = {saveSuggestion: saveSuggestion, getRatings: getRatings, getUsers: getUsers, createContactsAndRatings: createContactsAndRatings};