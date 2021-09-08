const validateUUID = require('uuid-validate');
const schema2 = require('../schema.json');
const Validator = require('jsonschema').Validator;

isUUID = (str) => {
  //FIXME: Enable after testing.
  //return validateUUID(str);
  return true;
};
parseLink = (link) => {
  rows = link.split(',')
  var rObj = {};
  for(var i in rows) {
    var parts = rows[i].split(';')
    var type = parts[1].split('"')[1]
    rObj[type] = {};
    var qs = parts[0].split('&')
    var page;
    var per_page;
    for( var j in qs ) {
      if( qs[j].indexOf('per_page') != -1 ) {
        per_page = qs[j].split('=')[1].replace('>', '')
      } else if( qs[j].indexOf('page') != -1 ) {
        page = qs[j].split('=')[1]
      }
    }
    rObj[type].page = page;
    rObj[type].per_page = per_page;
  }
  return rObj;
};
isObject = (item) => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};
isInt = (value) => {
  return !isNaN(value) &&
         parseInt(Number(value)) == value &&
         !isNaN(parseInt(value, 10));
};
isStr = (str) => {
  //FIXME: Enable after testing.
  return true;
};
isFloat = (num) => {
  //FIXME: Enable after testing.
  return true;
};

var map = {"INT": isInt, "{}": isObject, "UUID": isUUID, "STR": isStr, "FLOAT": isFloat};

validateSchema = (type, obj, igoreId, lazy, callback) => {
  var v = new Validator();
  var ret = v.validate(obj, schema2[type]);
  var errArray = [];
  var errors = 0;
  for( var i in ret.errors ) {
    var row = ret.errors[i];
    if( lazy && row.name == "required" ) {
    } else {
      errArray.push(row);
    }
  }
  if( errArray.length != 0 ) {
    errors = errArray;
  }
  if( callback ) {
    callback({'error': errors, 'item': obj});
  } else {
    return {'error': errors, 'item': obj};
  }
};

//FIXME remove this, change schema2 to schema and rename json files
validateSchemaOld = (type, obj, ignoreId, lazy, callback) => {
  var errorExpected = {};
  var unexpectedKeys = {};
  var missingKeys = {};
  var errors = false;
  var err = 0;
  var item = null;

  for( var key in obj ) {
    var value = obj[key];
    if( ignoreId && key == 'id' ) {
      continue;
    }
    if( schema[type].hasOwnProperty(key) ) {
      var valid = map[schema[type][key]](value);
      if( !valid ) {
        errorExpected[key] = schema[type][key];
        errors = true;
      }
    } else {
      unexpectedKeys[key] = value;
      errors = true;
    }
  }
  for( var _key in schema[type] ) {
    var expected = schema[type][_key];
    if( ignoreId && _key == 'id' ) {
      continue;
    }
    if( !obj.hasOwnProperty(_key) ) {
      if( !lazy ) {
        missingKeys[_key] = expected;
        errors = true;
      }
    }
  }
  if( errors ) {
    err = {
      'typeMismatch': errorExpected,
      'unexpectedKeys': unexpectedKeys,
      'missingKeys': missingKeys
    };
  } else {
    item = obj;
  }
  if( callback ) {
    callback({'error': err, 'item': item});
  } else {
    var ret = {'error': err, 'item': item};
    return ret;
  }
};

copyObject = (object) => {
  if( isObject(object) ) {
    return JSON.parse(JSON.stringify(object));
  } else {
    console.error('Tried to copy a non-ojbect.');
  }
};
mergeParams = (inputParams, params, callback) => {
  var newParams = copyObject(params);
  for( var key in inputParams ) {
    newParams[key] = inputParams[key];
  }
  if( callback ) {
    callback(newParams);
  } else {
    return newParams;
  }
};
buildUpdateExpression = (inputParams, data, callback) => {
  var newParams = copyObject(inputParams);
  var ean = {};
  var eav = {};
  var uel = [];
  for(var key in data) {
    ean['#'+key] = key;
    eav[':'+key] = data[key];
    uel.push('#'+key+' = :'+key);
  }
  var ue = 'SET ' + uel.join(', ');
  newParams.ExpressionAttributeNames = ean;
  newParams.ExpressionAttributeValues = eav;
  newParams.UpdateExpression = ue;
  newParams.ReturnValues = 'ALL_NEW';
  if( callback ) {
    callback(newParams);
  } else {
    return newParams;
  }
};

module.exports = {
  isUUID: isUUID,
  isObject: isObject,
  isInt: isInt,
  validateSchema: validateSchema,
  copyObject: copyObject,
  mergeParams: mergeParams,
  buildUpdateExpression: buildUpdateExpression,
  parseLink: parseLink
};
