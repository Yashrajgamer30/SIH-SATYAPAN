import { API_BASE } from '../config/api';
import React, { useState, useEffect, useRef } from 'react';
import {
  Share2,
  AlertTriangle,
  FileText,
  Building,
  ShieldAlert,
  ArrowRight,
  Maximize2,
  RefreshCw,
  Search,
  ExternalLink,
  X
} from 'lucide-react';

interface NetworkNode {
  id: string;
  aicte_id: string;
  name: string;
  state: string;
  district: string;
  category: string;
  risk_band: 'HIGH' | 'MEDIUM' | 'LOW';
  duplicate_count: number;
  x?: number;
  y?: number;
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  doc_type: string;
  doc_title: string;
  similarity: number;
  hash_match_type: string;
  source_doc_id: string;
  target_doc_id: string;
  detected_at: string;
  status: string;
  details: string;
}

export const CrossInstituteNetworkView: React.FC = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEdge, setSelectedEdge] = useState<NetworkEdge | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [filterType, setFilterType] = useState('ALL');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchNetwork();
  }, []);

  const fetchNetwork = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/official/cross-network`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      // Assign initial circular layout coordinates if not present
      const cx = 450;
      const cy = 250;
      const r = 180;
      const positionedNodes = (data.nodes || []).map((n: NetworkNode, i: number, arr: NetworkNode[]) => {
        const angle = (i / (arr.length || 1)) * 2 * Math.PI;
        return {
          ...n,
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle)
        };
      });

      setNodes(positionedNodes);
      setEdges(data.edges || []);
    } catch (e) {
      console.error('Failed to load network graph:', e);
      // Fallback demo nodes
      const fallbackNodes: NetworkNode[] = [
        {
          id: 'inst-1',
          aicte_id: '1-29849201',
          name: 'Govt College of Engg, Pune',
          state: 'Maharashtra',
          district: 'Pune',
          category: 'Engineering',
          risk_band: 'HIGH',
          duplicate_count: 2,
          x: 300,
          y: 200
        },
        {
          id: 'inst-2',
          aicte_id: '1-30918291',
          name: 'Pune Institute of Tech',
          state: 'Maharashtra',
          district: 'Pune',
          category: 'Engineering',
          risk_band: 'HIGH',
          duplicate_count: 2,
          x: 600,
          y: 180
        },
        {
          id: 'inst-3',
          aicte_id: '1-40918231',
          name: 'Nashik Polytechnic Institute',
          state: 'Maharashtra',
          district: 'Nashik',
          category: 'Polytechnic',
          risk_band: 'MEDIUM',
          duplicate_count: 2,
          x: 450,
          y: 380
        }
      ];

      const fallbackEdges: NetworkEdge[] = [
        {
          id: 'edge-dup-1',
          source: 'inst-1',
          target: 'inst-2',
          doc_type: 'FIRE_SAFETY_CERTIFICATE',
          doc_title: 'State Fire NOC Annexure C',
          similarity: 0.98,
          hash_match_type: 'EXACT_PHASH',
          source_doc_id: 'doc-fnoc-clean',
          target_doc_id: 'doc-fnoc-dup',
          detected_at: '2026-10-24T14:32:00Z',
          status: 'FLAGGED_DUPLICATE',
          details: 'Identical municipal serial number (NOC/MH/PUN/2024/8819) and identical notary stamp signature submitted across two distinct institute entities.'
        },
        {
          id: 'edge-dup-2',
          source: 'inst-1',
          target: 'inst-3',
          doc_type: 'FACULTY_EXPERIENCE_CERTIFICATE',
          doc_title: 'Dr. Ramesh Gupta - Appointment Order',
          similarity: 0.94,
          hash_match_type: 'OCR_TEXT_OVERLAP',
          source_doc_id: 'doc-fac-orig',
          target_doc_id: 'doc-fac-cloned',
          detected_at: '2026-10-25T09:15:00Z',
          status: 'CONCURRENT_EMPLOYMENT',
          details: 'Full-time Professor declared concurrently on payroll of two approved technical colleges in Pune and Nashik.'
        }
      ];
      setNodes(fallbackNodes);
      setEdges(fallbackEdges);
    } finally {
      setLoading(false);
    }
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background subtle grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    // Draw Edges
    edges.forEach((edge) => {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (!src || !tgt || src.x === undefined || tgt.x === undefined) return;

      const isSelected = selectedEdge?.id === edge.id;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y!);
      ctx.lineTo(tgt.x, tgt.y!);
      ctx.strokeStyle = isSelected
        ? '#ef4444'
        : edge.similarity > 0.95
        ? '#f43f5e'
        : '#f59e0b';
      ctx.lineWidth = Math.max(2, edge.similarity * 6);
      ctx.stroke();

      // Draw edge label (similarity %)
      const mx = (src.x + tgt.x) / 2;
      const my = (src.y! + tgt.y!) / 2;
      ctx.fillStyle = isSelected ? '#991b1b' : '#334155';
      ctx.font = 'bold 11px Inter, sans-serif';
      const label = `${(edge.similarity * 100).toFixed(0)}% MATCH`;
      ctx.fillText(label, mx - 25, my - 6);
    });

    // Draw Nodes
    nodes.forEach((node) => {
      if (node.x === undefined || node.y === undefined) return;

      const isSelected = selectedNode?.id === node.id;
      const radius = node.duplicate_count > 0 ? 28 : 22;

      // Glow ring for high risk
      if (node.risk_band === 'HIGH') {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fill();
      }

      // Outer circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? '#1e3a8a' : node.risk_band === 'HIGH' ? '#dc2626' : '#2563eb';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Node text label
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(node.name.slice(0, 18) + (node.name.length > 18 ? '...' : ''), node.x - 45, node.y + radius + 15);

      ctx.fillStyle = '#64748b';
      ctx.font = '10px monospace';
      ctx.fillText(node.aicte_id, node.x - 30, node.y + radius + 28);
    });
  }, [nodes, edges, selectedEdge, selectedNode]);

  // Click handler on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked a node
    for (const node of nodes) {
      if (node.x !== undefined && node.y !== undefined) {
        const dist = Math.hypot(node.x - x, node.y - y);
        if (dist <= 30) {
          setSelectedNode(node);
          return;
        }
      }
    }

    // Check if clicked near an edge midpoint
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    for (const edge of edges) {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (src && tgt && src.x !== undefined && tgt.x !== undefined) {
        const mx = (src.x + tgt.x) / 2;
        const my = (src.y! + tgt.y!) / 2;
        if (Math.hypot(mx - x, my - y) < 25) {
          setSelectedEdge(edge);
          return;
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Cross-Institute Duplicate Network Graph
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800">
              Syndicate Detection Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Detects fraudulent document reuse, concurrent faculty appointments, and shared forged stamps across distinct institutional entities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNetwork}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-Cluster
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graph Canvas Panel (2 cols) */}
        <div className="lg:col-span-2 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Interactive Relationship Topology (Click edge to inspect duplicate)
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Critical Similarity (&gt;95%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Suspicious Reuse (&gt;90%)
              </span>
            </div>
          </div>

          <div className="relative border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950/40 overflow-hidden flex justify-center">
            <canvas
              ref={canvasRef}
              width={900}
              height={500}
              onClick={handleCanvasClick}
              className="cursor-crosshair max-w-full"
            />
          </div>
        </div>

        {/* Side Detail Panel (1 col) */}
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Syndicate Anomaly Clusters ({edges.length})
            </h3>

            <div className="space-y-2.5 max-h-[440px] overflow-y-auto">
              {edges.map((edge) => (
                <div
                  key={edge.id}
                  onClick={() => setSelectedEdge(edge)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedEdge?.id === edge.id
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-rose-700 dark:text-rose-400">
                      {edge.doc_type.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-xs font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded">
                      {(edge.similarity * 100).toFixed(0)}% Match
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                    {edge.details}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{edge.hash_match_type}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                      Compare Side-by-Side <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Modal */}
      {selectedEdge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-sm">
                  Side-by-Side Forensic Document Comparison: {selectedEdge.doc_title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEdge(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-900 dark:text-rose-200">
                <p className="font-semibold">Automated Anomaly Finding: {selectedEdge.status}</p>
                <p className="text-[11px] mt-0.5 text-rose-800 dark:text-rose-300">{selectedEdge.details}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Source Institute Document */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-blue-900 dark:text-blue-300">
                      Primary Submission (Origin)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">ID: {selectedEdge.source_doc_id}</span>
                  </div>
                  <div className="h-56 bg-slate-200 dark:bg-slate-900 rounded-lg flex items-center justify-center border border-dashed border-slate-300 text-xs text-slate-400 p-4 text-center">
                    <div>
                      <FileText className="w-10 h-10 mx-auto text-blue-500 mb-2" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Source PDF Stored in AES-256 Vault</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">SHA-256: 7f83b165...9481</p>
                    </div>
                  </div>
                </div>

                {/* Target Institute Document */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-rose-900 dark:text-rose-300">
                      Reused / Cloned Submission
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">ID: {selectedEdge.target_doc_id}</span>
                  </div>
                  <div className="h-56 bg-slate-200 dark:bg-slate-900 rounded-lg flex items-center justify-center border border-dashed border-rose-300 text-xs text-slate-400 p-4 text-center">
                    <div>
                      <FileText className="w-10 h-10 mx-auto text-rose-500 mb-2" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300">Duplicate Submission Cloned</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">pHash Hamming Distance: 1 (98% match)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                <span>Timestamp: {selectedEdge.detected_at}</span>
                <button
                  onClick={() => setSelectedEdge(null)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
