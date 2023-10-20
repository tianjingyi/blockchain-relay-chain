const levelDB = require('../DBStored.js');

class TxIndex {
    constructor () {
        this.index = new Map()
    }

    getPreBlockIndex(callback) {
        let keyNumber
        levelDB.getLevelDBData('keyNumber', (key, value) => {
            keyNumber = value

            levelDB.getLevelDBData(keyNumber-1, (key, value) => {
                let oldIndex = JSON.parse(value).txIndex
                callback(oldIndex)
            })
        })
    }

    insert(key, value) {
        this.index.set(key, value)
    }
}

exports.TxIndex = TxIndex;