'use strict'

const { graphqlWithAuth } = require('./graphql')
const core = require('@actions/core')

const addIssueToBoard = async ({
  projectId,
  columnId,
  issue,
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

  let result
  if (isProjectBeta) {
    result = await graphqlWithAuth(mutationProjectBeta, {
      projectId,
      contentId: issueId
    })
  } else {
    result = await graphqlWithAuth(mutationProjectBoard, {
      projectId,
      columnId
    })
  }

  if (result.errors) {
    throw new Error(`Error adding issue to board`)
  }

  if (isProjectBeta) {
    if (!result?.addProjectNextItem?.projectNextItem?.id) {
      throw new Error('Failed to add issue to board')
    }

    const {
      addProjectNextItem: {
        projectNextItem: { id, title = '' }
      }
    } = result

    core.info(`Added issue to board: id - ${id}, title - ${title}`)

    return { projectIssueId: id }
  }
}

module.exports = {
  addIssueToBoard
}
