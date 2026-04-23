import { useEffect, useState, useCallback } from "react";
import "./MonitoringPage.css";

/* ── Types ── */
type CBValue = { state?: string; open?: boolean } | string | number | boolean;

type Health = {
  status: string;
  environment: string;
  kafka?: {
    enabled: boolean;
    producer: string;
  };
  websocket?: {
    active_connections: number;
    active_accounts: number;
  };
  circuit_breakers?: Record<string, CBValue>;
};

/* ── Helpers ── */
function formatCB(cb: CBValue): { label: string; state: "open" | "closed" | "unknown" } {
  if (!cb) return { label: "Unknown", state: "unknown" };
  if (typeof cb === "object" && !Array.isArray(cb)) {
    if ("state" in cb && typeof cb.state === "string") {
      const s = cb.state.toUpperCase();
      return { label: s, state: s === "OPEN" ? "open" : "closed" };
    }
    if ("open" in cb) {
      return cb.open
        ? { label: "OPEN", state: "open" }
        : { label: "CLOSED", state: "closed" };
    }
  }
  return { label: JSON.stringify(cb), state: "unknown" };
}

function statusColor(s: string | undefined): "green" | "amber" | "red" | "gray" {
  if (!s) return "gray";
  const lower = s.toLowerCase();
  if (lower === "ok" || lower === "healthy" || lower === "ready") return "green";
  if (lower === "degraded" || lower === "partial") return "amber";
  if (lower === "error" || lower === "unhealthy") return "red";
  return "green";
}

function producerColor(s: string | undefined): "green" | "amber" | "red" | "gray" {
  if (!s) return "gray";
  const lower = s.toLowerCase();
  if (lower === "ok" || lower === "connected" || lower === "healthy") return "green";
  if (lower === "degraded") return "amber";
  return "red";
}

/* ── Components ── */
function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: "green" | "amber" | "red" | "gray" | "blue";
}) {
  return (
    <div className={`metric-card ${accent ? `metric-card--${accent}` : ""}`}>
      <p className="metric-card__label">{label}</p>
      <p className="metric-card__value">{value ?? "—"}</p>
      {sub && <p className="metric-card__sub">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, live }: { title: string; live?: boolean }) {
  return (
    <div className="section-header">
      <h2 className="section-header__title">{title}</h2>
      {live && (
        <span className="live-badge">
          <span className="dot dot--live" />
          live
        </span>
      )}
    </div>
  );
}

function CBCard({ name, val }: { name: string; val: CBValue }) {
  const { label, state } = formatCB(val);
  return (
    <div className={`cb-card cb-card--${state}`}>
      <span className="cb-card__name">{name}</span>
      <span className={`cb-card__state cb-card__state--${state}`}>{label}</span>
    </div>
  );
}

/* ── Page ── */
export default function MonitoringPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8000"}/ready`);
      if (!res.ok) throw new Error("Non-2xx response");
      const data: Health = await res.json();
      setHealth(data);
      setFetchError(false);
      setLastUpdated(new Date());
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
      setCountdown(5);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  useEffect(() => {
    const tick = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  const sysColor = statusColor(health?.status);
  const cbEntries = health?.circuit_breakers ? Object.entries(health.circuit_breakers) : [];
  const openBreakers = cbEntries.filter(([, v]) => formatCB(v).state === "open").length;

  return (
    <div className="monitoring">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Monitoring</h1>
          <p className="page-header__sub">
            {loading
              ? "Fetching system state…"
              : fetchError
              ? "⚠ Cannot reach /ready endpoint"
              : `Last updated ${lastUpdated?.toLocaleTimeString()} · refreshing in ${countdown}s`}
          </p>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={fetchHealth}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="spinner" />
          <span>Loading system state…</span>
        </div>
      ) : (
        <>
          {/* ── System Status ── */}
          <section className="section">
            <SectionHeader title="System Status" live />
            <div className="metric-grid">
              <MetricCard
                label="Health Status"
                value={health?.status?.toUpperCase() ?? "—"}
                accent={sysColor}
              />
              <MetricCard
                label="Environment"
                value={health?.environment ?? "—"}
                accent="blue"
              />
              <MetricCard
                label="Circuit Breakers"
                value={cbEntries.length > 0 ? `${openBreakers} / ${cbEntries.length} open` : "—"}
                accent={openBreakers > 0 ? "red" : "green"}
              />
            </div>
          </section>

          {/* ── Kafka ── */}
          <section className="section">
            <SectionHeader title="Kafka" />
            <div className="metric-grid">
              <MetricCard
                label="Enabled"
                value={health?.kafka?.enabled === undefined ? "—" : health.kafka.enabled ? "Enabled" : "Disabled"}
                accent={health?.kafka?.enabled ? "green" : "gray"}
              />
              <MetricCard
                label="Producer Status"
                value={health?.kafka?.producer?.toUpperCase() ?? "—"}
                accent={producerColor(health?.kafka?.producer)}
              />
            </div>
          </section>

          {/* ── WebSocket ── */}
          <section className="section">
            <SectionHeader title="WebSocket" live />
            <div className="metric-grid">
              <MetricCard
                label="Active Connections"
                value={health?.websocket?.active_connections ?? "—"}
                sub="concurrent sockets"
                accent="blue"
              />
              <MetricCard
                label="Active Accounts"
                value={health?.websocket?.active_accounts ?? "—"}
                sub="unique users"
                accent="blue"
              />
            </div>
          </section>

          {/* ── Circuit Breakers ── */}
          {cbEntries.length > 0 && (
            <section className="section">
              <SectionHeader title="Circuit Breakers" />
              <div className="cb-grid">
                {cbEntries.map(([key, val]) => (
                  <CBCard key={key} name={key} val={val} />
                ))}
              </div>
            </section>
          )}

          {/* ── Grafana ── */}
          <section className="section">
            <SectionHeader title="Grafana Dashboard" live />
            <div className="grafana-wrapper">
              <iframe
                src={`${import.meta.env.VITE_GRAFANA_URL ?? "http://localhost:3000"}/d/streaming-platform-main/streaming-agentic-ai-platform?orgId=1&kiosk`}
                className="grafana-frame"
                title="Grafana — Streaming AI Platform"
                loading="lazy"
              />
            </div>
          </section>

          {/* ── Raw JSON ── */}
          <section className="section">
            <SectionHeader title="Raw /ready Response" />
            <pre className="raw-json">{JSON.stringify(health, null, 2)}</pre>
          </section>
        </>
      )}
    </div>
  );
}
