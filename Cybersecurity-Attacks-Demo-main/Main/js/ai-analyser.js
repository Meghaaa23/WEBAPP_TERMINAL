document.addEventListener("DOMContentLoaded", () => {
  const { Terminal } = window;
  const FitAddon = window.FitAddon;

  function setupTerminal(elementId, wsUrl, hostName) {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      scrollback: 5000,
      rendererType: "canvas",
      fontFamily: 'monospace, "DejaVu Sans Mono", "Courier New"',
      convertEol: true,
      theme: {
        background: "#000000",
        foreground: "#00ff00",
        cursor: "#00ff00"
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

    // Open terminal and fit it immediately
    term.open(container);
    fitAddon.fit();
    setTimeout(() => {
      fitAddon.fit();
    }, 0);
    // Focus management
    term.focus();
    container.setAttribute("tabindex", "0");
    container.style.outline = "none";

    container.addEventListener("click", (e) => {
      e.preventDefault();
      term.focus();
    });

    container.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    setTimeout(() => {
      fitAddon.fit();
       window.addEventListener("resize", () => fitAddon.fit());

      const { cols, rows } = term;
      console.log(`${hostName} ready: ${cols}x${rows}`);

      // Enable helper textarea for input
      const textarea = container.querySelector(".xterm-helper-textarea");
      if (textarea) {
        textarea.removeAttribute("readonly");
        textarea.removeAttribute("disabled");
        textarea.style.pointerEvents = "auto";
        console.log(`${hostName} textarea enabled`);
      }

      term.focus();
    }, 100);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // console.log(`${hostName} connected`);
      setTimeout(() => {
        fitAddon.fit();
        ws.send(JSON.stringify({ resize: [term.cols, term.rows] }));
     }, 50);
      // Reset scrollback and start fresh at top-left
       term.reset();
      // term.writeln(`\x1b[32mConnected to ${hostName}\x1b[0m\r\n`);

    };

    ws.onmessage = (e) => {
      term.write(e.data); // append normally (no forced scroll)
      const viewport = container.querySelector(".xterm-viewport");
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
    };

    ws.onclose = () => {
      term.writeln("\r\n\x1b[31mConnection closed\x1b[0m\r\n");
    };

    ws.onerror = (error) => {
      console.error(`${hostName} error:`, error);
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
 const viewport = container.querySelector('.xterm-viewport');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    });

    // Optional debugging for key events
    container.addEventListener(
      "keydown",
      (e) => {
        console.log(`${hostName} keydown:`, e.key, "code:", e.code);
      },
      true
    );

    // Auto-resize when window size changes
    window.addEventListener("resize", () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        const { cols, rows } = term;
        ws.send(JSON.stringify({ resize: [cols, rows] }));
      }
    });

    // Keep focus when tab regains focus
    window.addEventListener("focus", () => {
      setTimeout(() => term.focus(), 100);
    });
      return { term, ws, fitAddon };
  }

  console.log("Starting AI Analyser terminals...");

  const terminal1 = setupTerminal(
    "terminal1",
    "wss://demo.sidclab.org/hostC/",
    "Host C"
  );
  const terminal2 = setupTerminal(
    "terminal2",
    "wss://demo.sidclab.org/hostD/",
    "Host D"
  );

  window.addEventListener("beforeunload", () => {
    if (terminal1?.ws) terminal1.ws.close();
    if (terminal2?.ws) terminal2.ws.close();
  });
});