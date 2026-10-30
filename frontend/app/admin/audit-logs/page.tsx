"use client";

import React, { useEffect, useState } from "react";
import { Layers, Search, ShieldCheck, Clock, User, Filter, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const token = localStorage.getItem("evalora_token");
        const res = await fetch(`${API_BASE}/admin/audit-logs?limit=100`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditLogs();
  }, []);

  const filtered = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.resource_type.toLowerCase().includes(search.toLowerCase()) ||
    (l.user_id && String(l.user_id).includes(search))
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#123B7A] flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Security Audit Trail & Governance</h1>
              <p className="text-xs text-slate-500">Immutable ledger of administrative actions, role assignments, and exam integrity events</p>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            Recorded Events: <span className="text-[#123B7A] font-bold">{logs.length}</span>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search audit trail by action or resource type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
            />
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5">Admin / User ID</th>
                    <th className="px-6 py-3.5">Action Executed</th>
                    <th className="px-6 py-3.5">Target Resource</th>
                    <th className="px-6 py-3.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr key="loading-audit-logs">
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#123B7A]" />
                        Loading audit trail...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr key="empty-audit-logs">
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        No audit records match the query.
                      </td>
                    </tr>
                  ) : (
                    filtered.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                          {new Date(l.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-800">
                          {l.user_id ? `User #${l.user_id}` : "System Automated"}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="font-mono text-[11px] font-bold text-[#123B7A] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {l.action}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-slate-600 font-medium">
                            {l.resource_type} {l.resource_id ? `(${l.resource_id})` : ""}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate">
                          {l.details ? JSON.stringify(l.details) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
