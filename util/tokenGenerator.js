var redis  = require('redis')
var util   = require('util')
var Promise = require('bluebird')
var redisConfig = require('../config/config.js')['redis']
var _ = require("lodash")

var lettersAndNumbers = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

var Token = function() {
  this.prefix = 'tokenVal:'
  this.charPrefix = 'tokenChars:'
  this.client = redis.createClient(6379, redisConfig.host, {db: 2})
  this.tokenNumbers = []
  this.tokenChars = []
  //Checks if the characters are generated; generates if not
  this.client.hgetall(this.charPrefix, (err, result) => {
    if(err || !result || result[0] == 'undefined') {
      var tC = [
        0, _.shuffle(lettersAndNumbers).join(''),
        1, _.shuffle(lettersAndNumbers).join(''),
        2, _.shuffle(lettersAndNumbers).join(''),
        3, _.shuffle(lettersAndNumbers).join(''),
        4, _.shuffle(lettersAndNumbers).join(''),
        5, _.shuffle(lettersAndNumbers).join('')
      ]
      this.client.hmset(this.charPrefix, tC, function(err, result) {
        if(!err) this.tokenChars = this.getUnarray(tC)
        ;
        ;
      })
    } else {
      this.tokenChars = [result[0], result[1], result[2], result[3], result[4], result[5]]
      ;
      ;
    }
  })
  //checks if numbers are generated; generates if not
  this.client.hgetall(this.prefix, (err, result) => {
    if(err || !result || result[0] == 'undefined'){
      var tN = [0, 0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0]
      this.client.hmset(this.prefix, tN, function(err, result) {
        if(!err) this.tokenNumbers = this.getUnarray(tN)
      })
    } else {
      this.tokenNumbers = [parseInt(result[0]), parseInt(result[1]), parseInt(result[2]), parseInt(result[3]), parseInt(result[4]), parseInt(result[5])]


    }
  })

  this.increment = (i) => {
    if(!i) i = 5;
    ;
    ;
    if(i != 0) {
      if(this.tokenNumbers[i] == 35){
        this.tokenNumbers[i] = 0
        this.increment(i-1)
      } else {
        this.tokenNumbers[i] += 1
        this.client.hmset(this.prefix, this.getArray(this.tokenNumbers), function(err, result) {
          if(!err) this.tokenNumbers = [parseInt(result[0]), parseInt(result[1]), parseInt(result[2]), parseInt(result[3]), parseInt(result[4]), parseInt(result[5])]
        })
      }
    } else {
      this.tokenNumbers[i] += 1
    }
  }
}
Token.prototype.getArray = function(items) {
  return  [
    0, items[0],
    1, items[1],
    2, items[2],
    3, items[3],
    4, items[4],
    5, items[5],
  ]
}
Token.prototype.getUnarray = function(items) {
  return  [
    parseInt(items[1]),
    parseInt(items[3]),
    parseInt(items[5]),
    parseInt(items[7]),
    parseInt(items[9]),
    parseInt(items[11]),
  ]
}

Token.prototype.checkToken = function() {
   var key = this.prefix
   var client = this.client
   this.increment()
   return new Promise((resolve, reject) => {
     client.hgetall(key, (err, result) => {
       ;
       var token = this.tokenChars[0][result[0]] + this.tokenChars[1][result[1]] + this.tokenChars[2][result[2]] + this.tokenChars[3][result[3]] + this.tokenChars[4][result[4]] + this.tokenChars[5][result[5]]
       err ? reject() : resolve(token)
     })
   })
}
module.exports = Token
