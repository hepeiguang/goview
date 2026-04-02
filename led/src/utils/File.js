'use strict'

const fs = require('fs')
const path = require('path')

const rename = (_old, _new) => {
  return new Promise((resolve, reject) => {
    fs.rename(_old, _new, function (err) {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

const getFileName = file => {
  const extension = path.extname(file)
  const fileName = path.basename(file, extension)
  return fileName
}

function filterFile(file) {
  // 获取文件后缀名
  const extension = path.extname(file)
  return file.indexOf('.') !== 0 && file !== 'index.js' && extension == '.js'
}

module.exports = { rename: rename, getFileName: getFileName, filterFile: filterFile }
