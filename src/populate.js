'use strict'

const { graphql } = require('@octokit/graphql')

const addIssuesToBoard = async ({ projectId, contentId, token }) => {
  const mutation = `
  mutation addProjectNextItem($projectId: String!, $contentId: String!) {
    addProjectNextItem(input: { projectId: $projectId contentId: $contentId }) {
      projectNextItem {
        id
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

  return JSON.stringify(result)
}

addIssuesToBoard({
  projectId: 'PN_kwDOABeR784AA2ly',
  contentId: 'I_kwDOG3mxN85Ef446'
}).catch(err => console.log(err))

module.exports = {
  addIssuesToBoard
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
