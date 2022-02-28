'use strict'
const core = require('@actions/core')
const { getGoodFirstIssues } = require('./get-issues')
const { addIssueToBoard } = require('./populate')
const { logError, logDebug, logInfo } = require('./log')
const { getAllBoardIssues } = require('./get-board-issues')

module.exports = async function ({ context, token = null, inputs = {} }) {
  logDebug(`Inputs: ${JSON.stringify(inputs)}`)

  if (
    !inputs['organizations'] ||
    !inputs['time-interval'] ||
    !token ||
    !inputs['project-id'] ||
    !context.payload.organization.login
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

    if (goodFirstIssues.length === 0) {
      logInfo('No good first issues found')
      return
    }

    const { boardIssues = [], projectNodeId = null } = await getAllBoardIssues(
      token,
      context.payload.organization.login,
      projectId
    )

    logInfo(
      `Found ${boardIssues.length} board issues: ${JSON.stringify(boardIssues)}`
    )
    logInfo(`Found project node id: ${projectNodeId}`)

    goodFirstIssues.map(async issue => {
      if (!boardIssues.includes(issue.id) && projectNodeId) {
        await addIssueToBoard({
          projectId: projectNodeId,
          contentId: issue.id,
          token
        })
      }
    })
  } catch (err) {
    logError(err)
    core.setFailed(err.message)
  }
}
