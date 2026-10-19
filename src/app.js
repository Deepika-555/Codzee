
const http = require("node:http");

const tasks = [];
let nextId = 1;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.method === "GET" && req.url === "/tasks") {
    res.writeHead(200);
    return res.end(JSON.stringify(tasks));
  }


  if (req.method === "POST" && req.url === "/tasks") {
    let body = "";
    let bodySize = 0;
    let tooLarge = false;
    const MAX_BODY_SIZE = 100_000;
    const MAX_TITLE_LENGTH = 200;

    req.setEncoding("utf8");

    req.on("data", (chunk) => {
      if (tooLarge) return;

      bodySize += Buffer.byteLength(chunk, "utf8");

      if (bodySize > MAX_BODY_SIZE) {
        tooLarge = true;
        body = "";
        res.writeHead(413);
        res.end(JSON.stringify({ error: "Request body too large" }));
        return;
      }

      body += chunk;
    });

    req.on("end", () => {
      if (tooLarge) return;

      let data;

      try {
        data = JSON.parse(body);
      } catch {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: "Invalid JSON" }));
      }

      if (
        typeof data?.title !== "string" ||
        data.title.trim().length === 0
      ) {
        res.writeHead(400);
        return res.end(
          JSON.stringify({ error: "Task title is required" })
        );
      }

      const title = data.title.trim();

      if ([...title].length > MAX_TITLE_LENGTH) {
        res.writeHead(400);
        return res.end(
          JSON.stringify({ error: "Task title must be 200 characters or fewer" })
        );
      }

      const task = {
        id: nextId++,
        title,
        completed: false
      };

      tasks.push(task);
      res.writeHead(201);
      res.end(JSON.stringify(task));
    });

    return;
  }

if (req.method === "DELETE" && req.url.startsWith("/tasks/")) {
  const idPart = req.url.slice("/tasks/".length);

  // Accept only positive integer task IDs
  if (!/^[1-9]\d*$/.test(idPart)) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid task ID" }));
    return;
  }

  const id = Number(idPart);
  const index = tasks.findIndex((task) => task.id === id);

  if (index === -1) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Task not found" }));
    return;
  }

  tasks.splice(index, 1);

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Task deleted successfully" }));
  return;
}


  res.writeHead(404);
  res.end(JSON.stringify({ error: "Route not found" }));
});

if (require.main === module) {
  server.listen(3000, () => {
    console.log("Task API running on port 3000");
  });
}

module.exports = { server, tasks };
