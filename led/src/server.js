const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
require('./models')
const listEndpoints = require('express-list-endpoints')
const { getLocalIP } = require('./utils/ip')

// 中间件函数来处理错误
function errorHandler(err, req, res, next) {
  console.error(err.stack)
  res.status(500).json({ code: 1, msg: err.message, data: {} })
}

const app = express()
const PORT = process.env.PORT || 4444

let ip = getLocalIP()

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'POST,GET,PUT,PATCH,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Credentials', 'true') // Add this line
  next()
})

const corsOptions = {
  origin: [
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`,
    `http://${ip}:${PORT}`,
    `http://localhost:8080`,
    `http://127.0.0.1:8080`,
    `http://${ip}:8080`,
    `http://localhost:5500`,
    `http://127.0.0.1:5500`,
    `http://${ip}:5500`,
  ]
}

app.use(cors(corsOptions))

// parse requests of content-type - application/json
app.use(bodyParser.json())

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }))

// 添加 errorHandler 中间件
app.use(errorHandler)

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to led application.' })
})

const routes = require('./routers')
app.use(routes)

let endpoints = listEndpoints(app)
global.endpoints = endpoints.sort((a, b) => a.path.localeCompare(b.path))

app.listen(PORT, () => {
  console.log(`
      ##############################################################
      🛡️  Server listening on port: ${PORT}, http://${ip}:${PORT} 🛡️
      ##############################################################
    `)
})
