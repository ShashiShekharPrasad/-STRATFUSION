import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const TYPE_CONFIG = {
  OSINT: { color: '#00d4ff', fillColor: '#00d4ff', label: 'OSINT' },
  HUMINT: { color: '#00ff88', fillColor: '#00ff88', label: 'HUMINT' },
  IMINT: { color: '#ff6b35', fillColor: '#ff6b35', label: 'IMINT' },
};

const CLASS_COLORS = {
  'UNCLASSIFIED': '#00ff88',
  'CONFIDENTIAL': '#ffd700',
  'SECRET': '#ff6b35',
  'TOP SECRET': '#ff3366',
};

function FlyToNode({ selectedNode }) {
  const map = useMap();
  useEffect(() => {
    if (selectedNode) {
      map.flyTo([selectedNode.latitude, selectedNode.longitude], 6, { duration: 1.2 });
    }
  }, [selectedNode, map]);
  return null;
}

function NodeMarker({ node, isSelected }) {
  const cfg = TYPE_CONFIG[node.type] || TYPE_CONFIG.OSINT;
  const radius = isSelected ? 12 : 8;
  const opacity = isSelected ? 1 : 0.85;

  return (
    <CircleMarker
      center={[node.latitude, node.longitude]}
      radius={radius}
      pathOptions={{
        color: cfg.color,
        fillColor: cfg.fillColor,
        fillOpacity: opacity,
        weight: isSelected ? 3 : 2,
      }}
    >
      <Popup className="intel-popup" maxWidth={340} minWidth={280}>
        <PopupContent node={node} />
      </Popup>
    </CircleMarker>
  );
}

function PopupContent({ node }) {
  const cfg = TYPE_CONFIG[node.type] || TYPE_CONFIG.OSINT;
  const classColor = CLASS_COLORS[node.classification] || '#3a6a8a';

  return (
    <div className="popup-inner">
      <div className="popup-header">
        <div>
          <span className={`card-type-badge badge-${node.type}`} style={{ marginRight: 6 }}>{node.type}</span>
          <span style={{ fontSize: 9, color: classColor, fontFamily: "'Share Tech Mono', monospace", letterSpacing: 1 }}>
            {node.classification}
          </span>
        </div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#3a6a8a' }}>
          {node.timestamp ? new Date(node.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
        </div>
      </div>

      <div className="popup-title">{node.title}</div>

      {node.imageUrl && (
        <img
          src={node.imageUrl.startsWith('/') ? `http://localhost:5000${node.imageUrl}` : node.imageUrl}
          alt={node.title}
          className="popup-image"
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}

      <div className="popup-desc">{node.description}</div>

      <div className="popup-meta">
        <div className="popup-meta-item">
          <div className="popup-meta-label">LATITUDE</div>
          <div className="popup-meta-value">{Number(node.latitude).toFixed(4)}°</div>
        </div>
        <div className="popup-meta-item">
          <div className="popup-meta-label">LONGITUDE</div>
          <div className="popup-meta-value">{Number(node.longitude).toFixed(4)}°</div>
        </div>
        {node.source && (
          <div className="popup-meta-item" style={{ gridColumn: '1 / -1' }}>
            <div className="popup-meta-label">SOURCE</div>
            <div className="popup-meta-value">{node.source}</div>
          </div>
        )}
        {node.metadata && Object.keys(node.metadata).slice(0, 2).map(k => (
          <div className="popup-meta-item" key={k}>
            <div className="popup-meta-label">{k.toUpperCase()}</div>
            <div className="popup-meta-value">{String(node.metadata[k])}</div>
          </div>
        ))}
      </div>

      {node.tags && node.tags.length > 0 && (
        <div className="popup-tags">
          {node.tags.map(tag => (
            <span key={tag} className="popup-tag">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MapView({ nodes, selectedNode, onNodeSelect, loading, activeFilter, onFilterChange, stats }) {
  const filters = ['ALL', 'OSINT', 'HUMINT', 'IMINT'];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Corner decorations */}
      <div className="corner-decoration tl" />
      <div className="corner-decoration tr" />
      <div className="corner-decoration bl" />
      <div className="corner-decoration br" />

      {/* Stats overlay */}
      <div className="map-overlay-top">
        <div className="stats-bar">
          <div className="stat-chip total">
            <div>
              <div className="stat-chip-value">{stats.total}</div>
              <div className="stat-chip-label">TOTAL</div>
            </div>
          </div>
          <div className="stat-chip osint">
            <div>
              <div className="stat-chip-value">{stats.osint}</div>
              <div className="stat-chip-label">OSINT</div>
            </div>
          </div>
          <div className="stat-chip humint">
            <div>
              <div className="stat-chip-value">{stats.humint}</div>
              <div className="stat-chip-label">HUMINT</div>
            </div>
          </div>
          <div className="stat-chip imint">
            <div>
              <div className="stat-chip-value">{stats.imint}</div>
              <div className="stat-chip-label">IMINT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={4}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <FlyToNode selectedNode={selectedNode} />
        {nodes.map(node => (
          <NodeMarker
            key={node._id}
            node={node}
            isSelected={selectedNode?._id === node._id}
          />
        ))}
      </MapContainer>

      {/* Filter bar */}
      <div className="filter-bar">
        {filters.map(f => (
          <button
            key={f}
            className={`filter-btn ${activeFilter === f ? (f === 'ALL' ? 'active-all' : `active-${f}`) : ''}`}
            onClick={() => onFilterChange(f)}
          >
            {f === 'ALL' ? '⬡ ALL' : f === 'OSINT' ? '◉ OSINT' : f === 'HUMINT' ? '◈ HUMINT' : '◆ IMINT'}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 70, right: 12, zIndex: 500,
        background: 'rgba(4,21,37,0.92)', border: '1px solid #0d3a5c',
        borderRadius: 6, padding: '10px 14px', backdropFilter: 'blur(10px)'
      }}>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: cfg.color }}>{type}</span>
          </div>
        ))}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" />
            <div style={{ marginTop: 16, fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: '#00d4ff', letterSpacing: 2 }}>
              LOADING INTEL...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
