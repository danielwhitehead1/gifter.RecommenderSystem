let sql = require('./createpool-lib'); 
let externalApi = require('./external_api-lib');
var similarity = require( 'compute-cosine-similarity' );
let pool = sql.mysqlPool;
const sources = ['ebay', 'etsy'];
const categories = require('./../category_mappings.json');

const complexrecommend = function() {
  getAllContactIds((results) => {
    findSimilarity(results, (similarity, contacts) => {
      let bestCategories = findSimilarCategories(similarity, contacts);
      recommendProducts(bestCategories);
    });
  });
}

/**
 * This method loops through the best categories and adds a suggestions for each contact
 * @param {Object} bestCategories Object containing contact ids and their associated best category
 */
function recommendProducts(bestCategories) {
  Object.keys(bestCategories).forEach((key) => {
    let source = getSource(bestCategories[key]);
    externalApi.callApi(source, categories[source][bestCategories[key]], key)
  });
}

/**
 * Finds a random source based on the category name
 * @param {String} category Category name 
 */
function getSource(category) {
  releventSources = [];
  Object.keys(categories).forEach((key) => {
    if(categories[key][category]) {
      releventSources.push(key);
    }
  });
  return(releventSources[Math.floor(Math.random() * releventSources.length)])
}

/**
 * Gets all the contacts IDs in table
 * @param {function} callback 
 */
function getAllContactIds(callback) {
  pool.getConnection(function(error, connection) {
    if(error) console.log(error)
    connection.query(
      `
        SELECT c.id FROM gifter.contacts as c
      `, function(err, results) {
        if(err) console.log(err);
        connection.release();
        callback(results);
      }
    )
  });
}

/**
 * Finds the vector of similarities between current ID and all other contacts
 * @param {int} id Current contact ID
 * @param {RowPacketData} results Full table of contacts
 * @param {function} callback 
 */
function findSimilarity(results, callback) {
  pool.getConnection(function(error, connection) {
    if(error) console.log(error);
    connection.query(
    `
      SELECT * FROM gifter.ratings 
    `, function(error, results) {
      if(error) console.log(error);
      connection.release();
      let contacts = format(results);
      contacts.forEach((user) => {
        similarity[user.id] = {};
      });
      contacts.forEach((user1) => {
        contacts.forEach((user2) => {
          if(!similarity[user1.id][user2.id] && user1.id !== user2.id) {
            similarity[user1.id][user2.id] = cosineSimilarity(user1, user2);
          }
        })
      })
      callback(similarity, contacts);
    })
  })
}

/**
 * Finds the similar categories based on the similar users
 */
findSimilarCategories = (similarity, contacts) => {
  let bestCategories = {};
  contacts.forEach((contact1) => {
    let totals = {};
    let similaritiesSum = {};
    contacts.forEach((contact2) => {
      if(contact1.id !== contact2.id) {
        Object.keys(contact2).forEach((key) => {
          if(key !== 'id' && key !== 'contactId' && key !== 'userCognitoId') {
            if(totals[key]) {
              totals[key] += contact2[key] * similarity[contact1.id][contact2.id];
              similaritiesSum[key] += similarity[contact1.id][contact2.id]
            } else {
              totals[key] = contact2[key] * similarity[contact1.id][contact2.id];
              similaritiesSum[key] = similarity[contact1.id][contact2.id]
            }
          }
        });
      }
    })
    let bestCategory = '';
    let highestScore = -1;
    Object.keys(totals).forEach((key) => {
      if((totals[key] / similaritiesSum[key]) > highestScore && !contact1[key]) {
        highestScore = totals[key] / similaritiesSum[key];
        bestCategory = key;
      }
    });
    bestCategories[contact1.contactId] = bestCategory;
  });
  return(bestCategories);
}

function cosineSimilarity(user1, user2) {
  let user1Arr = [];
  let user2Arr = [];
  Object.keys(user1).forEach((key) => {
    if(key !== 'id' && key !== 'contactId' && key !== 'userCognitoId') {
      if(user2[key])  {
        user1Arr.push(user1[key]);
        user2Arr.push(user2[key]); 
      }
    }
  })
  return(similarity(user1Arr, user2Arr));
}

function format(results) {
  results.forEach(function(result, index, results) {
    results[index] = notNull(result);
  });
  return(results);
}

function notNull(result) {
  let notNull = {};
  Object.keys(result).forEach((key) => {
    if(result[key] !== null) notNull[key] = result[key];
  })
  return(notNull);
}

module.exports = { complexrecommend: complexrecommend };
