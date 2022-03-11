'use strict'
const tap = require('tap')

tap.test('Get projects beta board issues without pagination', async t => {
  const boardIssuesMockData = {
    organization: {
      projectNext: {
        id: 'project-id',
        fields: {
          nodes: []
        },
        items: {
          pageInfo: {
            hasNextPage: false,
            endCursor: '1234'
          },
          edges: [
            {
              node: {
                content: {
                  id: '1'
                }
              }
            },
            {
              node: {
                content: {
                  id: '2'
                }
              }
            }
          ]
        }
      }
    }
  }

  const moduleToTest = t.mock('../src/get-board-issues', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => boardIssuesMockData
    }
  })

  const expectedResults = {
    boardIssues: ['1', '2'],
    projectNodeId: 'project-id',
    projectFields: []
  }
  const results = await moduleToTest.getAllBoardIssues(
    'organization-login',
    1,
    true
  )

  t.same(results, expectedResults)
})

tap.test('Get projects beta board issues with pagination', async t => {
  const expectedResults1 = [
    {
      node: {
        content: {
          id: '1'
        }
      }
    },
    {
      node: {
        content: {
          id: '2'
        }
      }
    }
  ]

  const expectedResults2 = [
    {
      node: {
        content: {
          id: '3'
        }
      }
    },
    {
      node: {
        content: {
          id: '4'
        }
      }
    }
  ]

  const edges = [expectedResults1, expectedResults2]

  const boardIssuesMockData = timesCalled => ({
    organization: {
      projectNext: {
        id: 'project-id',
        fields: {
          nodes: []
        },
        items: {
          pageInfo: {
            hasNextPage: timesCalled !== 1,
            endCursor: '1234'
          },
          edges: edges[timesCalled]
        }
      }
    }
  })

  let timesCalled = 0
  const moduleToTest = t.mock('../src/get-board-issues', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => {
        const results = boardIssuesMockData(timesCalled)
        timesCalled++
        return results
      }
    }
  })

  const expectedResults = {
    boardIssues: ['1', '2', '3', '4'],
    projectNodeId: 'project-id',
    projectFields: []
  }
  const results = await moduleToTest.getAllBoardIssues(
    'organization-login',
    1,
    true
  )

  t.same(results, expectedResults)
})

tap.test('Return empty issues array if no board issues', async t => {
  const boardIssuesMockData = {
    organization: {
      projectNext: {
        id: 'project-id',
        fields: {
          nodes: []
        },
        items: {
          pageInfo: {
            hasNextPage: false,
            endCursor: '1234'
          },
          edges: [
            {
              node: {
                content: null
              }
            }
          ]
        }
      }
    }
  }

  const moduleToTest = t.mock('../src/get-board-issues', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => boardIssuesMockData
    }
  })

  const expectedResults = {
    boardIssues: [],
    projectNodeId: 'project-id',
    projectFields: []
  }
  const results = await moduleToTest.getAllBoardIssues(
    'organization-login',
    1,
    true
  )

  t.same(results, expectedResults)
})

tap.test('Throw an error if cannot get issues', async t => {
  const moduleToTest = t.mock('../src/get-board-issues', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => ({
        errors: [{ message: 'error' }],
        data: {
          organization: null
        }
      })
    }
  })

  t.rejects(
    moduleToTest.getAllBoardIssues('organization-login', 1, true),
    new Error('Error getting issues from board')
  )
})

tap.test('Get legacy projects board issues', async t => {
  const moduleToTest = t.mock('../src/get-board-issues', {
    '@actions/core': {
      getInput: () => ''
    },
    '@actions/github': {
      getOctokit: () => {
        return {
          paginate: () => {
            return new Promise(resolve =>
              resolve([{ id: '1', node_id: 'project-id', number: 1 }])
            )
          },
          request: () => {
            return new Promise(resolve =>
              resolve({ data: { id: 1, note: 'Test note' } })
            )
          }
        }
      }
    }
  })

  const expectedResults = {
    boardIssues: [{ id: 1, note: 'Test note' }],
    projectNodeId: 'project-id'
  }
  const results = await moduleToTest.getAllBoardIssues(
    'organization-login',
    1,
    false
  )
  t.same(results, expectedResults)
})
