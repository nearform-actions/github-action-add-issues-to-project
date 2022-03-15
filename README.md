![CI](https://github.com/nearform/github-action-add-issues-to-project/actions/workflows/ci.yml/badge.svg)

# Add issues to your organization project board
Github action that populates your organization project board with open issues based on their labels.

## Inputs
- `organizations`: comma separated list of Github organizations where to search issues in.
- `issues-labels`: comma separated list of labels of the open issues to be searched.
- `time-interval`:  Time range filter for issues. Uses the ["ms"](https://www.npmjs.com/package/ms) package format.
- `project-number`: The number of the project board where issues will be added.
- `column-name`: The name of the column where issues will be added.

See also [action.yml](action.yml).

# Usage

The action requires a `github-token` that can be generated in two ways: 

## 1) Creating and installing a Github App + using tibdex/github-app-token@v1

Create a GitHub App under your organization with the following permissions:

*Repository Permissions:*
- Issues (Read/Write)

*Organization Permissions*
- Projects (Read/Write)

Copy the `Private key` and `App id` from the application created.

Go to your repository and create the following secrets:
- `PRIVATE_KEY`
- `APP_ID`

Install the application in your organization.

### uses: tibdex/github-app-token@v1

This is a necessary step in the action workflow to generate the token that grants permissions to perform the action.

It takes the `PRIVATE_KEY` and `APP_ID` added to the repository `secrets` as input.  

```yaml
- name: Generate token
        id: generate_token
        uses: tibdex/github-app-token@v1
        with:
          app_id: ${{ secrets.APP_ID }}
          private_key: ${{ secrets.PRIVATE_KEY }}
```

### Example workflow configured with Github App token:

The example below runs the action every day at midnight (`schedule` event). The action fetches open issues labelled `bug` or `good first issue` in the `fastify` and `nearform` organizations updated over the previous `25 hours`. The new issues found are added to the `to do` column of the organization project number `12`.

```yaml
name: Add issues to board

on:
  schedule:
    - cron: '0 0 * * *'

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - name: Generate token
        id: generate_token
        uses: tibdex/github-app-token@v1
        with:
          app_id: ${{ secrets.APP_ID }}
          private_key: ${{ secrets.PRIVATE_KEY }}
      - name: Add issues to board
        uses: nearform/github-action-add-issues-to-project@v1
        with:
          github-token: ${{ steps.generate_token.outputs.token }}
          organizations: 'nearform, fastify'
          issues-labels: 'bug, good first issue'
          time-interval: '25 hours'
          project-number: 12
          column-name: ' to do'

```

## 2) Creating a PAT (personal access token)

You can also configure this action by creating a GitHub [PAT ](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with the following permission:
- repo --> public_repo
- admin:org -> read/write:org

Once the PAT is created save it as a GitHub secret in the repository.

### Example workflow configured with PAT:

In the example below the action is expected to be run manually (`worflow_dispatch`). The required inputs are specified in the `inputs` fields. As a default, the `issues-labels` to be searched are labelled `good first issue`, they have been updated over the past `7 days` and will be added to the project `to do` column.

```yaml
name: Add issues to project
on:
  workflow_dispatch:
    inputs:
      organizations:
        description: 'organizations for issues'
        required: true
      issues-labels: 
        description: 'issues labels'
        default: 'good first issue'
        required: true
      time-interval:
        description: 'time range filter'
        default: '7 days'
        required: true
      project-number:
        description: 'project board number'
        required: true
      column-name: 
        description: 'project board column name'
        default: 'to do'
        required: false

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - name: Add issues to board
        uses: nearform/github-action-add-issues-to-project@v1
        with:
          github-token: ${{ secrets.GH_PAT }}
          organizations: ${{ github.event.inputs.organizations }}
          issues-labels: ${{ github.event.inputs.issues-labels }}
          time-interval: ${{ github.event.inputs.time-interval }}
          project-number: ${{ github.event.inputs.project-number }}
          column-name: ${{ github.event.inputs.column-name }}

```

## :warning: Limitations and caveats :warning:

Due to some differences between Github's project **beta** boards and (legacy) project boards APIs, please be aware of the following limitations if the target project board is a project **beta** board:
- the organization owning the board can only fetch issues from its own repositories, as the project **beta** board does not allow adding issues from different organizations.
- the `column-name` field can be left empty as the issue will be added to whichever column specified in the project **beta** workflow (if defined) or to a 'No status' column.

## Output

For each issue found a new card is added to the project board with a link to the existing issue. In projects **beta** boards, instead, the issues found are directly added to the specified organization project board.
