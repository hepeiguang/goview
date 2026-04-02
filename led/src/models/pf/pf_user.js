'use strict'

const bcrypt = require('bcryptjs')
const { Sequelize, Model, DataTypes } = require('sequelize')
const BaseModel = require('../../base/base_model')

const SALT_WORK_FACTOR = 10

class pf_user extends BaseModel {}

pf_user.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING
    },
    salt: {
      type: DataTypes.STRING
    },
    nick: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        notEmpty: true,
        len: [2, 32]
      }
    },
    birthday: {
      type: DataTypes.STRING
    },
    gender: {
      type: DataTypes.ENUM('0', '1'),
      defaultValue: '0'
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: {
          msg: '用户账号必须是邮箱！'
        }
      }
    },
    phone: {
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: true
    },
    state: {
      type: DataTypes.STRING
    },
    description: {
      type: DataTypes.STRING
    },
    login_count: {
      type: DataTypes.INTEGER
    },
    previous_visit: {
      type: DataTypes.STRING
    },
    last_visit: {
      type: DataTypes.STRING
    },
    del_flag: {
      // type: DataTypes.ENUM(0, 1),
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    source: {
      type: DataTypes.STRING(64)
      //comment: '用户来源，支付宝、微信、百度等'
    },
    inviteman: {
      type: DataTypes.STRING(64)
      //comment: '邀请人'
    },
    company_id: {
      type: DataTypes.STRING(36),
      allowNull: false
    }
  },
  {
    modelName: 'pf_user', // 指定表名
    timestamps: false, // 默认禁用时间戳

    hooks: {
      beforeCreate: async user => {
        user.salt = await bcrypt.genSaltSync(SALT_WORK_FACTOR)
        user.password = await bcrypt.hashSync(user.password, user.salt)
      }
    }
  }
)

pf_user.genSalt = async password => {
  let salt = await bcrypt.genSaltSync(SALT_WORK_FACTOR)
  let _password = await bcrypt.hashSync(password, salt)
  return {
    password: _password,
    salt: salt
  }
}

pf_user.validatePassword = async (password, salt, enPassword) => {
  var encodedPassword = await bcrypt.hashSync(password, salt)
  return enPassword === encodedPassword
}

pf_user.updatePwd = async (user_id, password) => {
  // password = password || '123456'
  let params = await pf_user.genSalt(password)
  let res = await pf_user.update(params, {
    where: {
      id: user_id
    }
  })
  if (res && res.length > 0 && res[0] == 1) {
    return true
  } else {
    return false
  }
}

module.exports = pf_user
