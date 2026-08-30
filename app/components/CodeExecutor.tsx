"use client";

import { useState, useRef, useCallback } from "react";

interface CodeExecutorProps {
  code: string;
  language: string;
}

export default function CodeExecutor({ code, language }: CodeExecutorProps) {
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const runCode = useCallback(() => {
    if (language !== "javascript" && language !== "js") return;

    setIsRunning(true);
    setOutput([]);
    setShowOutput(true);

    // Create sandboxed iframe for execution
    const iframe = document.createElement("iframe");
    iframe.sandbox.add("allow-scripts");
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    iframeRef.current = iframe;

    const logs: string[] = [];

    // Inject console capture script
    const script = `
      <script>
        const __logs = [];
        const __origConsole = {
          log: console.log.bind(console),
          error: console.error.bind(console),
          warn: console.warn.bind(console),
          info: console.info.bind(console),
        };
        
        function __capture(...args) {
          const msg = args.map(a => {
            if (a === null) return 'null';
            if (a === undefined) return 'undefined';
            if (typeof a === 'object') {
              try { return JSON.stringify(a, null, 2); } catch { return String(a); }
            }
            return String(a);
          }).join(' ');
          __logs.push(msg);
          window.parent.postMessage({ type: 'code-output', log: msg }, '*');
        }
        
        console.log = (...args) => { __capture(...args); __origConsole.log(...args); };
        console.error = (...args) => { __capture('❌ ' + args.join(' ')); __origConsole.error(...args); };
        console.warn = (...args) => { __capture('⚠️ ' + args.join(' ')); __origConsole.warn(...args); };
        console.info = (...args) => { __capture('ℹ️ ' + args.join(' ')); __origConsole.info(...args); };
        
        window.onerror = (msg) => {
          window.parent.postMessage({ type: 'code-output', log: '❌ Error: ' + msg }, '*');
        };
        
        window.onunhandledrejection = (e) => {
          window.parent.postMessage({ type: 'code-output', log: '❌ Unhandled: ' + (e.reason?.message || e.reason || 'Unknown') }, '*');
        };
      <\/script>
    `;

    iframe.srcdoc = `<html><head>${script}</head><body><script>${code}<\/script></body></html>`;

    // Listen for output messages
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "code-output") {
        setOutput((prev) => [...prev, e.data.log]);
      }
    };
    window.addEventListener("message", handler);

    // Cleanup after 10 seconds
    setTimeout(() => {
      window.removeEventListener("message", handler);
      if (iframeRef.current) {
        document.body.removeChild(iframeRef.current);
        iframeRef.current = null;
      }
      setIsRunning(false);
    }, 10000);
  }, [code, language]);

  if (language !== "javascript" && language !== "js") return null;

  return (
    <div className="mt-2">
      {!showOutput ? (
        <button
          onClick={runCode}
          disabled={isRunning}
          className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors"
        >
          {isRunning ? (
            <>
              <span className="animate-spin">⏳</span> Running...
            </>
          ) : (
            <>▶️ Run</>
          )}
        </button>
      ) : (
        <div className="mt-2 rounded-lg bg-black/50 border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1 bg-white/5 border-b border-white/10">
            <span className="text-xs text-muted">Output</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setOutput([]);
                  runCode();
                }}
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                🔄 Rerun
              </button>
              <button
                onClick={() => {
                  setShowOutput(false);
                  setOutput([]);
                  if (iframeRef.current) {
                    document.body.removeChild(iframeRef.current);
                    iframeRef.current = null;
                  }
                }}
                className="text-xs text-muted hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="p-3 max-h-64 overflow-y-auto font-mono text-sm">
            {output.length === 0 ? (
              <span className="text-muted text-xs">
                {isRunning ? "Running..." : "No output"}
              </span>
            ) : (
              output.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap text-foreground/90">
                  {line}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
