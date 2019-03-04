let sql = require('./createpool-lib'); 
const DEGREE_OF_SIMILARITY = 0.1;

let pool = sql.mysqlPool;


const recommend = function() {  
  pool.getConnection(function(err, connection) {
    if(err) console.log(err);

    connection.query(
      `
        SELECT s.contactId, s.itemId, s.title, s.url, s.imgURL, s.seller
        FROM gifter.suggestions as s
        WHERE s.saved = 1
      `
      , function(error, results, fields) {
          if(error) console.log(error);

          let formattedSavedSuggestions = format(results, 'saved');
          connection.query(
            `
              SELECT tag, contactId, userCognitoId
              FROM gifter.tags
            `,
            function(error, results, fields) {
              if(error) console.log(error);

              let formattedTags = format(results, 'tags');
              connection.query(
                `
                  SELECT contactId, itemId
                  FROM gifter.similarSuggestions
                `, 
                function(error, results, fields) {
                  let formattedSimilar = format(results, 'similar');
                  connection.release();
                  recommendSimilarProducts(formattedSavedSuggestions, formattedTags, formattedSimilar)
                }
              )
            }
          )
    });
  });
}

/**
 * Formats object into another object with contactId as key.
 * @param {Object} results 
 * @param {String} format 
 */
function format(results, format) {
  let formattedResult = {};
  let contactId = -1;
  results.forEach((result) => {
    contactId = result.contactId;
    if(formattedResult[contactId]) {
      formattedResult[contactId].push(getFormat(result, format));
    } else {
      formattedResult[contactId] = [getFormat(result, format)];
    }
  })
  return formattedResult;
}

/**
 * Formatting function.
 * @param {Object} result 
 * @param {String} format 
 */
function getFormat(result, format) {
  switch (format) {
    case 'saved':
      return(result)
    case 'tags':
      return({tag: result.tag, userCognitoId: result.userCognitoId})
    case 'similar':
      return(result.itemId)
    default:
      console.log('Format not found.')
      break;
  }
}

/**
 * Adds recommendations for users depending on other similar users.
 * @param {Object} savedSuggestions 
 * @param {Object} tags 
 */
function recommendSimilarProducts(savedSuggestions, formattedTags, existingSimilar) {
  let similarUsers = {};
  Object.keys(savedSuggestions).forEach((key) => {
    let currentTags = getTags(key, formattedTags);
    Object.keys(formattedTags).forEach((tagKey) => {
      if(tagKey !== key && areSimilar(currentTags, getTags(tagKey, formattedTags))) {
        if(similarUsers[key]) similarUsers[key].push(tagKey)
        else similarUsers[key] = [tagKey];
      }
    })
  })
  if(Object.keys(similarUsers).length > 0 && similarUsers.constructor === Object ) addSimilarSuggestions(similarUsers, savedSuggestions, existingSimilar, formattedTags);
}

function getTags(key, formattedTags) {
  let result = [];
  formattedTags[key].forEach((element) => {
    result.push(element.tag);
  })
  return result;
}

/**
 * Compares two arrays and determines if they are similar to a certain degree.
 * @param {Array} tags_1 
 * @param {Array} tags_2 
 */
function areSimilar(tags_1, tags_2) {
  let similarElements = tags_1.filter(value => -1 !== tags_2.indexOf(value));
  let similarity = similarElements.length / tags_2.length;
  return similarity >= DEGREE_OF_SIMILARITY;
}

/**
 * Adds the similar suggestions to the table for the relevent contacts.
 * @param {Object} similarUsers 
 * @param {Object} savedSuggestions 
 * @param {Object} formattedTags 
 */
function addSimilarSuggestions(similarUsers, savedSuggestions, existingSimilar, formattedTags) {
  let queryObject = [];
  Object.keys(similarUsers).forEach((key) => {
    similarUsers[key].forEach((contactId) => {
      savedSuggestions[key].forEach((suggestion) => {
        if(Object.keys(existingSimilar).length === 0 || !existingSimilar[contactId] || !existingSimilar[contactId].includes(suggestion.itemId)) {
          queryObject.push(
            [contactId, suggestion.itemId, suggestion.title, suggestion.url, suggestion.imgURL, suggestion.seller, formattedTags[contactId][0].userCognitoId, 0, Date.now()]
          )
        }
      })
    })
  })
  if(queryObject.length > 0) {
    pool.getConnection(function(err, connection) {
      if(err) console.log(err);
      connection.query(
        `
          INSERT INTO gifter.similarSuggestions (contactId, itemId, title, url, imgURL, seller, userCognitoId, saved, createdAt) VALUES ?
        `, [queryObject],
        function(error, results, fields) {
          if(error) console.log(error);
          connection.release();
          console.log(results);
        }
      )
    });
  }
}

module.exports = { recommend: recommend };
