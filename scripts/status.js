'use strict';

const fs = require('fs')


let _output = fs.readFileSync('output.json')
let output = JSON.parse(_output)

function message (msg) {
  console.log(`\x1b[33mPresto\x1b[0m: ${msg}`)
}

for (let row of output.Stacks[0].Outputs) {
  if (row.OutputKey === 'ServiceEndpoint') {
    message('These are your LTI Configuration XML URLs.')
    message(`  \x1b[41mDiscussion Hero LTI Config XML URL:\x1b[0m \x1b[1m${row.OutputValue}/dhlti.xml\x1b[0m`)
    message(`  \x1b[44m       Nebula 2 LTI Config XML URL:\x1b[0m \x1b[1m${row.OutputValue}/n2lti.xml\x1b[0m`)
  }
}