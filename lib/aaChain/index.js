var Bignumber = require('bignumber.js');
var Web3 = require('web3');
var EthereumTx = require('ethereumjs-tx');
var utils = require('ethereumjs-utils');
const SimpleKeyring = require('eth-simple-keyring');
var abi = require('human-standard-token-abi');
var async = require('async');
var sha256 = require('js-sha256')
const checkPrivateKeyLength = require('../help/length');
const { browserAddress, browserAddressTest } = require('../config.json');
const Transaction = require('../help/transaction');
const hdkey = require('ethereumjs-wallet/hdkey');
const bip39 = require('bip39');
const PATH = "m/44'/60'/0'/0/0";
const txDecoder = require('ethereum-tx-decoder')
// Erc20转账方法的Sha值
var TransferMethodSha = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

function EthSdk (provider) {


    const options = {
        defaultBlock: 'latest',
        transactionBlockTimeout: 50,
        transactionConfirmationBlocks: 24,
        transactionPollingTimeout: 60
    };

    this.host = provider.host;
    this.port = provider.port;
    this.chainId = '0xa'; // 必须16进制

    var hasProtocol = /^https?:\/\//.test(this.host)

    // 实例化的web3对象
    this.web3 = new Web3(`${hasProtocol ? '' : 'http://'}${this.host}${hasProtocol ? '' : `:${this.port}`}`, options);
    const ip = provider.testnet === true ? browserAddressTest : browserAddress;
    this.privateUrl = `${ip}:7022/api/v1/transaction?chainName=eth`
    // this.minPrice = "18000000000"
}

/**
 * 创建交易体
 */
EthSdk.prototype.createTxInfo = async function ({ from, to, value, fee, data = '0x', nonce }) {
    if (nonce == undefined) {
        throw '请传入nonce'
    }
    // 验证地址是否有效
    this.isValidAddress(to);
    this.isValidAddress(from);
    var that = this;
    var gasPrice = await this.web3.eth.getGasPrice();
    var bigGasPrice = new Bignumber(gasPrice).decimalPlaces(0)
    var gas = new Bignumber(fee).div(bigGasPrice).decimalPlaces(0)
    // 获取nonce
    // var nonce = await this.web3.eth.getTransactionCount(from, 'pending');
    // 创建一个交易体
    var tx = new EthereumTx({
        from,
        nonce: '0x' + nonce.toString(16),
        gasPrice: `0x${bigGasPrice.toString(16)}`,
        gasLimit: `0x${Bignumber(gas).toString(16)}`,
        to,
        chainId: this.chainId,
        data,
        gas: `0x${Bignumber(gas).toString(16)}`,
        value: `0x${Bignumber(value).toString(16)}`
    })
    return tx;
}

EthSdk.prototype.isValidPrivate = function (privateKey) {
    if (!utils.isValidPrivate(utils.toBuffer(privateKey))) {
        throw new Error('无效的私钥')
    }
}

EthSdk.prototype.unsign = function (rawTransaction) {
    // const from = this.web3.eth.accounts.recoverTransaction(rawTransaction);;
    tx = txDecoder.decodeTx(rawTransaction);
    tx.gasLimit = tx.gasLimit.toString()
    tx.gasPrice = tx.gasPrice.toString()
    tx.value = tx.value.toString()
    // tx.from = from;
    return tx;
}

EthSdk.prototype.unlockKeyStore = function (keyStoreObj, passwd) {
    let acc0json = this.web3.eth.accounts.decrypt(keyStoreObj, passwd);
    return acc0json
}

EthSdk.prototype.getKeyStore = function (privateKey, passwd) {
    let acc0json = this.web3.eth.accounts.encrypt(privateKey, passwd);
    return acc0json
}



EthSdk.prototype.getNonce = async function (address) {
    var nonce = await this.web3.eth.getTransactionCount(address, 'pending')
    return nonce;
}

EthSdk.prototype.getTransaction = async function (hash) {
    var nonce = await this.web3.eth.getTransaction(hash)
    return nonce;
}
/**
 * @desc 发送交易
 * @param{string} privateKey
 * @param{string} recipientAddress
 * @param{string} amount
 * @param{string} fee
 * @param needValue 如果是代币合约的话　发送交易　是否需要发送value的值为amount
 * */

