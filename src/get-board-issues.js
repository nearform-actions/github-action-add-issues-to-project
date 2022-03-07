'use strict'
const { graphql } = require('@octokit/graphql')
const github = require('@actions/github')
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
                title
              }
            }
          }        
        }
      }
    }
  }
}
`

const getAllBoardIssuesProjectBeta =
  (token, login, projectNumber) =>
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
      projectId: Number(projectNumber)
    })

    logDebug(`Get Board Issues result - ${JSON.stringify(edges)}`)

    if (errors) {
      logDebug(JSON.stringify(errors))
      throw new Error(`Error getting issues from board`)
    }

    results.push(...edges)

    if (hasNextPage) {
      await getAllBoardIssuesProjectBeta(
        token,
        login,
        projectNumber
      )({
        results,
        cursor: endCursor
      })
    }

    const boardIssues = results.reduce((prev, curr) => {
      const {
        node: { content }
      } = curr
      if (content && content.id) {
        prev.push(content.id)
      }
      return prev
    }, [])

    return { boardIssues, projectNodeId }
  }

const getAllBoardIssuesProjectBoard = async (token, login, projectNumber) => {
  const octokit = github.getOctokit(token)
  const projects = await octokit.paginate('GET /orgs/{org}/projects', {
    org: login
  })
  const project = projects.find(p => p.number == projectNumber)
  const projectId = project.id
  const projectNodeId = project.node_id

  const projectColumns = await octokit.paginate(
    'GET /projects/{project_id}/columns',
    {
      project_id: projectId
    }
  )

  const getCards = async projectColumns => {
    const cardsArr = await Promise.all(
      projectColumns.map(async c => {
        const columnCards = await octokit.request(
          `/projects/columns/${c.id}/cards`
        )
        return columnCards
      })
    )
    return cardsArr.flatMap(c => c.data)
  }
  const boardIssues = await getCards(projectColumns)

  return { boardIssues, projectNodeId }
}

const getAllBoardIssues = async (
  token,
  login,
  projectNumber,
  isProjectBeta
) => {
  if (isProjectBeta) {
    return getAllBoardIssuesProjectBeta(token, login, projectNumber)()
  }
  return getAllBoardIssuesProjectBoard(token, login, projectNumber)
}

module.exports = {
  getAllBoardIssues
}
