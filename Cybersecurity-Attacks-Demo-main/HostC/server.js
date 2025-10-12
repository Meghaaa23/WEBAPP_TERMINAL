// server.js (works for HostC & HostD)
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

// pick a safe working directory that exists
const DEMO_FOLDER_PATH = fs.existsSync('/home/azureuser/Playground')
  ? '/home/azureuser/Playground'
  : '/tmp';

// detect a valid shell
function detectShell() {
  const candidates = ['/usr/bin/bash', '/bin/bash', '/usr/bin/env bash', '/bin/sh'];
  for (const c of candidates) {
    const pathOnly = c.split(' ')[0];
    if (fs.existsSync(pathOnly)) return c;
  }
  return '/bin/sh';
}
const shellPath = detectShell();

// CORS (allow your domain)
app.use(cors({ origin: ['https://demo.sidclab.org'], methods: ['GET','POST','OPTIONS'] }));
app.use(express.json());

// (optional) serve static if you want
app.use(express.static(path.join(__dirname, '../Main')));

// health check
app.get('/health', (req, res) => {
  res.json({ ok: true, cwd: DEMO_FOLDER_PATH, shell: shellPath });
});

// run commands
app.post('/execute', (req, res) => {
  const command = req.body && req.body.command;
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ output: 'No command provided' });
  }

  console.log('[EXEC]', command);
  exec(command, { cwd: DEMO_FOLDER_PATH, shell: shellPath, timeout: 15000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('[ERROR]', error.message);
      return res.status(500).json({ output: stderr || error.message });
    }
    res.json({ output: stdout || '(no output)' });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on ${PORT}`);
  console.log('CWD:', DEMO_FOLDER_PATH, 'Shell:', shellPath);
});
