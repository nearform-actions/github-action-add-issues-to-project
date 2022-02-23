'use strict'
const tap = require('tap')

tap.test('Get issues', async t => {
  const issuesMockData = {
    search: {
      nodes: [{ id: '1' }, { id: '2' }, { id: '3' }]
    }
  }

  const moduleToTest = t.mock('../src/get-issues', {
    '@octokit/graphql': {
      graphql: {
        defaults: () => {
          return async () => issuesMockData
        }
      }
    }
  })

  const expectedResults = [{ id: '1' }, { id: '2' }, { id: '3' }]
  const results = await moduleToTest.getGoodFirstIssues(
    'test-token',
    'test-organization',
    'test-timeInterval'
  )
  t.same(results, expectedResults)
})
