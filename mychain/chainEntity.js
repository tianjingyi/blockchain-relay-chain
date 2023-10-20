const SHA256 = require('crypto-js/sha256');

class Transaction {
    constructor() {
       this.sourceIP = ""
       this.desIP = "" 
       this.goodHash = ""  
    }
}

class Block {
    constructor() {
        this.hash = "",
        this.number = 0,
        this.parentHash = "",
        this.merkleRoot = "",
        this.time = "",
        this.nonce = 0,

        this.tx = [],
        this.txIndex = new Map()

        this.vcProof = []
    }
}


class BlockChain {
    constructor() {
        this.blockChain = [],
        this.bplusTreeOfGoods = null
    }

    // pow共识，要求前四位为0
    PoW(block) {
        let i 
        for (i = 0; i < block.hash.length; i++) {
          if (block.hash[i] !== '0') {
              break;
          }
        }
        return i >= 4;
    }

    // 生成创世区块
    createGenesisBlock(genesisBlock) {
        genesisBlock.number = 0;
        genesisBlock.parentHash = "";
        genesisBlock.merkleRoot = "";
        genesisBlock.time = new Date().getTime().toString().slice(0,-3);
        genesisBlock.nonce = 0;
        genesisBlock.hash = SHA256(JSON.stringify(genesisBlock)).toString();
        while(!this.PoW(genesisBlock)){
            genesisBlock.nonce += 1;
            genesisBlock.hash = SHA256(JSON.stringify(genesisBlock)).toString();
        }
        //this.blockChain.push(genesisBlock);
        return genesisBlock;
    }

    //验证区块数据有没有被篡改
    validateBlock(blockNumber) {
        let block = this.getBlock(blockNumber);
        let oldBlockHash = block.hash; //原hash
        // remove block hash to test block integrity
        // block.hash = '';
        //重新获取hash
        let validBlockHash = SHA256(JSON.stringify(block)).toString(); 

        if (oldBlockHash === validBlockHash) {
            return true;
        } else {
            //被改了
            console.log('Block #'+ blockNumber + ' invalid hash:\n' + oldBlockHash + '<>' + validBlockHash); 
            return false;
        }
    }

   // Validate blockchain
    validateChain() {
        let errorLog = [];
        for(let i = 0; i < this.blockChain.length-1; i++) {
            // 验证链上每个区块
            if(!this.validateBlock(i))
                errorLog.push(i);
            // compare blocks hash link
            let blockHash = this.blockChain[i].hash;
            let previousHash = this.blockChain[i+1].parentHash;
            if (blockHash !== previousHash) {
                errorLog.push(i); //push出错区块编号
            }
        }

        if(errorLog.length > 0) {
            console.log('Block errors = ' + errorLog.length + '\n');
            console.log('Blocks: ' + errorLog);
        } else {
            console.log('No errors detected');
        }
    }
}

exports.Transaction = Transaction;
exports.Block = Block;
exports.BlockChain = BlockChain;
