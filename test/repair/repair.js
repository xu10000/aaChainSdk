const { Sequelize } = require('sequelize');
const Tx = require('./tx')
const AachainSdk = require('./aachainSdk');
// const { default: BigNumber } = require('bignumber.js');
const BigNumber = require("bignumber.js")

var txModel
var aachainSdk
const sdkHost = '161.202.173.39'
const sdkPort = 8000

const dbHost = '119.8.104.104'
const dbName = 'aa_chain'
const dbUser = 'root'
const dbPasswd = '6805fe827a3dea0f'
const firstAddress = '0xb4D059Ca1c63B6cd90D899aDE1837FC50fA10F39'.toLowerCase()
const initEthBalance = "9900000000000000000000000000"
const yDecimal  = 100000000 * 10 ** 18 // 亿的精度
const privateKey = "aa32a8588d78c0062d0b81a567ea8f288d6bbbfa08902d989a68043856db59b3"
// AAB
const AABContract = '0x724Cbb5c969890Adc6580d610f9086Ecc003A53A'
const AABNewContract = '';
const AABInitBalance = new BigNumber(999).times(yDecimal).toFixed(0)
const zeroAddress = '0x0000000000000000000000000000000000000000'
// ASDT  
const ASDTContract = '0x15A016109740A1689a788a0AE4e98C81f5aBEBa8'
const ASDTNewContract = '';
const ASDTInitBalance = new BigNumber(9999).times(yDecimal).toFixed(0)
// AAC  
const AACContract = '0x11a2846bFE5DAe84A097b72F7921A506F3006c60'
const AACNewContract = '';
const AACInitBalance = new BigNumber(99).times(yDecimal).toFixed(0)
// AAE 
const AAEContract = '0x740819a47E5119BD921D220A11ef52f3651b8272'
const AAENewContract = '';
const AAEInitBalance = new BigNumber(999).times(yDecimal).toFixed(0)
// AAS
const AASContract = '0xbbD4a0af29496f67A5C87Ee3784171a70848aa50'
const AASNewContract = '';
const AASInitBalance = new BigNumber(999).times(yDecimal).toFixed(0)
// AAG
const AAGContract = '0x7227dA1CDdc5004452FE93fCc0163ED5003207C6'
const AAGNewContract = '';
const AAGInitBalance = new BigNumber(999).times(yDecimal).toFixed(0)
//AAP 
const AAPContract = '0xF8DBfeEBBDC8f81A82754C0e4a81c6bd10c46dCF'
const AAPNewContract = '';
const AAPInitBalance = new BigNumber(999).times(yDecimal).toFixed(0)
// STC
const STCContract = '0xacc2aEbe32F037E68AF572804f477064b792B6c9'
const STCNewContract = '';
const STCInitBalance = new BigNumber(200).times(yDecimal).toFixed(0)
const sequelize = new Sequelize(dbName, dbUser, dbPasswd, {
  // host: '119.8.104.104',
  // port: 3306,
  // dialect: 'mysql',
  host: dbHost,
  dialect: 'mysql',
  pool: {      //连接池设置
    max: 5,  //最大连接数
    idle: 30000,
    acquire: 60000
  },
  dialectOptions: {
    charset: 'utf8mb4',  //字符集
    collate: 'utf8mb4_unicode_ci'
  },
  define: {   //模型设置
    freezeTableName: true,    //自定义表面，不设置会自动将表名转为复数形式
    timestamps: false    //自动生成更新时间、创建时间字段：updatedAt,createdAt
  }
})


function init () {
  aachainSdk = AachainSdk.init(sdkHost, sdkPort)
  txModel = Tx.init(sequelize)
}

async function getTxArr () {
  var userArr = []
  var condition = {
    contract: "",
    // limit: 100,
  }

  txsCount = await txModel.count({
    where: condition
  })
  console.log('eth tx count: ', txsCount)
  var txs = await txModel.findAll({
    raw: true,
    where: condition,
    order: [
      ["autoId", "asc"]
    ]
    /**limit: 10**/
  })
  // console.log('\nxxalll ', txs)

  return txs
}

async function getAllEth (txs) {
  var ethArr = []
  ethArr[firstAddress] = initEthBalance
  for (let i = 0; i < txs.length; i++) {
    var tx = txs[i]
    if (tx.from && tx.to && tx.value!="0") {
      tx.from = tx.from.toLowerCase()
      tx.to = tx.to.toLowerCase()
      var fromRes = new BigNumber(ethArr[tx.from]).minus(tx.value)
      // 结果必须大于等于0
      if (fromRes.lt(0)) {
        throw `fromRes.less(0) 
        tx: ${JSON.stringify(tx)}
        ethArr[tx.from] ${ethArr[tx.from]}
        tx.Value: ${tx.value}
        `
      }

      ethArr[tx.from] = fromRes.toFixed(0)
      // console.log('xxx ', ethArr[tx.from])

      // to没有账户则创建
      if (!ethArr[tx.to]) {
        ethArr[tx.to] = "0"
      }
      ethArr[tx.to] = new BigNumber(ethArr[tx.to]).plus(tx.value).toFixed(0)
    }
  }
  return ethArr;
}

