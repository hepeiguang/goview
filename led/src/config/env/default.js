'use strict'

const path = require('path')
const utils = require('./utils')
const _package = require('../../../package.json')

const APP_ROOT = process.cwd()
const APP_NAME = 'LED'

// 支持环境变量切换数据库类型: mysql | sqlite | mssql
const DB_TYPE = process.env.DB_TYPE || 'mysql'

// 根据 DB_TYPE 生成数据库配置
const getDbConfig = () => {
  switch (DB_TYPE) {
    case 'sqlite':
      return {
        username: '',
        password: '',
        database: 'led',
        dialect: 'sqlite',
        storage: path.join(APP_ROOT, 'db/led.sqlite'),
        dialectOptions: {},
        pool: { max: 1, min: 0, acquire: 30000, idle: 10000 }
      }
    case 'mssql':
      return {
        username: 'sa',
        password: 'root',
        database: 'iMES',
        dialect: 'mssql',
        host: '192.168.31.44',
        port: 1433,
        dialectOptions: {
          options: {
            encrypt: false,
            trustServerCertificate: true
          },
          useUTC: true,
          multipleStatements: true
        },
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
      }
    case 'mysql':
    default:
      return {
        username: 'root',
        password: '123456',
        database: 'led',
        dialect: 'mysql',
        host: '127.0.0.1',
        port: 3306,
        dialectOptions: {
          dateStrings: true,
          typeCast: true,
          multipleStatements: true,
          charset: 'utf8mb4',
          supportBigNumbers: true,
          bigNumberStrings: true,
          decimalNumbers: true
        },
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
      }
  }
}

const dbConfig = getDbConfig()
console.log(`🎯 数据库类型: ${DB_TYPE}`)

let config = {
  APP_ROOT: APP_ROOT,
  APP_NAME: APP_NAME,
  APP_PORT: 4444,
  APP_SECRET: Buffer.from(APP_NAME, 'base64'),
  DEBUG: true,
  VERSION: _package.version,
  LOG_DIR: path.join(APP_ROOT, 'logs'),
  UPLOAD_PATH_LED: path.join(APP_ROOT, 'tmp/upload/led/'),
  sessionExpiresIn: '100y',
  SALT_WORK_FACTOR: 10,
  // api 返回前端的格式类型
  API_RES_TYPE: 'datagrid',

  sequelizeConfig: {
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    connect: {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      dialectOptions: dbConfig.dialectOptions,
      timezone: '+08:00',
      storage: dbConfig.storage, // SQLite 专用
      define: {
        charset: 'utf8mb4',
        freezeTableName: true, //sequelize就不会在表名后附加"s"字符
        timestamps: true, //加属性created_at和updated_at
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      },
      // 定义全局的钩子
      hooks: {
        afterFind: async (result, options, fn) => {
          return result
        }
      },
      pool: dbConfig.pool
    }
  }
}

module.exports = config
