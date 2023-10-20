const sc = require('./chainEntity.js');
const levelDB = require('./DBStored.js');
const txIndex = require('./txRelationIndex/index.js')

const SHA256 = require('crypto-js/sha256');
const merkle = require('merkle');
const merkleRoot = merkle('sha256');

const level = require('level');
const treeDB = level('./bplusTree/treedata');
const Tree = require('./bplusTree/tree.js');
const Node = require('./bplusTree/node.js');

let blockChain = new sc.BlockChain();

function createBlockChain() {
    let genesisBlock = new sc.Block();
    genesisBlock = blockChain.createGenesisBlock(genesisBlock);
    levelDB.addLevelDBData(0, JSON.stringify(genesisBlock));
    // 添加表示数据库中键值对个数的key
    levelDB.addLevelDBData('keyNumber', 1);
    // levelDB.getLevelDBData(0, (key, value) => {
    //     console.log('***' + value)
    // })

    // let root = new Node()
    // blockChain.bplusTreeOfGoods = new Tree({db: treeDB, branchingFactor: 3, root: root});

    // treeDB.put('treeRoot', JSON.stringify(blockChain.bplusTreeOfGoods.root), function(err) {
    //     if (err) 
    //       return console.log('Block: ' + key + ' submission failed', err);
    // })
}

function addBlockToChain() {
    // 获取到levelDB的key的个数，决定新块的number
    let keyNumber
    levelDB.getLevelDBData('keyNumber', (key, value) => {
        keyNumber = value
        // new一个新块
        let newBlock = new sc.Block()
        newBlock.number = keyNumber;
        if(keyNumber > 0) {
            levelDB.getLevelDBData(keyNumber-1, (key, value) => {
                newBlock.parentHash = JSON.parse(value).hash
                newBlock.tx = ['a', 'b', 'c', 'd']
                // 形成一颗merkle树
                merkleRoot.async(newBlock.tx, function(err, tree) {
                    newBlock.merkleRoot = tree.root().toLowerCase()
                    // 遍历树
                    // for (let i = 0; i < tree.levels(); i++) {
                    //     console.log( tree.level(i) );
                    // }
                });
                newBlock.time = new Date().getTime().toString().slice(0,-3);
                newBlock.nonce = 0;
                newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();


                // 交易索引部分
                let index = new txIndex.TxIndex()
                index.getPreBlockIndex((oldIndex) => {
                    // let newIndex = new Map(Object.entries(oldIndex))
                    let newIndex = oldIndex
                    newIndex['tx3'] = 'tx5'
                    newBlock.txIndex = newIndex

                    treeDB.get('treeRoot', function(err, value) {
                        console.log(value)
                        let oldRoot = JSON.parse(value)
                        let node = new Node({keys: oldRoot.keys, values: oldRoot.values, pointers: oldRoot.pointers, parent: oldRoot.parent, pointer: oldRoot.pointer})
                        
                        if(oldRoot === undefined || oldRoot === null) {
                            let newRoot = new Node()
                            blockChain.bplusTreeOfGoods = new Tree({db: treeDB, branchingFactor: 4, root: newRoot});
                        } else {
                            blockChain.bplusTreeOfGoods = new Tree({db: treeDB, branchingFactor: 4, root: node});
                        }
                        // 为B+树中增加节点
                        let chainInfoOfGoods = "chain5,chain1"
                        let insertKey = SHA256(chainInfoOfGoods).toString()
                        console.log(insertKey)
                        blockChain.bplusTreeOfGoods.insert(insertKey, chainInfoOfGoods, function(err, rootHash) {
                            if (err) {
                                throw err;
                            }
                        });
                        console.log('!!!' + JSON.stringify(blockChain.bplusTreeOfGoods.root))
                        treeDB.put('treeRoot', JSON.stringify(blockChain.bplusTreeOfGoods.root), function(err) {
                            if (err) 
                              return console.log('Block: ' + key + ' submission failed', err);
                        })
                    })
                    

                    // 其余操作在回调函数中执行
                    while(!blockChain.PoW(newBlock)) {
                        newBlock.nonce += 1;
                        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
                    }
                    //新块添加到数据库，并更新db中键值对个数
                    levelDB.addLevelDBData(keyNumber, JSON.stringify(newBlock))
                    levelDB.addLevelDBData('keyNumber', parseInt(keyNumber)+1);
    
                    levelDB.getLevelDBData('keyNumber', (key, value) => {
                        let newKeyNumber = value
                        console.log('区块个数：' + newKeyNumber)
                    })
                    levelDB.getLevelDBData(keyNumber, (key, value) => {
                        let newBlockInfo = value
                        console.log('新区块信息：' + newBlockInfo) 
                    })
                })  
            })
        } else {
            console.log('No genesisBlock!')
        } 
    }) 
}

createBlockChain();
//addBlockToChain();

// 在新增的区块中增加索引，存放跨链交易，再增加一个AccProof字段存放证明
// 新增索引，存放跨链交易涉及的商品信息，所构成的B+树
// 查询功能，根据商品hash查询所存在的链、根据交易hash查询所有相关的跨链交易
function searchChainInfoOfGoods() {
    treeDB.get('treeRoot', function(err, value) {
        if (err) {
            return console.log('Block Not Found!\n', err);
        }

        let oldRoot = JSON.parse(value)
        
        let node = new Node({keys: oldRoot.keys, values: oldRoot.values, pointers: oldRoot.pointers, parent: oldRoot.parent, pointer: oldRoot.pointer})
        if(oldRoot === undefined || oldRoot === null) {
            let newRoot = new Node()
            blockChain.bplusTreeOfGoods = new Tree({db: treeDB, branchingFactor: 4, root: newRoot});
        } else {
            blockChain.bplusTreeOfGoods = new Tree({db: treeDB, branchingFactor: 4, root: node});
        }

        let searchKey = "b966ff5bb97404d4fe7a4a2fe0c4006d4671493722bf136f885a29dae957bead"
        blockChain.bplusTreeOfGoods.get(searchKey, function(err, value) {
            if (err) {
                throw err;
            }
            console.log(value);
        });
    })  
}
//searchChainInfoOfGoods()

function searchTxRealation() {
    let find = "tx1"
    let keyNumber
        levelDB.getLevelDBData('keyNumber', (key, value) => {
            keyNumber = value

            levelDB.getLevelDBData(keyNumber-1, (key, value) => {
                let oldIndex = JSON.parse(value).txIndex
                console.log(find, oldIndex[find])
            })
        })
}
//searchTxRealation()