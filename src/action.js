'use strict'
const core = require('@actions/core')
const { getGoodFirstIssues } = require('./get-issues')
const { logError } = require('./log')

module.exports = async function () {
  const organization = core.getInput('organization')
  const timeInterval = core.getInput('timeInterval')

  try {
    // eslint-disable-next-line
    const goodFirstIssues = await getGoodFirstIssues(organization, timeInterval)
  } catch (err) {
    logError(err)
  }
}
