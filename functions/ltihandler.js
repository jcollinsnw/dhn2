'use strict';
var lti = require('../pk-lib/lti.js');
var convertRequest = require('../pk-lib/convertRequest.js');
var pkToken = require('../src/token.js');

var LTI = (event, context, callback) => {
    var req = convertRequest.convert(event);
    var token = new pkToken();

    if (req.body['lti_message_type'] === 'ContentItemSelectionRequest') {
        content_item.got_launch(req, res, contentItemData).then(() => {
            redisUtil.redisSave(contentitem_key, contentItemData);
            ciLoaded = true;

            let redirectUrl = provider + '/content_item';
            console.log('Redirecting to : ' + redirectUrl);
            res.redirect(redirectUrl);
        });
    }

    if (req.body['lti_message_type'] === 'basic-lti-launch-request') {
        lti.got_launch(req, {"render": function(d1, d2, d3) {
            var payload = req.body;
            let cf_url = process.env.CF_URL;
            if (payload.hasOwnProperty('custom_expire_hours')) {
                let nowSeconds = Math.floor(Date.now() / 1000)
                let hours = parseFloat(payload['custom_expire_hours'])
                let expire = nowSeconds + (hours * 60 * 60)
                payload.exp = expire
            }
            token.generateToken(payload, (token) => {
                var redirectUrl = '/noRedirectURL'
                var allow_redirectURL = false
                if (!cf_url) {
                    allow_redirectURL = true
                } else {
                    redirectUrl = `https://${cf_url}/discussionHero/index.html?ref=${event.headers.Host}&stage=${process.env.stage}&token=${token}`
                }
                if( req.body.hasOwnProperty('custom_redirecturl') && allow_redirectURL ) {
                    redirectUrl = req.body['custom_redirecturl'] + '?ref=' + event.headers.Host + '&stage=' + process.env.stage + '&token=' + token;
                }
                if( req.body.hasOwnProperty('custom_redirecturl_override') ) {
                    redirectUrl = req.body['custom_redirecturl_override'] + '?ref=' + event.headers.Host + '&stage=' + process.env.stage + '&token=' + token;
                }
                const response = {
                    statusCode: 302,
                    headers: {
                        Location: redirectUrl,
                        "Set-Cookie": "pk-token="+token+"; HttpOnly"
                    }
                };

                callback(null, response);
            })
        }});
    } else {
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                message: context,
                input: req,
                args: {
                    'nonlti': true
                },
            }),
        };

        callback(null, response);
    }
};

var empty = (event, context, callback) => {
    const response = {
        statusCode: 200,
        body: `<html><head><script type="text/javascript">
            function readCookie(name) {
                var nameEQ = name + "=";
                var ca = document.cookie.split(';');
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
                }
                return null;
            }
            console.log("Sending cookie: ", readCookie('pk-token'));
            parent.postMessage(readCookie('pk-token'), "http://localhost:8080/");
        </script></head></html>`,
        headers: {
            "Content-Type": "text/html"
        }
    };
    callback(null, response);
}

module.exports = {
    LTI: LTI,
    empty: empty
};