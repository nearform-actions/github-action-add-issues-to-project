'use strict'
const tap = require('tap')

tap.test('Add issue to project beta board', async t => {
  const mutationResponseMockData = {
    addProjectNextItem: { projectNextItem: { id: 'project-issue-1' } }
  }

  const moduleToTest = t.mock('../src/add-issue', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => mutationResponseMockData
    }
  })

  const functionToTest = async () =>
    await moduleToTest.addIssueToBoard({
      projectId: 'project-id',
      columnId: 'column-id',
      issue: { id: '1' },
      isProjectBeta: true
    })

  t.resolves(functionToTest)
})

tap.test('Throw an errow if cannot perform mutation', async t => {
  const moduleToTest = t.mock('../src/add-issue', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => ({
        errors: [{ message: 'error' }]
      })
    }
  })

  t.rejects(
    moduleToTest.addIssueToBoard({
      projectId: 'project-id',
      columnId: 'column-id',
      issue: { id: '1' },
      isProjectBeta: true
    }),
    new Error('Error adding issue to board')
  )
})

tap.test('Throw an errow if cannot add new issue', async t => {
  const moduleToTest = t.mock('../src/add-issue', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => ({
        addProjectNextItem: {}
      })
    }
  })

  t.rejects(
    moduleToTest.addIssueToBoard({
      projectId: 'project-id',
      columnId: 'column-id',
      issue: { id: '1' },
      isProjectBeta: true
    }),
    new Error('Failed to add issue to board')
  )
})

tap.test('Add card to project board', async t => {
  const mutationResponseMockData = {
    addProjectCard: { projectColumn: { name: 'To do' } }
  }

  const moduleToTest = t.mock('../src/add-issue', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => mutationResponseMockData
    }
  })

  const functionToTest = async () =>
    await moduleToTest.addIssueToBoard({
      projectId: 'project-id',
      columnId: 'column-id',
      issue: { id: '1', title: 'test issue', url: '/test-issue' },
      isProjectBeta: false
    })

  t.resolves(functionToTest)
})
