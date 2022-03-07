'use strict'
const { graphql } = require('@octokit/graphql')
const { logDebug } = require('./log')

const queryProjectBeta = `
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

const queryProjectBoard = `
query getAllBoardIssues($login: String!, $projectId: Int!) {
  organization(login: $login) {
    project(number: $projectId){
      id
      columns(first: 100) {
       nodes {
         id
         name
         cards(first: 100) {
           nodes {
             note
             content{
               ... on Issue {
                 id
                 title
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

async function getAllBoardIssues(token, login, projectId, isProjectBeta) {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token  ${token}`
    }
  })

  const query = isProjectBeta ? queryProjectBeta : queryProjectBoard

  const result = await graphqlWithAuth(query, {
    login,
    projectId: Number(projectId)
  })

  logDebug(`Get All Board Issues result - ${JSON.stringify(result)}`)

  if (result.errors) {
    logDebug(JSON.stringify(result.errors))
    throw new Error(`Error getting issues from board`)
  }

  let projectNodeId, boardIssues

  if (isProjectBeta) {
    projectNodeId = result.organization.projectNext.id
    const items = result.organization.projectNext.items.nodes.map(
      n => n.content
    )
    boardIssues = items.reduce((prev, curr) => {
      if (curr && curr.id) {
        prev.push(curr.id)
      }
      return prev
    }, [])
  } else {
    projectNodeId = result.organization.project.id
    const cards = result.organization.project.columns.nodes.flatMap(
      n => n.cards.nodes
    )
    boardIssues = cards.reduce((prev, curr) => {
      if (curr.note || (curr.content && curr.content.id)) {
        prev.push(curr)
      }
      return prev
    }, [])
  }

  return { boardIssues, projectNodeId }
}

module.exports = {
  getAllBoardIssues
}
