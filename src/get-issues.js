'use strict'
const { graphql } = require('@octokit/graphql')

const query = `
query goodFirstIssues($queryString: String!) {
  search(first: 100, query: $queryString, type: ISSUE) {
    issueCount
    nodes {
      ... on Issue {
        id
      }
    }
  }
}
`

async function getGoodFirstIssues(organization, timeInterval) {
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token  ${process.env.GH_TOKEN}`
    }
  })

  const queryString = `org:${organization} is:open label:"good first issue" sort:updated-desc updated:${timeInterval}`
  const {
    search: { nodes }
  } = await graphqlWithAuth(query, {
    queryString
  })

  return nodes
}

module.exports = {
  getGoodFirstIssues
}
