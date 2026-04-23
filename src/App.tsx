import { useState, useRef, useEffect } from "react";
import "./App.css";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";

function App() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [stream, setStream] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stream]);

  const connect = () => {
    if (ws) {
      ws.close();
    }

    const token = prompt("Paste your JWT token to connect:");
    if (!token) return;

    setStatus("connecting");

    const socket = new WebSocket(
      `${import.meta.env.VITE_WS_URL}/api/v1/ws/chat?token=${token}`
    );

    socket.onopen = () => {
      setStatus("connected");
    };

    socket.onclose = () => {
      setStatus("disconnected");
    };

    socket.onerror = () => {
      setStatus("error");
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case "delta":
          setIsStreaming(true);
          setStream((prev) => prev + msg.word);
          break;

        case "done":
          setIsStreaming(false);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: msg.final_response,
              timestamp: new Date(),
            },
          ]);
          setStream("");
          setTimeout(() => inputRef.current?.focus(), 50);
          break;

        case "error":
          setIsStreaming(false);
          console.error("WebSocket error message:", msg);
          break;
      }
    };

    setWs(socket);
  };

  const disconnect = () => {
    ws?.close();
    setWs(null);
    setStatus("disconnected");
    setMessages([]);
    setStream("");
  };

  const send = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!input.trim() || isStreaming) return;

    const message = input.trim();
    setInput("");

    setMessages((prev) => [
      ...prev,
      { role: "user", content: message, timestamp: new Date() },
    ]);

    ws.send(
      JSON.stringify({
        message,
        intent: "support",
      })
    );
  };

  const connected = status === "connected";

  const statusConfig = {
    disconnected: { dot: "dot--off", label: "Disconnected" },
    connecting: { dot: "dot--connecting", label: "Connecting…" },
    connected: { dot: "dot--on", label: "Connected" },
    error: { dot: "dot--error", label: "Connection Error" },
  };

  const { dot, label } = statusConfig[status];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__left">
          <div className="logo">
            <span className="logo__mark" />
            <span className="logo__text">Streaming Agentic AI Platform</span>
          </div>
          <nav className="nav">
            <a href="/" className="nav__link nav__link--active">Chat</a>
            <a href="/monitoring" className="nav__link">Monitoring</a>
          </nav>
        </div>
        <div className="header__right">
          <div className={`status-badge ${connected ? "status-badge--connected" : ""}`}>
            <span className={`dot ${dot}`} />
            {label}
          </div>
          {connected ? (
            <button className="btn btn--ghost btn--sm" onClick={disconnect}>
              Disconnect
            </button>
          ) : (
            <button
              className="btn btn--primary btn--sm"
              onClick={connect}
              disabled={status === "connecting"}
            >
              {status === "connecting" ? "Connecting…" : "Connect"}
            </button>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <main className="chat">
        {messages.length === 0 && !isStreaming ? (
          <div className="empty-state">
            <div className="empty-state__icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="4" y="8" width="40" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16 44h16M24 36v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M14 20h6M14 26h12M26 20h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="empty-state__title">Chat</h2>
            <p className="empty-state__sub">
              {connected
                ? "Ready. Send a message to start a conversation."
                : "Connect with your JWT token to begin."}
            </p>
            {!connected && (
              <button className="btn btn--primary" onClick={connect}>
                Connect to Agent
              </button>
            )}
          </div>
        ) : (
          <div className="messages">
            {messages.map((m, i) => (
              <div key={i} className={`message message--${m.role}`}>
                <div className="message__avatar">
                  {m.role === "user" ? "U" : "AI"}
                </div>
                <div className="message__body">
                  <div className="message__content">{m.content}</div>
                  <div className="message__time">
                    {m.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isStreaming && (
              <div className="message message--assistant message--streaming">
                <div className="message__avatar">AI</div>
                <div className="message__body">
                  <div className="message__content">
                    {stream}
                    <span className="cursor" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Bar */}
      <footer className="input-bar">
        <div className="input-bar__inner">
          <input
            ref={inputRef}
            className="input-bar__field"
            value={input}
            disabled={!connected || isStreaming}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={
              !connected
                ? "Connect to start chatting…"
                : isStreaming
                ? "Waiting for response…"
                : "Send a message"
            }
            autoComplete="off"
          />
          <button
            className="btn btn--send"
            onClick={send}
            disabled={!connected || isStreaming || !input.trim()}
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M16 9L2 2l3 7-3 7 14-7z" fill="currentColor" />
            </svg>
          </button>
        </div>
        {isStreaming && (
          <div className="input-bar__hint">
            <span className="dot dot--connecting" />
            Agent is responding…
          </div>
        )}
      </footer>
    </div>
  );
}

export default App;
