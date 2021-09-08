const readline = require('readline')
const yaml = require('js-yaml')
const fs = require('fs')
const AWS = require('aws-sdk')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const CONFIG_EXAMPLE_FILE = './serverless.example.yml'
const CONFIG_FILE = './serverless.yml'
const baseCORSDomains = [
  'http://localhost:8080',
  'http://127.0.0.1:8080'
]

const CC = { // Console Colors
  Reset: '\x1b[0m',
  Bright: '\x1b[1m',
  Dim: '\x1b[2m',
  Underscore: '\x1b[4m',
  Blink: '\x1b[5m',
  Reverse: '\x1b[7m',
  Hidden: '\x1b[8m',
  Fg: {
    Black: '\x1b[30m',
    Red: '\x1b[31m',
    Green: '\x1b[32m',
    Yellow: '\x1b[33m',
    Blue: '\x1b[34m',
    Magenta: '\x1b[35m',
    Cyan: '\x1b[36m',
    White: '\x1b[37m',
  },
  Bg: {
    Black: '\x1b[40m',
    Red: '\x1b[41m',
    Green: '\x1b[42m',
    Yellow: '\x1b[43m',
    Blue: '\x1b[44m',
    Magenta: '\x1b[45m',
    Cyan: '\x1b[46m',
    White: '\x1b[47m'
  }
}

class Installer {
  constructor () {
    this.defaultConfig = {}
    this.config = {}
    this.region = 'us-east-1'
    this.kmsKeyId = null
    this.kms = null
  }
  configExists () {
    try {
      yaml.safeLoad(fs.readFileSync(CONFIG_FILE, 'utf8'))
    } catch (e) {
      return false
    }
    return true
  }
  loadConfig (loadExisting) {
    try {
      this.defaultConfig = yaml.safeLoad(fs.readFileSync(CONFIG_EXAMPLE_FILE, 'utf8'))
      if (loadExisting) {
        this.config = yaml.safeLoad(fs.readFileSync(CONFIG_FILE, 'utf8'))
      } else {
        this.config = yaml.safeLoad(fs.readFileSync(CONFIG_EXAMPLE_FILE, 'utf8'))
      }
    } catch (e) {
      console.error(e)
      process.exit(1)
    }
  }
  getInput (prompt, defaultValue, secret) {
    let promise = new Promise((resolve, reject) => {
      let newPrompt = `${prompt}: `
      if (defaultValue) {
        newPrompt = `${CC.Fg.Yellow}${prompt}${CC.Reset} [${CC.Dim}${defaultValue}${CC.Reset}]: `
      }
      rl.question(newPrompt, (value) => {
        if (secret) {
          let stars = new Array(value.length + 1).join('*')
          process.stdout.moveCursor(0, -1)
          process.stdout.clearLine(1)
          console.log(`${newPrompt}${stars}`)
        }
        if (value.length > 0) {
          resolve(value)
        } else {
          resolve(defaultValue)
        }
      })
    })
    return promise
  }
  async gatherInput () {
    process.stdout.write(`\nWelcome to the DH/N2 configuration wizard! Please enter the required information to generate the serverless.yml file.\n`)
    this.config.provider.stackTags.Name = 'dhn2'
    this.config.custom.app = 'discussionHero'
    this.region = await this.getInput('Enter your AWS Region', this.region)
    this.kms = new AWS.KMS({ region: this.region })
    let name = await this.getInput(`Enter the name of this application ${CC.Fg.Red}(Note: Upper-case characters will be changed to lower case)`, 'northwestern-dhn2')
    this.config.service.name = name.toLowerCase()
    let createKMSResponse = await this.getInput('Do you want to generate a KMS key in your AWS instance for use in DH/N2?', 'yes')
    let createKMS = createKMSResponse[0].toLowerCase() !== 'n'
    if (createKMS) {
      let newKey = await this.createKMSKey()
      this.config.service.awsKmsKeyArn = newKey.arn
      this.kmsKeyId = newKey.id
    } else {
      this.config.service.awsKmsKeyArn = await this.getInput('  Ok, please enter the ARN of the KMS key you wish to use')
      this.kmsKeyId = await this.config.service.awsKmsKeyArn.split('/')[1]
    }
    let unencryptedSecret = await this.getInput('Please enter the LTI shared secret you would like to use', false, true)
    this.config.provider.environment.sharedSecret = await this.encryptData(unencryptedSecret)
    let unencryptedToken = await this.getInput('Please enter the Canvas Access Token associated with an admin account here', false, true)
    this.config.provider.environment.canvasCredentials = await this.encryptData(unencryptedToken)
    this.config.provider.environment.corsDomains = baseCORSDomains.join(',')
    this.outputYAML()
    return true
  }
  outputYAML () {
    let yamlStr = yaml.safeDump(this.config)
    fs.writeFileSync(CONFIG_FILE, yamlStr, 'utf8')
    process.stdout.write(`Config file written: ${CONFIG_FILE}`)
  }
  createKMSKey () {
    let promise = new Promise((resolve, reject) => {
      this.kms.createKey({}, (err, data) => {
        if (err) {
          reject(err)
          console.error(err)
          console.error('Error creating a KMS key!')
          process.exit(2)
        } else {
          resolve({arn: data.KeyMetadata.Arn, id: data.KeyMetadata.KeyId})
        }
      })
    })
    return promise
  }
  encryptData (data) {
    let promise = new Promise((resolve, reject) => {
      let params = {
        KeyId: this.kmsKeyId,
        Plaintext: Buffer.from(data)
      }
      this.kms.encrypt(params, (err, data) => {
        if (err) {
          reject(err)
          console.error(err)
          console.error('Error with KMS ecryption!')
          process.exit(3)
        } else {
          let encrypted = data.CiphertextBlob.toString('base64')
          resolve(encrypted)
        }
      })
    })
    return promise
  }
}

