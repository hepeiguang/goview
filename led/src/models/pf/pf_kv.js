'use strict'

const { Sequelize, Model, DataTypes } = require('sequelize')
const BaseModel = require('../../base/base_model')

class pf_kv extends BaseModel {}

pf_kv.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    type: {
      type: DataTypes.STRING(5),
      allowNull: false
    },
    key1: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    key2: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    val: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    remark: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    modelName: 'pf_kv',
    timestamps: false // 默认禁用时间戳
  }
)

module.exports = pf_kv
