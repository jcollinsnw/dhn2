const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

var dynamoDb;

module.exports.update = (params, testDynamoDb) => {
  if( testDynamoDb ) {
    dynamoDb = testDynamoDb;
  } else {
    dynamoDb = new AWS.DynamoDB.DocumentClient();
  }
  const timestamp = new Date().getTime();

  // Set all the default options.
  params.ExpressionAttributeValues[':updatedAt'] = timestamp;
  params.UpdateExpression = params.UpdateExpression + ', updatedAt = :updatedAt';
  params.ReturnValues = 'ALL_OLD';

  // update the todo in the database
  var p = dynamoDb.update(params).promise();
  return {'promise': p, 'item': {'updatedAt': timestamp}};
};
