import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import TopBar from './components/TopBar';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Demo data for when backend is not available
const DEMO_NODES = [
  { _id: '1', type: 'OSINT', title: 'Social Media Surge — Delhi NCR', description: 'Coordinated social media activity detected. 342 posts from 28 accounts in 2 hours.', latitude: 28.6139, longitude: 77.2090, source: 'Twitter Monitor', classification: 'UNCLASSIFIED', tags: ['social-media', 'coordination'], metadata: { platform: 'Twitter', posts: 342 }, timestamp: new Date().toISOString() },
  { _id: '2', type: 'OSINT', title: 'Dark Web Forum Activity', description: 'Encrypted forum threads discussing logistics movement near western border.', latitude: 23.0225, longitude: 72.5714, source: 'Dark Web Monitor', classification: 'CONFIDENTIAL', tags: ['forum', 'logistics'], metadata: { confidence: '78%' }, timestamp: new Date().toISOString() },
  { _id: '3', type: 'HUMINT', title: 'Field Agent Report — Mumbai Port', description: 'Agent FALCON reports unusual cargo movement at Nhava Sheva. Three unregistered containers.', latitude: 18.9388, longitude: 72.9356, source: 'Agent FALCON', classification: 'SECRET', tags: ['port', 'cargo', 'suspicious'], metadata: { agent: 'FALCON', reliability: 'B2' }, timestamp: new Date().toISOString() },
  { _id: '4', type: 'HUMINT', title: 'Source Report — Rajasthan Border', description: 'Local source confirms increased vehicle movement along NH-11 between 0200-0400 hrs.', latitude: 27.0238, longitude: 74.2179, source: 'Source BRAVO-7', classification: 'CONFIDENTIAL', tags: ['border', 'vehicles', 'night-movement'], metadata: { source: 'BRAVO-7', reliability: 'C3' }, timestamp: new Date().toISOString() },
  { _id: '5', type: 'IMINT', title: 'Satellite Pass — Karachi Coast', description: 'High-resolution satellite imagery showing 4 vessels in unusual formation 12nm offshore.', latitude: 24.8607, longitude: 67.0011, source: 'SAT-7 Pass', classification: 'SECRET', tags: ['maritime', 'vessels', 'formation'], imageUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80', metadata: { resolution: '0.5m', satellite: 'SAT-7' }, timestamp: new Date().toISOString() },
  { _id: '6', type: 'IMINT', title: 'Aerial Recon — Punjab Sector', description: 'UAV imagery confirms construction of new structure at grid reference 32N 74E.', latitude: 31.1471, longitude: 75.3412, source: 'UAV-RECON-3', classification: 'TOP SECRET', tags: ['construction', 'uav', 'structure'], imageUrl: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=400&q=80', metadata: { platform: 'UAV-3', altitude: '8000ft' }, timestamp: new Date().toISOString() },
  { _id: '7', type: 'OSINT', title: 'News Aggregation — Eastern Corridor', description: 'Multiple news sources reporting military exercises near eastern corridor. Sentiment: Negative.', latitude: 22.5726, longitude: 88.3639, source: 'News Aggregator', classification: 'UNCLASSIFIED', tags: ['military', 'exercises', 'media'], metadata: { sources: 8, reach: '2.3M' }, timestamp: new Date().toISOString() },
  { _id: '8', type: 'HUMINT', title: 'Embassy Intelligence — Colombo', description: 'Embassy contact reports diplomatic back-channel communications regarding naval access rights.', latitude: 6.9271, longitude: 79.8612, source: 'Embassy Contact', classification: 'SECRET', tags: ['diplomatic', 'naval', 'sri-lanka'], metadata: { contact: 'ECHO-1', reliability: 'A1' }, timestamp: new Date().toISOString() },
  { _id: '9', type: 'IMINT', title: 'Satellite Imagery — Aksai Chin', description: 'New road construction detected in disputed territory. Estimated 12km of new track.', latitude: 35.1736, longitude: 79.5000, source: 'SAT-12 Pass', classification: 'TOP SECRET', tags: ['construction', 'road', 'disputed-territory'], imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80', metadata: { resolution: '0.3m', length: '12km' }, timestamp: new Date().toISOString() },
];

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [filteredNodes, setFilteredNodes] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, osint: 0, humint: 0, imint: 0 });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const fetchNodes = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/nodes`, { timeout: 3000 });
      const data = res.data.data;
      if (data.length === 0) {
        setNodes(DEMO_NODES);
        setIsDemo(true);
      } else {
        setNodes(data);
      }
    } catch {
      setNodes(DEMO_NODES);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/stats`, { timeout: 3000 });
      setStats(res.data.data);
    } catch {
      // compute from demo nodes
      const s = { total: DEMO_NODES.length, osint: 0, humint: 0, imint: 0 };
      DEMO_NODES.forEach(n => { s[n.type.toLowerCase()]++; });
      setStats(s);
    }
  }, []);

  useEffect(() => {
    fetchNodes();
    fetchStats();
  }, [fetchNodes, fetchStats]);

  useEffect(() => {
    if (activeFilter === 'ALL') setFilteredNodes(nodes);
    else setFilteredNodes(nodes.filter(n => n.type === activeFilter));
  }, [nodes, activeFilter]);

  const handleNodeAdded = (newNode) => {
    setNodes(prev => [newNode, ...prev]);
    toast.success(`${newNode.type} node added to dashboard`, {
      style: { background: '#061e33', color: '#e0f4ff', border: '1px solid #0d3a5c' }
    });
  };

  const handleSeedData = async () => {
    try {
      await axios.post(`${API}/osint/seed`);
      await fetchNodes();
      await fetchStats();
      toast.success('Demo OSINT data seeded', {
        style: { background: '#061e33', color: '#e0f4ff', border: '1px solid #0d3a5c' }
      });
    } catch {
      toast.error('Backend not connected — using demo data');
    }
  };

  const handleS3Sync = async () => {
    try {
      const res = await axios.post(`${API}/osint/sync-s3`);
      const msg = res.data.demo
        ? `S3 DEMO: ${res.data.data?.length || 0} OSINT nodes loaded from simulated S3`
        : res.data.message || 'S3 sync complete';

      // Add returned nodes directly to map state
      if (res.data.data && Array.isArray(res.data.data)) {
        setNodes(prev => {
          const existingIds = new Set(prev.map(n => n.title));
          const newNodes = res.data.data.filter(n => !existingIds.has(n.title));
          return [...newNodes, ...prev];
        });
        setStats(prev => ({
          ...prev,
          total: prev.total + (res.data.data.length),
          osint: prev.osint + (res.data.data.length)
        }));
      } else {
        await fetchNodes();
        await fetchStats();
      }

      toast.success(msg, {
        style: { background: '#061e33', color: '#e0f4ff', border: '1px solid #ffa500' }
      });
    } catch (err) {
      toast.error(err?.response?.data?.error || 'S3 sync failed', {
        style: { background: '#061e33', color: '#e0f4ff', border: '1px solid #0d3a5c' }
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="scanline" />
      <Toaster position="top-right" />
      <TopBar stats={stats} isDemo={isDemo} onSeed={handleSeedData} onS3Sync={handleS3Sync} />
      <div className="main-layout">
        <Sidebar
          nodes={filteredNodes}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onNodeSelect={setSelectedNode}
          selectedNode={selectedNode}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(p => !p)}
        />
        <div className="map-container">
          <MapView
            nodes={filteredNodes}
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
            loading={loading}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            stats={stats}
          />
        </div>
        <RightPanel onNodeAdded={handleNodeAdded} apiBase={API} />
      </div>
    </div>
  );
}
