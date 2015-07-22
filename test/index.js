'use strict';
var swaggerMongoose = require('./../lib/index');

var fs = require('fs');
var mongoose = require('mongoose');
var mockgoose = require('mockgoose');
mockgoose(mongoose);
var assert = require('chai').assert;

describe('swagger-mongoose tests', function () {

  before(function () {
    mongoose.connect('mongodb://localhost/schema-test');
  });

  afterEach(function () {
    mongoose.disconnect();
    delete mongoose.models.Pet;
    delete mongoose.models.Address;
    delete mongoose.models.Error;
  });

  it('should create an example pet and return all valid properties', function (done) {
    var swagger = fs.readFileSync('./test/petstore.json');
    var Pet = swaggerMongoose.compile(swagger).models.Pet;
    var myPet = new Pet({
      id: 123,
      name: 'Fluffy',
      dob: new Date(),
      price: 99.99,
      sold: true,
      friends: ['Barney', 'Fido'],
      favoriteNumbers: [1, 3, 7, 9],
      address: [
        {addressLine1: '1 Main St.'},
        {addressLine1: '2 Main St.'}
        ],
      notAKey: 'test'
    });
    myPet.save(function (err) {
      if (err) throw err;
      Pet.findOne({id: 123}, function (err, data) {
        assert(data.id === 123, 'ID mismatch');
        assert(data.name === 'Fluffy', 'Name mismatch');
        assert(data.price === 99.99, 'Price mismatch');
        assert(data.sold === true, 'Sold mismatch');
        assert(data.friends.length === 2, 'Friends mismatch');
        assert(data.favoriteNumbers.length === 4, 'Favorite numbers mismatch');
        assert(data.address.addressLine1 === '1 Main St.', 'Nested address mismatch');
        assert(!data.notAKey, 'Strict schema mismatch');
        done();
      });
    });
  });

  it('should create an example pet from a file', function (done) {
    var swagger = fs.readFileSync('./test/petstore.json');
    var Pet = swaggerMongoose.compile(swagger).models.Pet;
    var myPet = new Pet({
      id: 123,
      name: 'Fluffy'
    });
    myPet.save(function (err) {
      if (err) throw err;
      Pet.findOne({id: 123}, function (err, data) {
        assert(data.id === 123, 'ID mismatch');
        assert(data.name === 'Fluffy', 'Name mismatch');
        done();
      });
    });
  });

  it('should create an example pet from a JSON object', function (done) {
    var swagger = fs.readFileSync('./test/petstore.json');
    var Pet = swaggerMongoose.compile(JSON.parse(swagger)).models.Pet;
    var myPet = new Pet({
      id: 123,
      name: 'Fluffy'
    });
    myPet.save(function (err) {
      if (err) throw err;
      Pet.findOne({id: 123}, function (err, data) {
        assert(data.id === 123, 'ID mismatch');
        assert(data.name === 'Fluffy', 'Name mismatch');
        done();
      });
    });
  });

  it('should create an example pet from a string', function (done) {
    var swagger = fs.readFileSync('./test/petstore.json');
    var Pet = swaggerMongoose.compile(swagger.toString()).models.Pet;
    var myPet = new Pet({
      id: 123,
      name: 'Fluffy'
    });
    myPet.save(function (err) {
      if (err) throw err;
      Pet.findOne({id: 123}, function (err, data) {
        assert(data.id === 123, 'ID mismatch');
        assert(data.name === 'Fluffy', 'Name mismatch');
        done();
      });
    });
  });

});

