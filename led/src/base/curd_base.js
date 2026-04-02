'use strict'

const { getPager, getPageInfo } = require('./pager')
const { dbHelper, sequelize } = db

const curd_base = model => {
  return {
    list: async function (req, res) {
      let data = { total: 0, rows: [] }
      let { pageSize, pageStart } = await getPageInfo(req.body)
      let options = { offset: pageStart, limit: pageSize, raw: true }
      if (Boolean(res.attributes)) options.attributes = res.attributes
      if (Boolean(res.include)) options.include = res.include
      if (Boolean(res.order)) options.order = res.order
      if (JSON.stringify(res.where) !== '{}' && res.where !== '{}') options.where = res.where
      console.log('options: ', JSON.stringify(options, null, 2))

      let tmp = await model.findAndCountAll(options)
      if (tmp) {
        data.total = tmp.count
        data.rows = tmp.rows
      }
      return data
    },

    get_page: async function (req, res, next) {
      let data = { total: 0, rows: [] }
      let { pageSize, pageStart } = await getPageInfo(req.body)
      let options = { offset: pageStart, limit: pageSize }
      if (Boolean(res.attributes)) options.attributes = res.attributes
      if (Boolean(res.include)) options.include = res.include
      if (Boolean(res.order)) options.order = res.order
      if (JSON.stringify(res.where) !== '{}' && res.where !== '{}') options.where = res.where
      // console.log('options: ', JSON.stringify(options, null, 2));

      let tmp = await model.findAndCountAll(options)
      if (tmp) {
        data.total = tmp.count
        data.rows = tmp.rows
      }
      res.json(data)
    },

    get_list: async function (req, res, next) {
      let data = { total: 0, rows: [] }

      if (!res.hasOwnProperty('sql_count')) return res.ng('sql_count不能为空！', 100)
      if (!res.hasOwnProperty('sql_data')) return res.ng('sql_data不能为空！', 100)
      let { sql_count, sql_data } = res
      // console.log('sql_count, sql_data: ', sql_count, sql_data);
      if (sql_count && sql_data) {
        data.total = await dbHelper.queryScalar(sql_count, 'COUNT')
        data.rows = await dbHelper.query(sql_data)
        // let data = await getResData(rows, params);
      }
      res.json(data)
    },

    delete: async function (req, res, next) {
      let params = req.body
      if (!params.hasOwnProperty('id')) return res.ng('id不能为空！', 100)
      let { id } = params
      res.where.id = id
      // let _obj = await model.findOne({ where: res.where });
      let _obj = await model.findByPk(id)
      if (!_obj) {
        return res.ng(`未找到id=【${id}】的记录，无法删除！`, 101)
      } else {
        let data = await model.destroy({ where: res.where })
        res.json(data, '删除成功!')
      }
    },

    get: async function (req, res, next) {
      let { id } = req.query
      if (!id) id = req.body.id
      res.where.id = id
      let options = { where: res.where }
      if (Boolean(res.attributes)) options.attributes = res.attributes
      if (Boolean(res.include)) options.include = res.include

      let data = await model.findOne(options)
      res.json(data)
    },

    get_all: async function (req, res, next) {
      let options = {
        where: res.where
      }
      if (Boolean(res.include)) options.include = res.include

      let data = await model.findAll(options)
      res.json(data)
    },

    //创建 -post
    create: async function (req, res, next) {
      req.body.user_id = res.where.user_id

      let data = await model.create(req.body, { returning: true })
      res.json(data, '添加成功!')
    },

    // 更新 -- put
    update: async function (req, res, next) {
      let params = req.body
      if (!params.hasOwnProperty('id')) return res.ng('id不能为空！', 100)
      res.where.id = params.id

      let data = await model.update(req.body, { where: res.where })
      res.json(data)
    },
    //创建-更新
    upsert: async function (req, res, next) {
      let params = req.body
      let _has = params.hasOwnProperty('id')
      params.user_id = res.where.user_id

      let _obj
      if (_has) {
        let { id } = params
        res.where.id = id
        _obj = await model.findByPk(id)
        if (!_obj) {
          return res.ng(`未找到id=【${id}】的记录，无法进行更新操作！`, 110)
        } else {
          let tmp = await model.update(params, { where: res.where })
          return res.json({}, '更新成功!')
        }
      } else {
        if (res.hasOwnProperty('unique_check')) {
          _obj = await model.findOne({ where: res.unique_check, raw: true })
          if (_obj) {
            let unique_check = Object.keys(res.unique_check) || []
            let field = unique_check.join(', ')
            return res.ng(`字段${field}在表中存在重复数据，请更换！`, 111)
          } else {
            _obj = await model.create(params, { returning: true })
            return res.json(_obj, '添加成功!')
          }
        } else {
          _obj = await model.create(params, { returning: true })
          return res.json(_obj, '添加成功!')
        }
      }
    },

    delete_many: async function (req, res, next) {
      let params = req.body
      if (!params.hasOwnProperty('id')) return res.ng('id不能为空！', 100)
      let { id } = params
      res.where.id = id

      let data = await model.destroy({ where: res.where })

      res.json({}, '批量删除成功!')
    }
  }
}

module.exports = curd_base
