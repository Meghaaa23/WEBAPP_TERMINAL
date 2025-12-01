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

  let isInitializing = true;
  let buffer = '';
  let initTimer = null;

  // Safety timeout - stop filtering after 2 seconds regardless
  initTimer = setTimeout(() => {
    if (isInitializing) {
      isInitializing = false;
      shell.write('clear\r');
    }
  }, 2000);

  shell.onData((data) => {
    if (ws.readyState === 1) {
      if (isInitializing) {
        buffer += data;
        
        // Check if we've received the full prompt
        if (buffer.includes('Playground$') || buffer.includes('$ ')) {
          clearTimeout(initTimer);
          isInitializing = false;
          
          // Clear the shell to start fresh
          shell.write('clear\r');
          buffer = '';
        }
        // Don't send initialization output to client
      } else {
        // Normal operation - send everything
        ws.send(data);
      }
    }
  });

  shell.onExit(({ exitCode, signal }) => {
    clearTimeout(initTimer);
    ws.close();
  });

  ws.on("message", (msg) => {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.resize && Array.isArray(parsed.resize)) {
        const [cols, rows] = parsed.resize;
        shell.resize(cols, rows);
        return;
      }
    } catch {
      // Not JSON, treat as input
    }
    
    // Send input to shell
    if (Buffer.isBuffer(msg)) {
      shell.write(msg.toString("utf8"));
    } else {
      shell.write(msg);
    }
  });

  ws.on("close", () => {
    clearTimeout(initTimer);
    shell.kill();
    sessions.delete(ws);
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("HostD running on port 3000");
});