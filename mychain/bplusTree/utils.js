const assert = require('assert');
const SHA256 = require('crypto-js/sha256');

const utils = {};

utils.sha256 = function(str) {
  return SHA256(JSON.stringify(str)).toString();
};

utils.asyncMap = function(array, iterator, callback) {
  var results = new Array(array.length);
  var pending = array.length;
  var error = null;

  if (!pending) {
    return setImmediate(callback);
  }

  function getNext(index) {
    return function next(err, result) {
      assert(pending > 0, 'callback called multiple times');
      if (err) {
        error = err;
      }
      results[index] = result;
      pending -= 1;
      if (!pending) {
        callback(error, results);
      }
    };
  }

  array.forEach(function(item, i) {
    iterator(item, getNext(i));
  });

};

module.exports = utils;