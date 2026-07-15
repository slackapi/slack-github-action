---
"@slack/slack-github-action": major
---

build(deps): bump js-yaml from 4.2.0 to 5.2.1

The stricter, spec-compliant parser rejects continuation lines within a quoted
scalar that are not indented to the node level. Multiline payloads that relied
on the prior leniency must indent continuation lines or use a block scalar. See
the YAML [line prefixes](https://yaml.org/spec/1.2.2/#63-line-prefixes) spec for
the `s-flow-line-prefix(n)` indentation rule.
