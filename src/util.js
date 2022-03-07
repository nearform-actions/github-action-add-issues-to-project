'use strict'

const { graphql } = require('@octokit/graphql')
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
  token,
  login,
  projectId,
  columnName,
  isProjectBeta
) {
  if (isProjectBeta) return null

  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token  ${token}`
    }
  })

  const result = await graphqlWithAuth(query, {
    login,
    projectId: Number(projectId)
  })

  logDebug(`Get project columns result - ${JSON.stringify(result)}`)

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

  logInfo(`Found column id is: ${columnId}`)

  return columnId
}

function checkIssueAlreadyExists(boardIssues, issue, isProjectBeta) {
  if (isProjectBeta) {
    return boardIssues.includes(issue.id)
  }

  return boardIssues.some(boardIssue => {
    return (
      (boardIssue.content && boardIssue.content.id == issue.id) ||
      (boardIssue.note && boardIssue.note.includes(issue.url))
    )
  })
}

module.exports = {
  findColumnIdByName,
  checkIssueAlreadyExists
}
