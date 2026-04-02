const { Sequelize, Model, DataTypes } = require('sequelize')
const { sequelizeConfig: db_cfg, DEBUG } = require('../config')

const logging = DEBUG ? console : false

// 根据数据库类型配置 Sequelize 选项
const dialect = db_cfg.connect.dialect
const sequelizeOptions = {
  logging: logging.info,
  isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
}

// SQLite 不支持 timezone 设置
if (dialect === 'sqlite') {
  sequelizeOptions.storage = db_cfg.connect.storage
  sequelizeOptions.pool = {
    max: 1,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
} else if (dialect === 'mysql') {
  sequelizeOptions.host = db_cfg.connect.host
  sequelizeOptions.port = db_cfg.connect.port
  sequelizeOptions.timezone = db_cfg.connect.timezone
} else if (dialect === 'mssql') {
  sequelizeOptions.host = db_cfg.connect.host
  sequelizeOptions.port = db_cfg.connect.port
}

// 添加 dialect 到选项
sequelizeOptions.dialect = dialect
// SQLite 不自动添加表名后缀
sequelizeOptions.define = {
  freezeTableName: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
}

let sequelize = new Sequelize(db_cfg.database, db_cfg.username, db_cfg.password, sequelizeOptions)

const query_raw = true

class BaseModel extends Model {
  static init(attributes, options) {
    options = {
      ...options,
      sequelize
    }
    super.init(attributes, options)
    // console.log('attributes: ', attributes)
    // console.log('==================================================')
    // console.log('options: ', options)
  }
  // Define any common methods or properties here
  static async findById(id) {
    return this.findOne({ where: { id }, raw: query_raw })
  }

  static async findByEmail(email) {
    return this.findOne({ where: { email }, raw: query_raw })
  }

  static async findAllByStatus(status) {
    return this.findAll({ where: { status }, raw: query_raw })
  }

  static async findRecent(limit) {
    return this.findAll({ limit, order: [['created_at', 'DESC']], raw: query_raw })
  }

  static async findWithRelatedModels() {
    return this.findAll({ include: [RelatedModel] })
  }

  static async findWithParams(params) {
    return this.findAll({ where: params, raw: query_raw })
  }

  static async updateById(id, data) {
    return this.update(data, { where: { id } })
  }

  static async deleteById(id) {
    return this.destroy({ where: { id } })
  }

  static async paginate(page, pageSize) {
    const offset = (page - 1) * pageSize
    const limit = pageSize
    return this.findAll({ offset, limit })
  }

  static async executeRawQuery(query) {
    return sequelize.query(query)
  }

  static async upsert(data) {
    return this.upsert(data, { where: { id: data.id } })
  }
  static async bulkCreate(data) {
    return this.bulkCreate(data)
  }
  static async bulkUpdate(data) {
    const ids = data.map(item => item.id)
    return this.update(data, { where: { id: ids } })
  }
  static async bulkDelete(ids) {
    return this.destroy({ where: { id: ids } })
  }
}

module.exports = BaseModel
