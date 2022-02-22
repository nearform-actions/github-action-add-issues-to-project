'use strict'
//const core = require('@actions/core')
//const { getGoodFirstIssues } = require('./get-issues')
const { logError } = require('./log')

module.exports = async function () {
  // const organization = core.getInput('organization')
  // const since = core.getInput('since')

  try {
    //const goodFirstIssues = await getGoodFirstIssues(organization, since)
  } catch (err) {
    logError(err)
  }
}
