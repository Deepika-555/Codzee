
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

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        
        if (
          typeof data.title !== "string" ||
          data.title.trim().length === 0
        ) {
          res.writeHead(400);
          return res.end(
            JSON.stringify({ error: "Task title is required" })
          );
        }


        const task = {
          id: nextId++,
          title: data.title,
          completed: false
        };

        tasks.push(task);
        res.writeHead(201);
        res.end(JSON.stringify(task));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    });

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
