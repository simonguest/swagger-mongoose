'use strict';
var _ = require('lodash');
var mongoose = require('mongoose');

var allowedTypes = ['integer', 'long', 'float', 'double', 'string', 'password', 'boolean', 'date', 'dateTime', 'array'];
var definitions = null;

var propertyMap = function (property) {
  switch (property.type) {
    case 'integer':
    case 'long' :
    case 'float' :
    case 'double' :
      return Number;
    case 'string':
    case 'password':
      return String;
    case 'boolean':
      return Boolean;
    case 'date':
    case 'dateTime':
      return Date;
    case 'array':
      return [propertyMap(property.items)];
    default:
      throw new Error('Unrecognized schema type: ' + property.type);
  }
};

var isSimpleSchema = function(schema) {
  return schema.type && isAllowedType(schema.type);
};

var isAllowedType = function(type) {
  return allowedTypes.indexOf(type) != -1;
};

var isPropertyHasRef = function(property) {
  return property['$ref'] || ((property['type'] == 'array') && (property['items']['$ref']));
}

var getSchema = function(object) {
  var props = {};
  _.forEach(object, function (property, key) {
    if (isPropertyHasRef(property)) {
      var refRegExp = /^#\/definitions\/(\w*)$/;
      var refString = property['$ref'] ? property['$ref'] : property['items']['$ref'];
      var propType = refString.match(refRegExp)[1];
      props[key] = getSchema(definitions[propType]['properties'] ? definitions[propType]['properties'] : definitions[propType]);
    }
    else if (property.type) {
      var type = propertyMap(property);
      props[key] = {type: type};
    }
    else if (isSimpleSchema(object)) {
      props = {type: propertyMap(object)};
    }
  });

  return props;
};

module.exports.compileAsync = function (spec, callback) {
  try {
    callback(null, this.compile(spec));
  } catch (err) {
    callback({message: err}, null);
  }
};

module.exports.compile = function (spec) {
  if (!spec) throw new Error('Swagger spec not supplied');

  var swaggerJSON = JSON.parse(spec.toString());
  definitions = swaggerJSON['definitions'];
  var schemas = {};
  _.forEach(definitions, function (definition, key) {
    var object = getSchema(definition['properties'] ? definition['properties'] : definition);
    schemas[key] = new mongoose.Schema(object);
  });

  var models = {};
  _.forEach(schemas, function (schema, key) {
    models[key] = mongoose.model(key, schema);
  });

  return {
    schemas: schemas,
    models: models
  };
};