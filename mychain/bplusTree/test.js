const level = require('level');
const db = level('./treedata');

const Tree = require('./tree.js');
const Node = require('./node.js');

const tree = new Tree({db: db, branchingFactor: 3, root: new Node()});

const key = '9a9a7810c119d74e';
const value = '7319f63e4d58f03705ba0c4e7b87655a1fcfcca53e708bb46c79b299aa6961db';
const key1 = '9a9a7810c119d74e1';
const value1 = '7319f63e4d58f03705ba0c4e7b87655a1fcfcca53e708bb46c79b299aa6961db1';
const key2 = '9a9a7810c119d74e2';
const value2 = '7319f63e4d58f03705ba0c4e7b87655a1fcfcca53e708bb46c79b299aa6961db2';
const key3 = '9a9a7810c119d74e3';
const value3 = '7319f63e4d58f03705ba0c4e7b87655a1fcfcca53e708bb46c79b299aa6961db3';
const key4 = '9a9a7810c119d74e4';
const value4 = '7319f63e4d58f03705ba0c4e7b87655a1fcfcca53e708bb46c79b299aa6961db4';
const key5 = '9a9a7810c119d74e5';
const value5 = '7319f63e4d58f03705ba0c4e7b87655a1fcfcca53e708bb46c79b299aa6961db5';
const key6 = '1';
const value6 = '11';
const key7 = '2';
const value7 = '22';
const key8 = '3';
const value8 = '33';
const key9 = '4';
const value9 = '44';
const key10 = '5';
const value10 = '55';

tree.insert(key, value, function(err, rootHash) {
  if (err) {
    throw err;
  }
  tree.insert(key1, value1, function(err, rootHash) {
    if (err) {
      throw err;
    }
    tree.insert(key2, value2, function(err, rootHash) {
      if (err) {
        throw err;
      }
      tree.insert(key3, value3, function(err, rootHash) {
        if (err) {
          throw err;
        }
        tree.insert(key4, value4, function(err, rootHash) {
          if (err) {
            throw err;
          }
          tree.insert(key5, value5, function(err, rootHash) {
            if (err) {
              throw err;
            }
            tree.insert(key6, value6, function(err, rootHash) {
              if (err) {
                throw err;
              }
              tree.insert(key7, value7, function(err, rootHash) {
                if (err) {
                  throw err;
                }
                tree.insert(key8, value8, function(err, rootHash) {
                  if (err) {
                    throw err;
                  }
                  tree.insert(key9, value9, function(err, rootHash) {
                    if (err) {
                      throw err;
                    }
                    tree.insert(key10, value10, function(err, rootHash) {
                      if (err) {
                        throw err;
                      }
                      tree.get(key8, function(err, value) {
                        if (err) {
                          throw err;
                        }
                        console.log(value);
                      });
                    });
                      
                  });
                });
              });
            });
            // console.log('root', tree.root);

            // for(let item of tree.root.pointers) {
            //   db.get(item, function(err, value) {
            //     if (err) {
            //       throw err;
            //     }
            //     console.log(item, value);
            //   });
            // }
          });
        });
        
      });
    });
  });
});








// console.log('rootHash', tree.root);