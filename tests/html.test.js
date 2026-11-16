import test from "node:test";
import assert from "node:assert/strict";
import { escapeHTML } from "../src/core/html.js";

test("escapes HTML markup and attribute delimiters", () => {
  assert.equal(
    escapeHTML('<script>alert("x")</script> & \'quoted\''),
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;quoted&#39;"
  );
});

test("converts values to strings and safely handles null-like values", () => {
  assert.equal(escapeHTML(42), "42");
  assert.equal(escapeHTML(null), "null");
  assert.equal(escapeHTML(undefined), "");
});
