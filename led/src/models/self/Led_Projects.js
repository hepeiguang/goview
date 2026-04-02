/* jshint indent: 2 */

const { Sequelize, Model, DataTypes } = require('sequelize')
const BaseModel = require('../../base/base_model')
class Led_Projects extends BaseModel {}

Led_Projects.init(
  {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'Id'
    },
    projectName: {
      type: 'LONGTEXT',
      allowNull: true,
      field: 'ProjectName'
    },
    state: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'State'
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
    isDelete: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'IsDelete'
    },
    indexImage: {
      type: 'LONGTEXT',
      allowNull: true,
      field: 'IndexImage'
    },
    remarks: {
      type: 'LONGTEXT',
      allowNull: true,
      field: 'Remarks'
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
    modelName: 'Led_Projects', // 指定表名
    tableName: 'Led_Projects',
    timestamps: false // 默认禁用时间戳
  }
)

module.exports = Led_Projects
