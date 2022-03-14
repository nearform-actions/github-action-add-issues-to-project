'use strict'
const tap = require('tap')

tap.test('Get issues without pagination', async t => {
  const issuesMockData = {
    search: {
      nodes: [{ id: '1' }, { id: '2' }, { id: '3' }],
      pageInfo: {
        hasNextPage: false,
        endCursor: '1234'
      }
    }
  }

  const moduleToTest = t.mock('../src/get-issues', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => issuesMockData
    }
  })

  const expectedResults = [{ id: '1' }, { id: '2' }, { id: '3' }]
  const results = await moduleToTest.getIssues(
    'test-organization',
    'test-label',
    '1 day'
  )()
  t.same(results, expectedResults)
})

tap.test('Get issues with pagination', async t => {
  const expectedResults1 = [{ id: '1' }, { id: '2' }]

  const expectedResults2 = [{ id: '3' }, { id: '4' }]

  const issues = [expectedResults1, expectedResults2]

  const issuesMockData = timesCalled => ({
    search: {
      nodes: issues[timesCalled],
      pageInfo: {
        hasNextPage: timesCalled !== 1,
        endCursor: '1234'
      }
    }
  })

  let timesCalled = 0
  const moduleToTest = t.mock('../src/get-issues', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => {
        const results = issuesMockData(timesCalled)
        timesCalled++
        return results
      }
    }
  })

  const expectedResults = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }]
  const results = await moduleToTest.getIssues(
    'test-organization',
    'test-label',
    '1 day'
  )()

  t.same(results, expectedResults)
})
