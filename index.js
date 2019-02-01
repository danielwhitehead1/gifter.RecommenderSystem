const cron = require('node-cron');
const express = require('express');
const fs = require('fs');

app = express();

cron.schedule("1 * * * *", function() {
  console.log('Running a task every first minte.');
  //SEND API CALL TO CREATE SIMILAR SUGGESTIONS
  // WILL NEED QUERY TO PULL FAVOURITED SUGGESTIONS AND ASSOCIATED USER KEYWORDS
  // LOOP THROUGH EACH USER FINDING SIMILAR USERS
  // FOR THOSE SIMILAR USERS
})

// CAN ADD DIFFERENT SHCEDULING FUNCTIONS IN HERE