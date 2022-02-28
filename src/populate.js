'use strict'

const { graphql } = require('@octokit/graphql')
const { logInfo } = require('./log')

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

  if (!result.addProjectNextItem.projectNextItem.id) {
    throw new Error('Failed to add issue to board')
  }

  const { id, title = '' } = result.addProjectNextItem.projectNextItem

  logInfo(`Added issue to board: id - ${id}, title - ${title}`)

  return result.addProjectNextItem.projectNextItem.title
}

module.exports = {
  addIssueToBoard
}

/* response
{
  "data": {
    "addProjectNextItem": {
      "projectNextItem": {
        "id": "MDE1OlByb2plY3ROZXh0SXRlbTM0MjEz"
      }
    }
  }
}
*/
