import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const TOAST_STYLE = { style: { background: '#061e33', color: '#e0f4ff', border: '1px solid #0d3a5c' } };

export default function RightPanel({ onNodeAdded, apiBase }) {
  const [activeTab, setActiveTab] = useState('manual');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    type: 'OSINT', title: '', description: '', latitude: '',
    longitude: '', source: '', classification: 'UNCLASSIFIED', tags: ''
  });
  const [imageForm, setImageForm] = useState({
    title: '', description: '', latitude: '', longitude: '',
    classification: 'UNCLASSIFIED', tags: ''
  });
  const [imageFile, setImageFile] = useState(null);

  // HUMINT file dropzone
  const onDropHumint = useCallback(async (files) => {
    if (!files.length) return;
    const file = files[0];
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const res = await axios.post(`${apiBase}/humint/upload`, fd);
      toast.success(`Ingested ${res.data.inserted} HUMINT records`, TOAST_STYLE);
    } catch {
      toast.error('Upload failed — check file format', TOAST_STYLE);
    } finally {
      setUploading(false);
    }
  }, [apiBase]);

  const { getRootProps: getHumintProps, getInputProps: getHumintInput, isDragActive: isHumintDrag } = useDropzone({
    onDrop: onDropHumint,
    accept: { 'text/csv': ['.csv'], 'application/json': ['.json'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    multiple: false
  });

  // IMINT image dropzone
  const onDropImint = useCallback((files) => {
    if (files.length) setImageFile(files[0]);
  }, []);

  const { getRootProps: getImintProps, getInputProps: getImintInput, isDragActive: isImintDrag } = useDropzone({
    onDrop: onDropImint,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png'] },
    multiple: false
  });

  const handleFormChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleImageFormChange = (e) => setImageForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.latitude || !form.longitude) {
      toast.error('Title, Latitude and Longitude are required', TOAST_STYLE);
      return;
    }
    try {
      const endpoint = form.type === 'OSINT' ? 'osint' : form.type === 'HUMINT' ? 'humint' : 'imint';
      const payload = {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : []
      };
      const res = await axios.post(`${apiBase}/${endpoint}`, payload);
      onNodeAdded(res.data.data);
      setForm({ type: 'OSINT', title: '', description: '', latitude: '', longitude: '', source: '', classification: 'UNCLASSIFIED', tags: '' });
      toast.success('Intel node added', TOAST_STYLE);
    } catch {
      toast.error('Failed to add node', TOAST_STYLE);
    }
  };

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile || !imageForm.latitude || !imageForm.longitude) {
      toast.error('Image, Latitude and Longitude are required', TOAST_STYLE);
      return;
    }
    const fd = new FormData();
    fd.append('image', imageFile);
    Object.entries(imageForm).forEach(([k, v]) => fd.append(k, v));
    setUploading(true);
    try {
      const res = await axios.post(`${apiBase}/imint/upload`, fd);
      onNodeAdded(res.data.data);
      setImageFile(null);
      setImageForm({ title: '', description: '', latitude: '', longitude: '', classification: 'UNCLASSIFIED', tags: '' });
      toast.success('IMINT imagery uploaded', TOAST_STYLE);
    } catch {
      toast.error('Image upload failed', TOAST_STYLE);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="right-panel">
      <div className="panel-header">DATA INGESTION</div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #0d3a5c' }}>
        {[
          { id: 'manual', label: 'MANUAL' },
          { id: 'humint', label: 'HUMINT' },
          { id: 'imint', label: 'IMINT' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '10px 4px', background: 'none',
              border: 'none', borderBottom: activeTab === tab.id ? '2px solid #00d4ff' : '2px solid transparent',
              color: activeTab === tab.id ? '#00d4ff' : '#3a6a8a',
              fontFamily: "'Share Tech Mono', monospace", fontSize: 10,
              letterSpacing: 1, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Manual Entry Tab */}
      {activeTab === 'manual' && (
        <form className="intel-form" onSubmit={handleManualSubmit}>
          <div style={{ marginBottom: 12, padding: '8px 10px', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 4 }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#3a6a8a', letterSpacing: 1 }}>
              MANUAL INTEL ENTRY — Add OSINT, HUMINT, or IMINT nodes directly to the map
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">INTEL TYPE</label>
            <select name="type" className="form-select" value={form.type} onChange={handleFormChange}>
              <option value="OSINT">OSINT — Open Source</option>
              <option value="HUMINT">HUMINT — Human Intel</option>
              <option value="IMINT">IMINT — Imagery Intel</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">CLASSIFICATION</label>
            <select name="classification" className="form-select" value={form.classification} onChange={handleFormChange}>
              <option value="UNCLASSIFIED">UNCLASSIFIED</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="SECRET">SECRET</option>
              <option value="TOP SECRET">TOP SECRET</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">TITLE *</label>
            <input name="title" className="form-input" placeholder="Intel node title..." value={form.title} onChange={handleFormChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">DESCRIPTION</label>
            <textarea name="description" className="form-textarea" placeholder="Detailed intelligence report..." value={form.description} onChange={handleFormChange} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">LATITUDE *</label>
              <input name="latitude" type="number" step="any" className="form-input" placeholder="28.6139" value={form.latitude} onChange={handleFormChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">LONGITUDE *</label>
              <input name="longitude" type="number" step="any" className="form-input" placeholder="77.2090" value={form.longitude} onChange={handleFormChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">SOURCE</label>
            <input name="source" className="form-input" placeholder="Agent callsign / platform..." value={form.source} onChange={handleFormChange} />
          </div>

          <div className="form-group">
            <label className="form-label">TAGS (comma separated)</label>
            <input name="tags" className="form-input" placeholder="border, movement, suspicious" value={form.tags} onChange={handleFormChange} />
          </div>

          <button type="submit" className="btn-submit">
            ⊕ SUBMIT INTEL NODE
          </button>
        </form>
      )}

      {/* HUMINT Upload Tab */}
      {activeTab === 'humint' && (
        <div className="intel-form">
          <div style={{ marginBottom: 12, padding: '8px 10px', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: 4 }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#3a6a8a', letterSpacing: 1 }}>
              HUMINT FIELD REPORT INGESTION — Upload CSV, Excel, or JSON field reports
            </div>
          </div>

          <div {...getHumintProps()} className={`dropzone ${isHumintDrag ? 'active' : ''}`} style={{ borderColor: isHumintDrag ? '#00ff88' : undefined }}>
            <input {...getHumintInput()} />
            <div className="dropzone-icon">📋</div>
            <div className="dropzone-text" style={{ color: '#00ff88' }}>
              {uploading ? 'PROCESSING...' : isHumintDrag ? 'DROP REPORT HERE' : 'DRAG & DROP FIELD REPORT'}
            </div>
            <div className="dropzone-hint">CSV / EXCEL / JSON — requires latitude & longitude columns</div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#3a6a8a', letterSpacing: 1, marginBottom: 8 }}>
              REQUIRED COLUMNS
            </div>
            {['title', 'description', 'latitude *', 'longitude *', 'classification', 'tags'].map(col => (
              <div key={col} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#00ff88' }} />
                <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: '#7ab8d4' }}>{col}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: 4, border: '1px solid #0d3a5c' }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#3a6a8a', marginBottom: 6 }}>SAMPLE JSON FORMAT</div>
            <pre style={{ fontSize: 9, color: '#7ab8d4', fontFamily: "'Share Tech Mono', monospace", overflow: 'auto', whiteSpace: 'pre-wrap' }}>
{`[{
  "title": "Field Report Alpha",
  "description": "Observed movement",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "classification": "SECRET",
  "tags": "border,movement"
}]`}
            </pre>
          </div>
        </div>
      )}

      {/* IMINT Upload Tab */}
      {activeTab === 'imint' && (
        <form className="intel-form" onSubmit={handleImageSubmit}>
          <div style={{ marginBottom: 12, padding: '8px 10px', background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.15)', borderRadius: 4 }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: '#3a6a8a', letterSpacing: 1 }}>
              IMINT IMAGERY INGESTION — Upload satellite or aerial imagery (JPG/JPEG/PNG)
            </div>
          </div>

          <div {...getImintProps()} className={`dropzone ${isImintDrag ? 'active' : ''}`} style={{ borderColor: imageFile ? '#ff6b35' : isImintDrag ? '#ff6b35' : undefined, marginBottom: 12 }}>
            <input {...getImintInput()} />
            <div className="dropzone-icon">{imageFile ? '🛰️' : '📡'}</div>
            <div className="dropzone-text" style={{ color: '#ff6b35' }}>
              {imageFile ? imageFile.name : isImintDrag ? 'DROP IMAGE HERE' : 'DRAG & DROP IMAGERY'}
            </div>
            <div className="dropzone-hint">JPG / JPEG / PNG — max 50MB</div>
          </div>

          {imageFile && (
            <div style={{ marginBottom: 10, position: 'relative' }}>
              <img
                src={URL.createObjectURL(imageFile)}
                alt="preview"
                style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4, border: '1px solid #0d3a5c' }}
              />
              <button
                type="button"
                onClick={() => setImageFile(null)}
                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,51,102,0.8)', border: 'none', color: '#fff', borderRadius: 3, padding: '2px 6px', cursor: 'pointer', fontSize: 10 }}
              >
                ✕
              </button>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">TITLE</label>
            <input name="title" className="form-input" placeholder="Satellite pass designation..." value={imageForm.title} onChange={handleImageFormChange} />
          </div>

          <div className="form-group">
            <label className="form-label">DESCRIPTION</label>
            <textarea name="description" className="form-textarea" placeholder="Imagery analysis notes..." value={imageForm.description} onChange={handleImageFormChange} style={{ minHeight: 50 }} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">LATITUDE *</label>
              <input name="latitude" type="number" step="any" className="form-input" placeholder="28.6139" value={imageForm.latitude} onChange={handleImageFormChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">LONGITUDE *</label>
              <input name="longitude" type="number" step="any" className="form-input" placeholder="77.2090" value={imageForm.longitude} onChange={handleImageFormChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">CLASSIFICATION</label>
            <select name="classification" className="form-select" value={imageForm.classification} onChange={handleImageFormChange}>
              <option value="UNCLASSIFIED">UNCLASSIFIED</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="SECRET">SECRET</option>
              <option value="TOP SECRET">TOP SECRET</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">TAGS</label>
            <input name="tags" className="form-input" placeholder="satellite, uav, coastal" value={imageForm.tags} onChange={handleImageFormChange} />
          </div>

          <button type="submit" className="btn-submit" disabled={uploading} style={{ borderColor: '#ff6b35', color: '#ff6b35', background: 'rgba(255,107,53,0.1)' }}>
            {uploading ? '⟳ UPLOADING...' : '⊕ UPLOAD IMAGERY'}
          </button>
        </form>
      )}
    </div>
  );
}
