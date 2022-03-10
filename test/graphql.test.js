'use strict'
const { test } = require('tap')

test('should validate graphql params', t => {
  t.plan(5)

  const moduleToTest = t.mock('../src/graphql.js', {
    '@actions/core': {
      getInput: (name, options) => {
        t.equal(name, 'github-token')
        t.same(options, { required: true })

        return 'fake-token'
      }
    },
    '@octokit/graphql': {
      graphql: {
        defaults: options => {
          t.same(options, {
            headers: {
              authorization: 'token fake-token'
            }
          })
          return (query, parameters) => {
            t.equal(query, 'fake-query')
            t.same(parameters, { foo: 'bar' })
          }
        }
      }
    }
  })

  moduleToTest.graphqlWithAuth('fake-query', { foo: 'bar' })
})
