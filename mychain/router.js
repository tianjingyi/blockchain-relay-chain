const axios = require('axios');
const exec = require('child_process').exec;

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

module.exports = function (app) {	
	app.post('/sendtx', async function (req, res) {
		try {
            let blockChain = new sc.BlockChain();
			let tx_args = req.body
			let jsonTx = {
				"sourceIP": tx_args.sourceIP,
				"desIP": tx_args.desIP,
                //还需要发送交易的账户信息，把第一个账户看作公共账户？作为跨链交易的from/to
                //还需要传来商品信息
                "goodHash": tx_args.goodHash,
                "goodInfo": tx_args.goodInfo
                //这两个哈希等向两条链发送交易后，再通过请求的响应获得
				//"sourceTxHash": tx_args.desIP,
                //"desTxHash": tx_args.desIP,
			}
            console.log('接收到了，' + JSON.stringify(jsonTx))

            // add block
            let keyNumber
            levelDB.getLevelDBData('keyNumber', (key, value) => {
                keyNumber = value

                let newBlock = new sc.Block()
                newBlock.number = keyNumber;
                if(keyNumber > 0) {
                    levelDB.getLevelDBData(keyNumber-1, (key, value) => {
                        newBlock.parentHash = JSON.parse(value).hash
                        newBlock.tx.push(JSON.stringify(jsonTx))
                        // 形成一颗merkle树
                        merkleRoot.async(newBlock.tx, function(err, tree) {
                            newBlock.merkleRoot = tree.root().toLowerCase()
                        });
                        newBlock.time = new Date().getTime().toString().slice(0,-3);
                        newBlock.nonce = 0;
                        newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

                        while(!blockChain.PoW(newBlock)) {
                            newBlock.nonce += 1;
                            newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();
                        }

                        // 向链发送交易
                        let sourceTx = {
                            "jsonrpc":"2.0",
                            "method":"eth_sendTransaction",
                            "params":[{"from":"0x7c89b4ddb94e6953f8066b8dcedd3c25f3ff87bd","to":"0x0ec92ae2ebfe3c2e2314c5d44c968f0e93af365c","value":"0x9184e72a","key":"0x1234"}],
                            "id":1
                        }
                        axios.post('http://' + jsonTx.sourceIP + ':8545', sourceTx)
                        .then(res => {
                            let data = res.data
                            console.log('发送交易的回执1' + data)
                        })
                        .catch(err => {
                            console.log('Error: ', err.message);
                        });
                        let desTx = {
                            "jsonrpc":"2.0",
                            "method":"eth_sendTransaction",
                            "params":[{"from":"0x7c89b4ddb94e6953f8066b8dcedd3c25f3ff87bd","to":"0x0ec92ae2ebfe3c2e2314c5d44c968f0e93af365c","value":"0x9184e72a","key":"0x1234"}],
                            "id":1
                        }
                        axios.post('http://' + jsonTx.desIP + ':8545', desTx)
                        .then(res => {
                            let data = res.data
                            console.log('发送交易的回执2' + data)
                        })
                        .catch(err => {
                            console.log('Error: ', err.message);
                        });

                        // 交易索引部分
                        let index = new txIndex.TxIndex()
                        index.getPreBlockIndex((oldIndex) => {
                            let newIndex = oldIndex
                            let sourceTxAndChain = jsonTx.sourceIP + ':' + '交易哈希'
                            let desTxAndChain = jsonTx.desIP + ':' + '交易哈希'
                            newIndex[sourceTxAndChain] = desTxAndChain
                            newIndex[desTxAndChain] = sourceTxAndChain
                            newBlock.txIndex = newIndex
                            let map = new Map(Object.entries(newBlock.txIndex))
                            let keyArr = []
                            // 遍历txIndex，为每个成员生成vc证明
                            map.forEach((value, key) => {
                                keyArr.push(key)
                            })    
                            exec('python ./vc.py '+ keyArr, 
                                function (error, stdout, stderr) {
                                    if(error) {
                                        console.error('error: ' + error)
                                        return
                                    }
                                    newBlock.vcProof = stdout
                            });

                            // treeDB.get('treeRoot', function(err, value) {
                            //     if (err) {
                            //         return console.log('Block Not Found!\n', err);
                            //     }
                            //     let oldRoot = JSON.parse(value)
                                
                            //     let node = new Node({keys: oldRoot.keys, values: oldRoot.values, pointers: oldRoot.pointers, parent: oldRoot.parent, pointer: oldRoot.pointer})
                                
                            //     if(oldRoot === undefined || oldRoot === null) {
                            //         let newRoot = new Node()
                            //         blockChain.bplusTreeOfGoods = new Tree({db: treeDB, branchingFactor: 3, root: newRoot});
                            //     } else {
                            //         blockChain.bplusTreeOfGoods = new Tree({db: treeDB, branchingFactor: 3, root: node});
                            //     }

                            //     // 为B+树中增加节点
                            //     let insertKey = jsonTx.goodHash.toString()
                            //     let chainInfoOfGoods = jsonTx.sourceIP + "," + jsonTx.desIP
                            //     blockChain.bplusTreeOfGoods.insert(insertKey, chainInfoOfGoods, function(err, rootHash) {
                            //         if (err) {
                            //             throw err;
                            //         }

                            //         treeDB.put('treeRoot', JSON.stringify(blockChain.bplusTreeOfGoods.root), function(err) {
                            //             if (err) 
                            //               return console.log('Block: ' + key + ' submission failed', err);
                            //         })
                            //     });
                            // })
                            
                            //新块添加到数据库，并更新db中键值对个数
                            levelDB.addLevelDBData(keyNumber, JSON.stringify(newBlock))
                            levelDB.addLevelDBData('keyNumber', parseInt(keyNumber)+1);
            
                            // levelDB.getLevelDBData('keyNumber', (key, value) => {
                            //     let newKeyNumber = value
                            //     console.log('区块个数：' + newKeyNumber)
                            // })
                            // levelDB.getLevelDBData(keyNumber, (key, value) => {
                            //     let newBlockInfo = value
                            //     console.log('新区块信息：' + newBlockInfo) 
                            // })
                        })  
                    })
                } else {
                    console.log('No genesisBlock!')
                } 
            })
			
		    res.status(200).json({response: '发送交易上链成功！'});
		} catch (error) {
		    console.error(`Failed to evaluate transaction: ${error}`);
		    res.status(500).json({error: error});
		    process.exit(1);
		}
	});
	
	// app.get('/searchTree', async function (req, res) {
    //     let blockChain = new sc.BlockChain()
    //     let result
    //     treeDB.get('treeRoot', function(err, value) {
    //         let oldRoot = JSON.parse(value)
            
    //         let node = new Node({keys: oldRoot.keys, values: oldRoot.values, pointers: oldRoot.pointers, parent: oldRoot.parent, pointer: oldRoot.pointer})
    //         if(oldRoot === undefined || oldRoot === null) {
    //             let newRoot = new Node()
    //             blockChain.bplusTreeOfGoods = new Tree({db: treeDB, branchingFactor: 3, root: newRoot});
    //         } else {
    //             blockChain.bplusTreeOfGoods = new Tree({db: treeDB, branchingFactor: 3, root: node});
    //         }

    //         let searchKey = req.query.goodHash
    //         blockChain.bplusTreeOfGoods.get(searchKey, function(err, value) {
    //             if (err) {
    //                 throw err;
    //             }
    //             result = value
    //             res.status(200).json({response: {result: result}});
    //         });
    //     })

		
	// });
	
	app.get('/searchTx', async function (req, res) {
        let find = req.body.txInfo
        let keyNumber
        let result
        levelDB.getLevelDBData('keyNumber', (key, value) => {
            keyNumber = value

            levelDB.getLevelDBData(keyNumber-1, (key, value) => {
                let oldIndex = JSON.parse(value).txIndex
                result = oldIndex[find]
            })
        })

		res.status(200).json({response: {result: result}});
	});
}
