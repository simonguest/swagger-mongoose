![Travis Status](https://travis-ci.org/simonguest/swagger-mongoose.svg?branch=master)
# swagger-mongoose

Generate mongoose schemas and models from swagger documents

## Usage

Simply pass your swagger document to the compile method, and then dynamically access the underlying mongoose models.

```js
var swaggerMongoose = require('swagger-mongoose');

var swagger = fs.readFileSync('./petstore.json');
var Pet = swaggerMongoose.compile(swagger).models.Pet;
var myPet = new Pet({
    id: 123,
    name: 'Fluffy'
    });
myPet.save();
```

There are 3 different use cases and 3 new custom options available for the new ```x-swagger-mongoose``` custom property for Swagger documents that are v2 and greater.

Custom options include: ```schema-options```, ```additional-properties```, and ```exclude-schema```

By default the ```exclude-schema``` option is set to false.

Global Schema Options
```js
x-swagger-mongoose:
  schema-options:
    timestamps: true
definitions:
  User: ...
```

Per-Schema Options
```js
  User:
    type: object
    x-swagger-mongoose:
      schema-options:
          timestamps: true
```
Unique Index at the property level
```js
  Person:
    required:
      - login
    properties:
      _id:
        type: string
      login:
        type: string
        x-swagger-mongoose:
          index:
            unique: 'true'
```

Compound Indexes at the document level
```js
definitions:
  House:
    x-swagger-mongoose:
      index:
        lng: 1
        lat: 1
```

Unique Compound Indexes at the document level
```js
  User:
    type: object
    x-swagger-mongoose:
      index:
        firstName: 1
        lastName: 1
        unique: true
```

Swagger Validation requires String but Schema defined as a reference
```js
  User:
    type: object
    properties:
      otherSchema:
        type: string
        x-swagger-mongoose:
          $ref: "#/definitions/OtherSchema"
```

Additional Mongo Schema paths that are not shown in Swagger-UI Documentation
```js
  SchemaName:
    type: object
    x-swagger-mongoose:
      additional-properties:
        user:
          $ref: "#/definitions/User"
        approved:
          type: string
          format: datetime
        rejected:
          type: string
          format: datetime
```

No Mongo Schema created for this definition
```js
  ExcludedSchema:
    type: object
    x-swagger-mongoose:
      exclude-schema: true
```
## Custom validators

This is a bit of a work around, but in the top-level of your swagger doc:
```js
x-swagger-mongoose:
  validators: ./lib/validators
```
validators is a relative path to the validators/index.js folder/file, FROM process.cwd().

each validator is an object, that contains two properties:
* message: this is the text displayed in the mongoose error when it returns false
* validator: this is the function that takes one argument (I believe) and returns true or false.

the properties must have these names, and must be exported in the index. unless you're aware of how to require an entire folder, in which case pull requests are welcome.

example validator:
```js
//  /lib/validators/index.js
module.exports.homePhone = {
  message: '{VALUE} is not a valid home phone number!',
  validator: function(v){
    return /([0-9]{1}[-\.\s])?([\(\[]?[0-9]{3}[\)\]]?[-\.\s])?([0-9]{3})[-\.\s]([0-9]{4})(?:\s?(?:x|ext)\s?([0-9])+)?/.test(v)
  }
}
```

at the property that you want to attach a validator for, add the validator property and the name of the function.
```js
phone:
  type: object
  properties:
    home:
      type: string
      x-swagger-mongoose:
        validator: homePhone
    mobile:
      type: string
```

## Installation

```js
npm install swagger-mongoose
```

## Limitations

swagger-mongoose supports the following attributes: integer, long, float, double, string, password, boolean, date, dateTime, object, array (including nested schemas). swagger-mongoose also supports relationships between objects in a swagger document (thanks to @buchslava)

swagger-mongoose does not yet perform/create any validation from the swagger definitions (see issues if you'd like to help)

## License

Copyright 2016 Simon Guest and other contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
