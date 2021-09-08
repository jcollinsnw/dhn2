'use strict';
const AWS = require('aws-sdk');
AWS.config.update({region: 'us-east-1'});
var jwt = require('jsonwebtoken');
var cookie = require('cookie');

class pkToken {
    constructor(testEnv) {
        if (testEnv) {
            //process.env = testEnv;
            this.env = testEnv;
        } else {
            this.env = process.env;
        }
    }
    getKMS(key, callback) {
        const encrypted = this.env[key];
        const kms = new AWS.KMS();
        kms.decrypt({
            CiphertextBlob: new Buffer(encrypted, 'base64')
        }, (err, data) => {
            if (err) {
                console.log('Decrypt error:', err);
                return callback(err);
            }
            var decrypted = data.Plaintext.toString('ascii');
            callback(decrypted);
        });
    }

    getSharedSecret(callback) {
        this.getKMS('sharedSecret', callback);
    }

    tokenValid(event, done, callback) {
        this.getKMS('sharedSecret', function (shared_secret) {
            var token;
            if( event.hasOwnProperty('Cookie') ) {
                const cookies = cookie.parse(event.Cookie);
                if( cookies.hasOwnProperty('pk-token') ) {
                    token = cookies['pk-token'];
                } else {
                    done(new Error("No Presto Cookie"))
                }
            } else if (event.hasOwnProperty('pk-token')) {
                token = event['pk-token']
            } else {
                console.log(event)
                done(new Error("No Token Found"))
            }
            var options = {
                //maxAge: 100000
            };
            jwt.verify(token, shared_secret, options, function (err, decoded) {
                if (err) {
                    console.log(err);
                    done(new Error('invalid token'), {'error': 'Invalid Token'});
                } else {
                    callback(decoded);
                }
            });
        });
    }

    generateToken(data, callback) {
        this.getSharedSecret(function (shared_secret) {
            var token = jwt.sign(data, shared_secret);
            callback(token);
        });
    }
}

module.exports = pkToken;