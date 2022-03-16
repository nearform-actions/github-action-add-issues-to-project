'use strict'
const core = require('@actions/core')
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
  const queryArchivedCards = `
  query getArchivedCards($login: String!, $projectNumber: Int!) {
    organization(login: $login) {
     project(number: $projectNumber){
      columns(first: 100){
        edges{
          node{
            name 
            cards(first:100, archivedStates: ARCHIVED){
              edges{
                node {
                  id
                  note
                  isArchived
                }
              }
            }
          }
        }
      }
    }
    }
  }
  `
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

  const getArchivedCards = async () => {
    const result = await graphqlWithAuth(queryArchivedCards, {
      login,
      projectNumber
    })

    const { errors, organization } = result

    if (errors) {
      throw new Error(`Error getting archived cards from board`)
    }

    const {
      project: {
        columns: { edges }
      }
    } = organization

    return edges.flatMap(edge => edge.node.cards.edges)
  }

  const archivedIssues = await getArchivedCards()

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
