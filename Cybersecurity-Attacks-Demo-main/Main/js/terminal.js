document.addEventListener('DOMContentLoaded', () => {
    const mainTerminalBtn = document.getElementById('main-terminal-btn');
    const hostTerminalsBtn = document.getElementById('host-terminals-btn');
    const mainTerminal = document.getElementById('main-terminal');
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');

    // Show Main Terminal
    mainTerminalBtn.addEventListener('click', () => {
        mainTerminal.classList.remove('hidden');
    });

    // Option 2: Open Host A and B in a new tab
    hostTerminalsBtn.addEventListener('click', () => {
        window.open('attack.html', '_blank');
        mainTerminal.classList.add('hidden');
    });

    // Handle Enter key for executing commands in Main Terminal
    terminalInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const command = terminalInput.value;
            terminalOutput.value += `\n$ ${command}\n`;

            try {
                const response = await fetch('https://demo.sidclab.org/mainHost/execute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ command })
                });

                if (!response.ok) {
                    const errorResponse = await response.json();
                    terminalOutput.value += `Error: ${errorResponse.output || 'Unknown error occurred'}\n`;
                } else {
                    const result = await response.json();
                    terminalOutput.value += `${result.output}\n`;
                }
            } catch (error) {
                terminalOutput.value += `Network Error : ${error.message}\n`;
            }

            terminalInput.value = '';
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }
    });
});