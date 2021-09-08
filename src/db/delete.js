const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

var dynamoDb;

module.exports.delete = (params, testDynamoDb) => {
  if( testDynamoDb ) {
    dynamoDb = testDynamoDb;
  } else {
    dynamoDb = new AWS.DynamoDB.DocumentClient();
  }

  // delete the from the database
  /*dynamoDb.delete(params, (error) => {
    // handle potential errors
    if (error) {
      console.error(error);
      callback(new Error('Couldn\'t remove the todo item.'));
      return;
    }

    // create a response
    const response = {
      statusCode: 200,
      body: JSON.stringify({}),
    };
    callback(null, response);
  });*/
  var p = dynamoDb.delete(params).promise();
  return {'promise': p};
};