EthSdk.prototype.createTx = async function (privateKey, recipientAddress, amount, fee, contract, data, nonce, needValue = false) {

    var reg = /^0x/
    if (!reg.test(privateKey)) {
        privateKey = '0x' + privateKey;
    }

    if (typeof amount != 'string' || typeof fee != 'string') {
        throw 'amount 和 fee 必须是字符串';
    }

    var bigAmount = new Bignumber(amount), bigFee = new Bignumber(fee);


    if (!bigAmount.isInteger() || !bigFee.isInteger()) {
        throw 'amount 和 fee必须是字符串整型';
    }

    var paa = this.getPublicKeyAndAddress(privateKey);

    var tx;

    if (contract) {
        this.isValidAddress(contract)
        var token = new this.web3.eth.Contract(abi, contract);

        if (!data) {
            this.isValidAddress(recipientAddress)
            data = token.methods.transfer(recipientAddress, bigAmount.toString(10)).encodeABI();
        }

        tx = await this.createTxInfo({
            from: paa.address,
            to: contract,
            value: needValue ? amount : '0',
            fee: fee,
            data,
            nonce
        });
    } else {
        this.isValidAddress(recipientAddress)
        tx = await this.createTxInfo({
            from: paa.address,
            to: recipientAddress,
            value: amount,
            fee: fee,
            data,
            nonce
        });
    }
    tx.sign(utils.toBuffer(privateKey));
    var serialize = tx.serialize();
    var txHash = '0x' + tx.hash().toString('hex');
    var v = '0x' + tx.v.toString('hex');
    var s = '0x' + tx.s.toString('hex');
    var r = '0x' + tx.r.toString('hex');
    //返回交易
    return {
        txHash,
        codingTx: '0x' + serialize.toString('hex'),
        v,
        s,
        r,
    }
}

EthSdk.prototype.send = async function (codingTx) {
    return new Promise((resolve, reject) => {
        this.web3.eth.sendSignedTransaction(codingTx)
            .on('transactionHash', (hash) => {
                resolve(hash)
            })
            .on('error', (err) => {
                reject(err)
            })
    })

}

//查询余额
EthSdk.prototype.getBalance = async function (address, contract) {
    this.isValidAddress(address);
    return await this.web3.eth.getBalance(address)
}

EthSdk.prototype.getErc20Balance = async function (contract, address) {
    this.isValidAddress(contract);
    this.isValidAddress(address);
    var token = new this.web3.eth.Contract(abi, contract)
    var balance = await token.methods.balanceOf(address).call();
    return balance.toString();
}
// 获取合约symbol
EthSdk.prototype.getErc20Symbol = async function (contract) {
    this.isValidAddress(contract);
    var token = new this.web3.eth.Contract(abi, contract)
    var symbol = await token.methods.symbol().call();
    return symbol;
}

// 获取合约内容
EthSdk.prototype.getErc20Decimal = async function (contract) {
    this.isValidAddress(contract);
    var token = new this.web3.eth.Contract(abi, contract)
    var decimal = await token.methods.decimals().call();
    decimal = decimal._hex ? decimal._hex : decimal;
    return parseInt(decimal);
}

EthSdk.prototype.parseHexValue = function (hexValue) {
    // console.log('xxx  ----  ', hexValue)
    return (new Bignumber(hexValue)).toString()


}

// 是否有效的以太坊地址
EthSdk.prototype.isValidAddress = function (address) {
    if (!utils.isValidAddress(address)) {
        throw new Error('无效的以太坊地址')
    }
}

// 验证地址是否合法
EthSdk.prototype.checkAddress = function (address) {
    if (!utils.isValidAddress(address)) {
        return false;
    }
    return true;
}


EthSdk.prototype.toLowCase = function (str) {
    if (str) {
        return str.toLocaleLowerCase()
    }
}
/**
 *
 * @param {object} txData //链上返回的数据对象
 * @return {object} //返回通用格式的对象
 */
