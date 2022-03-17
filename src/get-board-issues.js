'use strict'
const { graphqlWithAuth } = require('./graphql')
const { getOctokit } = require('@actions/github')

const getAllBoardIssuesProjectBeta =
  (login, projectNumber) =>
  async ({ results, cursor } = { results: [] }) => {
    const query = `
    query getAllBoardIssues($login: String!, $projectNumber: Int!, $cursor: String) {
      organization(login: $login) {
        projectNext(number: $projectNumber) {
          id
          fields(first: 100){
            nodes{
              id
              name
              settings
            }
          }
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

    const result = await graphqlWithAuth(query, {
      cursor,
      login,
      projectNumber
    })

    const { errors, organization } = result

    if (errors) {
      throw new Error(`Error getting issues from board`)
    }

    const {
      projectNext: {
        id: projectNodeId,
        fields: { nodes: projectFields },
        items: {
          edges,
          pageInfo: { hasNextPage, endCursor }
        }
      }
    } = organization

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

    return { boardIssues, projectNodeId, projectFields }
  }

const getAllBoardIssuesProjectBoard = async (login, projectNumber) => {
  const token = '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'
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
          `/projects/columns/${c.id}/cards?archived_state=all`
        )
        return columnCards
      })
    )
    return cardsArr.flatMap(c => c.data)
  }
  const issues = await getCards(projectColumns)

  const boardIssues = issues.filter(issue => !issue.archived)
  const archivedIssues = issues.filter(issue => issue.archived)

  return { boardIssues, projectNodeId, archivedIssues }
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
