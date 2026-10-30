"use client";

import React, { useState } from "react";
import {
  X, ShieldAlert, CheckCircle2, AlertTriangle, Clock,
  Eye, Users, User, FileText, Check, Ban
} from "lucide-react";

interface ProctorEventItem {
  id: number;
  event_type: string;
  severity: string;
  duration_ms?: number;
  confidence?: number;
  face_count?: number;
  review_status?: string;
  examiner_notes?: string;
  time?: string;
  details?: any;
}

interface ProctoringReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: ProctorEventItem | null;
  candidateName?: string;
  apiBaseUrl?: string;
  onStatusUpdated?: (updatedEvent: ProctorEventItem) => void;
}

export function ProctoringReviewDrawer({
  isOpen,
  onClose,
  event,
  candidateName,
  apiBaseUrl = "http://127.0.0.1:8000/api/v1",
  onStatusUpdated
}: ProctoringReviewDrawerProps) {
  const [notes, setNotes] = useState(event?.examiner_notes || "");
  const [saving, setSaving] = useState(false);

  if (!isOpen || !event) return null;

  const handleUpdateStatus = async (status: "REVIEWED" | "DISMISSED" | "CONFIRMED") => {
    setSaving(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("evalora_token") : null;
      const res = await fetch(`${apiBaseUrl}/proctoring/events/${event.id}/review`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          review_status: status,
          examiner_notes: notes
        })
      });

      if (res.ok) {
        const updated = await res.json();
        onStatusUpdated?.(updated);
        onClose();
      }
    } catch (err) {
      console.warn("Failed to update event review status:", err);
    } finally {
      setSaving(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    if (sev === "HIGH" || sev === "CRITICAL") {
      return "bg-rose-100 text-rose-700 border-rose-200";
    }
    if (sev === "MEDIUM") {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#123B7A] flex items-center justify-center font-bold">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Incident Event Review</h3>
                <p className="text-xs text-slate-500">{candidateName || "Candidate Session"}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Body */}
          <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-210px)] text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Event Identifier:</span>
                <span className="font-mono font-bold text-slate-800">#{event.id}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Event Type:</span>
                <span className="font-bold text-[#123B7A]">{event.event_type}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Algorithm Severity:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityBadge(event.severity)}`}>
                  {event.severity}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Recorded Time:</span>
                <span className="font-mono text-slate-700">{event.time || "Recent"}</span>
              </div>

              {event.duration_ms !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Event Duration:</span>
                  <span className="font-mono font-bold text-slate-800">{(event.duration_ms / 1000).toFixed(1)} seconds</span>
                </div>
              )}

              {event.face_count !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Detected Faces:</span>
                  <span className="font-mono font-bold text-slate-800">{event.face_count}</span>
                </div>
              )}

              {event.confidence !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Model Confidence:</span>
                  <span className="font-mono font-bold text-emerald-600">{(event.confidence * 100).toFixed(0)}%</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Review Status:</span>
                <span className="font-bold uppercase tracking-wider text-[11px] text-slate-800">
                  {event.review_status || "UNREVIEWED"}
                </span>
              </div>
            </div>

            {event.details && (
              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                  Event Telemetry Details
                </label>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[10px] overflow-x-auto">
                  {typeof event.details === "object" ? JSON.stringify(event.details, null, 2) : String(event.details)}
                </div>
              </div>
            )}

            {/* Examiner Notes Input */}
            <div className="space-y-1.5 pt-2">
              <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Examiner Review Notes
              </label>
              <textarea
                rows={3}
                placeholder="Add observational findings or justification..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleUpdateStatus("DISMISSED")}
              disabled={saving}
              className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Ban className="w-3.5 h-3.5 text-slate-400" />
              <span>Dismiss Alert</span>
            </button>

            <button
              onClick={() => handleUpdateStatus("CONFIRMED")}
              disabled={saving}
              className="py-2.5 px-3 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Confirm Violation</span>
            </button>
          </div>

          <button
            onClick={() => handleUpdateStatus("REVIEWED")}
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-[#123B7A] hover:bg-[#1E4B94] text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Mark Incident Reviewed</span>
          </button>
        </div>
      </div>
    </div>
  );
}
