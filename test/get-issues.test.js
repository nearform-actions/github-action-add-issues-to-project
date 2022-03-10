'use strict'
const tap = require('tap')

tap.test('Get issues', async t => {
  const issuesMockData = {
    search: {
      nodes: [{ id: '1' }, { id: '2' }, { id: '3' }]
    }
  }

  const moduleToTest = t.mock('../src/get-issues', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => issuesMockData
    }
  })

  const expectedResults = [{ id: '1' }, { id: '2' }, { id: '3' }]
  const results = await moduleToTest.getGoodFirstIssues(
    'test-organization',
    '1 day'
  )
  t.same(results, expectedResults)
})
