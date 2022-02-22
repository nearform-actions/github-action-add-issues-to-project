'use strict'
const core = require('@actions/core')
const { getGoodFirstIssues } = require('./get-issues')
const { logError } = require('./log')

module.exports = async function () {
  const organization = core.getInput('organization') || 'fastify'
  const updated = core.getInput('updated') || '2022-02-01..2022-02-22'

  try {
    // eslint-disable-next-line
    const goodFirstIssues = await getGoodFirstIssues(organization, updated)
  } catch (err) {
    logError(err)
  }
}
