
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { server } = require("../src/app");

test("Task API validates and creates tasks", async (t) => {
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const url = `http://127.0.0.1:${server.address().port}`;

  const invalid = await fetch(`${url}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "   " })
  });

  assert.equal(invalid.status, 400);

  const nullBody = await fetch(`${url}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "null"
  });

  assert.equal(nullBody.status, 400);

  const created = await fetch(`${url}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "  Buy milk  " })
  });

  assert.equal(created.status, 201);

  const task = await created.json();
  
  // Title length: 200 characters should be accepted
  const maxTitle = await fetch(`${url}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "a".repeat(200) })
  });
  assert.equal(maxTitle.status, 201);

  // Title length: 201 characters should be rejected
  const longTitle = await fetch(`${url}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "a".repeat(201) })
  });
  assert.equal(longTitle.status, 400);

  // 200 emoji are 200 Unicode code points
  const emojiTitle = await fetch(`${url}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "😀".repeat(200) })
  });
  assert.equal(emojiTitle.status, 201);

  // Oversized request should return 413
  const oversizedBody = await fetch(`${url}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "x".repeat(100_001) })
  });
  assert.equal(oversizedBody.status, 413);

  // Server should still accept a valid request afterwards
  const afterOversized = await fetch(`${url}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "After oversized request" })
  });
  assert.equal(afterOversized.status, 201);

  assert.equal(task.title, "Buy milk");
  assert.equal(task.completed, false);

  const response = await fetch(`${url}/tasks`);
  assert.equal(response.status, 200);

  const tasks = await response.json();
  assert.ok(tasks.some((item) => item.id === task.id));
  
  // Delete an existing task
  const deleted = await fetch(`${url}/tasks/${task.id}`, {
    method: "DELETE"
  });
  assert.equal(deleted.status, 200);

  // Deleted task should no longer appear in the list
  const afterDelete = await fetch(`${url}/tasks`);
  const remainingTasks = await afterDelete.json();
  assert.ok(!remainingTasks.some((item) => item.id === task.id));

  // Deleting the same task again should return 404
  const deleteAgain = await fetch(`${url}/tasks/${task.id}`, {
    method: "DELETE"
  });
  assert.equal(deleteAgain.status, 404);

  // Invalid task ID should return 400
  const invalidDelete = await fetch(`${url}/tasks/abc`, {
    method: "DELETE"
  });
  assert.equal(invalidDelete.status, 400);

});
