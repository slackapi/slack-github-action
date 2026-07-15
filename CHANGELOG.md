# slack-github-action

## 4.0.0

### Major Changes

- b1974f0: build: parse yaml with more strict multiline indentation rules

  Internal dependencies of [`js-yaml@v5`](https://github.com/nodeca/js-yaml/blob/master/CHANGELOG.md#500---2026-06-20) make YAML parsing more strict and compliant with the YAML specification. Indentation is now required for values that span multiple lines against the base value.

  See the YAML [line prefixes](https://yaml.org/spec/1.2.2/#63-line-prefixes) spec for the expected indentation rule:

  ```diff
    channel: "C0123"
    text: "first line

  - second line"
  +   second line"
  ```

### Patch Changes

- 654bb72: chore: provide global fetch proxied configurations with updates to web api and webhook packages

## 3.0.5

### Patch Changes

- 96fddbe: fix: revert multiline yaml parsing indentation change

## 3.0.4

### Patch Changes

- fa03fe4: refactor: send webhooks with the [`@slack/webhook`](https://docs.slack.dev/tools/node-slack-sdk/webhook) package

## 3.0.3

### Patch Changes

- 66834e4: feat: add instrumentation to address error rates

## 3.0.2

### Patch Changes

- 79529d7: fix: resolve url.parse deprecation warning for webhook techniques
