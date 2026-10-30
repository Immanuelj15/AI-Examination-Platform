"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, AlertCircle,
  Clock, ShieldAlert, Sparkles, FileText, Users, Eye, Save,
  Calendar, Lock, Search, Filter, RefreshCw, X, ChevronRight,
  HelpCircle, CheckSquare, Upload, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

const WIZARD_STEPS = [
  { id: 1, label: "01 Basic Info" },
  { id: 2, label: "02 Question Selection" },
  { id: 3, label: "03 Exam Rules" },
  { id: 4, label: "04 Proctoring" },
  { id: 5, label: "05 Schedule & Candidates" },
  { id: 6, label: "06 Preview" },
  { id: 7, label: "07 Publish" }
];

export default function ExamCreationWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [showConfirmPublish, setShowConfirmPublish] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    code: `EXAM-${Math.floor(1000 + Math.random() * 9000)}`,
    description: "",
    subject_id: "1",
    category: "Technical Assessment",
    instructions: "• Keep your camera active throughout the assessment.\n• Do not switch tabs or exit fullscreen mode.\n• All questions are evaluated against server-side timers.",
    duration_minutes: 60,
    total_marks: 50.0,
    passing_marks: 20.0,
    negative_marking: true,
    negative_mark_penalty: 0.5,
    shuffle_questions: true,
    shuffle_options: true,
    allow_previous: true,
    allow_flagging: true,
    auto_submit: true,
    // Proctoring
    camera_required: true,
    mic_required: false,
    face_detection_enabled: true,
    multi_face_detection_enabled: true,
    gaze_detection_enabled: true,
    tab_switch_detection_enabled: true,
    fullscreen_required: true,
    proctor_action: "WARN_FLAG", // WARN_FLAG, PAUSE, TERMINATE
    // Schedule
    start_date: new Date().toISOString().split("T")[0],
    start_time: "10:00",
    end_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    end_time: "18:00",
    timezone: "Asia/Kolkata",
    access_type: "INVITED_ONLY", // INVITED_ONLY, ORG_ONLY, PUBLIC
    // Selected Question IDs and Candidate IDs
    selected_question_ids: [] as number[],
    selected_student_ids: [] as number[]
  });

  // Backend Data Sources
  const [subjects, setSubjects] = useState<any[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Question Selection Tab / Mode
  const [selectionMode, setSelectionMode] = useState<"individual" | "auto">("individual");
  const [qSearch, setQSearch] = useState("");
  const [qSubjectFilter, setQSubjectFilter] = useState("");
  const [qDifficultyFilter, setQDifficultyFilter] = useState("");
  const [qTypeFilter, setQTypeFilter] = useState("ALL");

  // Auto Selection Configuration
  const [autoConfig, setAutoConfig] = useState({
    easy_count: 5,
    medium_count: 5,
    hard_count: 2
  });
  const [autoError, setAutoError] = useState<string | null>(null);

  // Candidate Selection Filters
  const [studentSearch, setStudentSearch] = useState("");

  // Load backend dependencies
  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const token = localStorage.getItem("evalora_token");
        const headers = { Authorization: `Bearer ${token}` };

        const [sRes, qRes, stRes] = await Promise.all([
          fetch(`${API_BASE}/questions/subjects`, { headers }),
          fetch(`${API_BASE}/questions`, { headers }),
          fetch(`${API_BASE}/examiner/students`, { headers })
        ]);

        if (sRes.ok) {
          const sData = await sRes.json();
          setSubjects(sData);
          if (sData.length > 0 && !formData.subject_id) {
            setFormData(prev => ({ ...prev, subject_id: String(sData[0].id) }));
          }
        }
        if (qRes.ok) {
          const qData = await qRes.json();
          setAvailableQuestions(qData);
          // By default, select first few active questions if none selected
          const activeIds = qData.filter((q: any) => q.status !== "ARCHIVED").slice(0, 5).map((q: any) => q.id);
          setFormData(prev => ({
            ...prev,
            selected_question_ids: activeIds,
            total_marks: qData.filter((q: any) => activeIds.includes(q.id)).reduce((acc: number, cur: any) => acc + (cur.marks || 0), 0)
          }));
        }
        if (stRes.ok) {
          const stData = await stRes.json();
          setAvailableStudents(stData);
          // By default, pre-select available student IDs
          setFormData(prev => ({
            ...prev,
            selected_student_ids: stData.map((s: any) => s.id)
          }));
        }
      } catch (e) {
        console.error("Failed to load exam wizard data:", e);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchDependencies();
  }, []);

  // Update total marks dynamically based on question selections
  useEffect(() => {
    const selectedObjs = availableQuestions.filter(q => formData.selected_question_ids.includes(q.id));
    const calculatedMarks = selectedObjs.reduce((acc, cur) => acc + (cur.marks || 0), 0);
    if (calculatedMarks > 0) {
      setFormData(prev => ({
        ...prev,
        total_marks: calculatedMarks,
        passing_marks: Math.min(prev.passing_marks, calculatedMarks) || Math.round(calculatedMarks * 0.4)
      }));
    }
  }, [formData.selected_question_ids, availableQuestions]);

  // Question Selection Helpers
  const handleToggleQuestion = (id: number) => {
    setFormData(prev => {
      const exists = prev.selected_question_ids.includes(id);
      const updated = exists
        ? prev.selected_question_ids.filter(x => x !== id)
        : [...prev.selected_question_ids, id];
      return { ...prev, selected_question_ids: updated };
    });
  };

  const handleSelectAllFilteredQuestions = (ids: number[]) => {
    setFormData(prev => {
      const set = new Set([...prev.selected_question_ids, ...ids]);
      return { ...prev, selected_question_ids: Array.from(set) };
    });
  };

  const handleClearSelectedQuestions = () => {
    setFormData(prev => ({ ...prev, selected_question_ids: [] }));
  };

  // Run Auto-select API
  const handleRunAutoSelect = async () => {
    setAutoError(null);
    try {
      const token = localStorage.getItem("evalora_token");
      const res = await fetch(`${API_BASE}/exams/auto-select-questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_id: parseInt(formData.subject_id),
          easy_count: autoConfig.easy_count,
          medium_count: autoConfig.medium_count,
          hard_count: autoConfig.hard_count
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFormData(prev => ({
          ...prev,
          selected_question_ids: data.selected_ids
        }));
        setSelectionMode("individual");
      } else {
        setAutoError(data.issues ? data.issues.join(" ") : (data.message || "Insufficient questions"));
      }
    } catch (e) {
      setAutoError("Failed to communicate with auto-selection engine.");
    }
  };

  // Candidate Selection Helpers
  const handleToggleStudent = (id: number) => {
    setFormData(prev => {
      const exists = prev.selected_student_ids.includes(id);
      const updated = exists
        ? prev.selected_student_ids.filter(x => x !== id)
        : [...prev.selected_student_ids, id];
      return { ...prev, selected_student_ids: updated };
    });
  };

  const handleToggleAllStudents = () => {
    if (formData.selected_student_ids.length === availableStudents.length) {
      setFormData(prev => ({ ...prev, selected_student_ids: [] }));
    } else {
      setFormData(prev => ({ ...prev, selected_student_ids: availableStudents.map(s => s.id) }));
    }
  };

  // Filtered Questions list
  const filteredQuestions = useMemo(() => {
    return availableQuestions.filter(q => {
      if (q.status === "ARCHIVED") return false;
      if (qTypeFilter !== "ALL" && q.question_type !== qTypeFilter) return false;
      if (qDifficultyFilter && q.difficulty !== qDifficultyFilter) return false;
      if (qSubjectFilter && String(q.subject_id) !== qSubjectFilter) return false;
      if (qSearch.trim()) {
        const s = qSearch.toLowerCase();
        return (q.question_en || "").toLowerCase().includes(s);
      }
      return true;
    });
  }, [availableQuestions, qTypeFilter, qDifficultyFilter, qSubjectFilter, qSearch]);

  // Filtered Students list
  const filteredStudents = useMemo(() => {
    return availableStudents.filter(s => {
      if (!studentSearch.trim()) return true;
      const q = studentSearch.toLowerCase();
      return (
        (s.full_name || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q)
      );
    });
  }, [availableStudents, studentSearch]);

  // Validation function
  const runValidation = (): string[] => {
    const issues: string[] = [];

    if (!formData.title.trim()) issues.push("Exam title is required.");
    if (!formData.code.trim()) issues.push("Exam access code is required.");
    if (formData.selected_question_ids.length === 0) issues.push("Add at least one question before publishing.");
    if (formData.total_marks <= 0) issues.push("Total marks must be greater than zero.");
    if (formData.passing_marks < 0) issues.push("Passing marks cannot be negative.");
    if (formData.passing_marks > formData.total_marks) issues.push("Passing score cannot exceed total marks.");
    if (formData.duration_minutes <= 0) issues.push("Duration must be greater than 0 minutes.");

    // Validate Schedule
    const startIso = new Date(`${formData.start_date}T${formData.start_time}:00`);
    const endIso = new Date(`${formData.end_date}T${formData.end_time}:00`);
    if (isNaN(startIso.getTime()) || isNaN(endIso.getTime())) {
      issues.push("Invalid exam schedule date/time.");
    } else if (endIso <= startIso) {
      issues.push("Exam end time must be after the start time.");
    }

    if (formData.access_type === "INVITED_ONLY" && formData.selected_student_ids.length === 0) {
      issues.push("Candidate access is set to Invited Only, but no candidates have been assigned.");
    }

    return issues;
  };

  // Handle Save Draft or Publish
  const handleSaveExam = async (status: "DRAFT" | "PUBLISHED") => {
    if (status === "PUBLISHED") {
      const issues = runValidation();
      if (issues.length > 0) {
        setValidationIssues(issues);
        setCurrentStep(7);
        return;
      }
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("evalora_token");
      const startTime = new Date(`${formData.start_date}T${formData.start_time}:00`).toISOString();
      const endTime = new Date(`${formData.end_date}T${formData.end_time}:00`).toISOString();

      const payload = {
        title: formData.title,
        code: formData.code,
        description: formData.description,
        subject_id: parseInt(formData.subject_id),
        instructions: formData.instructions,
        duration_minutes: formData.duration_minutes,
        total_marks: formData.total_marks,
        passing_marks: formData.passing_marks,
        negative_marking: formData.negative_marking,
        shuffle_questions: formData.shuffle_questions,
        shuffle_options: formData.shuffle_options,
        camera_required: formData.camera_required,
        mic_required: formData.mic_required,
        face_detection_enabled: formData.face_detection_enabled,
        gaze_detection_enabled: formData.gaze_detection_enabled,
        multi_face_detection_enabled: formData.multi_face_detection_enabled,
        tab_switch_detection_enabled: formData.tab_switch_detection_enabled,
        start_time: startTime,
        end_time: endTime,
        status: status,
        question_ids: formData.selected_question_ids,
        candidate_student_ids: formData.selected_student_ids
      };

      const res = await fetch(`${API_BASE}/exams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (status === "PUBLISHED") {
          setPublishSuccess(true);
          setTimeout(() => {
            router.push("/examiner/dashboard");
          }, 1800);
        } else {
          router.push("/examiner/dashboard");
        }
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to process exam.");
      }
    } catch (e) {
      alert("Network error communicating with assessment backend.");
    } finally {
      setSubmitting(false);
      setShowConfirmPublish(false);
    }
  };

  // Selected questions breakdown
  const selectedQuestionObjects = useMemo(() => {
    return availableQuestions.filter(q => formData.selected_question_ids.includes(q.id));
  }, [availableQuestions, formData.selected_question_ids]);

  const questionBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {
      MCQ: 0,
      MULTI_SELECT: 0,
      SHORT_ANSWER: 0,
      LONG_ANSWER: 0,
      IMAGE_UPLOAD: 0,
      CODING: 0
    };
    selectedQuestionObjects.forEach(q => {
      if (breakdown[q.question_type] !== undefined) {
        breakdown[q.question_type]++;
      }
    });
    return breakdown;
  }, [selectedQuestionObjects]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-4">
            <Link
              href="/examiner/dashboard"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Assessment Wizard</h1>
              <p className="text-xs text-slate-500 font-medium">Step {currentStep} of 7 — {WIZARD_STEPS.find(s => s.id === currentStep)?.label}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSaveExam("DRAFT")}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>Save Draft</span>
            </button>

            {currentStep < 7 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(prev + 1, 7))}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#123B7A] hover:bg-[#1E4B94] text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  const issues = runValidation();
                  if (issues.length > 0) {
                    setValidationIssues(issues);
                  } else {
                    setShowConfirmPublish(true);
                  }
                }}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Publish Exam</span>
              </button>
            )}
          </div>
        </header>

        {/* Wizard Step Progression Bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 min-w-max">
            {WIZARD_STEPS.map((s) => {
              const active = currentStep === s.id;
              const completed = currentStep > s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(s.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    active
                      ? "bg-[#123B7A] text-white shadow-xs"
                      : completed
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    active ? "bg-white text-[#123B7A]" : completed ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    {completed ? <Check className="w-2.5 h-2.5" /> : s.id}
                  </span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <main className="p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* STEP 1: BASIC INFORMATION */}
          {currentStep === 1 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Step 01 — Basic Assessment Information</h2>
                <p className="text-xs text-slate-500">Provide the title, code, subject, and instructions for candidate briefing.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Exam Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Full Stack Developer Assessment 2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                  />
                </div>

                {/* Exam Code */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Exam Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. CS-FS-2026"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Subject Domain <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Assessment Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="Technical Assessment">Technical Assessment</option>
                    <option value="Academic Semester Exam">Academic Semester Exam</option>
                    <option value="Recruitment Screening">Recruitment Screening</option>
                    <option value="Aptitude & Logical">Aptitude & Logical</option>
                  </select>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Description & Overview
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Assessment covering JavaScript, React, Node.js, SQL and fundamental web development concepts."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                  />
                </div>

                {/* Instructions */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Candidate Instructions
                  </label>
                  <textarea
                    rows={4}
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: QUESTION SELECTION */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Header card with selected counter and marks */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Step 02 — Question Selection</h2>
                  <p className="text-xs text-slate-500">Select questions individually or configure automatic pool distribution.</p>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Selected Questions</span>
                    <div className="text-sm font-bold text-[#123B7A]">
                      {formData.selected_question_ids.length} Questions
                    </div>
                  </div>
                  <div className="h-6 w-px bg-slate-300" />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">Calculated Marks</span>
                    <div className="text-sm font-bold text-emerald-700 font-mono">
                      {formData.total_marks} Marks
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode Selection Tabs */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectionMode("individual")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectionMode === "individual"
                      ? "bg-[#123B7A] text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Individual Question Selection
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode("auto")}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectionMode === "auto"
                      ? "bg-[#123B7A] text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Automatic Question Selection (Pool Distribution)
                </button>
              </div>

              {/* AUTO SELECTION PANEL */}
              {selectionMode === "auto" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#123B7A]" />
                    <h3 className="text-sm font-bold text-slate-900">Define Difficulty Distribution</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    The platform validates whether enough questions exist in your question repository before selecting them.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
                      <span className="text-xs font-bold text-emerald-800 uppercase">Easy Questions</span>
                      <input
                        type="number"
                        min="0"
                        value={autoConfig.easy_count}
                        onChange={(e) => setAutoConfig({ ...autoConfig, easy_count: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-sm font-bold font-mono"
                      />
                    </div>

                    <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1">
                      <span className="text-xs font-bold text-blue-800 uppercase">Medium Questions</span>
                      <input
                        type="number"
                        min="0"
                        value={autoConfig.medium_count}
                        onChange={(e) => setAutoConfig({ ...autoConfig, medium_count: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm font-bold font-mono"
                      />
                    </div>

                    <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-1">
                      <span className="text-xs font-bold text-rose-800 uppercase">Hard Questions</span>
                      <input
                        type="number"
                        min="0"
                        value={autoConfig.hard_count}
                        onChange={(e) => setAutoConfig({ ...autoConfig, hard_count: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-sm font-bold font-mono"
                      />
                    </div>
                  </div>

                  {autoError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{autoError}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleRunAutoSelect}
                      className="px-4 py-2 bg-[#123B7A] hover:bg-[#1E4B94] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                    >
                      Generate Question Set
                    </button>
                  </div>
                </div>
              )}

              {/* INDIVIDUAL QUESTION TABLE */}
              {selectionMode === "individual" && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search available questions..."
                        value={qSearch}
                        onChange={(e) => setQSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <select
                      value={qDifficultyFilter}
                      onChange={(e) => setQDifficultyFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="">All Difficulties</option>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>

                    <select
                      value={qTypeFilter}
                      onChange={(e) => setQTypeFilter(e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="ALL">All Types</option>
                      <option value="MCQ">MCQ</option>
                      <option value="MULTI_SELECT">Multi-Select</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                      <option value="LONG_ANSWER">Long Answer</option>
                      <option value="IMAGE_UPLOAD">Image Upload</option>
                      <option value="CODING">Coding</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleSelectAllFilteredQuestions(filteredQuestions.map(q => q.id))}
                      className="px-3 py-2 text-xs font-bold text-[#123B7A] bg-blue-50 hover:bg-blue-100 rounded-xl whitespace-nowrap"
                    >
                      Select All Filtered
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSelectedQuestions}
                      className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl whitespace-nowrap"
                    >
                      Clear Selection
                    </button>
                  </div>

                  {/* Table */}
                  <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-96">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">Select</th>
                          <th className="py-2.5 px-3">Question Prompt</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Difficulty</th>
                          <th className="py-2.5 px-3">Marks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredQuestions.map((q) => {
                          const isSelected = formData.selected_question_ids.includes(q.id);
                          return (
                            <tr
                              key={q.id}
                              onClick={() => handleToggleQuestion(q.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? "bg-blue-50/60 font-semibold" : "hover:bg-slate-50/70"
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // handled by row click
                                  className="w-4 h-4 rounded text-[#123B7A] focus:ring-[#123B7A]"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="line-clamp-2 text-slate-900">{q.question_en}</span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                                  {q.question_type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full font-bold ${
                                  q.difficulty === "EASY"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : q.difficulty === "HARD"
                                    ? "bg-rose-50 text-rose-700"
                                    : "bg-blue-50 text-blue-700"
                                }`}>
                                  {q.difficulty}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                                {q.marks}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Randomization Controls */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Question & Option Randomization</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.shuffle_questions}
                      onChange={(e) => setFormData({ ...formData, shuffle_questions: e.target.checked })}
                      className="w-4 h-4 rounded text-[#123B7A] focus:ring-[#123B7A]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Randomize Question Order</span>
                      <span className="text-[11px] text-slate-500">Each candidate receives deterministic pseudorandomized questions</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.shuffle_options}
                      onChange={(e) => setFormData({ ...formData, shuffle_options: e.target.checked })}
                      className="w-4 h-4 rounded text-[#123B7A] focus:ring-[#123B7A]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Randomize Options (MCQ / Multi-Select)</span>
                      <span className="text-[11px] text-slate-500">Shuffle option keys (A, B, C, D) per student paper</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: EXAM RULES */}
          {currentStep === 3 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Step 03 — Examination Timing & Rules</h2>
                <p className="text-xs text-slate-500">Configure duration, passing thresholds, negative penalties, and candidate navigation.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Duration (Minutes) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Authoritative server-side timer enforcement</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Passing Marks Threshold <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.passing_marks}
                    onChange={(e) => setFormData({ ...formData, passing_marks: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Navigation Flags */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Navigation & Submission Policies</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_previous}
                      onChange={(e) => setFormData({ ...formData, allow_previous: e.target.checked })}
                      className="w-4 h-4 rounded text-[#123B7A]"
                    />
                    <span className="text-xs font-semibold text-slate-800">Allow Previous Question</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allow_flagging}
                      onChange={(e) => setFormData({ ...formData, allow_flagging: e.target.checked })}
                      className="w-4 h-4 rounded text-[#123B7A]"
                    />
                    <span className="text-xs font-semibold text-slate-800">Allow Question Flagging</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.auto_submit}
                      onChange={(e) => setFormData({ ...formData, auto_submit: e.target.checked })}
                      className="w-4 h-4 rounded text-[#123B7A]"
                    />
                    <span className="text-xs font-semibold text-slate-800">Auto Submit on Timeout</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PROCTORING */}
          {currentStep === 4 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Step 04 — Advanced AI Proctoring Configuration</h2>
                <p className="text-xs text-slate-500">Configures MediaPipe face landmarker, multi-face presence, gaze angle and tab monitoring.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Webcam Camera Monitoring</span>
                    <span className="text-[11px] text-slate-500">Requires camera feed verification during test session</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.camera_required}
                    onChange={(e) => setFormData({ ...formData, camera_required: e.target.checked })}
                    className="w-5 h-5 rounded text-[#123B7A]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Face Presence Detection</span>
                    <span className="text-[11px] text-slate-500">Continuously verifies single face bounding in viewport</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.face_detection_enabled}
                    onChange={(e) => setFormData({ ...formData, face_detection_enabled: e.target.checked })}
                    className="w-5 h-5 rounded text-[#123B7A]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Multiple Face Detection</span>
                    <span className="text-[11px] text-slate-500">Flags when additional persons enter the candidate frame</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.multi_face_detection_enabled}
                    onChange={(e) => setFormData({ ...formData, multi_face_detection_enabled: e.target.checked })}
                    className="w-5 h-5 rounded text-[#123B7A]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Gaze & Head Yaw Monitoring</span>
                    <span className="text-[11px] text-slate-500">Monitors candidate gaze deviation from screen boundaries</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.gaze_detection_enabled}
                    onChange={(e) => setFormData({ ...formData, gaze_detection_enabled: e.target.checked })}
                    className="w-5 h-5 rounded text-[#123B7A]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Tab Switch & Focus Detection</span>
                    <span className="text-[11px] text-slate-500">Records event when candidate leaves exam tab</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.tab_switch_detection_enabled}
                    onChange={(e) => setFormData({ ...formData, tab_switch_detection_enabled: e.target.checked })}
                    className="w-5 h-5 rounded text-[#123B7A]"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Enforced Fullscreen Lock</span>
                    <span className="text-[11px] text-slate-500">Requires candidate to maintain browser fullscreen mode</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.fullscreen_required}
                    onChange={(e) => setFormData({ ...formData, fullscreen_required: e.target.checked })}
                    className="w-5 h-5 rounded text-[#123B7A]"
                  />
                </label>
              </div>

              {/* Proctor Actions */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Action on Repeated Violations</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="radio"
                      name="proctor_action"
                      checked={formData.proctor_action === "WARN_FLAG"}
                      onChange={() => setFormData({ ...formData, proctor_action: "WARN_FLAG" })}
                      className="text-[#123B7A]"
                    />
                    <span>Warn Candidate & Flag Log (Default)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="radio"
                      name="proctor_action"
                      checked={formData.proctor_action === "PAUSE"}
                      onChange={() => setFormData({ ...formData, proctor_action: "PAUSE" })}
                      className="text-[#123B7A]"
                    />
                    <span>Pause Exam Session</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="radio"
                      name="proctor_action"
                      checked={formData.proctor_action === "TERMINATE"}
                      onChange={() => setFormData({ ...formData, proctor_action: "TERMINATE" })}
                      className="text-[#123B7A]"
                    />
                    <span>Auto-Terminate on Severe Breach</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SCHEDULE & CANDIDATES */}
          {currentStep === 5 && (
            <div className="space-y-6">
              {/* Schedule card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900">Step 05 — Exam Schedule & Candidate Assignment</h2>
                  <p className="text-xs text-slate-500">Define accessibility windows and assign registered students.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Candidate Assignment Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Registered Candidate Roster</h3>
                    <p className="text-xs text-slate-500">
                      {formData.selected_student_ids.length} of {availableStudents.length} candidates selected
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleAllStudents}
                      className="px-3 py-1.5 bg-blue-50 text-[#123B7A] hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                    >
                      {formData.selected_student_ids.length === availableStudents.length ? "Deselect All" : "Select All Candidates"}
                    </button>
                  </div>
                </div>

                {/* Candidate search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate by name or email..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Student list */}
                <div className="border border-slate-200 rounded-xl overflow-y-auto max-h-60 divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No matching students found</div>
                  ) : (
                    filteredStudents.map((st) => {
                      const selected = formData.selected_student_ids.includes(st.id);
                      return (
                        <div
                          key={st.id}
                          onClick={() => handleToggleStudent(st.id)}
                          className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                            selected ? "bg-blue-50/50" : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-[#123B7A]"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900">{st.full_name}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{st.email}</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {st.role}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: PREVIEW */}
          {currentStep === 6 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Step 06 — Full Examination Summary & Preview</h2>
                <p className="text-xs text-slate-500">Review parameters before moving to validation and publishing.</p>
              </div>

              {/* Assessment card summary */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#123B7A] text-white shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">{formData.category}</span>
                    <h3 className="text-xl font-extrabold">{formData.title || "Untitled Assessment"}</h3>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-white/10 rounded-lg backdrop-blur-xs">
                    Code: {formData.code}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-blue-200 text-[11px] block">Duration</span>
                    <span className="font-bold text-white font-mono">{formData.duration_minutes} Mins</span>
                  </div>
                  <div>
                    <span className="text-blue-200 text-[11px] block">Total Questions</span>
                    <span className="font-bold text-white font-mono">{formData.selected_question_ids.length}</span>
                  </div>
                  <div>
                    <span className="text-blue-200 text-[11px] block">Total Marks</span>
                    <span className="font-bold text-white font-mono">{formData.total_marks} Marks</span>
                  </div>
                  <div>
                    <span className="text-blue-200 text-[11px] block">Passing Score</span>
                    <span className="font-bold text-white font-mono">{formData.passing_marks} Marks</span>
                  </div>
                </div>
              </div>

              {/* Question Breakdown by Type */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Question Format Breakdown</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(questionBreakdown).map(([type, count]) => (
                    <div key={type} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <span className="text-[10px] font-bold text-slate-400 block truncate">{type}</span>
                      <span className="text-base font-bold text-slate-900 font-mono">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proctoring & Security summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <span className="font-bold text-slate-800 block">Proctoring Configuration</span>
                  <p className="text-slate-600">Camera: {formData.camera_required ? "Enabled" : "Disabled"}</p>
                  <p className="text-slate-600">Face Landmarker: {formData.face_detection_enabled ? "Active" : "Off"}</p>
                  <p className="text-slate-600">Multi-Face & Gaze: {formData.multi_face_detection_enabled ? "Active" : "Off"}</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <span className="font-bold text-slate-800 block">Schedule & Candidates</span>
                  <p className="text-slate-600">Start: {formData.start_date} {formData.start_time}</p>
                  <p className="text-slate-600">End: {formData.end_date} {formData.end_time}</p>
                  <p className="text-slate-600">Candidates Assigned: {formData.selected_student_ids.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: VALIDATE & PUBLISH */}
          {currentStep === 7 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Step 07 — Pre-Publish Validation Checklist</h2>
                <p className="text-xs text-slate-500">Every requirement is checked before opening access to candidates.</p>
              </div>

              {/* Validation Issues Alert if any */}
              {validationIssues.length > 0 ? (
                <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <span>Exam cannot be published. Please resolve the following issues:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs text-rose-700">
                    {validationIssues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-3.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors"
                  >
                    Fix Issues in Form
                  </button>
                </div>
              ) : (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>All pre-publish checks passed successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Exam structure, question pool, schedules, and candidate roster are validated. You can safely publish.
                  </p>
                </div>
              )}

              {/* Publishing Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleSaveExam("DRAFT")}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
                >
                  Save as Incomplete Draft
                </button>

                <button
                  onClick={() => {
                    const issues = runValidation();
                    if (issues.length > 0) {
                      setValidationIssues(issues);
                    } else {
                      setShowConfirmPublish(true);
                    }
                  }}
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#123B7A] hover:bg-[#1E4B94] text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
                >
                  Publish Examination
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CONFIRM PUBLISH MODAL */}
      <AnimatePresence>
        {showConfirmPublish && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirmPublish(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 z-10"
            >
              <h3 className="text-base font-bold text-slate-900">Publish this examination?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Publishing will schedule this examination, create candidate roster access, and freeze the active question set.
                Candidates will be eligible to begin upon schedule opening.
              </p>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmPublish(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveExam("PUBLISHED")}
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-[#123B7A] hover:bg-[#1E4B94] text-white rounded-xl transition-colors shadow-sm"
                >
                  {submitting ? "Publishing..." : "Confirm & Publish"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PUBLISH SUCCESS OVERLAY */}
      <AnimatePresence>
        {publishSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#123B7A]/90 backdrop-blur-sm"
          >
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center space-y-4 max-w-sm w-full mx-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">✓ Exam Published Successfully</h3>
              <p className="text-xs text-slate-500">Redirecting to your Examiner Dashboard...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
