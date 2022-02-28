'use strict'

const { graphql } = require('@octokit/graphql')
const { logInfo, logDebug } = require('./log')

const addIssueToBoard = async ({ projectId, contentId, token }) => {
  const mutation = `
  mutation addIssueToBoard($projectId: ID!, $contentId: ID!) {
    addProjectNextItem(input: { projectId: $projectId contentId: $contentId }) {
      projectNextItem {
        id
        title
      }
    }
  }`

  const client = graphql.defaults({
    headers: {
      authorization: `token ${token}`
    }
  })

  const result = await client(mutation, {
    projectId,
    contentId
  })

  logDebug(`Mutation result - ${JSON.stringify(result)}`)

  if (result.errors) {
    logDebug(JSON.stringify(result.errors))
    throw new Error(`Error adding issue to board`)
  }

  if (!result?.addProjectNextItem?.projectNextItem?.id) {
    throw new Error('Failed to add issue to board')
  }

  const { id, title = '' } = result.addProjectNextItem.projectNextItem

  logInfo(`Added issue to board: id - ${id}, title - ${title}`)
}

module.exports = {
  addIssueToBoard
}
