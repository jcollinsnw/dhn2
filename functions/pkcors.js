buildResponse = function(data, event, code) {
  var corsDomains = process.env.corsDomains.split(",");
  if (process.env.CF_URL) {
    corsDomains.push(`https://${process.env.CF_URL}`)
  }
  var eorigin = event.headers.origin;
  var origin = null;
  if (!eorigin) {
    eorigin = event.headers["Origin"];
  }
  for (var i in corsDomains) {
    var originL = corsDomains[i];
    if (originL === eorigin) {
      origin = originL;
    }
  }
  if (origin === null) {
    console.log("Invalid origin: " + eorigin, event.headers);
    code = 502;
    origin = "";
    data = "";
  }
  var body = data;
  var error = null;
  try {
    body = JSON.stringify(data);
  } catch (e) {
    console.log(e);
    error = e.toString();
  }
  var response = {
    statusCode: code,
    body: body,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers":
        "Access-Control-Allow-Credentials, Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, Origin, Accept, X-Accept, X-Accept-Charset, pk-token, pk-netid, link, canvas-url",
      "Access-Control-Expose-Headers": "link",
      "Access-Control-Allow-Credentials": "true"
    }
  };
  return response;
};

exec = (event, context, callback) => {
  var resp = buildResponse("", event, 200);
  callback(null, resp);
};

module.exports = {
  exec: exec,
  buildResponse: buildResponse
};
