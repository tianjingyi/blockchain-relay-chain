const level = require('level');
const db = level('./chaindata');
const sc = require('./chainEntity.js');

module.exports = {
  addLevelDBData: function(key, value) {
    
    db.put(key, value, function(err) {
      if (err) 
        return console.log('Block: ' + key + ' submission failed', err);
    })
    console.log('newBlock put success!')
  },

  getLevelDBData: function(key, callback) {
    db.get(key, function(err, value) {
        if (err) 
          return console.log('Block Not Found!\n', err);
        callback(key, value);
        //console.log('Key: ' + key + ', Value = ' + value);
        //return value;
    })
  }
}