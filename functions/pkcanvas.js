const common = require('../src/common.js');
const pkt = require('../src/token.js');
const cors = require('./pkcors.js');
const https = require('https');
const querystring = require('querystring');
const axios = require("axios");
const url = require('url');
const AWS = require('aws-sdk');
const s3 = new AWS.S3()
const uuid = require('uuid');

canvas = (event, context, callback, testEnv) => {
  var tm;
  if (testEnv) {
    tm = new pkt(testEnv);
  } else {
    tm = new pkt();
  }
  tm.tokenValid(event.headers, function (er, e) {
    callback(er, e)
  }, function (valid) {
    var canvas_hostname = valid['custom_canvas_api_domain'];
    var netid = valid['lis_person_sourcedid'];
    var canvasPath = event.path.split('/pkcanvas')[1]; // Strip /canvas from path
    if (canvasPath === '/api/v1/log') {
      response = cors.buildResponse({ token: valid, event: event }, event);
      callback(null, response);
    } else if (canvasPath === '/api/v1/log64') {
      var newb = Buffer.from(event.body, 'base64').toString()
      response = cors.buildResponse({ token: valid, event: event, newb: newb }, event);
      callback(null, response);
    } else if (canvasPath == '/api/v1/none') {
      response = cors.buildResponse({ token: valid }, event);
      callback(null, response);
    } else if (canvasPath == '/api/v1/getDebugUpload') {
      const bucket = process.env.debugBucket
      const params = {
        Bucket: bucket,
        Key: JSON.parse(event.body).filename
      }
      s3.getSignedUrl('putObject', params, (err, url) => {
        var response = {}
        if (err) {
          response = cors.buildResponse({ success: false, message: 'Pre-Signed URL error', file: params.Key, err: err }, event)
          callback(null, response);
        }
        else {
          response = response = cors.buildResponse({ success: true, message: 'AWS SDK S3 Pre-signed urls generated successfully.', file: params.Key, url: url }, event)
          callback(null, response);
        }
      })
    } else {
      var canvasMethod = event.httpMethod;
      //var queryParams = querystring.stringify(event.queryStringParameters);

      tm.getKMS('canvasCredentials', function (cc) {
        // If we don't have query string parameters, add them
        if (!event.hasOwnProperty('queryStringParameters') || event.queryStringParameters == null) {
          event.queryStringParameters = {};
        }
        // Force masquerade
        if (event.queryStringParameters.hasOwnProperty('as_user_id') && valid.roles.indexOf('Administrator')) {
          console.log(netid + " masquerade as " + event.queryStringParameters.as_user_id)
        } else {
          event.queryStringParameters["as_user_id"] = "sis_user_id:" + netid;
        }
        var qs = querystring.stringify(event.queryStringParameters);
        var qs = decodeURIComponent(qs).replace(/ *\[[0-9]\] */g, '[]'); //Remove array indecies, Lambda doesn't allow duplicate query strings

        // Make a full path and then add query string parameters
        var fullPath = decodeURIComponent(canvasPath + "?" + qs);

        // Replace URL parts with LTI variables
        var m = fullPath.match(/{\s*[\w\.]+\s*}/g);
        if (m != null) {
          var lti_vars = m.map(function (x) { return x.match(/[\w\.]+/)[0]; });
          for (var i in lti_vars) {
            var re = new RegExp("{" + lti_vars[i] + "}")
            if (valid.hasOwnProperty(lti_vars[i])) {
              fullPath = fullPath.replace(re, valid[lti_vars[i]]);
            }
          }
        }
        if (canvasPath.indexOf('as_user_id=') != -1) {
          cc = '';
        }
        var ct = "application/json"
        if (event.hasOwnProperty('headers') && event.headers && event.headers.hasOwnProperty('Content-Type')) {
          ct = event.headers['Content-Type']
        }
        if (event.hasOwnProperty('headers') && event.headers && event.headers.hasOwnProperty('content-type')) {
          ct = event.headers['content-type']
        }
        const options = {
          hostname: canvas_hostname,
          port: 443,
          path: fullPath,
          method: canvasMethod,
          headers: {
            Authorization: "Bearer " + cc,
            "Content-Type": ct
          }
        };
        const optionsAxios = {
          url: `https://${canvas_hostname}${fullPath}`,
          method: canvasMethod.toLowerCase(),
          headers: {
            Authorization: "Bearer " + cc,
            "Content-Type": ct
          }
        }
        if (optionsAxios.method === 'post' || optionsAxios.method === 'put') {
          if (event.isBase64Encoded) {
            optionsAxios.data = Buffer.from(event.body, 'base64')
          } else {
            optionsAxios.data = event.body
          }
        }

        var r = axios(optionsAxios)
        r.then((responseAxios) => {
          const response = cors.buildResponse(responseAxios.data, event)
          response.headers['canvas-url'] = fullPath;
          if (responseAxios.headers.hasOwnProperty('link')) {
            var link = common.parseLink(responseAxios.headers.link);
            response.headers.link = JSON.stringify(link);
          }
          callback(null, response)
        }).catch((error) => {
          console.log('axerror', error)
          const response = cors.buildResponse({ error: error.toString() }, event)
          callback(null, response)
        })
      });
    }
  });
};

canvass3 = (event, context, callback, testEnv) => {
  event.path = event.path.replace(/\/canvass3/, '/canvasnew')
  canvasnew(event, context, (err, response) => {
    if (err) {
      console.log(err)
      callback(err)
    } else {
      var s3 = new AWS.S3();
      var key = uuid.v1() + '.json';

      var params = {
        Bucket : process.env.largeRequestBucket,
        Key : key,
        Body : JSON.stringify(response)
      }

      s3.putObject(params, (err, data) => {
        if (err) {
          console.log(err, err.stack, data); // an error occurred
          callback(err);
        } else {
          var object = {
            Key: params.Key,
            Bucket: params.Bucket,
            Expires: 60
          }
          const url = s3.getSignedUrl('getObject', object);
          response = cors.buildResponse({url: url}, event);
          callback(null, response);
        }
      });
    }
  }, testEnv)
  
}

module.exports = {
  canvas: canvas,
  canvass3: canvass3
};
