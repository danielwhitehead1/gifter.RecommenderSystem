const sqlQueries = require('./sql_queries-lib');
const fs = require('fs');

// Ratings: contactId, categoryId, rating
// Categories: categoryId, name

// Need to standardise Ids and map categories to Ids
/**
 * Updates the CSV files for Gifter, creating a ratings and categories csv file used 
 * in the SVD recommender system
 */
const updateCSV = function() {
  sqlQueries.getRatings(function(results) {
    writeResults(results)
  })
  sqlQueries.getUsers(function(results) {
    console.log(results)
    writeUsers(results)
  })
}

const createTestData = function() {
  sqlQueries.createContactsAndRatings(100, 10, function(results) {
    updateCSV();
    console.log(`Successfuly added ${100} randomised test contacts with ${10} ratings each.`)
  })
}

/**
 * Writes the ratings to relevent csv files
 * @param {Object} ratings Ratings from DB
 */
function writeResults(ratings) {
  let categories = writeCategories(ratings[0]);
  writeRatings(categories, ratings)
}

/**
 * Writes the users to relevent csv file
 * @param {Object} users Users from DB 
 */
function writeUsers(users) {
  let id = 0;
  console.log(users)
  const users_file = fs.createWriteStream('./csv/users.csv');
  users.forEach((user) => {
    users_file.write(`${id},${user.id}\n`);
    id++;
  })
  users_file.end();
}

/**
 * Creates a csv file of the categories and some Ids starting from 1
 * @param {Object} rating A single rating element from DB
 */
function writeCategories(rating) {
  let categories = {}
  let id = 1;
  const category_file = fs.createWriteStream('./csv/categories.csv');
  Object.keys(rating).forEach((key) => {
    if(key!=='id' && key!=='userCognitoId' && key!=='contactId') {
      category_file.write(`${id},${key}\n`);
      categories[key] = id;
      id++;
    }
  })
  category_file.end();
  return(categories);
}

/**
 * Creates a csv file of the ratings
 * @param {Object} categories Categories and their Ids
 * @param {Object} ratings All ratings from DB
 */
function writeRatings(categories, ratings) {
  let contactId = -1;
  const rating_file = fs.createWriteStream('./csv/ratings.csv');
  ratings.forEach((element) => {
    Object.keys(element).forEach((key) => {
      if(key === 'contactId') {
        contactId = element[key];
      }
      if(key !== 'userCognitoId' && key !== 'id' && key !== 'contactId') {
        if(element[key]) {
          // MIGHT NEED TO SET CONTACT IDs BACK TO 0..RANGE
          rating_file.write(`${contactId},${categories[key]},${element[key]}\n`)
        }
      }
    })
  })
  rating_file.end();
}

module.exports = { updateCSV: updateCSV, createTestData: createTestData };
