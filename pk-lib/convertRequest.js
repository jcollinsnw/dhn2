var qs = require('querystring');

var convert = function(event) {
  var req = JSON.parse(JSON.stringify(event));
  var path = req.requestContext.path;
  var proto = req.headers["CloudFront-Forwarded-Proto"];
  var host = req.headers.Host;
  var url = proto + "://" + host + path;
  var method = req.httpMethod;

  req.body = qs.parse(req.body);
  req.url = url;
  req.connection = {'encrypted': proto == 'https'};
  req.method = method;
  req.headers.host = host;

  return req;
};

var convertCB = function(event, callback) {
  var req = convert(event);
  callback(req);
};

module.exports = {
  convert: convert,
  convertCB: convertCB
};
