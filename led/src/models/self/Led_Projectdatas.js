/* jshint indent: 2 */

const { Sequelize, Model, DataTypes } = require('sequelize')
const BaseModel = require('../../base/base_model')

class Led_Projectdatas extends BaseModel {}

Led_Projectdatas.init(
  {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'Id'
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'ProjectId'
    },
    createTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'CreateTime'
    },
    createUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'CreateUserId'
    },
    contentData: {
      type: 'LONGTEXT',
      allowNull: true,
      field: 'ContentData'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'updated_at'
    }
  },
  {
    modelName: 'Led_Projectdatas', // 指定表名
    tableName: 'Led_Projectdatas',
    timestamps: false // 默认禁用时间戳
  }
)

module.exports = Led_Projectdatas
