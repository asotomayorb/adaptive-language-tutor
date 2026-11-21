import test from "node:test";
import assert from "node:assert/strict";
import { italian } from "../src/content/it.js";

const catalogs = [italian];

test("each language catalog has unique exercise IDs", () => {
  for (const catalog of catalogs) {
    const ids = catalog.exercises.map(item => item.id);
    assert.equal(new Set(ids).size, ids.length, catalog.id);
  }
});

test("every exercise has the fields required by the learning interface", () => {
  for (const catalog of catalogs) {
    for (const item of catalog.exercises) {
      for (const field of ["id", "level", "topic", "skill", "prompt", "target", "term", "meaning", "options", "hint", "explanation"]) {
        assert.ok(item[field] !== undefined && item[field] !== "", catalog.id + " / " + item.id + " missing " + field);
      }
      assert.ok(["A1", "A2"].includes(item.level), item.id);
      assert.ok(["daily", "travel", "food", "work"].includes(item.topic), item.id);
      assert.ok(Array.isArray(item.options) && item.options.length >= 3, item.id);
      assert.ok(item.options.includes(item.target), item.id + " target must be selectable");
    }
  }
});

test("each catalog covers all four practice topics and both initial levels", () => {
  for (const catalog of catalogs) {
    for (const topic of ["daily", "travel", "food", "work"]) {
      assert.ok(catalog.exercises.some(item => item.topic === topic), catalog.id + " missing topic " + topic);
    }
    assert.ok(catalog.exercises.some(item => item.level === "A1"), catalog.id + " missing A1");
    assert.ok(catalog.exercises.some(item => item.level === "A2"), catalog.id + " missing A2");
  }
});

test("diagnostic has enough questions for its four-question flow", () => {
  for (const catalog of catalogs) {
    assert.ok(catalog.exercises.filter(item => item.level === "A1").length >= 3);
    assert.ok(catalog.exercises.filter(item => item.level === "A2").length >= 1);
  }
});
