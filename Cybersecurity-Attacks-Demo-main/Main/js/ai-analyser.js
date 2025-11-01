document.addEventListener("DOMContentLoaded", () => {
  const { Terminal } = window;
  const FitAddon = window.FitAddon;

  function setupTerminal(elementId, wsUrl, hostName) {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      scrollback: 1000,
      rendererType: 'canvas',
      fontFamily: 'monospace, "DejaVu Sans Mono", "Courier New"',
      convertEol: true,
      theme: {
        background: '#000000',
        foreground: '#00ff00',
        cursor: '#00ff00'
      },
      allowProposedApi: true
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    const container = document.getElementById(elementId);
    if (!container) {
      console.error(`Container ${elementId} not found!`);
      return null;
    }
    
    term.open(container);
    
    // Force focus immediately
    term.focus();
    
    // Ensure container can receive focus
    container.setAttribute('tabindex', '0');
    container.style.outline = 'none';
    
    // Click handler to maintain focus
    container.addEventListener('click', (e) => {
      e.preventDefault();
      term.focus();
    });
    
    // Prevent any parent elements from stealing focus
    container.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    
    let viewport = null;
    setTimeout(() => {
      viewport = container.querySelector('.xterm-viewport');
      if (viewport) {
        console.log(`${hostName} viewport found`);
      }
      
      fitAddon.fit();
      const { cols, rows } = term;
      console.log(`${hostName} ready: ${cols}x${rows}`);
      
      // Ensure helper textarea is enabled
      const textarea = container.querySelector('.xterm-helper-textarea');
      if (textarea) {
        textarea.removeAttribute('readonly');
        textarea.removeAttribute('disabled');
        textarea.style.pointerEvents = 'auto';
        console.log(`${hostName} textarea enabled`);
      }
      
      // Force focus again after setup
      term.focus();
    }, 100);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`${hostName} connected`);
      
      setTimeout(() => {
        const { cols, rows } = term;
        console.log(`${hostName} sending terminal size: ${cols}x${rows}`);
        ws.send(JSON.stringify({ resize: [cols, rows] }));
        
        // Focus after connection established
        term.focus();
      }, 200);
    };

    ws.onmessage = (e) => {
      term.write(e.data);

      requestAnimationFrame(() => {
        term.scrollToBottom();
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      });
    };

    ws.onclose = () => {
      term.writeln("\r\n\x1b[31mConnection closed\x1b[0m\r\n");
    };

    ws.onerror = (error) => {
      console.error(`${hostName} error:`, error);
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log(`${hostName} keystroke:`, data, 'codes:', Array.from(data).map(c => c.charCodeAt(0)));
        ws.send(data);
      }
    });

    // Additional keyboard event listener as fallback
    container.addEventListener('keydown', (e) => {
      // Log all keydown events
      console.log(`${hostName} keydown:`, e.key, 'code:', e.code, 'keyCode:', e.keyCode);
      
      // If it's a number key and terminal didn't catch it, send manually
      if (e.key >= '0' && e.key <= '9' && ws.readyState === WebSocket.OPEN) {
        console.log(`${hostName} manual number send:`, e.key);
        // Note: Only use this as last resort - xterm should handle this
      }
    }, true); // Use capture phase

    window.addEventListener("resize", () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        const { cols, rows } = term;
        ws.send(JSON.stringify({ resize: [cols, rows] }));
      }
    });

    // Keep terminal focused when page regains focus
    window.addEventListener('focus', () => {
      setTimeout(() => term.focus(), 100);
    });

    return { term, ws, fitAddon };
  }

  console.log('Starting AI Analyser terminals...');
  
  const terminal1 = setupTerminal("terminal1", "wss://demo.sidclab.org/hostC/", "Host C");
  const terminal2 = setupTerminal("terminal2", "wss://demo.sidclab.org/hostD/", "Host D");

  window.addEventListener('beforeunload', () => {
    if (terminal1?.ws) terminal1.ws.close();
    if (terminal2?.ws) terminal2.ws.close();
  });
});