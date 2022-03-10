'use strict'
const core = require('@actions/core')

const { run } = require('./action.js')

run().catch(error => core.setFailed(error))
