const uuid = require('uuid');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const common = require('../common.js');

var dynamoDb;

module.exports.create = (params, testDynamoDb) => {
  if( testDynamoDb ) {
    dynamoDb = testDynamoDb;
  } else {
    dynamoDb = new AWS.DynamoDB.DocumentClient();
  }
  const timestamp = new Date().getTime();
  if (!params.Item.hasOwnProperty('id')) {
    params.Item.id = uuid.v1();
  }
  params.Item.createdAt = timestamp;
  params.Item.updatedAt = timestamp;
  // write the todo to the database
  var p = dynamoDb.put(params).promise();
  return {'item': params.Item, 'promise': p};
};
