const Node = require('./node');
const utils = require('./utils');

function Tree(options) {
  this.db = options.db;
  // key count
  this.branchingFactor = options.branchingFactor || Tree.DEFAULT_BRANCHING_FACTOR;
  this.root = options.root;
}

Tree.DEFAULT_BRANCHING_FACTOR = 3;
// Tree.DEFAULT_KEY_SIZE = 8;
// Tree.DEFAULT_VALUE_SIZE = 32;

Tree.prototype._maxLeafSize = function() {
  return this.branchingFactor;
};

Tree.prototype._searchLeaf = function(key, node, callback) {
  let self = this;
  if (!(node.pointers.length > 0)) {
    return callback(null, node);
  }

  this._getNextNode(node, key, function(err, nodeObj) {
    if (nodeObj.pointers.length <= 0) {
      return callback(null, nodeObj)
    } else {
      self._searchLeaf(key, nodeObj, callback)
    }
  })
};

Tree.prototype._putNode = function(node, callback) {
  let value = JSON.stringify(node);
  let key = utils.sha256(value);
  this.db.put(key, value, function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, {
      node: node,
      pointer: key,
      value: value
    });
  });
};

Tree.prototype._putNodes = function(nodes, callback) {
  let self = this;
  utils.asyncMap(nodes, function(node, next) {
    self._putNode(node, next);
  }, callback);
};
// prevNode表示node分裂前
Tree.prototype._propagateSplitToParent = function(prevNode, newLeft, newRight, middleKey, middleValue, callback) {
  let parent = prevNode.parent;

  let middleIndex
  for(let i = 0; i < parent.pointers.length; i++) {
    if(parent.pointers[i] === prevNode.pointer) {
      middleIndex = i
      break
    }
  }
  parent.pointers.splice(middleIndex, 1)

  // 父结点中增加middleKey并修改pointers
  parent.promoteKey(middleIndex, middleKey, middleValue, newLeft.pointer, newRight.pointer);
  // 父节点满了再分裂[size()是节点的关键字个数]
  if (parent.size() > this._maxLeafSize()) {
    this._splitNode(parent, callback);
  } else {
    this._putNode(parent, function(err, result) {
      if (err) {
        return callback(err);
      }
      callback(null, result);
    });
  }
};

Tree.prototype._splitNode = function(node, callback) {
  let self = this;

  let split = node.split(this.branchingFactor);
  
  this._putNodes([split.left, split.right], function(err, results) {
    if (err) {
      return callback(err);
    }
    let left = results[0];
    let right = results[1];

    if (node.parent) {
      left.parent = node.parent
      right.parent = node.parent
      self._propagateSplitToParent(node, left, right, split.middleKey, split.middleValue, callback);
    } else {
      // pointers指向左右节点，所以要存左右节点的hash
      let rootNode = new Node({keys: [split.middleKey], values:[split.middleValue], pointers: [left.pointer, right.pointer]});
      left.parent = rootNode
      right.parent = rootNode
      let that = self
      self._putNode(rootNode, function(err, result) {
        if (err) {
          return callback(err);
        }
        that.root = result.node;
        
        callback(null, result);
      });
    }
  });
};

Tree.prototype._relinkNodeParentPointer = function(node, oldPointer, newPointer, callback) {
  let self = this;
  if (node.parent) {
    node.parent.relinkPointer(oldPointer, newPointer);

    let parentOldPointer = node.parent.pointer
    this._putNode(node.parent, function(err, result) {
      if (err) {
        return callback(err);
      }
      self._relinkNodeParentPointer(result.node, parentOldPointer, result.pointer, callback);
    });
  } else {
    this.root = node
    return callback(null, newPointer)
  }
};

Tree.prototype._nodeInsert = function(node, key, value, callback) {
  let self = this;
  this._searchLeaf(key, node, function(err, leaf) {
    if (err) {
      return callback(err);
    }
    let oldPointer = leaf.pointer
    leaf.insert(key, value)
    // 不满直接插入
    if (leaf.size() <= self._maxLeafSize()) {
      //leaf.insert(key, value)
      self._putNode(leaf, function(err, result) {
        if (err) {
          return callback(err);
        }
        self._relinkNodeParentPointer(leaf, oldPointer, result.pointer, callback);
      });
    // 否则分裂
    } else {
      //leaf.insert(key, value)
      self._splitNode(leaf, function(err, result) {
        if (err) {
          return callback(err);
        }
        self._nodeInsert(result.node, key, value, callback);
      });
    }
  });
};

Tree.prototype._getNextNode = function(node, key, callback) {
    let nextNodePointer = node.locatePointer(key)

    this.db.get(nextNodePointer, function(err, nodeInfo) {
      if (err) {
        return callback(err);
      }
      let nodeObj = JSON.parse(nodeInfo)
      let nextNode = new Node({keys: nodeObj.keys, values: nodeObj.values, pointers: nodeObj.pointers, parent: node, pointer: nextNodePointer})
      callback(null, nextNode)
    });
}

Tree.prototype.get = function(key, callback) {
  let self = this
  let result = this.root.search(key)
  if(result.found) {
    return callback(null, this.root.values[result.index]);
  } else {
    this._getNextNode(this.root, key, function(err, nodeObj) {
      let nextNode = nodeObj
      while(nextNode.pointers.length > 0) {
        let result = nextNode.search(key)
        if(result.found) {
          return callback(null, nextNode.values[result.index])
        }
        self._getNextNode(nextNode, key, function(err, nodeObj) {
          nextNode = nodeObj
        })
      }

      let result = nextNode.search(key)
      if(result.found) {
        callback(null, nextNode.values[result.index])
      } else {
        throw new Error('Key not found: ' + key);
      }
    })  
  }
};

Tree.prototype.insert = function(key, value, callback) {
  this._nodeInsert(this.root, key, value, callback);
};

module.exports = Tree;