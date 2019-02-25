let config = require('./../config.json');
const axios = require("axios");
const sqlQueries = require('./sql_queries-lib');
const giftWords = ['gift', 'present', ''];

function callApi(source, category, contactId) {
  switch (source) {
    case 'etsy':
      callEtsyApi(category, (result) => etsyCallback(result, contactId));
      break;
    case 'ebay':
      callEbayApi(category, (result) => ebayCallback(result, contactId));
      break;
    default:
      console.log(`Source: ${source} does not exists.`);
      break;
  }
}

function callEtsyApi(category, callback) {
  let keyword = giftWords[Math.floor(Math.random() * 3)];
  var url = 'https://openapi.etsy.com/v2/listings/active?';
      url += `api_key=${config.etsyAPI.API_KEY}`;
      url += '&limit=1';
      url += '&sort_on=score';
      url += `&category=${category}`
      url += "&includes=MainImage";
      if(keyword.length > 0) {
        url += `&keywords=${keyword}`;
      }
  axios.get(url).then(callback).catch((error) => {
    console.log(`Ooops something went wrong, our bad! Error: ${error}`);
  });    
}

function callEbayApi(category, callback) {
  var url = "http://svcs.ebay.com/services/search/FindingService/v1";
      url += "?OPERATION-NAME=findItemsAdvanced";
      url += "&SERVICE-VERSION=1.0.0";
      url += `&SECURITY-APPNAME=${config.ebayAPI.APPNAME}`;
      url += `&GLOBAL-ID=${config.ebayAPI.GLOBAL_ID}`;
      url += "&RESPONSE-DATA-FORMAT=JSON";
      url += "&REST-PAYLOAD";
      // url += '&itemFilter(0).name=Condition'
      // url += '&itemFilter(0).value0=New'
      url += "&paginationInput.entriesPerPage=1";
      url += `&affiliate.trackingId=${config.ebayAPI.CAMPAIGN_ID}&affiliate.networkId=9`
      url += `&categoryId=${category}`
      url += `&keywords=${giftWords[Math.floor(Math.random() * 3)]}`
      url += '&descriptionSearch=true';
  axios.get(url).then(callback).catch((error) => {
    console.log(`Ooops something went wrong, our bad! Error: ${error}`);
  });
}

 function callTicketMasterApi(keywords, callback) {
  var url = 'https://app.ticketmaster.com/discovery/v2/events.json?'
      url += 'size=1&page=1'
      url += `&apikey=${config.TMAPI.API_KEY}`
      url += '&countryCode=GB'
      url += `&keyword=${keywords}`
  axios.get(url).then(callback).catch((error) => {
      console.log(`Ooops something went wrong, our bad! Error: ${error}`);
    })
}

etsyCallback = (response, contactId) => {
  let data = response.data
  let item = '';
  if(data.count > 0) {
    item = data.results[0] || [];
    item = formatSuggestion(
        item.title, 
        item.url, 
        item.listing_id, 
        'etsy', 
        item.MainImage.url_75x75, 
        item.category_path[0].toLowerCase().replace(/\s/, '_'), 
        contactId
      );
    sqlQueries.saveSuggestion(item);  
  }
}

ebayCallback = (response, contactId) => {
  let item = '';
  let data = response.data;
  if(data.findItemsAdvancedResponse[0].searchResult[0].item) {
    item = data.findItemsAdvancedResponse[0].searchResult[0].item[0] || [];
    item = formatSuggestion(
        item.title, 
        item.viewItemURL[0], 
        item.itemId[0], 
        'ebay', 
        item.galleryURL[0], 
        item.primaryCategory[0].categoryName[0].toLowerCase().replace(/\s/g, '_').replace(/&/g, 'and').replace(/,/g, '').replace(/\//, '_'),
        contactId
      );
    sqlQueries.saveSuggestion(item);
  }
}

function formatSuggestion(title, url, id, seller, imgURL, category, contactId) {
  return({
    'title': title,
    'url': url,
    'itemId': id,
    'seller': seller,
    'saved': 0,
    'rated': 0,
    'imgURL': imgURL,
    'category': category,
    'similarSuggestion': 1,
    'contactId': contactId
  })
}

module.exports = { callApi: callApi };
