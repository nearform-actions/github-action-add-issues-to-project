'use strict'
const core = require('@actions/core')
const { getGoodFirstIssues } = require('./get-issues')
const { addIssueToBoard } = require('./populate')
const { logError, logDebug, logInfo } = require('./log')

module.exports = async function ({ inputs = {} }) {
  if (
    !inputs['organizations'] ||
    !inputs['timeInterval'] ||
    !inputs['token'] ||
    !inputs['projectId']
  ) {
    throw new Error('Missing required inputs')
  }

  const {
    organizations,
    'time-interval': timeInterval,
    'project-id': projectId,
    token
  } = inputs

  logDebug(`Inputs: ${JSON.stringify(inputs)}`)

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
