'use strict'
const core = require('@actions/core')
const { getGoodFirstIssues } = require('./get-issues')
const { logError } = require('./log')

module.exports = async function () {
  const token = core.getInput('github-token', { required: true })
  const organization = core.getInput('organization', { required: true })
  const timeInterval = core.getInput('time-interval', { required: true })

  try {
    // eslint-disable-next-line
    const goodFirstIssues = await getGoodFirstIssues(
      token,
      organization,
      timeInterval
    )
  } catch (err) {
    logError(err)
  }
}