if (require.main === module) {
  process.stdout.write(`
  ${CC.Bg.Blue}  Northwestern University ${CC.Reset}${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue}      proudly presents:   ${CC.Reset}${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}                         ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}   /${CC.Fg.Red}${CC.Bg.Red}███████${CC.Reset}  /${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}   /${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}   ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}  |${CC.Fg.Blue}${CC.Bg.Blue}█${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}${CC.Bg.Blue}__${CC.Fg.Blue}${CC.Bg.Blue}██${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}|${CC.Bg.Blue} ${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}  |${CC.Bg.Blue} ${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}   ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}  |${CC.Fg.Blue}${CC.Bg.Blue}█${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}  \\${CC.Bg.Blue} ${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}|${CC.Bg.Blue} ${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}  |${CC.Bg.Blue} ${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}   ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}  |${CC.Fg.Blue}${CC.Bg.Blue}█${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}  |${CC.Bg.Blue} ${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}|${CC.Bg.Blue} ${CC.Fg.Red}${CC.Bg.Red}████████${CC.Reset}   ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}  |${CC.Fg.Blue}${CC.Bg.Blue}█${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}  |${CC.Bg.Blue} ${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}|${CC.Bg.Blue} ${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}${CC.Bg.Blue}__  ${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}   ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}  |${CC.Fg.Blue}${CC.Bg.Blue}█${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}  |${CC.Bg.Blue} ${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}|${CC.Bg.Blue} ${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}  |${CC.Bg.Blue} ${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}   ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}  |${CC.Fg.Blue}${CC.Bg.Blue}█${CC.Fg.Red}${CC.Bg.Red}███████${CC.Reset}/|${CC.Bg.Blue} ${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}  |${CC.Bg.Blue} ${CC.Fg.Red}${CC.Bg.Red}██${CC.Reset}   ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}  |${CC.Bg.Blue}_______${CC.Reset}/ |${CC.Bg.Blue}__${CC.Reset}/  |${CC.Bg.Blue}__${CC.Reset}/   ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}                         ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}${CC.Bg.Red}     Discussion Hero     ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}${CC.Bg.Blue}       &  Nebula 2       ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}                         ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}  “Saving Students from  ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}   Boring Discussions!”  ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue} ${CC.Reset}                         ${CC.Bg.Blue} ${CC.Reset}
  ${CC.Bg.Blue}                           ${CC.Reset}
  `)
  let installer = new Installer()
  let configExists = installer.configExists()
  let runConfig = true
  let run = async () => {
    if (configExists) {
      let _response = await installer.getInput('Existing configuration found, would you like to skip configuration?', 'yes')
      runConfig = _response[0].toLowerCase() === 'n'
    }
    if (runConfig) {
      installer.loadConfig()
      installer.gatherInput().then(() => {
        process.stdout.write(`${CC.Fg.Yellow}Presto: ${CC.Reset}All Done! You are ready to deploy using 'npm run deploy'.`)
        process.exit(0)
      })
    } else {
      process.exit(0)
    }
  }
  run()
}
module.exports = Installer