'use strict'
const tap = require('tap')
const IssuesMockData = require('../mock')

tap.test('Get issues', async t => {
  const moduleToTest = t.mock('../src/get-issues', {
    '@octokit/graphql': {
      graphql: {
        defaults: () => {
          return async () => IssuesMockData
        }
      }
    }
  })

  const expectedResults = [{ id: '1' }, { id: '2' }, { id: '3' }]
  const results = await moduleToTest.getGoodFirstIssues(
    'test-organization',
    '2022-01-10T00:00:00.000+05:30'
  )
  t.same(results, expectedResults)
})
