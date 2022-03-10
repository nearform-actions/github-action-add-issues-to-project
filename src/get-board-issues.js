'use strict'
const core = require('@actions/core')
const { graphqlWithAuth } = require('./graphql')
const { getOctokit } = require('@actions/github')
const { logDebug } = require('./log')

const query = `
query getAllBoardIssues($login: String!, $projectNumber: Int!, $cursor: String) {
  organization(login: $login) {
    projectNext(number: $projectNumber) {
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
  (login, projectNumber) =>
  async ({ results, cursor } = { results: [] }) => {
    const result = await graphqlWithAuth(query, {
      cursor,
      login,
      projectNumber
    })

    const { errors, organization } = result

    if (errors) {
      logDebug(JSON.stringify(errors))
      throw new Error(`Error getting issues from board`)
    }

    const {
      projectNext: {
        id: projectNodeId,
        items: {
          edges,
          pageInfo: { hasNextPage, endCursor }
        }
      }
    } = organization

    logDebug(`Get Board Issues result - ${JSON.stringify(edges)}`)

    results.push(...edges)

    if (hasNextPage) {
      await getAllBoardIssuesProjectBeta(
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

const getAllBoardIssuesProjectBoard = async (login, projectNumber) => {
  const token = core.getInput('github-token', { required: true })
  const octokit = getOctokit(token)
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

const getAllBoardIssues = async (login, projectNumber, isProjectBeta) => {
  if (isProjectBeta) {
    return getAllBoardIssuesProjectBeta(login, projectNumber)()
  }
  return getAllBoardIssuesProjectBoard(login, projectNumber)
}

module.exports = {
  getAllBoardIssues
}
