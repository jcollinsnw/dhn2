const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

var dynamoDb;

module.exports.get = (params, testDynamoDb) => {
  if( testDynamoDb ) {
    dynamoDb = testDynamoDb;
  } else {
    dynamoDb = new AWS.DynamoDB.DocumentClient();
  }
  var p = dynamoDb.get(params).promise();
  return {'promise': p};
};
