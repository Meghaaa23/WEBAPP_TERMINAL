const express = require('express');
const { exec } = require('child_process');
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

    // Log the command for debugging
    console.log('Command received:', command);

    // Set options to execute the command in the demo directory
    const options = {
        cwd: DEMO_FOLDER_PATH, // Change the working directory to demo
        shell: true // Use the shell to execute the command
    };

    // Execute the command in the demo directory
    exec(command, options, (error, stdout, stderr) => {
        if (error) {
            // Log error and send response
            console.error('Execution error:', error);
	    console.log('eror:');
            console.error('Stderr:', stderr);
            return res.status(400).json({ output: stderr || error.message });
        }

        // Log the output
        console.log('Output:', stdout);

        // Wait for 10 seconds before sending the response
        setTimeout(() => {
            res.json({ output: stdout });
        }, 10000); // 10 seconds delay
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});