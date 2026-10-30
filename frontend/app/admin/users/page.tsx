"use client";

import React, { useEffect, useState } from "react";
import { Users, Plus, Search, Check, X, ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New user form state
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "STUDENT",
    phone: "",
    is_active: true
  });

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: number) => {
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/admin/users/${userId}/toggle-status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewUser({
          email: "",
          password: "",
          full_name: "",
          role: "STUDENT",
          phone: "",
          is_active: true
        });
        await fetchUsers();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to create user");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = users.filter((u) => {
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#123B7A] flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Identity & Access Management (RBAC)</h1>
              <p className="text-xs text-slate-500">Manage institutional users, faculty credentials, and role assignments</p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#123B7A] hover:bg-[#1E4B94] text-white text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create User</span>
          </button>
        </header>

        <main className="p-6 max-w-6xl mx-auto w-full space-y-6">
          {/* Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Role:</span>
              {["ALL", "ADMIN", "EXAMINER", "STUDENT"].map((r) => (
                <button
                  key={r}
                  onClick={() => setFilterRole(r)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    filterRole === r
                      ? "bg-[#123B7A] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr key="loading-users">
                      <td colSpan={6} className="py-8 text-center text-slate-400">Loading directory...</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr key="empty-users">
                      <td colSpan={6} className="py-8 text-center text-slate-400">No users match criteria.</td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#123B7A] text-white flex items-center justify-center font-bold text-xs">
                              {u.full_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{u.full_name}</p>
                              <p className="text-[10px] text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === "ADMIN"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : u.role === "EXAMINER"
                                ? "bg-blue-50 text-[#123B7A] border border-blue-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.is_active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {u.is_active ? "Active" : "Deactivated"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{u.phone || "—"}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(u.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                              u.is_active
                                ? "text-rose-600 hover:bg-rose-50 border border-rose-200"
                                : "text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                            }`}
                          >
                            {u.is_active ? "Deactivate" : "Activate"}
                          </button>
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

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Provision New Institutional User</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="e.g. Dr. Jennifer Hayes"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="name@institution.edu"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Assigned Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                >
                  <option value="STUDENT">STUDENT (Candidate Assessment)</option>
                  <option value="EXAMINER">EXAMINER (Faculty / Evaluation)</option>
                  <option value="ADMIN">ADMIN (Full Platform Authority)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="+1 555-0100"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#123B7A] text-white text-xs font-bold hover:bg-[#1E4B94]"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
