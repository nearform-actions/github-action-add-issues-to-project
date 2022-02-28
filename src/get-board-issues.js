'use strict'
const { graphql } = require('@octokit/graphql')
const { logDebug } = require('./log')

const query = `
query getAllBoardIssues($login: String!, $projectId: Int!) {
  organization(login: $login) {
    projectNext(number: $projectId) {
      id
      items (first: 100) {
        nodes {
      		content {
            ... on Issue {
              id
              number
            }
          }        
        }
      }
    }
  }
}
`

async function getAllBoardIssues(token, login, projectId) {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token  ${token}`
    }
  })

  const result = await graphqlWithAuth(query, {
    login,
    projectId: Number(projectId)
  })

  logDebug(`Get All Board Issues result - ${JSON.stringify(result)}`)

  if (result.errors) {
    logDebug(JSON.stringify(result.errors))
    throw new Error(`Error getting issues from board`)
  }

  const projectNodeId = result.organization.projectNext.id
  const boardIssues = result.organization.projectNext.items.nodes.map(n => n.id)

  return { boardIssues, projectNodeId }
}

module.exports = {
  getAllBoardIssues
}