function checkAmount(arr, total) {
  var _total = new BigNumber(0)
  // console.log('ethArr ', arr)

  for(address in arr ){
    // console.log('b ', arr[address])
    _total = _total.plus(arr[address])
  }
  console.log("plus amount: ", _total.toFixed(0), "total: ", total)
  if (!_total.eq(total)) {
    throw `_total.neq(total)`
  }
}
async function getErc20TxArr(contract) {
  var userArr = []
  var condition = {
    contract,
    // limit: 100,
  }

  txsCount = await txModel.count({
    where: condition
  })
  console.log('contract tx count: ', txsCount)
  var txs = await txModel.findAll({
    raw: true,
    where: condition,
    order: [
      ["autoId", "asc"]
    ]
    /**limit: 10**/
  })
  return txs;
}

async function getAllErc20(txs, total) {
  var erc20Arr = []
  erc20Arr[firstAddress] = total
  for (let i = 0; i < txs.length; i++) {
    var tx = txs[i]
    if (tx.erc20From && 
      tx.erc20From !== zeroAddress &&
      tx.erc20To && 
      tx.erc20To !== zeroAddress &&
      tx.erc20Value!="0") {
      tx.erc20From = tx.erc20From.toLowerCase()
      tx.erc20To = tx.erc20To.toLowerCase()
      var fromRes = new BigNumber(erc20Arr[tx.erc20From]).minus(tx.erc20Value)
      // 结果必须大于等于0
      if (fromRes.lt(0)) {
        throw `fromRes.less(0) 
        tx: ${JSON.stringify(tx)}
        erc20Arr[tx.from] ${erc20Arr[tx.erc20From]}
        tx.Value: ${tx.erc20Value}
        `
      }
      // console.log('xxx ', fromRes)

      erc20Arr[tx.erc20From] = fromRes.toFixed(0)

      // to没有账户则创建
      if (!erc20Arr[tx.erc20To]) {
        erc20Arr[tx.erc20To] = "0"
      }
      erc20Arr[tx.erc20To] = new BigNumber(erc20Arr[tx.erc20To]).plus(tx.erc20Value).toFixed(0)
    }
  }

  return erc20Arr;
}
async function sendEth(arr) {
  var count = 0
  for (address in arr) {
    var balance = arr[address]
    if(balance=="0") {
      continue
    }

    if(count < 1) {
      ++count
      continue
    }
    // 获取发送者地址
    var sender = aachainSdk.getPublicKeyAndAddress(privateKey).address;
    
    // 获取nonce
    var nonce = await aachainSdk.getNonce(sender);
    console.log(`当前交易的nonce为： ${nonce} count ${++count} balance ${balance}`)
    // 获取平均手续费
    var fee = await aachainSdk.getAverageFee()
    // console.log(`xxxxxtxData 00`)

    // 创建交易
    var txData = await aachainSdk.createTx(
        privateKey,
        address,
        balance, // eth数量
        fee,
        null,
        "",
        nonce,
    )
    // console.log(`xxxxxtxData `, txData)

    // 发送交易
    try {
      var txHash = await aachainSdk.send(txData.codingTx);
      console.log(`成功发送交易， hash： ${txHash}`)

    }catch(err) {
      throw `err ${JSON.stringify(err)}`
    }
    // break;
  }
}

async function main () {
  init()
  // get eth balance
  var ethTxs = await getTxArr()
  var ethArr = await getAllEth(ethTxs)
  checkAmount(ethArr, initEthBalance)
  console.log('ethArr ', ethArr)
  // await sendEth(ethArr)
  

  // get erc20 balance
  // AAB
  // aabTxs = await getErc20TxArr(AABContract) 
  // aabArr = await getAllErc20(aabTxs, AABInitBalance)
  // checkAmount(aabArr, AABInitBalance)
  // console.log(`aabTxs `, aabArr)
  // ASDT
  // asdtTxs = await getErc20TxArr(ASDTContract) 
  // asdtArr = await getAllErc20(asdtTxs, ASDTInitBalance)
  // checkAmount(asdtArr, ASDTInitBalance)
  // console.log(`asdtTxs `, asdtArr)
  // AAC
  // aacTxs = await getErc20TxArr(AACContract) 
  // aacArr = await getAllErc20(aacTxs, AACInitBalance)
  // checkAmount(aacArr, AACInitBalance)
  // console.log(`aacTxs `, aacArr)
//   // AAE
//   aaeTxs = await getErc20TxArr(AAEContract) 
//   aaeArr = await getAllErc20(aaeTxs, AAEInitBalance)
//   checkAmount(aaeArr, AAEInitBalance)
//   console.log(`aaeTxs `, aaeArr)
//   // AAS
//   aasTxs = await getErc20TxArr(AASContract) 
//   aasArr = await getAllErc20(aasTxs, AASInitBalance)
//   checkAmount(aasArr, AASInitBalance)
//   console.log(`aasTxs `, aasArr)
//   // AAG
//   aagTxs = await getErc20TxArr(AAGContract) 
//   aagArr = await getAllErc20(aagTxs, AAGInitBalance)
//   checkAmount(aagArr, AAGInitBalance)
//   console.log(`aagTxs `, aagArr)
//   // AAP
//   aapTxs = await getErc20TxArr(AAPContract) 
//   aapArr = await getAllErc20(aapTxs, AAPInitBalance)
//   checkAmount(aapArr, AAPInitBalance)
//   console.log(`aapTxs `, aapArr)
// // STC
// stcTxs = await getErc20TxArr(STCContract) 
// stcArr = await getAllErc20(stcTxs, STCInitBalance)
// checkAmount(stcArr, STCInitBalance)
// console.log(`stcTxs `, stcArr)

}

main()