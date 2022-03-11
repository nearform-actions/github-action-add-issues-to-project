'use strict'
const core = require('@actions/core')
const github = require('@actions/github')
const { getIssues } = require('./get-issues')
const { addIssueToBoard, addIssueToBoardBeta } = require('./add-issue')
const { getAllBoardIssues } = require('./get-board-issues')
const { updateIssueStatus } = require('./update-issue-status')
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
    const labels = core.getInput('issues-labels', { required: true })
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

    const newIssues = await getIssues(organizations, labels, timeInterval)()

    core.info(`Found ${newIssues.length} issues: ${JSON.stringify(newIssues)}`)

    if (newIssues.length === 0) {
      core.info(`No issues found with labels ${labels}`)
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

    newIssues.map(async issue => {
      if (
        !checkIssueAlreadyExists(boardIssues, issue, isProjectBeta) &&
        projectNodeId
      ) {
        if (isProjectBeta) {
          const { projectIssueId } = await addIssueToBoardBeta({
            projectId: projectNodeId,
            issue
          })

          if (columnName) {
            await updateIssueStatus({
              issueId: projectIssueId,
              projectId: projectNodeId,
              projectFields,
              columnName
            })
          }
        } else {
          await addIssueToBoard({
            projectId: projectNodeId,
            issue,
            columnId
          })
        }
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
