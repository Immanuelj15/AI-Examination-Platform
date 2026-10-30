"use client";

import React, { useEffect, useState } from "react";
import { Building2, Plus, Search, Globe, Shield, Check, X, Loader2, ExternalLink } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newOrg, setNewOrg] = useState({
    name: "",
    code: "",
    domain: "",
    logo_url: ""
  });

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/admin/organizations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrgs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/admin/organizations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newOrg)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewOrg({ name: "", code: "", domain: "", logo_url: "" });
        await fetchOrganizations();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create organization");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.code.toLowerCase().includes(search.toLowerCase()) ||
    (o.domain && o.domain.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#123B7A] flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Organization & Tenant Directory</h1>
              <p className="text-xs text-slate-500">Manage universities, colleges, and corporate recruitment divisions</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#123B7A] text-white text-xs font-semibold hover:bg-[#1E4B94] transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Register Organization</span>
          </button>
        </header>

        <main className="p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Search bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search organizations by name, code or domain..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
              />
            </div>
            <div className="text-xs font-semibold text-slate-500">
              Total Organizations: <span className="text-[#123B7A] font-bold">{orgs.length}</span>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#123B7A] mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading organizations...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No organizations found</h3>
              <p className="text-xs text-slate-500 mt-1">Register a university or corporate assessment sponsor above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(org => (
                <div key={org.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[#123B7A] text-lg overflow-hidden">
                        {org.logo_url ? (
                          <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
                        ) : (
                          org.name.charAt(0)
                        )}
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                        {org.code}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{org.name}</h3>
                      {org.domain && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>{org.domain}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Created {org.created_at ? new Date(org.created_at).toLocaleDateString() : "Active"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <Shield className="w-3 h-3" /> Enterprise Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Register Organization Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#123B7A]" />
                Register New Organization
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stanford University"
                  value={newOrg.name}
                  onChange={e => setNewOrg({ ...newOrg, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Identifier Code (Unique) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STANFORD-TECH"
                  value={newOrg.code}
                  onChange={e => setNewOrg({ ...newOrg, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl uppercase focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Authorized Email Domain</label>
                <input
                  type="text"
                  placeholder="e.g. stanford.edu"
                  value={newOrg.domain}
                  onChange={e => setNewOrg({ ...newOrg, domain: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Logo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={newOrg.logo_url}
                  onChange={e => setNewOrg({ ...newOrg, logo_url: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-[#123B7A] text-white text-xs font-semibold hover:bg-[#1E4B94] disabled:opacity-50"
                >
                  {submitting ? "Registering..." : "Create Tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
