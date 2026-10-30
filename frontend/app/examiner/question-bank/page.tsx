"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen, Plus, Search, Filter, CheckCircle2,
  Code2, Image as ImageIcon, FileText, Check, AlertCircle, X,
  Copy, Archive, Eye, Edit3, Download, Upload, RefreshCw,
  Layers, ChevronRight, Sparkles, HelpCircle, CheckSquare, ListOrdered
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

const QUESTION_TYPES = [
  { id: "ALL", label: "All Questions" },
  { id: "MCQ", label: "MCQ", icon: CheckCircle2 },
  { id: "MULTI_SELECT", label: "Multi Select", icon: CheckSquare },
  { id: "SHORT_ANSWER", label: "Short Answer", icon: FileText },
  { id: "LONG_ANSWER", label: "Long Answer", icon: FileText },
  { id: "IMAGE_UPLOAD", label: "Image Upload", icon: ImageIcon },
  { id: "CODING", label: "Coding", icon: Code2 }
];

export default function QuestionBankPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filters & Search
  const [selectedTypeTab, setSelectedTypeTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");

  // Preview Drawer Modal
  const [previewQuestion, setPreviewQuestion] = useState<any | null>(null);
  const [previewRoleView, setPreviewRoleView] = useState<"student" | "examiner">("student");

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("evalora_token") : null;
      const headers = { Authorization: `Bearer ${token}` };

      const [qRes, sRes, bRes] = await Promise.all([
        fetch(`${API_BASE}/questions`, { headers }),
        fetch(`${API_BASE}/questions/subjects`, { headers }),
        fetch(`${API_BASE}/questions/banks`, { headers })
      ]);

      if (qRes.ok) {
        const qData = await qRes.json();
        setQuestions(qData);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setSubjects(sData);
      }
      if (bRes.ok) {
        const bData = await bRes.json();
        setBanks(bData);
      }
    } catch (e) {
      console.error("Failed to load question bank data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Show feedback banner
  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Actions
  const handleDuplicate = async (qId: number) => {
    setActionLoading(qId);
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/questions/${qId}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showFeedback("success", "✓ Question duplicated successfully as a new draft.");
        await fetchData();
      } else {
        const err = await res.json();
        showFeedback("error", err.detail || "Failed to duplicate question.");
      }
    } catch (e) {
      showFeedback("error", "Network error duplicating question.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchiveOrDelete = async (qId: number) => {
    if (!confirm("Are you sure you want to archive or remove this question?")) return;
    setActionLoading(qId);
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/questions/${qId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        showFeedback("success", data.message || "✓ Question processed successfully.");
        await fetchData();
      } else {
        const err = await res.json();
        showFeedback("error", err.detail || "Failed to archive question.");
      }
    } catch (e) {
      showFeedback("error", "Network error archiving question.");
    } finally {
      setActionLoading(null);
    }
  };

  // Export questions to JSON
  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `evalora_question_bank_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showFeedback("success", `✓ Exported ${questions.length} questions to JSON.`);
  };

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Type Tab
      if (selectedTypeTab !== "ALL" && q.question_type !== selectedTypeTab) return false;
      // Search
      if (search.trim()) {
        const s = search.toLowerCase();
        const textEn = (q.question_en || "").toLowerCase();
        const tags = (q.tags || []).join(" ").toLowerCase();
        if (!textEn.includes(s) && !tags.includes(s)) return false;
      }
      // Subject
      if (selectedSubject && String(q.subject_id) !== selectedSubject) return false;
      // Topic
      if (selectedTopic && String(q.topic_id) !== selectedTopic) return false;
      // Difficulty
      if (selectedDifficulty && q.difficulty !== selectedDifficulty) return false;
      // Status
      if (selectedStatus !== "ALL" && q.status !== selectedStatus) return false;
      // Language filter
      if (selectedLanguage === "TA" && !q.question_ta) return false;
      if (selectedLanguage === "HI" && !q.question_hi) return false;
      if (selectedLanguage === "ML" && !q.question_ml) return false;
      if (selectedLanguage === "TE" && !q.question_te) return false;
      if (selectedLanguage === "KN" && !q.question_kn) return false;

      return true;
    });
  }, [questions, selectedTypeTab, search, selectedSubject, selectedTopic, selectedDifficulty, selectedStatus, selectedLanguage]);

  // Topic options for selected subject
  const currentSubjectObj = subjects.find(s => String(s.id) === selectedSubject);
  const availableTopics = currentSubjectObj ? currentSubjectObj.topics || [] : [];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#123B7A]/10 text-[#123B7A] flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Question Bank</h1>
                <p className="text-sm text-slate-500 font-medium">Create and manage reusable questions for your assessments.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Questions</span>
            </button>
            <Link
              href="/examiner/question-bank/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123B7A] hover:bg-[#1E4B94] text-white text-sm font-bold transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Question</span>
            </Link>
          </div>
        </header>

        {/* Feedback Alert Banner */}
        <AnimatePresence>
          {feedbackMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`px-8 py-3.5 text-sm font-semibold flex items-center justify-between border-b ${
                feedbackMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {feedbackMessage.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{feedbackMessage.text}</span>
              </div>
              <button onClick={() => setFeedbackMessage(null)} className="p-1 hover:bg-black/5 rounded">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Question Type Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
            {QUESTION_TYPES.map((t) => {
              const active = selectedTypeTab === t.id;
              const Icon = t.icon;
              const count = t.id === "ALL"
                ? questions.length
                : questions.filter(q => q.question_type === t.id).length;

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTypeTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
                    active
                      ? "border-[#123B7A] text-[#123B7A] bg-blue-50/50 rounded-t-lg"
                      : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 rounded-t-lg"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{t.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${active ? "bg-[#123B7A] text-white" : "bg-slate-200 text-slate-600"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Comprehensive Filters */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search questions by text or tags..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#123B7A]/20 focus:border-[#123B7A]"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Reset Filters button */}
              {(selectedSubject || selectedTopic || selectedDifficulty || selectedStatus !== "ALL" || selectedLanguage !== "ALL" || search) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedSubject("");
                    setSelectedTopic("");
                    setSelectedDifficulty("");
                    setSelectedStatus("ALL");
                    setSelectedLanguage("ALL");
                  }}
                  className="px-3.5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
              {/* Subject */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedTopic("");
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Topic</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  disabled={!selectedSubject}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                >
                  <option value="">All Topics</option>
                  {availableTopics.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                >
                  <option value="">All Difficulties</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Language</label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                >
                  <option value="ALL">All Languages</option>
                  <option value="EN">English Only</option>
                  <option value="TA">Tamil (தமிழ்)</option>
                  <option value="HI">Hindi (हिन्दी)</option>
                  <option value="ML">Malayalam (മലയാളം)</option>
                  <option value="TE">Telugu (తెలుగు)</option>
                  <option value="KN">Kannada (ಕನ್ನಡ)</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Questions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {loading ? (
              <div className="p-12 text-center space-y-4">
                <RefreshCw className="w-8 h-8 text-[#123B7A] animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-600">Loading Question Bank repository...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No questions found</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  No questions match your current filters. Adjust your search or click "+ Add Question" to create one.
                </p>
                <Link
                  href="/examiner/question-bank/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#123B7A] text-white text-xs font-bold hover:bg-[#1E4B94] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Question</span>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 w-12">#</th>
                      <th className="py-3.5 px-4 min-w-[280px]">Question</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Subject</th>
                      <th className="py-3.5 px-4">Topic</th>
                      <th className="py-3.5 px-4">Difficulty</th>
                      <th className="py-3.5 px-4">Marks</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredQuestions.map((q, idx) => {
                      const subjectObj = subjects.find(s => s.id === q.subject_id);
                      const topicObj = subjectObj?.topics?.find((t: any) => t.id === q.topic_id);

                      const isArchived = q.status === "ARCHIVED";

                      return (
                        <tr
                          key={q.id}
                          className={`hover:bg-slate-50/70 transition-colors ${isArchived ? "opacity-60 bg-slate-50/30" : ""}`}
                        >
                          <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 line-clamp-2 max-w-md">
                              {q.question_en}
                            </div>
                            {/* Multilingual indicator badges */}
                            <div className="flex items-center gap-1.5 mt-1">
                              {q.question_ta && <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">தமிழ்</span>}
                              {q.question_hi && <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-50 text-orange-700 font-bold border border-orange-200">हिन्दी</span>}
                              {q.question_ml && <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">മലയാളം</span>}
                              {q.question_te && <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">తెలుగు</span>}
                              {q.question_kn && <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-50 text-cyan-700 font-bold border border-cyan-200">ಕನ್ನಡ</span>}
                              {q.tags && q.tags.length > 0 && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  #{q.tags.slice(0, 2).join(", ")}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {q.question_type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs font-semibold text-slate-600">
                            {subjectObj ? subjectObj.name : "Computer Science"}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                            {topicObj ? topicObj.name : "—"}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                q.difficulty === "EASY"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : q.difficulty === "HARD"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {q.difficulty}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs font-bold text-slate-800 font-mono">
                            {q.marks} {q.negative_marks > 0 && <span className="text-rose-500 font-normal">(-{q.negative_marks})</span>}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                q.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : q.status === "DRAFT"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {q.status || "ACTIVE"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Preview Drawer */}
                              <button
                                onClick={() => {
                                  setPreviewQuestion(q);
                                  setPreviewRoleView("student");
                                }}
                                title="Preview Question"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#123B7A] hover:bg-blue-50 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Duplicate */}
                              <button
                                onClick={() => handleDuplicate(q.id)}
                                disabled={actionLoading === q.id}
                                title="Duplicate Question"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              {/* Archive or Delete */}
                              <button
                                onClick={() => handleArchiveOrDelete(q.id)}
                                disabled={actionLoading === q.id || isArchived}
                                title={isArchived ? "Archived" : "Archive Question"}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* QUESTION PREVIEW DRAWER / MODAL */}
      <AnimatePresence>
        {previewQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewQuestion(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#123B7A] text-white">
                      {previewQuestion.question_type}
                    </span>
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      {previewQuestion.marks} Marks
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">Question Preview</h3>
                </div>

                <div className="flex items-center gap-2">
                  {/* Toggle student vs examiner view */}
                  <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-bold">
                    <button
                      onClick={() => setPreviewRoleView("student")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${previewRoleView === "student" ? "bg-[#123B7A] text-white" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      Student View
                    </button>
                    <button
                      onClick={() => setPreviewRoleView("examiner")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${previewRoleView === "examiner" ? "bg-[#123B7A] text-white" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      Examiner Key
                    </button>
                  </div>

                  <button
                    onClick={() => setPreviewQuestion(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Notice for student view */}
                {previewRoleView === "student" && (
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>This shows exactly how the candidate will see this question during an active examination. Correct answers and grading rubrics are hidden.</span>
                  </div>
                )}

                {/* Question Prompt */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Prompt</span>
                  <div className="text-base font-bold text-slate-900 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {previewQuestion.question_en}
                  </div>
                </div>

                {/* Multilingual translations if present */}
                {(previewQuestion.question_ta || previewQuestion.question_hi || previewQuestion.question_ml || previewQuestion.question_te || previewQuestion.question_kn) && (
                  <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Translations</span>
                    {previewQuestion.question_ta && (
                      <div className="text-sm font-medium text-slate-700">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mr-2 border border-amber-200">Tamil</span>
                        {previewQuestion.question_ta}
                      </div>
                    )}
                    {previewQuestion.question_hi && (
                      <div className="text-sm font-medium text-slate-700">
                        <span className="text-[10px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded mr-2 border border-orange-200">Hindi</span>
                        {previewQuestion.question_hi}
                      </div>
                    )}
                    {previewQuestion.question_ml && (
                      <div className="text-sm font-medium text-slate-700">
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mr-2 border border-purple-200">Malayalam</span>
                        {previewQuestion.question_ml}
                      </div>
                    )}
                    {previewQuestion.question_te && (
                      <div className="text-sm font-medium text-slate-700">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded mr-2 border border-indigo-200">Telugu</span>
                        {previewQuestion.question_te}
                      </div>
                    )}
                    {previewQuestion.question_kn && (
                      <div className="text-sm font-medium text-slate-700">
                        <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded mr-2 border border-cyan-200">Kannada</span>
                        {previewQuestion.question_kn}
                      </div>
                    )}
                  </div>
                )}

                {/* MCQ / Multi-select options */}
                {(previewQuestion.question_type === "MCQ" || previewQuestion.question_type === "MULTI_SELECT") && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Options</span>
                    <div className="space-y-2">
                      {(previewQuestion.options || []).map((opt: any) => {
                        const isCorrect = opt.is_correct;
                        const showHighlight = previewRoleView === "examiner" && isCorrect;

                        return (
                          <div
                            key={opt.id || opt.option_key}
                            className={`p-3.5 rounded-xl border flex items-center justify-between text-sm transition-all ${
                              showHighlight
                                ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                                : "bg-white border-slate-200 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                showHighlight ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                              }`}>
                                {opt.option_key}
                              </span>
                              <span>{opt.text_en}</span>
                            </div>
                            {showHighlight && (
                              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                <Check className="w-4 h-4" /> Correct Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Short / Long Answer */}
                {(previewQuestion.question_type === "SHORT_ANSWER" || previewQuestion.question_type === "LONG_ANSWER") && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Answer Input Area (Student)</span>
                    <div className="h-28 bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3 text-xs text-slate-400 font-mono">
                      [ Candidate text response field will appear here ]
                    </div>

                    {previewRoleView === "examiner" && (
                      <div className="space-y-3 pt-2">
                        {previewQuestion.model_answer && (
                          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                            <span className="text-xs font-bold uppercase text-amber-800">Model Answer (Examiner Only)</span>
                            <p className="text-xs text-slate-800 leading-relaxed">{previewQuestion.model_answer}</p>
                          </div>
                        )}
                        {previewQuestion.rubric && (
                          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                            <span className="text-xs font-bold uppercase text-blue-800">Evaluation Rubric</span>
                            <div className="space-y-1">
                              {previewQuestion.rubric.map((r: any, i: number) => (
                                <div key={i} className="flex justify-between text-xs text-slate-700">
                                  <span>{r.criteria || r.concept}</span>
                                  <span className="font-bold font-mono">{r.marks || r.weight} Marks</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Image Upload question preview */}
                {previewQuestion.question_type === "IMAGE_UPLOAD" && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Image Upload Field</span>
                    <div className="p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-center space-y-2">
                      <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-600">Candidate upload prompt: JPEG, PNG, WEBP (Max 10MB)</p>
                      <p className="text-[11px] text-slate-400">Thumbnails and OCR pre-processing enabled</p>
                    </div>
                  </div>
                )}

                {/* Coding question preview */}
                {previewQuestion.question_type === "CODING" && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Coding Workspace</span>
                    <div className="bg-slate-900 rounded-xl p-4 text-emerald-400 font-mono text-xs">
                      {previewQuestion.coding_starter_code || "// Write code here\nfunction solution() {\n  return 0;\n}"}
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
                <button
                  onClick={() => setPreviewQuestion(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
