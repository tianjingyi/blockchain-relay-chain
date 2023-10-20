const level = require('level');
const treeDB = level('./bplusTree/treedata');

treeDB.get('4', function(err, value) {
    console.log(value)
})