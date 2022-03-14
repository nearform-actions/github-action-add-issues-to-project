![CI](https://github.com/nearform/github-action-add-issues-to-project/actions/workflows/ci.yml/badge.svg)

# Add issues to your organization project board
Github action that populates your organization project board with issues based on their labels.

## Inputs
- `organizations`: comma separated organizations where to search issues in.

    :warning: If the target project board is a project **beta** board, this can only be the organization that owns the board. 
- `issues-labels`: comma separated labels of the issues to be found. By default **good first issue** labelled issues are found. 
- `time-interval`:  Time range filter for issues. Uses the ["ms"](https://www.npmjs.com/package/ms) package format.
- `project-number`: The number of the project board where issues will be added.
- `column-name`: The name of the column where issues will be added. Any issue which is already added to the board will be skipped.

  :warning: If the target project board is a project **beta** board, this field can be left empty as the issue will be added to whichever column specified in the project board workflow (if defined) or to a 'No status' column.

  
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
        required: false
        default: 'good first issues'
      time-interval:
        description: 'time range filter'
        required: true
      project-number:
        description: 'project board number'
        required: true
      column-name: 
        description: 'project board column name'
        required: false
        default: 'to do'

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
      - name: Checkout Code
        uses: actions/checkout@v3
      - name: Add issues to board
        uses: nearform/github-action-add-issues-to-project@v1
        with:
          github-token: ${{ steps.generate_token.outputs.token }}
          organizations: ${{ github.event.inputs.organizations }}
          issues-labels: ${{ github.event.inputs.issues-labels }}
          time-interval: ${{ github.event.inputs.time-interval }}
          project-number: ${{ github.event.inputs.project-number }}
          column-name: ${{ github.event.inputs.column-name }}

```

## 2) Creating a PAT (personal access token)

You can also configure this action by creating a GitHub [PAT ](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) with the following permission:
- repo --> public_repo
- admin:org -> read/write:org

Once the PAT is created save it as a GitHub secret in the repository.

### Example workflow configured with PAT:

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
        required: false
        default: 'good first issues'
      time-interval:
        description: 'time range filter'
        required: true
      project-number:
        description: 'project board number'
        required: true
      column-name: 
        description: 'project board column name'
        required: false
        default: 'to do'

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3
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

## Output

For each issue found a new card is added to the project board with a link to the existing issue. In projects **beta** boards, instead, the issues found are directly added to the specified organization project board.
