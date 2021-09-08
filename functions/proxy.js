const axios = require("axios");
const cors = require('./pkcors.js');

proxy = (event, context, callback, testEnv) => {
  var url = event.queryStringParameters.url
  var method = event.httpMethod;
  var options = {
    url: url,
    method: method.toLowerCase(),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'max-age=0'
    }
  };
  if (options.method === 'post' || options.method === 'put') {
    if (event.isBase64Encoded) {
      options.data = Buffer.from(event.body, 'base64')
    } else {
      options.data = event.body
    }
  }
  axios(options).then(data => {
    var response = cors.buildResponse(data.data, event);
    response.headers['original-headers'] = JSON.stringify(data.headers)
    callback(null, response);
  }).catch((err) => {
    console.log('PROXY ERROR', err)
    console.log('PROXY ERROR EV', event)
    console.log('PROXY ERROR OPTIONS', options)
    var response = cors.buildResponse(err, event);
    callback(null, response)
  });
};

proxyFile = (event, context, callback, testEnv) => {
  var url = event.queryStringParameters.url
  var method = event.httpMethod;
  var options = {
    url: url,
    method: method.toLowerCase()
  };
  console.log(options)
  axios(options).then(data => {
    var response = {
      headers: data.headers,
      body: data.data
    }
    callback(null, response);
  });
}

module.exports = {
  proxy: proxy,
  proxyFile: proxyFile
};