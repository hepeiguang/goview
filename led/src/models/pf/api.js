'use strict'

const { Sequelize, Model, DataTypes } = require('sequelize')
const BaseModel = require('../../base/base_model')
class api extends BaseModel {}

api.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV1
    },
    realm: {
      type: DataTypes.STRING(12)
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(255)
    },
    script: {
      type: DataTypes.STRING(2000)
    },
    use: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    script_type: {
      type: DataTypes.STRING(1)
    },
    exec_type: {
      type: DataTypes.STRING(32)
    },
    exec_count: {
      type: DataTypes.BIGINT
    },
    remark: {
      type: DataTypes.STRING(255)
    },
    created_by: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    updated_by: {
      type: DataTypes.STRING(32),
      allowNull: true
    }
  },
  {
    modelName: 'api', // 指定表名
    timestamps: false // 默认禁用时间戳
  }
)

module.exports = api
