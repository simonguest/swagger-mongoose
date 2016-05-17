'use strict';
var swaggerMongoose = require('./../lib/index');

var fs = require('fs');
var async = require('async');
var mongoose = require('mongoose');
var mockgoose = require('mockgoose');
mockgoose(mongoose);
var assert = require('chai').assert;
var Schema = mongoose.Schema;

describe('swagger-mongoose tests', function () {

  before(function () {
    mongoose.connect('mongodb://localhost/schema-test');
  });

  afterEach(function () {
    mongoose.disconnect();
    delete mongoose.models.Pet;
    delete mongoose.models.Address;
    delete mongoose.models.Error;
    delete mongoose.models.Person;
    delete mongoose.models.House;
    delete mongoose.models.Car;
    delete mongoose.models.Human;
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
        assert(data.address[0].addressLine1 === '1 Main St.', 'Nested address mismatch');
        assert(data.address[1].addressLine1 === '2 Main St.', 'Nested address mismatch');
        assert(!data.notAKey, 'Strict schema mismatch');
        done();
      });
    });
  });

  it('should not create an example without required field', function (done) {
    var swagger = fs.readFileSync('./test/petstore.json');
    var Pet = swaggerMongoose.compile(swagger).models.Pet;
    var myPet = new Pet({
      id: 123
    });
    myPet.save(function (err) {
      assert(err, 'Validation error is missing');
      assert(err.message === 'Pet validation failed', 'Unexpected error message');
      done();
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

  it('should create an example person with relations to external collections', function (done) {
    var swagger = fs.readFileSync('./test/person.json');


    var models = swaggerMongoose.compile(swagger.toString()).models;

    var Person = models.Person;
    var House = models.House;
    var Car = models.Car;
    assert(Person.schema.paths.cars.options.type[0].type === Schema.Types.ObjectId, 'Wrong "car" type');
    assert(Person.schema.paths.houses.options.type[0].type === Schema.Types.ObjectId, 'Wrong "house" type');
    assert(Person.schema.paths.houses.options.type[0].ref === 'House', 'Ref to "house" should be "House"');

    async.parallel({
      house: function (cb) {
        var house = new House({
          description: 'Cool house',
          lng: 50.3,
          lat: 30
        });
        house.save(function (err, data) {
          cb(err, data);
        });
      },
      car: function (cb) {
        var car = new Car({
          provider: 'Mazda',
          model: 'CX-5'
        });
        car.save(function (err, data) {
          cb(err, data);
        });
      }
    }, function (err, results) {
      var person = new Person({
        login: 'jb@mi6.gov',
        firstName: 'James',
        lastName: 'Bond',
        houses: [
          results.house._id
        ],
        cars: [
          results.car._id
        ],
        phone: {
          home: "(123) 456-7890",
          mobile: "(012) 345-6789"
        }
      });
      person.save(function (err, data) {
        Person
          .findOne({_id: data._id})
          .lean()
          .exec(function (err, newPerson) {
            async.parallel({
              car: function (cb) {
                Car.findOne({_id: newPerson.cars[0]}, function (err, car) {
                  cb(err, car);
                });
              },
              house: function (cb) {
                House.findOne({_id: newPerson.houses[0]}, function (err, house) {
                  cb(err, house);
                });
              }
            }, function (err, populated) {
              newPerson.cars = [populated.car];
              newPerson.houses = [populated.house];

              assert(newPerson.login === 'jb@mi6.gov', 'Login is incorrect');
              assert(newPerson.firstName === 'James', 'First Name is incorrect');
              assert(newPerson.lastName === 'Bond', 'Last Name is incorrect');
              assert(newPerson.cars.length === 1, 'Cars content is wrong');
              assert(newPerson.cars[0].model === 'CX-5', 'Car model is incorrect');
              assert(newPerson.cars[0].provider === 'Mazda', 'Car provider is incorrect');
              assert(newPerson.houses.length === 1, 'Houses content is wrong');
              assert(newPerson.houses[0].lat === 30, 'House latitude is incorrect');
              assert(newPerson.houses[0].lng === 50.3, 'House longitude is incorrect');
              assert(newPerson.houses[0].description === 'Cool house', 'House description is incorrect');
              assert(newPerson.phone.home === '(123) 456-7890', 'Home phone number is incorrect');
              assert(newPerson.phone.mobile === '(012) 345-6789', 'Mobile phone number is incorrect');

              done();
            });
          });
      });
    });
  });

  it('should create an example pet from a JSON object with default schema options', function (done) {
    var swagger = fs.readFileSync('./test/petstore.json');

    var Pet = swaggerMongoose.compile(JSON.parse(swagger), { default: { timestamps: true }}).models.Pet;
    var myPet = new Pet({
      id: 123,
      name: 'Fluffy'
    });
    myPet.save(function (err) {
      if (err) throw err;
      Pet.findOne({id: 123}, function (err, data) {
        assert(data.schema.paths.createdAt, 'createdAt timestamp not found in data');
        assert(data.schema.paths.updatedAt, 'updatedAt timestamp not found in data');
        done();
      });
    });
  });

  it('should create an example pet from a JSON object with opposite default schema options', function (done) {
    var swagger = fs.readFileSync('./test/petstore.json');

    var Pet = swaggerMongoose.compile(JSON.parse(swagger), { default: {'schema-options': { timestamps: false }}}).models.Pet;
    var myPet = new Pet({
      id: 123,
      name: 'Fluffy'
    });
    myPet.save(function (err) {
      if (err) throw err;
      Pet.findOne({id: 123}, function (err, data) {
        assert(!data.schema.paths.createdAt, 'createdAt timestamp found in data');
        assert(!data.schema.paths.updatedAt, 'updatedAt timestamp found in data');
        done();
      });
    });
  });

  it('should create an example pet from a JSON object with schema specific options overriding default options', function (done) {
    var swagger = fs.readFileSync('./test/petstore.json');
    var Pet = swaggerMongoose.compile(JSON.parse(swagger), { default: {'schema-options': { timestamps: true }}, Pet: {'schema-options': { timestamps: false }}}).models.Pet;
    var myPet = new Pet({
      id: 123,
      name: 'Fluffy'
    });
    myPet.save(function (err) {
      if (err) throw err;
      Pet.findOne({id: 123}, function (err, data) {
        assert(!data.schema.paths.createdAt, 'createdAt timestamp found in data');
        assert(!data.schema.paths.updatedAt, 'updatedAt timestamp found in data');
        done();
      });
    });
  });

  it('should create an example pet from a JSON object with schema specific options overriding default options', function (done) {
    var swagger = fs.readFileSync('./test/petstore.json');
    var Pet = swaggerMongoose.compile(JSON.parse(swagger), { default: {'schema-options': { timestamps: false }}, Pet: {'schema-options': { timestamps: true }}}).models.Pet;
    var myPet = new Pet({
      id: 123,
      name: 'Fluffy'
    });
    myPet.save(function (err) {
      if (err) throw err;
      Pet.findOne({id: 123}, function (err, data) {
        assert(data.schema.paths.createdAt, 'createdAt timestamp not found in data');
        assert(data.schema.paths.updatedAt, 'updatedAt timestamp not found in data');
        done();
      });
    });
  });

  it('should avoid reserved mongodb fields', function (done) {
    var swagger = fs.readFileSync('./test/person.json');
    var models = swaggerMongoose.compile(swagger.toString()).models;

    var Person = models.Person;

    // next logic is indicate that "_id" and "__v" fields are MongoDB native
    assert(Person.schema.paths._id.instance === 'ObjectID', 'Wrong "_id" attributes');
    assert(Person.schema.paths._id.options.type === Schema.Types.ObjectId, 'Wrong "_id" attributes');
    assert(Person.schema.paths.__v.instance === 'Number', 'Wrong "__v" attributes');
    assert(Person.schema.paths.__v.options.type === Number, 'Wrong "__v" attributes');

    done();
  });

  it('should process circular references', function (done) {
    var swagger = fs.readFileSync('./test/person.json');
    var models = swaggerMongoose.compile(swagger.toString()).models;

    var Human = models.Human;

    // next logic is indicate that circular references are processed
    assert(Human.schema.paths.father.instance === 'ObjectID', 'Wrong "father" attribute: instance');
    assert(Human.schema.paths.father.options.type === Schema.Types.ObjectId, 'Wrong "father" attribute: type');
    assert(Human.schema.paths.mother.instance === 'ObjectID', 'Wrong "mother" attribute: instance');
    assert(Human.schema.paths.mother.options.type === Schema.Types.ObjectId, 'Wrong "mother" attribute: type');

    done();
  });

});
