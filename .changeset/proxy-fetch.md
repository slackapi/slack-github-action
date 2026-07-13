---
"@slack/slack-github-action": patch
---

feat: route API and webhook requests through `globalThis.fetch`, injecting an [undici](https://github.com/nodejs/undici) `ProxyAgent` when a proxy is configured