EthSdk.prototype.getCommonTx = function (txData, receiptData, ercData) {
    // 交易状态
    var status = null;
    if (!txData.blockHash) {
        status = 'pending';
    } else if (receiptData.status) {
        status = 'success';
    } else {
        status = 'failed';
    }

    txData.from = this.toLowCase(txData.from)
    txData.to = this.toLowCase(txData.to)
    const innerData = (new Buffer(txData.input.slice(2), 'hex')).toString()
    var commonData = {
        status: status, //交易状态 success failed pendding
        blockHeight: txData.blockNumber,
        txHash: txData.hash,
        sender: txData.from,
        recipient: txData.to,
        amount: txData.value,
        fee: Bignumber(receiptData.gasUsed).times(txData.gasPrice).toString(10),
        data: innerData,
        input: txData.input,
        logs: receiptData.logs ? receiptData.logs : []
    };
    if (ercData) {
        // Erc20
        ercData.from = this.toLowCase(ercData.from)
        ercData.to = this.toLowCase(ercData.to)
        commonData = Object.assign({}, commonData, {
            isErc20: true,
            erc20Sender: ercData.from,
            erc20Recipient: ercData.to,
            amount: ercData.value,
            recipient: ercData.contract
        });
    } else {
        // 返回通用的交易格式
        commonData = Object.assign({}, commonData, {
            isErc20: false, // 判断是否为erc20的转账，如果为true, 则erc20Sender 和 erc20Recipient不会空
            erc20Sender: null,
            erc20Recipient: null,
        });
    }

    return commonData;
}

EthSdk.prototype.getLastBlock = async function () {
    var data = await this.web3.eth.getBlock('latest')
    data.nonce = this.parseHexValue(data.nonce)
    return data;

}

EthSdk.prototype.createKeypair = async function () {
    const key = new SimpleKeyring();
    const address = await key.addAccounts(1);

    const privateKey = await key.exportAccount(address[0]);
    const publicKey = await utils.privateToPublic(utils.keccak256(privateKey));

    keyPair = {
        publicKey: `0x${publicKey.toString('hex')}`,
        privateKey: `0x${privateKey.toString('hex')}`,
    }

    return keyPair
}

EthSdk.prototype.getPublicKeyAndAddress = function (privateKey) {

    checkPrivateKeyLength(privateKey);

    var reg = /^0x/
    if (!reg.test(privateKey)) {
        privateKey = '0x' + privateKey
    }
    this.isValidPrivate(privateKey);
    var publicKey = utils.privateToPublic(utils.toBuffer(privateKey)).toString('hex');
    publicKey = `0x${publicKey}`;
    var address = this.getAddress(publicKey);
    return {
        publicKey,
        address
    }
}

EthSdk.prototype.getAddress = function (publicKey) {
    if (!utils.isValidPublic(utils.toBuffer(publicKey))) {
        throw new Error('无效的公钥')
    }
    return `0x${utils.publicToAddress(publicKey).toString('hex')}`;
}

// 普通
EthSdk.prototype.getAverageFee = async function (to, data) {
    var that = this;
    var gas = await this.web3.eth.estimateGas({
        to,
        data
    });
    var gasPrice = await this.web3.eth.getGasPrice()
    // 平均手续费的1.2倍，兼容token的发送, gas也是平均的1.5倍
    var averageFee = new Bignumber(gas).times(gasPrice).decimalPlaces(0).toString(10);
    return averageFee;
}



EthSdk.prototype.getGas = async function (sender, recipient, value, contract) {
    var token = new this.web3.eth.Contract(abi, contract);
    const data = token.methods.transfer(recipient, value).encodeABI();
    let gas = await this.web3.eth.estimateGas({
        from: sender,
        to: contract,
        data,
    });
    return gas;
}


// FIXME:原本是同步方法， 但是改为适用于IMToken的时候，它为异步方法。尴尬
EthSdk.prototype.getPrivateKeyBySeed = function (seed) {
    // 旧生成方式
    // privateKey = sha256(seed);
    // return "0x" + privateKey;

    // imToken 生成方式
    const hdWallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(seed));
    const wallet = hdWallet.derivePath(PATH).getWallet();
    const privateKey = wallet.getPrivateKeyString();
    // console.log(privateKey, wallet.getAddressString(), wallet.getPublicKeyString())
    return privateKey;
}



EthSdk.prototype.getBlock = async function (numberOrHash) {

    var block = await this.web3.eth.getBlock(numberOrHash)
    block.nonce = this.parseHexValue(block.nonce)
    return block;
}



module.exports = EthSdk;
