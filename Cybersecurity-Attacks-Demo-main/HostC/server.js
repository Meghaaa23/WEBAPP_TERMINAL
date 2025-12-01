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
  res.json({ ok: true, host: "HostC", port: 3000 }); // Change to HostD for HostD server
});

wss.on("connection", (ws) => {
  const shell = startShell();
  sessions.set(ws, shell);

  let isInitializing = true;
  let buffer = '';

  shell.onData((data) => {
    if (ws.readyState === 1) {
      if (isInitializing) {
        buffer += data;
        
        // Check if we've received the prompt
        if (buffer.includes('Playground$')) {
          isInitializing = false;
          
          // Filter out W's and send the initialization
          const filtered = buffer.replace(/W{5,}/g, '');
          ws.send(filtered);
          buffer = '';
        }
      } else {
        // Normal operation - send all data immediately
        ws.send(data);
      }
    }
  });

  // Safety timeout: after 2 seconds, stop filtering
  setTimeout(() => {
    if (isInitializing) {
      isInitializing = false;
      if (buffer) {
        const filtered = buffer.replace(/W{5,}/g, '');
        ws.send(filtered);
        buffer = '';
      }
    }
  }, 2000);

  shell.onExit(({ exitCode, signal }) => {
    ws.close();
  });

  ws.on("message", (msg) => {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.resize && Array.isArray(parsed.resize)) {
        const [cols, rows] = parsed.resize;
        if (cols > 0 && rows > 0) {
          shell.resize(cols, rows);
        }
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
    shell.kill();
    sessions.delete(ws);
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("HostC running on port 3000"); // Change to HostD for HostD server
});