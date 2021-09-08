const yaml = require('js-yaml')
const fs = require('fs')
const AWS = require('aws-sdk')
const Installer = require('./configure')

const CONFIG_EXAMPLE_FILE = './serverless.example.yml'
const CONFIG_FILE = './serverless.yml'

class DeleteBucket {
  constructor (config) {
    this.config = config
  }
  replaceVariables(value) {
    let newValue = value.replace('${self:service}', this.config.service.name)
    newValue = newValue.replace('${opt:stage, self:provider.stage}', 'dev')
    return newValue
  }
  deleteBucket (name, callback) {
    let params = {
      Bucket: name
    }
    let s3 = new AWS.S3(params)
    console.log(params)
    s3.listObjects(params, function (err, data) {
      if (err) return callback(err)

      if (data.Contents.length == 0) callback()

      params = { Bucket: name }
      params.Delete = { Objects: [] }

      data.Contents.forEach(function (content) {
        params.Delete.Objects.push({ Key: content.Key })
      })

      s3.deleteObjects(params, (err, data) => {
        if (err) return callback(err)
        if (data.Contents.length == 1000) this.deleteBucket(name, callback)
        else callback()
      })
    })
  }
}
let installer = new Installer()
installer.loadConfig(true)
let db = new DeleteBucket(installer.config)
let buckets = [
  db.replaceVariables(installer.config.custom.largeRequestBucket),
  db.replaceVariables(installer.config.custom.debugBucket),
  db.replaceVariables(installer.config.custom.attachmentBucket)
]
for (let bucket of buckets) {
  db.deleteBucket(bucket, (a, b, c) => {
    console.log(a, b, c)
  })
}