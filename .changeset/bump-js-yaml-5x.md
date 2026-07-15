---
"@slack/slack-github-action": major
---

build: parse yaml with more strict multiline indentation rules

Internal dependencies of [`js-yaml@v5`](https://github.com/nodeca/js-yaml/blob/master/CHANGELOG.md#500---2026-06-20) make YAML parsing more strict and compliant with the YAML specification. Indentation is now required for values that span multiple lines against the base value.

See the YAML [line prefixes](https://yaml.org/spec/1.2.2/#63-line-prefixes) spec for the expected indentation rule:

```diff
  channel: "C0123"
  text: "first line

- second line"
+   second line"
```
