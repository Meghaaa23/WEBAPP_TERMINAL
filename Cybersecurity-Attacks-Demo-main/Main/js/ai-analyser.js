document.addEventListener('DOMContentLoaded', () => {
  const hostCInput  = document.getElementById('host-c-input');
  const hostCOutput = document.getElementById('host-c-output');
  const hostDInput  = document.getElementById('host-d-input');
  const hostDOutput = document.getElementById('host-d-output');

  // generic runner
  async function runCommand(inputEl, outputEl, url) {
    const command = inputEl.value.trim();
    if (!command) return;

    outputEl.value += `\n$ ${command}\n`;
    inputEl.value = '';
    outputEl.scrollTop = outputEl.scrollHeight;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });

      if (!response.ok) {
        let errTxt;
        try { errTxt = (await response.json()).output; } catch { errTxt = await response.text(); }
        outputEl.value += `Error: ${errTxt || 'Unknown error'}\n`;
      } else {
        const data = await response.json();
        outputEl.value += (data.output || '[No output]') + '\n';
      }
    } catch (err) {
      outputEl.value += `Network Error: ${err.message}\n`;
    }

    outputEl.scrollTop = outputEl.scrollHeight;
  }

  // Host C listener
  hostCInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();                         
      runCommand(hostCInput, hostCOutput, 'https://demo.sidclab.org/hostC/execute');
    }
  });

  // Host D listener
  hostDInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(hostDInput, hostDOutput, 'https://demo.sidclab.org/hostD/execute');
    }
  });
});
