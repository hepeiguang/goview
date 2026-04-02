
// 工厂函数来创建控制器
function createController(Model) {
  class Controller {
    constructor(model) {
      this.Model = model
    }

    async findById(req, res) {
      const { id } = req.params
      const result = await Model.findById(id)
      res.json({ code: 0, msg: '', data: result })
    }

    async findByEmail(req, res) {
      const { email } = req.params
      const result = await Model.findByEmail(email)
      res.json({ code: 0, msg: '', data: result })
    }

    async findAllByStatus(req, res) {
      const { status } = req.params
      const result = await Model.findAllByStatus(status)
      res.json({ code: 0, msg: '', data: result })
    }

    async findRecent(req, res) {
      const { limit } = req.params
      const result = await Model.findRecent(limit)
      res.json({ code: 0, msg: '', data: result })
    }

    async findWithRelatedModels(req, res) {
      const result = await Model.findWithRelatedModels()
      res.json({ code: 0, msg: '', data: result })
    }

    async findWithParams(req, res) {
      const { params } = req.body
      const result = await Model.findWithParams(params)
      res.json({ code: 0, msg: '', data: result })
    }

    async updateById(req, res) {
      const { id } = req.params
      const { data } = req.body
      const result = await Model.updateById(id, data)
      res.json({ code: 0, msg: '', data: result })
    }

    async deleteById(req, res) {
      const { id } = req.params
      const result = await Model.deleteById(id)
      res.json({ code: 0, msg: '', data: result })
    }

    async paginate(req, res) {
      const { page, pageSize } = req.params
      const result = await Model.paginate(page, pageSize)
      res.json({ code: 0, msg: '', data: result })
    }

    async executeRawQuery(req, res) {
      const { query } = req.body
      const result = await Model.executeRawQuery(query)
      res.json({ code: 0, msg: '', data: result })
    }
  }
  return new Controller(Model)
}

module.exports = createController
