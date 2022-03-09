'use strict'
const core = require('@actions/core')
const { getGoodFirstIssues } = require('./get-issues')
const { addIssueToBoard } = require('./populate')
const { logError, logDebug, logInfo } = require('./log')
const { getAllBoardIssues } = require('./get-board-issues')
const { findColumnIdByName, checkIssueAlreadyExists } = require('./utils')

module.exports = async function ({ context, token = null, inputs = {} }) {
  logDebug(`Inputs: ${JSON.stringify(inputs)}`)

  if (
    !inputs['organizations'] ||
    !inputs['time-interval'] ||
    !token ||
    !inputs['project-number'] ||
    !inputs['project-beta'] ||
    !context.payload.organization.login
  ) {
    throw new Error('Missing required inputs')
  }

  try {
    const {
      organizations,
      'time-interval': timeInterval,
      'project-number': projectNumber,
      'column-name': columnName,
      'project-beta': isProjectBeta
    } = inputs

    if (!isProjectBeta && !columnName) {
      throw new Error('Column name is required')
    }

    const login = context.payload.organization.login

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
      login,
      projectNumber,
      isProjectBeta
    )

    logInfo(
      `Found ${boardIssues.length} board issues: ${JSON.stringify(boardIssues)}`
    )

    const columnId = await findColumnIdByName(
      token,
      login,
      projectNumber,
      columnName,
      isProjectBeta
    )

    goodFirstIssues.map(async issue => {
      if (
        !checkIssueAlreadyExists(boardIssues, issue, isProjectBeta) &&
        projectNodeId
      ) {
        await addIssueToBoard({
          projectId: projectNodeId,
          columnId,
          issue,
          token,
          isProjectBeta
        })
      }
    })
  } catch (err) {
    logError(err)
    core.setFailed(err.message)
  }
}
