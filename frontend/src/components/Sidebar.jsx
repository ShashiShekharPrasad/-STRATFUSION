import React from 'react';
import { format } from 'date-fns';

const TYPE_COLORS = { OSINT: '#00d4ff', HUMINT: '#00ff88', IMINT: '#ff6b35' };

export default function Sidebar({ nodes, activeFilter, onFilterChange, onNodeSelect, selectedNode, collapsed, onToggle }) {
  const filters = ['ALL', 'OSINT', 'HUMINT', 'IMINT'];

  return (
    <>
      <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">INTEL NODES</span>
          <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: '#3a6a8a' }}>
            {nodes.length} RECORDS
          </span>
        </div>

        <div className="sidebar-tabs">
          {filters.map(f => (
            <button
              key={f}
              className={`sidebar-tab ${activeFilter === f ? 'active' : ''}`}
              onClick={() => onFilterChange(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="node-list">
          {nodes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📡</div>
              <div className="empty-state-text">NO INTEL NODES<br />AWAITING DATA</div>
            </div>
          ) : (
            nodes.map(node => (
              <NodeCard
                key={node._id}
                node={node}
                isSelected={selectedNode?._id === node._id}
                onClick={() => onNodeSelect(node)}
              />
            ))
          )}
        </div>
      </div>

      <button
        className={`toggle-sidebar-btn left ${collapsed ? 'collapsed' : ''}`}
        onClick={onToggle}
        title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
      >
        {collapsed ? '›' : '‹'}
      </button>
    </>
  );
}

function NodeCard({ node, isSelected, onClick }) {
  const color = TYPE_COLORS[node.type] || '#00d4ff';
  const classColors = {
    'UNCLASSIFIED': '#00ff88', 'CONFIDENTIAL': '#ffd700',
    'SECRET': '#ff6b35', 'TOP SECRET': '#ff3366'
  };

  return (
    <div
      className={`intel-card ${node.type}`}
      onClick={onClick}
      style={isSelected ? { borderColor: color, boxShadow: `0 0 12px ${color}30` } : {}}
    >
      <div className="card-header">
        <span className={`card-type-badge badge-${node.type}`}>{node.type}</span>
        <span className="card-classification" style={{ color: classColors[node.classification] || '#3a6a8a' }}>
          {node.classification}
        </span>
      </div>
      <div className="card-title">{node.title}</div>
      <div className="card-desc">{node.description}</div>
      <div className="card-coords">
        <span>LAT: {Number(node.latitude).toFixed(4)}</span>
        <span>LON: {Number(node.longitude).toFixed(4)}</span>
      </div>
      {node.timestamp && (
        <div className="card-time">
          {format(new Date(node.timestamp), 'dd MMM yyyy HH:mm')}
        </div>
      )}
    </div>
  );
}
