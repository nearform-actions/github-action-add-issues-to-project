'use strict'
const { graphql } = require('@octokit/graphql')
const ms = require('ms')

const query = `
query goodFirstIssues($queryString: String!) {
  search(first: 100, query: $queryString, type: ISSUE) {
    issueCount
    nodes {
      ... on Issue {
        id
        title
        url
      }
    }
  }
}
`

async function getGoodFirstIssues(token, organizations, timeInterval) {
  const today = new Date().getTime()
  const issuesTimeFrame = new Date(today - ms(timeInterval)).toISOString()
  const orgs = organizations
    .replace(/\s/g, '')
    .split(',')
    .map(org => `org:${org}`)
    .join(' ')

  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token  ${token}`
    }
  })

  const queryString = `${orgs} is:open label:"good first issue" sort:updated-desc updated:">=${issuesTimeFrame}"`

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
