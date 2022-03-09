'use strict'
const tap = require('tap')

tap.test('Add issue to project beta board', async t => {
  const mutationResponseMockData = {
    addProjectNextItem: { projectNextItem: { id: '1' } }
  }

  const moduleToTest = t.mock('../src/populate', {
    '@octokit/graphql': {
      graphql: {
        defaults: () => {
          return async () => mutationResponseMockData
        }
      }
    }
  })

  const functionToTest = async () =>
    await moduleToTest.addIssueToBoard({
      projectId: 'project-id',
      columnId: 'column-id',
      issue: { id: '1' },
      token: 'test-token',
      isProjectBeta: true
    })

  t.resolves(functionToTest)
})

tap.test('Throw an errow if cannot perform mutation', async t => {
  const moduleToTest = t.mock('../src/populate', {
    '@octokit/graphql': {
      graphql: {
        defaults: () => {
          return async () => ({
            errors: [{ message: 'error' }]
          })
        }
      }
    }
  })

  t.rejects(
    moduleToTest.addIssueToBoard({
      projectId: 'project-id',
      columnId: 'column-id',
      issue: { id: '1' },
      token: 'test-token',
      isProjectBeta: true
    }),
    new Error('Error adding issue to board')
  )
})

tap.test('Throw an errow if cannot add new issue', async t => {
  const moduleToTest = t.mock('../src/populate', {
    '@octokit/graphql': {
      graphql: {
        defaults: () => {
          return async () => ({
            addProjectNextItem: {}
          })
        }
      }
    }
  })

  t.rejects(
    moduleToTest.addIssueToBoard({
      projectId: 'project-id',
      columnId: 'column-id',
      issue: { id: '1' },
      token: 'test-token',
      isProjectBeta: true
    }),
    new Error('Failed to add issue to board')
  )
})

tap.test('Add card to project board', async t => {
  const mutationResponseMockData = {
    addProjectCard: { projectColumn: { name: 'To do' } }
  }

  const moduleToTest = t.mock('../src/populate', {
    '@octokit/graphql': {
      graphql: {
        defaults: () => {
          return async () => mutationResponseMockData
        }
      }
    }
  })

  const functionToTest = async () =>
    await moduleToTest.addIssueToBoard({
      projectId: 'project-id',
      columnId: 'column-id',
      issue: { id: '1', title: 'test issue', url: '/test-issue' },
      token: 'test-token',
      isProjectBeta: false
    })

  t.resolves(functionToTest)
})
