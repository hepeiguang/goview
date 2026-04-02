'use strict'

const jwt = require('jsonwebtoken')

exports.JwtToken = class JwtToken {
  constructor(expiresIn, secret) {
    this.expiresIn = expiresIn
    this.secret = secret
  }

  async createToken(user) {
    try {
      if (user) {
        const { id, username } = user
        return await jwt.sign({ id: id, username: username, role: 'BIZ' }, this.secret, { expiresIn: this.expiresIn })
      } else {
        return await jwt.sign({ role: 'GUEST' }, this.secret, { expiresIn: this.expiresIn })
      }
    } catch (error) {
      console.log('createToken error: ', error)
    }
  }

  async verifyToken(token) {
    if (token) {
      if (token.startsWith('Bearer ')) {
        // Remove Bearer from string
        token = token.slice(7, token.length)
      }
      return await jwt.verify(token, this.secret, (err, decoded) => {
        if (err) {
          console.log('err', err)
          return { err: err, decoded: '' }
        } else {
          // console.log({ err: '', decoded: decoded })
          return { err: '', decoded: decoded }
        }
      })
    }
  }
}
