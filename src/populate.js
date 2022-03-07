'use strict'

const { graphql } = require('@octokit/graphql')
const { logInfo, logDebug } = require('./log')

const addIssueToBoard = async ({
  projectId,
  columnId,
  issue,
  token,
  isProjectBeta
}) => {
  const { id: issueId, title: issueTitle, url: issueUrl } = issue

  const mutationProjectBeta = `
  mutation addIssueToBoard($projectId: ID!, $contentId: ID!) {
    addProjectNextItem(input: { projectId: $projectId contentId: $contentId }) {
      projectNextItem {
        id
        title
      }
    }
  }`

  const mutationProjectBoard = `
  mutation addIssueToBoard($columnId: ID!) {
    addProjectCard(input: { note: "${issueTitle} ${issueUrl}", projectColumnId: $columnId }) {
      projectColumn {
        name
        cards {
          totalCount
        }
      }
    }
  }`

  const client = graphql.defaults({
    headers: {
      authorization: `token ${token}`
    }
  })

  let result
  if (isProjectBeta) {
    result = await client(mutationProjectBeta, {
      projectId,
      contentId: issueId
    })
  } else {
    result = await client(mutationProjectBoard, {
      projectId,
      columnId
    })
  }

  logDebug(`Mutation result - ${JSON.stringify(result)}`)

  if (result.errors) {
    logDebug(JSON.stringify(result.errors))
    throw new Error(`Error adding issue to board`)
  }

  if (isProjectBeta) {
    if (!result?.addProjectNextItem?.projectNextItem?.id) {
      throw new Error('Failed to add issue to board')
    }
    const { id, title = '' } = result.addProjectNextItem.projectNextItem
    logInfo(`Added issue to board: id - ${id}, title - ${title}`)
  }
}

module.exports = {
  addIssueToBoard
}
