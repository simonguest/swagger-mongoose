'use strict';

module.exports.homePhone = {
  message: '{VALUE} is not a valid home phone number!',
  validator: function(v){
    return /([0-9]{1}[-\.\s])?([\(\[]?[0-9]{3}[\)\]]?[-\.\s])?([0-9]{3})[-\.\s]([0-9]{4})(?:\s?(?:x|ext)\s?([0-9])+)?/.test(v)
  }
}
