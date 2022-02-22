'use strict'

const issuesMockData = {
  search: {
    nodes: [
      {
        issues: {
          nodes: [{ id: '1' }, { id: '2' }]
        }
      },
      {
        issues: {
          nodes: []
        }
      },
      {
        issues: {
          nodes: [{ id: '3' }]
        }
      }
    ]
  }
}

module.exports = issuesMockData
