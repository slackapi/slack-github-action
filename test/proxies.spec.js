import assert from "node:assert";
import http from "node:http";
import { beforeEach, describe, it } from "node:test";
import { errors as undiciErrors } from "undici";
import Config from "../src/config.js";
import SlackError from "../src/errors.js";
import { fetch, proxies } from "../src/proxies.js";
import { mocks } from "./index.spec.js";

describe("proxies", () => {
  beforeEach(() => {
    mocks.reset();
  });

  describe("fetch", () => {
    it("returns a custom fetch function when a proxy is configured", async () => {
      mocks.inputs.set("method", "chat.postMessage");
      mocks.inputs.set("proxy", "https://example.com");
      mocks.inputs.set("token", "xoxb-example");
      const config = new Config(mocks.core);
      const fetchFn = fetch(config);
      assert.strictEqual(typeof fetchFn, "function");
    });

    it("dispatches requests through the proxy with correct request handler", async () => {
      mocks.inputs.set("method", "chat.postMessage");
      mocks.inputs.set("proxy", "http://127.0.0.1:1");
      mocks.inputs.set("token", "xoxb-example");
      mocks.fetch.mock.restore();
      const config = new Config(mocks.core);
      const fetchFn = fetch(config);
      await assert.rejects(
        // ".invalid" is reserved by RFC 2606 to never resolve.
        fetchFn("https://slack-github-action.invalid/api/chat.postMessage", {
          method: "POST",
        }),
        (err) => {
          assert.ok(!(err.cause instanceof undiciErrors.InvalidArgumentError));
          return true;
        },
      );
    });

    /**
     * @see {@link https://github.com/slackapi/slack-github-action/pull/675}
     */
    it("sends form data through the proxy as a multipart body", async () => {
      const received = {};
      const server = http.createServer((req, res) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => {
          received.host = req.headers.host;
          received.type = req.headers["content-type"];
          received.body = Buffer.concat(chunks).toString();
          res.end("{}");
        });
      });
      server.on("connect", (req, socket, head) => {
        received.tunnel = req.url;
        socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
        socket.unshift(head);
        server.emit("connection", socket);
      });
      await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
      mocks.inputs.set("method", "files.uploadV2");
      mocks.inputs.set("proxy", `http://127.0.0.1:${server.address().port}`);
      mocks.inputs.set("token", "xoxb-example");
      mocks.fetch.mock.restore();
      mocks.fs.readFileSync.mock.restore();
      const config = new Config(mocks.core);
      const fetchFn = fetch(config);
      const body = new FormData();
      body.append("file", new Blob(["example"]), "example.txt");
      try {
        await fetchFn("http://slack-github-action.invalid/upload", {
          method: "POST",
          body,
        });
      } finally {
        server.closeAllConnections();
        server.close();
      }
      assert.strictEqual(received.host, "slack-github-action.invalid");
      assert.match(received.type, /^multipart\/form-data; boundary=/);
      assert.match(received.body, /filename="example.txt"[\s\S]*example/);
    });

    it("returns undefined when no proxy is configured", async () => {
      mocks.inputs.set("method", "chat.postMessage");
      mocks.inputs.set("token", "xoxb-example");
      const config = new Config(mocks.core);
      const fetchFn = fetch(config);
      assert.strictEqual(fetchFn, undefined);
    });

    it("fails to configure a fetch with an invalid proxied url", async () => {
      mocks.inputs.set("method", "chat.postMessage");
      mocks.inputs.set("proxy", "not-a-url");
      mocks.inputs.set("token", "xoxb-example");
      try {
        const config = new Config(mocks.core);
        fetch(config);
        assert.fail("An invalid proxy URL was not thrown as error!");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes("Failed to configure the HTTPS proxy"),
          );
        } else {
          assert.fail(err);
        }
      }
    });
  });

  describe("dispatcher", () => {
    it("returns no dispatcher when a proxy is not configured", async () => {
      mocks.inputs.set("webhook", "https://hooks.slack.com");
      mocks.inputs.set("webhook-type", "incoming-webhook");
      const config = new Config(mocks.core);
      const dispatcher = proxies(config, config.inputs.webhook);
      assert.strictEqual(dispatcher, undefined);
    });

    it("skips proxying a non-https destination altogether", async () => {
      mocks.inputs.set("webhook", "http://hooks.slack.com");
      mocks.inputs.set("webhook-type", "incoming-webhook");
      mocks.inputs.set("proxy", "https://example.com");
      const config = new Config(mocks.core);
      const dispatcher = proxies(config, config.inputs.webhook);
      assert.strictEqual(dispatcher, undefined);
    });

    it("returns a proxy dispatcher for the provided https proxy", async () => {
      mocks.inputs.set("webhook", "https://hooks.slack.com");
      mocks.inputs.set("webhook-type", "incoming-webhook");
      mocks.inputs.set("proxy", "https://example.com");
      const config = new Config(mocks.core);
      const dispatcher = proxies(config, config.inputs.webhook);
      assert.ok(dispatcher);
    });

    it("returns a proxy dispatcher for http proxies", async () => {
      mocks.inputs.set("webhook", "https://hooks.slack.com");
      mocks.inputs.set("webhook-type", "incoming-webhook");
      mocks.inputs.set("proxy", "http://example.com");
      const config = new Config(mocks.core);
      const dispatcher = proxies(config, config.inputs.webhook);
      assert.ok(dispatcher);
    });

    it("fails to configure a dispatcher with an invalid proxied url", async () => {
      mocks.inputs.set("webhook", "https://hooks.slack.com");
      mocks.inputs.set("webhook-type", "incoming-webhook");
      mocks.inputs.set("proxy", "https://");
      try {
        const config = new Config(mocks.core);
        proxies(config, config.inputs.webhook);
        assert.fail("An invalid proxy URL was not thrown as error!");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(
            err.message.includes("Failed to configure the HTTPS proxy"),
          );
        } else {
          assert.fail(err);
        }
      }
    });

    it("fails to configure a dispatcher with an unknown url protocol", async () => {
      mocks.inputs.set("webhook", "https://hooks.slack.com");
      mocks.inputs.set("webhook-type", "incoming-webhook");
      mocks.inputs.set("proxy", "ssh://example.com");
      try {
        const config = new Config(mocks.core);
        proxies(config, config.inputs.webhook);
        assert.fail("An unknown URL protocol was not thrown as error!");
      } catch (err) {
        if (err instanceof SlackError) {
          assert.ok(err.message.includes("Unsupported URL protocol"));
        } else {
          assert.fail(err);
        }
      }
    });
  });
});
