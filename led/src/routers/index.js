'use strict'

const express = require('express')
const router = express.Router()

router.use('/api', require('./led/led'))
router.use('/api', require('./pf/api'))
router.use('/api', require('./pf/pf_kv'))
router.use('/', require('./public'))
router.use('/', require('./model_route'))

module.exports = router
