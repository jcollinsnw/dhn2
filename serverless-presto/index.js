'use strict';

const fs = require('fs')

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options
    this.hooksDefault = {
      'after:aws:info:displayStackOutputs': this.process.bind(this),
      'before:package:createDeploymentArtifacts': this.message.bind(this, 'Starting deployment...'),
      'before:aws:deploy:deploy:uploadArtifacts': this.message.bind(this, 'Uploading code...'),
      'after:aws:deploy:deploy:updateStack': this.message.bind(this, 'Code upload complete.'),
      'before:aws:deploy:deploy:updateStack': this.message.bind(this, 'Checking deployment...'),
      // 'after:aws:info:displayStackOutputs': this.message.bind(this, 'Deployment complete.')
    }
    this.hooks = {}
    this.prestodebug = this.serverless.service.custom.prestodebug
    if (this.prestodebug) {
      this.monitorAllHooks()
    } else {
      this.hooks = this.hooksDefault
    }
  }
  get stackName () {
    return this.serverless.service.getServiceName() + '-' + this.serverless.getProvider('aws').getStage()
  }
  monitorAllHooks () {
    for (let event in this.serverless.pluginManager.hooks) {
      if (event.startsWith('before:') || event.startsWith('after:')) {
        this.hooks[event] = this.hook.bind(this, event);
      }
      else {
        const beforeEvent = 'before:' + event;
        this.hooks[beforeEvent] = this.hook.bind(this, beforeEvent);

        const afterEvent = 'after:' + event;
        this.hooks[afterEvent] = this.hook.bind(this, afterEvent);
      }
    }
  }
  async process () {
    let output = await this.serverless.getProvider('aws').request(
      'CloudFormation',
      'describeStacks',
      { StackName: this.stackName },
      this.serverless.getProvider('aws').getStage(),
      this.serverless.getProvider('aws').getRegion()
    )
    let str = JSON.stringify(output)
    fs.writeFileSync('output.json', str)
    for (let row of output.Stacks[0].Outputs) {
      if (row.OutputKey === 'ServiceEndpoint') {
        this.message('Deployment complete!')
        this.message(`  \x1b[41mDiscussion Hero LTI Config XML URL:\x1b[0m \x1b[1m${row.OutputValue}/dhlti.xml\x1b[0m`)
        this.message(`  \x1b[44m       Nebula 2 LTI Config XML URL:\x1b[0m \x1b[1m${row.OutputValue}/n2lti.xml\x1b[0m`)
      }
    }
  }
  message (msg) {
    console.log(`\x1b[33mPresto\x1b[0m: ${msg}`)
  }
  hook(event) {
    this.message('Hook Fired: ' + event);
    if (this.hooksDefault.hasOwnProperty(event)) {
      this.hooksDefault[event](event)
    }
  }
}

module.exports = ServerlessPlugin;