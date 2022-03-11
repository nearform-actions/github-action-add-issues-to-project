'use strict'

const core = require('@actions/core')
const { graphqlWithAuth } = require('./graphql')

const updateIssueStatus = async ({
  issueId,
  projectId,
  projectFields,
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
  core.info(`Project fields ${projectFields}`)
  const statusObj = projectFields.find(
    field => field.name.trim().toLowerCase() === 'status'
  )
  const statusId = statusObj.id
  const statusValues = JSON.parse(statusObj.settings)
  core.info(`Status values ${statusValues}`)
  if (!statusValues) {
    throw new Error(`Could not find project statuses`)
  }

  const valueObj = statusValues.options.find(
    value => value.name.trim().toLowerCase() === columnName.trim().toLowerCase()
  )
  if (!valueObj) {
    throw new Error(`Could not find project status ${columnName}`)
  }
  const value = valueObj.id

  const result = await graphqlWithAuth(mutation, {
    fieldId: statusId,
    itemId: issueId,
    projectId,
    value
  })

  const { errors } = result

  if (errors) {
    throw new Error(`Could not update issue status`)
  }

  core.info(`Issue ${issueId} moved to column ${columnName} `)
}

module.exports = {
  updateIssueStatus
}
