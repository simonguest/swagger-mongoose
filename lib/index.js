'use strict';
var _ = require('lodash');
var mongoose = require('mongoose');

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
  var definitions = swaggerJSON['definitions'];
  var schemas = {};
  _.forEach(definitions, function (definition, key) {
    // iterate through properties
    var props = {};
    _.forEach(definition['properties'], function (property, key) {
      if (property.type) {
        var type = propertyMap(property);
        props[key] = {type: type};
      }
    });

    // compile the schema
    schemas[key] = new mongoose.Schema(props);
  });

  // create models
  var models = {};
  _.forEach(schemas, function (schema, key) {
    models[key] = mongoose.model(key, schema);
  });

  return {
    schemas: schemas,
    models: models
  };
};
