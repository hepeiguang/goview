const fs = require('fs')
const express = require('express')
const curd_base = require('../base/curd_base')
const { models } = require('../models')

const router = express.Router()

const modelKeys = Object.keys(models)
const modelValues = Object.values(models)

for (const [index, model] of modelValues.entries()) {
  const modelName = modelKeys[index]

  // create a router for the model
  const modelRouter = express.Router()

  // add the CRUD routes to the router using the curd_base function
  const curdMethods = curd_base(model)

  for (const [method, func] of Object.entries(curdMethods)) {
    if (typeof func === 'function') {
      modelRouter.post(`/${method}`, func)
    }
  }

  // mount the router to the main router
  router.use(`/${modelName}`, modelRouter)
}

module.exports = router
