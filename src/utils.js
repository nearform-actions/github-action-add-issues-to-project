'use strict'
const { graphqlWithAuth } = require('./graphql')
const { logDebug, logInfo } = require('./log')

const query = `
query getProjectColumns($login: String!, $projectId: Int!) {
    organization(login: $login) {
      project(number: $projectId){
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

async function findColumnIdByName(
  login,
  projectNumber,
  columnName,
  isProjectBeta
) {
  if (isProjectBeta) return null

  const result = await graphqlWithAuth(query, {
    login,
    projectId: Number(projectNumber)
  })

  if (result.errors) {
    logDebug(JSON.stringify(result.errors))
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

  logInfo(`Found column id: ${columnId}`)

  return columnId
}

function checkIssueAlreadyExists(boardIssues, issue, isProjectBeta) {
  if (isProjectBeta) {
    return boardIssues.includes(issue.id)
  }
  return boardIssues.some(boardIssue => {
    return (
      (boardIssue.note && boardIssue.note.includes(issue.title)) ||
      (boardIssue.content_url &&
        boardIssue.content_url.includes(issue.resourcePath))
    )
  })
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
    logDebug(JSON.stringify(result.errors))
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
  checkIsProjectBeta
}
