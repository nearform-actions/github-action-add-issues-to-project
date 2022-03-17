'use strict'

const { graphqlWithAuth } = require('./graphql')
const core = require('@actions/core')

const addIssueToBoardBeta = async ({ projectId, issue }) => {
  const { id: issueId, title: issueTitle } = issue

  const mutation = `
  mutation addIssueToBoard($projectId: ID!, $contentId: ID!) {
    addProjectNextItem(input: { projectId: $projectId contentId: $contentId }) {
      projectNextItem {
        id
        title
      }
    }
  }`

  let result = await graphqlWithAuth(mutation, {
    projectId,
    contentId: issueId
  })

  if (result.errors) {
    throw new Error(`Error adding issue to board`)
  }

  if (!result?.addProjectNextItem?.projectNextItem?.id) {
    throw new Error('Failed to add issue to board')
  }

  const {
    addProjectNextItem: {
      projectNextItem: { id }
    }
  } = result

  core.info(`Added issue to board: id - ${id}, title - ${issueTitle}`)

  return { projectIssueId: id }
}

const addIssueToBoard = async ({ projectId, issue, columnId }) => {
  const { id: issueId, title: issueTitle, url: issueUrl } = issue
  const note = issueTitle.replace(/[^\w\s]/g, '')
  const mutationProjectBoard = `
  mutation addIssueToBoard($columnId: ID!) {
    addProjectCard(input: { note: "${note} ${issueUrl}", projectColumnId: $columnId }) {
      projectColumn {
        name
        cards {
          totalCount
        }
      }
    }
  }`

  const result = await graphqlWithAuth(mutationProjectBoard, {
    projectId,
    columnId
  })

  if (result.errors) {
    throw new Error(`Error adding issue to board`)
  }

  core.info(`Added issue to board: id - ${issueId}, title - ${issueTitle}`)
}

module.exports = {
  addIssueToBoardBeta,
  addIssueToBoard
}
