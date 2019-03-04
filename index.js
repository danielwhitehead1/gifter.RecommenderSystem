const cron = require('node-cron');
const express = require('express');
let simplerecommender = require('./lib/favourite_recommender_system-lib');
let cosineRecommender = require('./lib/cosine_recommender_system-lib');

app = express();

// cron.schedule("* * * * *", function() {
  // simplerecommender.recommend();
// })

// cron.schedule("* * * * *", function() {
  cosineRecommender.recommend();
// })


/**
 * This section is for helping to pull category info from apis, should be refactored into functions
 */

// let ebay = require('./ebay_categories.json');
// let etsy = require('./etsy_categories.json');

// let string = ''
// etsy.results.forEach(element => {
//   string += element.name + ' int, '
// });
// ebay.GetCategoryInfoResponse.CategoryArray.Category.forEach(element => {
//     string += '"' + element.CategoryName.toLowerCase().replace(/\s/g, '_').replace(/&/g, 'and').replace(/,/g, '').replace(/\//, '_') + '"' + ': "' + element.CategoryID + '", '
// });

// console.log(string);

// PROCESS TO CHANGE EBAY GATEGORY NAMES TO COLLUMN NAMES
// .toLowerCase().replace(/\s/g, '_').replace(/&/g, 'and').replace(/,/g, '').replace(/\//, '_')

