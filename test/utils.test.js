'use strict'
const tap = require('tap')
const {
  checkIssueAlreadyExists,
  checkIssueIsArchived
} = require('../src/utils')

tap.test('Find column id by name', async t => {
  const columnsMockData = {
    organization: {
      project: {
        columns: {
          nodes: [
            {
              id: '1',
              name: 'to do'
            }
          ]
        }
      }
    }
  }
  const moduleToTest = t.mock('../src/utils', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => columnsMockData
    }
  })

  const result = await moduleToTest.findColumnIdByName(
    'test-organization',
    1,
    'to do',
    false
  )

  t.same(result, '1')
})

tap.test('Throw an error if cannot get project columns', async t => {
  const moduleToTest = t.mock('../src/utils', {
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
    moduleToTest.findColumnIdByName('test-organization', 1, 'to do', false),
    new Error('Error getting project columns')
  )
})

tap.test('Throws an error if cannot find column', async t => {
  const columnsMockData = {
    organization: {
      project: {
        columns: {
          nodes: [
            {
              id: '1',
              name: 'in progress'
            }
          ]
        }
      }
    }
  }
  const moduleToTest = t.mock('../src/utils', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => columnsMockData
    }
  })

  t.rejects(
    moduleToTest.findColumnIdByName('test-organization', 1, 'to do', false),
    new Error('Could not find column named to do')
  )
})

tap.test('Return if the project is beta', async t => {
  const moduleToTest = t.mock('../src/utils', {
    '@octokit/graphql': {}
  })

  const result = await moduleToTest.findColumnIdByName(
    'test-organization',
    1,
    'to do',
    true
  )

  t.strictSame(result, undefined)
})

tap.test(
  'Return true if issue already exists on project beta board',
  async t => {
    const boardIssues = ['1', '1']
    const issue1 = { id: '1' }
    const issue2 = { id: '3' }
    const result1 = checkIssueAlreadyExists(boardIssues, issue1, true)
    const result2 = checkIssueAlreadyExists(boardIssues, issue2, true)
    t.same(result1, true)
    t.same(result2, false)
  }
)

tap.test('Return true if issue already exists on project board', async t => {
  const boardIssues = [
    { note: 'first issue', content_url: '/first-issue' },
    { note: 'second issue', content_url: '/second-issue' },
    { note: null, content_url: '/third-issue' }
  ]
  const issue1 = { title: 'first issue', resourcePath: '/first-issue' }
  const issue2 = { title: 'another issue', resourcePath: '/another-issue' }
  const issue3 = { title: 'third issue', resourcePath: '/third-issue' }
  const result1 = checkIssueAlreadyExists(boardIssues, issue1, false)
  const result2 = checkIssueAlreadyExists(boardIssues, issue2, false)
  const result3 = checkIssueAlreadyExists(boardIssues, issue3, false)
  t.same(result1, true)
  t.same(result2, false)
  t.same(result3, true)
})

tap.test('Return true if project is beta', async t => {
  const projectMockData = {
    organization: {
      projectNext: {
        id: 1,
        title: 'Project beta'
      }
    }
  }
  const moduleToTest = t.mock('../src/utils', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => projectMockData
    }
  })

  const result = await moduleToTest.checkIsProjectBeta(
    'test-token',
    'test-organization',
    1
  )

  t.same(result, true)
})

tap.test('Return false if project is not beta', async t => {
  const projectMockData = {
    organization: {
      projectNext: null
    }
  }
  const moduleToTest = t.mock('../src/utils', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => projectMockData
    }
  })

  const result = await moduleToTest.checkIsProjectBeta(
    'test-token',
    'test-organization',
    1
  )

  t.same(result, false)
})

tap.test('Throw an error if cannot get project beta', async t => {
  const moduleToTest = t.mock('../src/utils', {
    '../src/graphql.js': {
      graphqlWithAuth: async () => ({
        errors: [
          {
            message: 'error'
          }
        ]
      })
    }
  })

  t.rejects(
    moduleToTest.checkIsProjectBeta('test-token', 'test-organization', 1),
    new Error('Error getting project beta')
  )
})

tap.test('Return true if issue is archived on project beta', async t => {
  const projectNodeId = 'test-project-id'
  const issue1 = {
    title: 'first issue',
    resourcePath: '/first-issue',
    projectNextItems: {
      edges: [
        { node: { project: { id: 'test-project-id' }, isArchived: true } }
      ]
    }
  }
  const issue2 = {
    title: 'another issue',
    resourcePath: '/another-issue',
    projectNextItems: {
      edges: [
        { node: { project: { id: 'test-project-id' }, isArchived: false } }
      ]
    }
  }

  const issue3 = {
    title: 'another issue',
    resourcePath: '/another-issue',
    projectNextItems: {
      edges: [
        { node: { project: { id: 'not-test-project-id' }, isArchived: true } }
      ]
    }
  }
  const result1 = checkIssueIsArchived(projectNodeId, [], issue1, true)
  const result2 = checkIssueIsArchived(projectNodeId, [], issue2, true)
  const result3 = checkIssueIsArchived(projectNodeId, [], issue3, true)
  t.same(result1, true)
  t.same(result2, false)
  t.same(result3, false)
})

tap.test(
  'Return true if issue is archived on legacy project board',
  async t => {
    const projectNodeId = 'test-project-id'
    const archivedIssues = [
      {
        note: 'first issue /first-issue'
      }
    ]
    const issue1 = { title: 'first issue', resourcePath: '/first-issue' }
    const issue2 = { title: 'second issue', resourcePath: '/second-issue' }

    const result1 = checkIssueIsArchived(
      projectNodeId,
      archivedIssues,
      issue1,
      false
    )
    const result2 = checkIssueIsArchived(
      projectNodeId,
      archivedIssues,
      issue2,
      false
    )
    t.same(result1, true)
    t.same(result2, false)
  }
)
