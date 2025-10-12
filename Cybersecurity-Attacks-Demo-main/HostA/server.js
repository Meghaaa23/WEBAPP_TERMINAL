const express = require('express');
const { exec, spawn } = require('child_process');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const DEMO_FOLDER_PATH = path.join(__dirname, 'demo'); // Path to your 'demo' folder

// Middleware to parse JSON and enable CORS
app.use(cors());
app.use(express.json());

// Serve static files (your HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Route to handle main terminal session and execute commands inside the demo folder
app.post('/execute', (req, res) => {
    const command = req.body.command;

    // Set options to execute the command in the demo directory
    const options = {
        cwd: DEMO_FOLDER_PATH, // Change the working directory to demo
        shell: true // Use the shell to execute the command
    };

    // Execute the command in the demo directory
    exec(command, options, (error, stdout, stderr) => {
        if (error) {
            // Send both stdout and stderr as output in case of error
            return res.status(400).json({ output: stderr || error.message });
	}

        res.json({ output: stdout });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});