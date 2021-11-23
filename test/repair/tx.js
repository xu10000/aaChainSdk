const { DataTypes } = require('sequelize');
const { BIGINT, STRING, TINYINT, TEXT, DECIMAL, INTEGER } = DataTypes;

class Tx {
  init (sequelize) {
    return sequelize.define('tx', {
      // 在这里定义模型属性
      autoId: { type: BIGINT, primaryKey: true, autoIncrement: true },
      blockHash: STRING, // 区块hash
      blockNumber: INTEGER, // 区块高度
      from: STRING, // 转账人的地址
      gas: STRING,
      gasPrice: STRING, // gas * gasPrice =  交易的手续费 (使用bigNewNumber 相乘）
      hash: STRING, // 交易hash
      input: TEXT, // 备注
      nonce: BIGINT, // 转账人交易的序列号
      to: STRING, // 收款人地址
      transactionIndex: INTEGER, // 在区块中的序号
      value: STRING, // 交易的金额
      erc20Value: STRING, // 交易的金额
      erc20From: STRING, // 交易的金额
      erc20To: STRING, // 交易的金额
      contract: STRING, // 交易的金额
      timestamp: BIGINT,// 打包时的时间戳
      v: STRING, // v r s 用于验证签名
      r: STRING,
      s: STRING,
    }, {
      // 这是其他模型参数
    });

  }
}


module.exports = new Tx();
