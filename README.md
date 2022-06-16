# Luos SDK-Web

## Contribute

### Workflow

You can use [ACT](https://github.com/nektos/act#installation-through-package-managers) to validate the workflows locally:

1. Install ACT (See link for other systems):

```sh
brew install act
```

2. Setup secrets variables in the `.act/.secrets` file:

```yml
NPM_TOKEN=
GITHUB_TOKEN=
```

3. Run the workflow locally:

```sh
act --container-architecture=linux/amd64 --secret-file ./.act/.secrets -P ubuntu-latest=node:16 push -v
```
