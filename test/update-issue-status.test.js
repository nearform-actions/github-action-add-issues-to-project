'use strict'
const tap = require('tap')
const { updateIssueStatus } = require('../src/update-issue-status')

tap.test('Update issue status', async t => {
  const mutationResponseMockData = {
    updateProjectNextItemField: {
      projectNextItem: {
        id: 'issue-project-id',
        title: 'test issue'
      }
    }
  }

  const moduleToTest = t.mock('../src/update-issue-status', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => mutationResponseMockData
    }
  })

  const functionToTest = async () =>
    await moduleToTest.updateIssueStatus({
      issueId: 'issue-id',
      projectId: 'project-id',
      projectFields: [
        {
          id: '1',
          name: 'Status',
          settings:
            '{"options":[{"id":"1","name":"To do"},{"id":"2","name":"Done"}]}'
        }
      ],
      columnName: 'to do'
    })
  t.resolves(functionToTest)
})

tap.test('Throw an error if cannot update issue status', async t => {
  const moduleToTest = t.mock('../src/update-issue-status', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => ({
        errors: [{ message: 'error' }]
      })
    }
  })

  const functionToTest = async () =>
    await moduleToTest.updateIssueStatus({
      issueId: 'issue-id',
      projectId: 'project-id',
      projectFields: [
        {
          id: '1',
          name: 'Status',
          settings:
            '{"options":[{"id":"1","name":"To do"},{"id":"2","name":"Done"}]}'
        }
      ],
      columnName: 'to do'
    })

  t.rejects(functionToTest, new Error('Could not update issue status'))
})

tap.test('Throw an error if cannot find project statuses', async t => {
  const functionToTest = updateIssueStatus({
    issueId: 'issue-id',
    projectId: 'project-id',
    projectFields: [
      {
        id: '1',
        name: 'Status',
        settings: null
      }
    ],
    columnName: 'to do'
  })

  t.rejects(functionToTest, new Error('Could not find project statuses'))
})

tap.test('Throw an error if cannot find project status', async t => {
  const functionToTest = updateIssueStatus({
    issueId: 'issue-id',
    projectId: 'project-id',
    projectFields: [
      {
        id: '1',
        name: 'Status',
        settings: '{"options":[{"id":"2","name":"Done"}]}'
      }
    ],
    columnName: 'to do'
  })

  t.rejects(functionToTest, new Error('Could not find project status to do'))
})
