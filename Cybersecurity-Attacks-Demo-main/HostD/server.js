const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const pty = require('node-pty');
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

const sessions = new Map();

function startShell() {
  const shell = pty.spawn("/bin/bash", ["--login"], {
    name: "xterm-256color",
    cols: 80,
    rows: 30,
    cwd: "/home/azureuser/Playground",
    handleFlowControl: true,
    useConpty: false,
    env: process.env,
  });
  return shell;
}

app.get("/health", (req, res) => {
  res.json({ ok: true, host: "HostD", port: 3000 });
});

wss.on("connection", (ws) => {
  const shell = startShell();
  sessions.set(ws, shell);

  // CRITICAL: Send clear command
  setTimeout(() => {
    shell.write('clear\n');
  }, 100);

  // CRITICAL: Send raw data, no stripping
  shell.onData((data) => {
    if (ws.readyState === 1) {
      ws.send(data);
    }
  });

  shell.onExit(({ exitCode, signal }) => {
    ws.close();
  });

  ws.on("message", (msg) => {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.resize && Array.isArray(parsed.resize)) {
        shell.resize(parsed.resize[0], parsed.resize[1]);
        return;
      }
    } catch {
      // Prevent race condition & ensure correct encoding
      if (Buffer.isBuffer(msg)) msg = msg.toString("utf8");
      if (msg) shell.write(msg);
    }
  });

  ws.on("close", () => {
    shell.kill();
    sessions.delete(ws);
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("HostD running on port 3000");
});