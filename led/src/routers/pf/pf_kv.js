'use strict'

const { Router } = require('express')
const router = Router()

const { pf_kv } = db

const createController = require('../../base/controller_factory')
const _controller = createController(pf_kv)

router.get('/pf_kv/:id', _controller.findById)
router.get('/pf_kv/status/:status', _controller.findAllByStatus)
router.get('/pf_kv/recent/:limit', _controller.findRecent)
router.post('/pf_kv/search', _controller.findWithParams)

module.exports = router
