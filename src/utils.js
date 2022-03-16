'use strict'
const { graphqlWithAuth } = require('./graphql')

async function findColumnIdByName(
  login,
  projectNumber,
  columnName,
  isProjectBeta
) {
  if (isProjectBeta) {
    return
  }

  const query = `
  query getProjectColumns($login: String!, $projectNumber: Int!) {
      organization(login: $login) {
        project(number: $projectNumber){
          columns(first: 100) {
          nodes {
              id
              name
            }
          }
        }
      }
    }
  `

  const result = await graphqlWithAuth(query, {
    login,
    projectNumber
  })

  if (result.errors) {
    throw new Error(`Error getting project columns`)
  }

  const columns = result.organization.project.columns.nodes
  const column = columns.find(
    column =>
      column.name.trim().toLowerCase() === columnName.trim().toLowerCase()
  )

  if (!column) {
    throw new Error(`Could not find column named ${columnName}`)
  }

  const columnId = column.id

  return columnId
}

function checkIssueAlreadyExists(boardIssues, issue, isProjectBeta) {
  if (isProjectBeta) {
    return boardIssues.includes(issue.id)
  }
  return boardIssues.some(boardIssue => {
    return (
      (boardIssue.note && boardIssue.note.includes(issue.resourcePath)) ||
      (boardIssue.content_url &&
        boardIssue.content_url.includes(issue.resourcePath))
    )
  })
}

function checkIssueIsArchived(
  projectNodeId,
  archivedIssues,
  issue,
  isProjectBeta
) {
  if (isProjectBeta) {
    const {
      projectNextItems: { edges }
    } = issue

    const projectCard = edges.find(
      edge => edge?.node.project.id === projectNodeId
    )
    return projectCard?.node && projectCard.node.isArchived
  }

  return archivedIssues.some(
    archivedIssue =>
      archivedIssue.node.note &&
      archivedIssue.node.note.includes(issue.resourcePath)
  )
}

async function checkIsProjectBeta(login, projectNumber) {
  const queryProjectBeta = `
  query($login: String!, $projectNumber: Int!){
    organization(login: $login){
      projectNext(number: $projectNumber) {
        id
        title
      }
    }
  }
`
  const result = await graphqlWithAuth(queryProjectBeta, {
    login,
    projectNumber
  })

  if (result.errors) {
    throw new Error(`Error getting project beta`)
  }

  const {
    organization: { projectNext }
  } = result

  return !!projectNext
}

module.exports = {
  findColumnIdByName,
  checkIssueAlreadyExists,
  checkIssueIsArchived,
  checkIsProjectBeta
}
