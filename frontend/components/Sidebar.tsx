"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, BookOpen, FileCheck2, Video,
  Award, BarChart3, ShieldAlert, Settings, LogOut, ChevronLeft,
  ChevronRight, Building2, HelpCircle, Layers, CheckSquare, Sparkles
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { LanguageSelector } from "./LanguageSelector";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const role = user.role;

  // Define role navigation items
  const adminLinks = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users & RBAC", href: "/admin/users", icon: Users },
    { name: "Organizations", href: "/admin/organizations", icon: Building2 },
    { name: "Exams Management", href: "/admin/exams", icon: FileCheck2 },
    { name: "Live Monitoring", href: "/admin/live-monitoring", icon: Video },
    { name: "Proctoring Alerts", href: "/admin/proctoring", icon: ShieldAlert },
    { name: "Platform Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Audit Trail", href: "/admin/audit-logs", icon: Layers },
    { name: "System Settings", href: "/admin/settings", icon: Settings },
  ];

  const examinerLinks = [
    { name: "Overview", href: "/examiner/dashboard", icon: LayoutDashboard },
    { name: "My Exams", href: "/examiner/exams", icon: FileCheck2 },
    { name: "Create Exam", href: "/examiner/exams/new", icon: Sparkles },
    { name: "Question Bank", href: "/examiner/question-bank", icon: BookOpen },
    { name: "AI Grading Portal", href: "/examiner/grading", icon: CheckSquare },
    { name: "Live Examination", href: "/examiner/live", icon: Video },
  ];

  const studentLinks = [
    { name: "My Assessments", href: "/student/dashboard", icon: LayoutDashboard },
    { name: "Results & Feedback", href: "/student/results", icon: BarChart3 },
    { name: "Digital Certificates", href: "/student/certificates", icon: Award },
    { name: "System Check", href: "/student/system-check", icon: HelpCircle },
  ];

  const navLinks = role === "ADMIN" ? adminLinks : role === "EXAMINER" ? examinerLinks : studentLinks;

  return (
    <aside
      className={`relative flex flex-col bg-white border-r border-slate-200 transition-all duration-200 z-30 select-none ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Brand Header */}
      <div className="h-18 flex items-center justify-between px-5 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-[#123B7A] flex-shrink-0 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
            E
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#123B7A] tracking-tight">Evalora</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {role} PORTAL
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation list */}
      <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        <div className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 ${collapsed ? "text-center" : ""}`}>
          {!collapsed ? "Main Menu" : "•"}
        </div>
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== `/${role.toLowerCase()}/dashboard`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-3.5 min-h-[46px] rounded-xl text-[15px] font-semibold transition-all ${
                isActive
                  ? "bg-blue-50 text-[#123B7A] border-r-4 border-[#2563EB] shadow-xs font-bold"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-transform ${isActive ? "text-[#2563EB] scale-105" : "text-slate-500"}`} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* Bottom Profile & Footer */}
      <div className="p-4 border-t border-slate-100 space-y-3">
        {!collapsed && (
          <div className="px-2 py-1 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Interface Language:</span>
            <LanguageSelector />
          </div>
        )}

        <div className={`flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 rounded-xl bg-[#123B7A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            {user.full_name?.charAt(0) || "U"}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user.full_name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          )}
        </div>

        <button
          onClick={logout}
          className={`w-full flex items-center gap-2.5 px-3.5 min-h-[42px] rounded-xl text-[14px] font-bold text-rose-600 hover:bg-rose-50 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
          title="Sign out of platform"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
