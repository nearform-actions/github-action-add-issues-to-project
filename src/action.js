'use strict'
const core = require('@actions/core')
const github = require('@actions/github')
const { getGoodFirstIssues } = require('./get-issues')
const { addIssueToBoard } = require('./add-issue')
const { getAllBoardIssues } = require('./get-board-issues')
const {
  findColumnIdByName,
  checkIssueAlreadyExists,
  checkIsProjectBeta
} = require('./utils')

async function run() {
  core.info(`
    *** ACTION RUN - START ***
    `)

  try {
    const organizations = core.getInput('organizations', { required: true })
    const timeInterval = core.getInput('time-interval', { required: true })
    let projectNumber =
      core.getInput('project-number', { required: true }) &&
      Number(core.getInput('project-number'))
    const columnName = core.getInput('column-name')
    const login = github.context.payload.organization.login

    const isProjectBeta = await checkIsProjectBeta(login, projectNumber)

    if (!isProjectBeta && !columnName) {
      throw new Error('Column name is required for legacy project boards')
    }

    const goodFirstIssues = await getGoodFirstIssues(
      organizations,
      timeInterval
    )

    core.info(
      `Found ${goodFirstIssues.length} good first issues: ${JSON.stringify(
        goodFirstIssues
      )}`
    )

    if (goodFirstIssues.length === 0) {
      core.info('No good first issues found')
      return
    }

    const {
      boardIssues = [],
      projectNodeId = null,
      projectFields = []
    } = await getAllBoardIssues(login, projectNumber, isProjectBeta)

    core.info(`Found ${boardIssues.length} existing board issues`)

    const columnId = await findColumnIdByName(
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
          projectFields,
          columnId,
          columnName,
          issue,
          isProjectBeta
        })
      }
    })
  } catch (err) {
    core.setFailed(`Action failed with error ${err}`)
  } finally {
    core.info(`
    *** ACTION RUN - END ***
    `)
  }
}

module.exports = {
  run
}
