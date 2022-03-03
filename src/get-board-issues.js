'use strict'
const { graphql } = require('@octokit/graphql')
const { logDebug } = require('./log')

const query = `
query getAllBoardIssues($login: String!, $projectId: Int!, $cursor: String) {
  organization(login: $login) {
    projectNext(number: $projectId) {
      id
      items (first: 100, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          cursor
          node {
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
}
`

const getAllBoardIssues =
  (token, login, projectId) =>
  async ({ results, cursor } = { results: [] }) => {
    const graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token  ${token}`
      }
    })

    const {
      errors,
      organization: {
        projectNext: {
          id: projectNodeId,
          items: {
            edges,
            pageInfo: { hasNextPage, endCursor }
          }
        }
      }
    } = await graphqlWithAuth(query, {
      cursor,
      login,
      projectId: Number(projectId)
    })

    logDebug(`Get Board Issues result - ${JSON.stringify(edges)}`)

    if (errors) {
      logDebug(JSON.stringify(errors))
      throw new Error(`Error getting issues from board`)
    }

    results.push(...edges)

    if (hasNextPage) {
      await getAllBoardIssues(
        token,
        login,
        projectId
      )({
        results,
        cursor: endCursor
      })
    }

    return { boardIssues: results, projectNodeId }
  }

module.exports = {
  getAllBoardIssues
}
