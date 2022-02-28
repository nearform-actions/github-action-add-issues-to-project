'use strict'
const core = require('@actions/core')
const { getGoodFirstIssues } = require('./get-issues')
const { addIssueToBoard } = require('./populate')
const { logError, logDebug, logInfo } = require('./log')

module.exports = async function ({ token = null, inputs = {} }) {
  logDebug(`Inputs: ${JSON.stringify(inputs)}`)

  if (
    !inputs['organizations'] ||
    !inputs['time-interval'] ||
    !token ||
    !inputs['project-id']
  ) {
    throw new Error('Missing required inputs')
  }

  const {
    organizations,
    'time-interval': timeInterval,
    'project-id': projectId
  } = inputs

  try {
    const goodFirstIssues = await getGoodFirstIssues(
      token,
      organizations,
      timeInterval
    )
    logInfo(
      `Found ${goodFirstIssues.length} good first issues: ${JSON.stringify(
        goodFirstIssues
      )}`
    )

    goodFirstIssues.map(async issue => {
      await addIssueToBoard({
        projectId,
        contentId: issue.id,
        token
      })
    })
  } catch (err) {
    logError(err)
    core.setFailed(err.message)
  }
}
