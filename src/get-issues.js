'use strict'
const { graphqlWithAuth } = require('./graphql')
const ms = require('ms')

const query = `
query goodFirstIssues($queryString: String!, $cursor: String) {
  search(first: 100, query: $queryString, type: ISSUE, after: $cursor) {
    issueCount
    nodes {
      ... on Issue {
        id
        title
        resourcePath
        url
      }
    }
    pageInfo{
      hasNextPage
      endCursor
  }
  }
}
`

const getIssues =
  (organizations, labels, timeInterval) =>
  async ({ results, cursor } = { results: [] }) => {
    const today = new Date().getTime()
    const issuesTimeFrame = new Date(today - ms(timeInterval)).toISOString()
    const orgs = organizations
      .replace(/\s/g, '')
      .split(',')
      .map(org => `org:${org}`)
      .join(' ')
    const labelsList = labels
      .split(',')
      .map(label => `"${label.trim()}"`)
      .join(',')

    const queryString = `${orgs} is:open label:${labelsList} sort:updated-desc updated:">=${issuesTimeFrame}"`

    const {
      search: {
        nodes,
        pageInfo: { hasNextPage, endCursor }
      }
    } = await graphqlWithAuth(query, {
      queryString,
      cursor
    })

    results.push(...nodes)

    if (hasNextPage) {
      await getIssues(
        organizations,
        labels,
        timeInterval
      )({
        results,
        cursor: endCursor
      })
    }

    return results
  }

module.exports = {
  getIssues
}
