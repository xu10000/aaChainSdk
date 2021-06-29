## npm包

### transaction 结构体

```
{
	blockHash: string // 区块hash
	blockNumber: int // 区块高度
	from: string // 转账人的地址
	gas: string
	gasPrice: string // gas * gasPrice =  交易的手续费 (使用bigNewNumber 相乘）
	hash: string // 交易hash
	input: string // 备注
	nonce: int // 转账人交易的序列号
	to: string // 收款人地址
	transactionIndex: int // 在区块中的序号
	value: string // 交易的金额
	timestamp: int // 打包时的时间戳
	v: string  // v r s 用于验证签名
	r: string  
	s: string 
}
```

### block 结构体

```
{
	number： int // 区块高度
	hash: string // 区块hash
	parentHash: // 前一个区块的hash
	nonce: // 区块的序列号
	miner: // 矿工
	difficulty: int // 挖矿难度
	totalDifficulty: int // 到目前为止的难度
	size: int // 区块大小
	gasLimit: string // gas限制
	gasUsed: string // 使用的gas
	timestamp: int // 打包的时间戳
}
```

## 说明

备注需要节点的接口，请在后续有url地址再调用！！

## 获取连接

```
// npm install @xu10000/aa_chain_sdk
var AAChainSdk = require("@xu10000/aa_chain_sdk");
var provider = {
	chainType: BlockChainSdk.chainType.AAChain
	// 测试网络 test.aachain.com (后续提供，目前还没有)
	host: 'test.aachain.com',
	port: 8100,
	testnet: true //标志是否为测试网络
}
var blockchainSdk = New BlocchainSdk(provider)
```

## 助记词、公私钥、地址
```
// 助记词, 不可暴露！
var seed =  AAChainSdk.createSeed()
// 私钥， 不可暴露！
var priv = blockchainSdk.getPrivateKeyBySeed(seed);
// 公钥和地址 ， 可公开！
@return 
{
	publicKey: string 
	address : string 
}
var account = sdk.getPublicKeyAndAddress(privateKey)
```

## 获取最新区块 （需要节点）
```
/**
* @return{object}
{
	@param{int} height //区块高度
	@param{string} hash //区块hash
	@param{int} timestamp //戳
}
**/
var block = await blockchainSdk.getLastBlock()
```
## 生成交易 （需要节点）

```
// privateKey 发送者的私钥
// amount 和 fee都必须是字符串整形
// nonce  optional  eth独有的字段，代表当前地址在发送第几个交易，eth交易必填(该接口必须从服务端接口获取！)
/**
* return{object} txData
{
	txHash{string} //交易hash
	codingTx{string} //编码过的交易结构体，用来发送
}
**/
var nonce = ? // int 类型，从提供的api接口获取
var fee = await blockchainSdk.getAverageFee(to, null);
var txData = await blockchainSdk.createTx (privateKey, to, value, fee, null/**发送时合约地址默认为空**/, null/**备注信息**/, nonce)
// 发送交易
提供的api接口发送，参数为txData
```
## 查询账户余额 （需要节点）

```
/**
* @return balance //整形字符串
**/
var balance = await blockchainSdk.getBalance(address)
```

## 

## 获取地址
```
var address =  blockchainSdk.getAddress(publicKey)
```



## 获取最近区块的平均手续费 （需要节点）

```
/**
* @desc 获取最近区块的平均手续费
@return{string} 

**/
// to 收款人地址
var fee = await sdk.getAverageFee(to, null)
```



## 验证助记词

```
/**
@param {string} seed //助记词
@return{bool} 

**/
	var flag = BlockchainSdk.validSeed(seed)
    console.log(`检查种子是否成功： ${flag}`);
```



## 验证地址是否合法

```
/**@param {string} address
** @return{bool}  
**/ !! 验证地址前缀0x必须带，否则都返回false
	// 合法返回true,否则flase
	var flag = BlockchainSdk.checkAddress('0x1232ww...');
```



## keySotre

```
// 生成keyStore对象， 生成需要客户端自己保存在文件
var keyStoreObj = BlockchainSdk.getKeyStore(privateKey, passwd) // 私钥，密码
@return {
   address: string
  privateKey: string 
}
// 导入keyStore对象得出私钥和地址
var priKeyAndAddress = BlockchainSdk.unlockKeyStore(keyStoreObj, passwd) // keystore对象，密码

```



## 查询Erc20代币的余额

```
/**@param {string} contract // 代币的合约地址，可替换。
**@param {string} address // 查询地址
var balance = await sdk.getErc20Balance(contract, address);
```



## 创建erc20转账的交易

```
// 获取代币转账的手续费
/**@param {string} contract // 代币的合约地址，可替换。
**@param {string} sender // 转账人
**@param {string} recipient // 收款人
**@param {string} amount  // 转账的代币金额
** @return{string}  
 var fee = await sdk.getErc20TransferFee(contract, sender, to, amount);
 var nonce = ? // int 类型，从提供的api接口获取
//  !! 注意，这里和上面不同的是，要传入contract 字段
 var txData = await blockchainSdk.createTx (privateKey, to, value, fee, contract, null/**备注信息**/, nonce)
// 然后再把生成的交易发送到接口

```

