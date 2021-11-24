var BlockchainSdk = require("../../lib/index")
module.exports = {

  init (host, port) {
    var provider = {
      chainType: BlockchainSdk.chainType.AAChain,
      host, //测试
      port,
      // host: '47.106.199.160', //正式网络
      // port: 8000,
      testnet: false, //标志是否为测试网络
    }


    return new BlockchainSdk(provider);
  }
}