
document.addEventListener('DOMContentLoaded', () => {
    const hostAInput = document.getElementById('host-a-input');
    const hostAOutput = document.getElementById('host-a-output');
    const hostBInput = document.getElementById('host-b-input');
    const hostBOutput = document.getElementById('host-b-output');

    // Handle Enter key for executing commands in Host A Terminal
    hostAInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const command = hostAInput.value;
            hostAOutput.value += `\n$ ${command}\n`;

            try {
                const response = await fetch('https://demo.sidclab.org/hostA/execute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ command })
                });

                if (!response.ok) {
                    const errorResponse = await response.json();
                    hostAOutput.value += `Error: ${errorResponse.output || 'Unknown error occurred'}\n`;
                } else {
                    const result = await response.json();
                    hostAOutput.value += `${result.output}\n`;
                }
            } catch (error) {
                hostAOutput.value += `Network Error : ${error.message} ${error}\n`;
            }

            hostAInput.value = '';
            hostAOutput.scrollTop = hostAOutput.scrollHeight;
        }
    });

    // Handle Enter key for executing commands in Host B Terminal
    hostBInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            const command = hostBInput.value;
            hostBOutput.value += `\n$ ${command}\n`;

            try {
                const response = await fetch('https://demo.sidclab.org/hostB/execute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ command })
                });

                if (!response.ok) {
                    const errorResponse = await response.json();
                    hostBOutput.value += `Error: ${errorResponse.output || 'Unknown error occurred'}\n`;
                } else {
                    const result = await response.json();
                    hostBOutput.value += `${result.output}\n`;
                }
            } catch (error) {
                hostBOutput.value += `Network Error: ${error.message}\n`;
            }

            hostBInput.value = '';
            hostBOutput.scrollTop = hostBOutput.scrollHeight;
        }
    });
});
