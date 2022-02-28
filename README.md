# Add Good first issues to your project board
Github script that populates your project board with good first issues from different organizations.

![CI](https://github.com/nearform/github-action-bench-good-first-issues/actions/workflows/ci.yml/badge.svg)

# Settings

You have two ways to configure this action.

## 1) Creating a Github App

Create a GitHub App under your organization with the following permissions:

*Repository Permissions:*
- Issues (Read/Write)

*Organization Permissions*
- Projects (Read)

Copy the `Private key` and `App id` from the application created.

Go to your repository and create the following secrets:
- `GH_APP_PRIVATE_KEY`
- `GH_APP_ID`

Install the application in your organization.

This is necessary to generate the token that grants permissions to perform the actions.

Workflow configured with Github app tokens:
```yaml
name: good-first-issues
on:
  workflow_dispatch:
    inputs:
      organizations:
        description: 'organizations to check'
        required: true
        default: 'fastify'
      time-interval:
        description: 'time range filter'
        required: true
        default: '10 days'
      project-id:
        description: 'project id'
        required: true

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Generate token
        id: generate_token
        uses: tibdex/github-app-token@v1
        with:
          app_id: ${{ secrets.GH_APP_ID }}
          private_key: ${{ secrets.GH_APP_PRIVATE_KEY }}
      - uses: actions/checkout@master
        with:
          token: ${{ steps.generate_token.outputs.token }}
          repository: nearform/github-action-bench-good-first-issues
          ref: master
          path: good-first-issues
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      - uses: actions/github-script@v6
        with:
          github-token: ${{ steps.generate_token.outputs.token }}
          script: |
            const script = require('./good-first-issues/dist/index.js')
            await script({ github, context, token: "${{ steps.generate_token.outputs.token }}", inputs: ${{ toJSON(github.event.inputs) }} })
```

## 2) Creating a PAT (personal access token)
You can also configure this action by creating a GitHub [PAT ](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with the following permissions:
- repo (all)
- admin:org -> read/write:org

Once the PAT is created save it as a GitHub secret named `GH_PROJECTS_PAT` in the repository

Workflow configured with your PAT:  

```yaml
name: good-first-issues
on:
  workflow_dispatch:
    inputs:
      organizations:
        description: 'organizations for issues'
        required: true
        default: 'fastify'
      time-interval:
        description: 'time range filter'
        required: true
        default: '10 days'
      project-id:
        description: 'project id'
        required: true
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@master
        with:
          token: ${{ secrets.GH_PROJECTS_PAT }}
          repository: nearform/github-action-bench-good-first-issues
          ref: master
          path: good-first-issues
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      - uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GH_PROJECTS_PAT }}
          script: |
            const script = require('./good-first-issues/dist/index.js')
            await script({ github, context, token: "${{ secrets.GH_PROJECTS_PAT }}", inputs: ${{ toJSON(github.event.inputs) }} })
```

## Inputs:
- `organizations`: Organizations from which good-first-issues will be fetched. Multiple organizations can be specified by seperating with space.
- `time-interval`:  Time range filter for issues. Uses ["ms"](https://www.npmjs.com/package/ms) package format
- `project-id`: The `id` number of the project board where issues will be added. This can be an organization project or a repository project.

Note: 
- By default, all issues will be added to the `Todo` column.
- Any issue which is already added to the board will be skipped.


## Limitations
The GitHub API currently does not allow operations on a project board which is in a different organization. For this script to work, the project board and the repository from which this script is being invoked should be in the same organization.
