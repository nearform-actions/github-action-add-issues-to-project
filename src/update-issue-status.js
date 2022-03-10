'use strict'

const core = require('@actions/core')
const { graphqlWithAuth } = require('./graphql')

const updateIssueStatus = async ({
  fieldId,
  issueId,
  projectId,
  columnName
}) => {
  const mutation = `
  mutation($fieldId: ID!, $itemId: ID!, $projectId: ID!, $value: String!) {
    updateProjectNextItemField(input: {fieldId: $fieldId, itemId: $itemId, projectId: $projectId, value: $value}){
     projectNextItem{
       id
       title
     }
   }
   }
 `
  const result = await graphqlWithAuth(mutation, {
    fieldId,
    itemId: issueId,
    projectId,
    value: columnName
  })

  const { errors } = result

  if (errors) {
    core.setFailed(`Could not update issue status ${JSON.stringify(errors)}`)
  }

  core.info(`Issue ${issueId} moved to column ${columnName} `)
}

module.exports = {
  updateIssueStatus
}
