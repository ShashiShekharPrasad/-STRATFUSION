import React, { useState, useEffect } from 'react';

export default function TopBar({ stats, isDemo, onSeed, onS3Sync }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad = n => String(n).padStart(2, '0');
  const timeStr = `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())} UTC`;
  const dateStr = time.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  return (
    <div className="topbar">
      <div className="topbar-logo">
        <div className="logo-icon">🛰️</div>
        <div>
          <div className="logo-text">STRATFUSION</div>
          <div className="logo-sub">MULTI-SOURCE INTELLIGENCE DASHBOARD</div>
        </div>
      </div>

      <div className="topbar-center">
        <div className="status-dot" />
        <span>SYSTEM OPERATIONAL</span>
        <span style={{ margin: '0 8px', color: '#0d3a5c' }}>|</span>
        <span>NODES: {stats.total}</span>
        <span style={{ margin: '0 8px', color: '#0d3a5c' }}>|</span>
        <span>{timeStr}</span>
        <span style={{ margin: '0 8px', color: '#0d3a5c' }}>|</span>
        <span>{dateStr}</span>
        {isDemo && (
          <>
            <span style={{ margin: '0 8px', color: '#0d3a5c' }}>|</span>
            <span style={{ color: '#ffd700' }}>DEMO MODE</span>
          </>
        )}
      </div>

      <div className="topbar-right">
        <div className="threat-level">THREAT: ELEVATED</div>
        <button
          onClick={onSeed}
          style={{
            background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
            color: '#00d4ff', padding: '4px 10px', borderRadius: '4px',
            cursor: 'pointer', fontSize: '10px', letterSpacing: '1px',
            fontFamily: "'Share Tech Mono', monospace"
          }}
        >
          SEED DATA
        </button>
        <button
          onClick={onS3Sync}
          style={{
            background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)',
            color: '#ffa500', padding: '4px 10px', borderRadius: '4px',
            cursor: 'pointer', fontSize: '10px', letterSpacing: '1px',
            fontFamily: "'Share Tech Mono', monospace"
          }}
          title="Sync OSINT data from AWS S3"
        >
          S3 SYNC
        </button>
        <span style={{ color: '#0d3a5c' }}>|</span>
        <span>OP: IRON VEIL</span>
        <span style={{ color: '#0d3a5c' }}>|</span>
        <span style={{ color: '#ff3366' }}>◉ LIVE</span>
      </div>
    </div>
  );
}
