'use strict'
const { graphql } = require('@octokit/graphql')

const query = `
query goodFirstIssuesRepos($searchQuery: String!, $since: String!) { 
    search(first: 100, query: $searchQuery, type: REPOSITORY) {
   nodes {
     ... on Repository {
       issues(first: 50, labels: ["good first issue"], states: OPEN, orderBy: {field: UPDATED_AT, direction: DESC}, filterBy: { since: $since}) {
         nodes {
           id
         }
       }
     }
   }
 }
}
`

async function getGoodFirstIssuesRepos(organization, since) {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${process.env.GH_TOKEN}`
    }
  })

  const searchQuery = `org:${organization} good-first-issues:>=1`

  const {
    search: { nodes }
  } = await graphqlWithAuth(query, {
    searchQuery,
    since
  })
  return nodes
}

async function getGoodFirstIssues(organization, since) {
  const repos = await getGoodFirstIssuesRepos(organization, since)

  const issues = repos.reduce((prev, curr) => {
    const {
      issues: { nodes }
    } = curr
    return [...prev, ...nodes]
  }, [])

  return issues
}

module.exports = {
  getGoodFirstIssues
}
