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
  const statusObj = projectFields.find(field => field.name === 'Status')
  const projectStatuses = JSON.parse(statusObj.settings)

  if (!projectStatuses) {
    throw new Error(`Could not find project statuses`)
  }

  const status = projectStatuses.options.find(
    status => status.name.trim().toLowerCase() === columnName.trim().toLowerCase
  )

  core.info(`Project status ${JSON.stringify(status)}`)

  if (!status) {
    throw new Error(`Could not find project status ${columnName}`)
  }

  const statusId = status.id

  const result = await graphqlWithAuth(mutation, {
    fieldId: statusId,
    itemId: issueId,
    projectId,
    value: columnName
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
