![Travis Status](https://travis-ci.org/simonguest/swagger-mongoose.svg?branch=master)
# swagger-mongoose

Generate Mongoose Schemas and Models from your Swagger Documents

## Installation

```js
npm install swagger-mongoose
```

## Usage

Simply pass your swagger document to the compile method, and then dynamically access the underlying mongoose models.

```js
var swaggerMongoose = require('swagger-mongoose');

var swagger = fs.readFileSync('./petstore.json');
var Pet = swaggerMongoose.compile(swagger).models.Pet;
```

## Limitations

swagger-mongoose only supports flat schemas, with the following attributes:

  integer, long, float, double, string, password, boolean, date, dateTime, array

swagger-mongoose does not yet support nested schemas or perform/create any validation from the swagger definitions (see issues if you'd like to help)
