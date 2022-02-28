'use strict'
const core = require('@actions/core')
const { getGoodFirstIssues } = require('./get-issues')
const { addIssueToBoard } = require('./populate')
const { logError, logDebug, logInfo } = require('./log')

module.exports = async function ({ inputs }) {
  const { organizations, timeInterval, projectId, token } = inputs

  if (!organizations || !timeInterval || !token || !projectId) {
    throw new Error('Missing required inputs')
  }

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
