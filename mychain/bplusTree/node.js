const utils = require('./utils');

function Node(options) {
  if (!options) {
    options = {};
  }

  this.keys = options.keys || [];
  this.values = options.values || [];
  this.pointers = options.pointers || [];

  this.parent = options.parent || null;
  this.pointer = options.pointer || null;
}

Node.TYPES = {
  INTERNAL: '0',
  LEAF: '1'
};

Node.prototype.hash = function() {
  return utils.sha256(this.toBuffer());
};

Node.prototype.size = function() {
  return this.keys.length;
};

Node.prototype.isLeaf = function() {
  return this.pointers.length > 0 ? false : true;
};

// 将节点从中间分裂，返回分裂后的左，右，中间
Node.prototype.split = function(branchingFactor) {
  // 向下取整
  let halfPosition = Math.floor(branchingFactor / 2);
  return {
    left: new Node({
      keys: this.keys.slice(0, halfPosition),
      values: this.values.slice(0, halfPosition),
      pointers: this.pointers.slice(0, halfPosition)
    }),
    right: new Node({
      keys: this.keys.slice(halfPosition + 1, this.keys.length),
      values: this.values.slice(halfPosition + 1, this.values.length),
      pointers: this.pointers.slice(halfPosition + 1, this.pointers.length)
    }),
    middleKey: this.keys[halfPosition],
    middleValue: this.values[halfPosition]
  };
};

Node.prototype.search = function(key) {
  let i
  for(i = 0; (i < this.keys.length) && (key >= this.keys[i]); i++) {
    if(this.keys[i] === key) {
      return {
        found: true,
        index: i
      }
    }
  }
  return {
    found: false,
    index: i
  }

  // 二分查找
  // let self = this;
  // let max = self.keys.length - 1;
  // let min = 0;
  // while(min <= max) {
  //   let position = Math.floor((max + min) / 2);
  //   //let valueCompare = self.keys[position].compare(key);
  //   if (self.keys[position] > key) {
  //     max = position - 1;
  //   } else if (self.keys[position] < key){
  //     min = position + 1;
  //   } else {
  //     return {
  //       found: true,
  //       index: position
  //     };
  //   }
  // }
  // return {
  //   found: false,
  //   index: min
  // };
};

// 是否匹配
Node.prototype.searchMatch = function(key) {
  let result = this.search(key);
  if (!result.found) {
    throw new Error('Key not found: ' + key);
  } else {
    return result.index;
  }
};

Node.prototype.searchLowerBound = function(key) {
  let result = this.search(key);
  if (result.found) {
    throw new Error('Duplicate key exists');
  } else {
    return result.index
  }
};

Node.prototype.locatePointer = function(key) {  
  let result = this.search(key);

  if(result.found) {
    
  } else if(this.keys[result.index] < key) {
    return this.pointers[result.index + 1]
  } else {
    return this.pointers[result.index]
  }
}; 

Node.prototype.relinkPointer = function(oldPointer, newPointer) {
  for(let i = 0; i < this.pointers.length; i++) {
    if(this.pointers[i] === oldPointer) {
      this.pointers[i] = newPointer
      return
    }
  }
};

Node.prototype.promoteKey = function(middleIndex, key, value, leftPointer, rightPointer) {
  let result = this.search(key);
  if(result.found) {
    throw new Error('Key already exists')
  } else {
    this.keys.splice(middleIndex, 0, key)
    this.values.splice(middleIndex, 0, value)
    this.pointers.splice(middleIndex, 0, leftPointer)
    this.pointers.splice(middleIndex + 1, 0, rightPointer)
  }
};

Node.prototype.get = function(key) {
  let index = this.searchMatch(key);
  return this.values[index];
};

// 节点中插入关键字
Node.prototype.insert = function(key, value) {
  let lowerIndex;
  try {
    lowerIndex = this.searchLowerBound(key);
  } catch(e) {
    return false;
  }
  let pos = lowerIndex;
  
  this.keys.splice(pos, 0, key);
  this.values.splice(pos, 0, value);
  return pos;
};

module.exports = Node;