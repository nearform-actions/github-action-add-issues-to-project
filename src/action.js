'use strict'
//const core = require('@actions/core')
//const { getGoodFirstIssues } = require('./get-issues')
const { logError } = require('./log')

module.exports = async function () {
  //const user = core.getInput('user') || 'fastify'
  // const since = core.getInput('since') || '2022-01-10T00:00:00.000+05:30'

  try {
    // const goodFirstIssues = await getGoodFirstIssues(user, since)
  } catch (e) {
    logError(e)
  }
}
