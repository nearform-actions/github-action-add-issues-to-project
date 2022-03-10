'use strict'
const core = require('@actions/core')
const { graphql } = require('@octokit/graphql')

async function graphqlWithAuth(query, parameters) {
  const token = core.getInput('github-token', { required: true })
  const graphqlQuery = graphql.defaults({
    headers: {
      authorization: `token  ${token}`
    }
  })
  return graphqlQuery(query, parameters)
}

module.exports = {
  graphqlWithAuth
}
