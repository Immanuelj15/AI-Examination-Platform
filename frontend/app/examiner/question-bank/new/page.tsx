"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, CheckCircle2, CheckSquare,
  FileText, Image as ImageIcon, Code2, Save, Eye, AlertCircle,
  Check, Sparkles, RefreshCw, X, HelpCircle, Upload, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

const QUESTION_TYPES = [
  { id: "MCQ", label: "Multiple Choice (MCQ)", desc: "Single correct option among multiple choices" },
  { id: "MULTI_SELECT", label: "Multi-Select", desc: "One or more correct options allowed" },
  { id: "SHORT_ANSWER", label: "Short Answer", desc: "Brief textual answer evaluated with keywords" },
  { id: "LONG_ANSWER", label: "Long Answer", desc: "Detailed essay evaluated with structured rubrics" },
  { id: "IMAGE_UPLOAD", label: "Image / Diagram Upload", desc: "Handwritten diagrams, circuit schematics, or math work" },
  { id: "CODING", label: "Coding Problem", desc: "Programming task with sample test cases" }
];

const LANGUAGES = [
  { id: "en", label: "English", native: "English" },
  { id: "ta", label: "Tamil", native: "தமிழ்" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
  { id: "ml", label: "Malayalam", native: "മലയാളം" },
  { id: "te", label: "Telugu", native: "తెలుగు" },
  { id: "kn", label: "Kannada", native: "ಕನ್ನಡ" }
];

export default function NewQuestionPage() {
  const router = useRouter();

  // Core Form State
  const [questionType, setQuestionType] = useState<string>("MCQ");
  const [bankId, setBankId] = useState<string>("");
  const [subjectId, setSubjectId] = useState<string>("1");
  const [topicId, setTopicId] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("MEDIUM");
  const [marks, setMarks] = useState<number>(2.0);
  const [negativeMarks, setNegativeMarks] = useState<number>(0.5);
  const [explanation, setExplanation] = useState<string>("");
  const [tagInput, setTagInput] = useState<string>("java, collections");
  const [status, setStatus] = useState<string>("ACTIVE");

  // Multilingual Question Prompts
  const [activeLangTab, setActiveLangTab] = useState<string>("en");
  const [questionTexts, setQuestionTexts] = useState({
    en: "",
    ta: "",
    hi: "",
    ml: "",
    te: "",
    kn: ""
  });

  // MCQ & Multi-select Options
  const [options, setOptions] = useState([
    { key: "A", text_en: "", is_correct: true },
    { key: "B", text_en: "", is_correct: false },
    { key: "C", text_en: "", is_correct: false },
    { key: "D", text_en: "", is_correct: false }
  ]);

  // Short & Long Answer
  const [modelAnswer, setModelAnswer] = useState<string>("");
  const [keywords, setKeywords] = useState<string>("");
  const [rubricItems, setRubricItems] = useState([
    { criteria: "Concept Understanding", marks: 1.0 },
    { criteria: "Explanation Clarity", marks: 0.5 },
    { criteria: "Examples / Edge Cases", marks: 0.5 }
  ]);

  // Image Upload Question specific
  const [imageInstructions, setImageInstructions] = useState<string>("Please clearly write the diagram or mathematical proof on clean paper and upload a photo.");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Coding Question specific
  const [codingStarter, setCodingStarter] = useState<string>("def solution():\n    # Implement here\n    pass");
  const [codingLanguage, setCodingLanguage] = useState<string>("python");
  const [testCases, setTestCases] = useState([
    { input: "5\n1 2 3 4 5", output: "15", is_hidden: false }
  ]);

  // Dropdown options from backend
  const [subjects, setSubjects] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Autosave Status
  const [autosaveStatus, setAutosaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const isDirty = useRef(false);

  // Preview Drawer Modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewRole, setPreviewRole] = useState<"student" | "examiner">("student");

  // Load subjects and banks
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const token = localStorage.getItem("evalora_token");
        const headers = { Authorization: `Bearer ${token}` };

        const [sRes, bRes] = await Promise.all([
          fetch(`${API_BASE}/questions/subjects`, { headers }),
          fetch(`${API_BASE}/questions/banks`, { headers })
        ]);

        if (sRes.ok) {
          const sData = await sRes.json();
          setSubjects(sData);
          if (sData.length > 0 && !subjectId) {
            setSubjectId(String(sData[0].id));
          }
        }
        if (bRes.ok) {
          const bData = await bRes.json();
          setBanks(bData);
        }
      } catch (e) {
        console.error("Failed to load question metadata:", e);
      }
    };
    fetchMetadata();
  }, []);

  // Set dirty flag when form changes
  const markDirty = () => {
    isDirty.current = true;
    setAutosaveStatus("saving");
    const t = setTimeout(() => {
      setAutosaveStatus("saved");
    }, 1200);
    return () => clearTimeout(t);
  };

  // Option handlers for MCQ / Multi-select
  const handleOptionTextChange = (idx: number, val: string) => {
    markDirty();
    const updated = [...options];
    updated[idx].text_en = val;
    setOptions(updated);
  };

  const handleToggleCorrectOption = (idx: number) => {
    markDirty();
    if (questionType === "MCQ") {
      // Radio behavior: exactly one correct
      const updated = options.map((opt, i) => ({
        ...opt,
        is_correct: i === idx
      }));
      setOptions(updated);
    } else {
      // Checkbox behavior: toggle current
      const updated = [...options];
      updated[idx].is_correct = !updated[idx].is_correct;
      setOptions(updated);
    }
  };

  const handleAddOption = () => {
    markDirty();
    const nextChar = String.fromCharCode(65 + options.length);
    setOptions([...options, { key: nextChar, text_en: "", is_correct: false }]);
  };

  const handleRemoveOption = (idx: number) => {
    if (options.length <= 2) {
      alert("At least 2 options are required.");
      return;
    }
    markDirty();
    const updated = options.filter((_, i) => i !== idx).map((opt, i) => ({
      ...opt,
      key: String.fromCharCode(65 + i)
    }));
    setOptions(updated);
  };

  // Rubric Item handlers
  const handleAddRubricItem = () => {
    markDirty();
    setRubricItems([...rubricItems, { criteria: "", marks: 1.0 }]);
  };

  const handleRemoveRubricItem = (idx: number) => {
    markDirty();
    setRubricItems(rubricItems.filter((_, i) => i !== idx));
  };

  // Real Image Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Only JPEG, PNG, and WEBP image files are supported.");
      return;
    }

    setUploadingImage(true);
    try {
      const token = localStorage.getItem("evalora_token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/questions/upload-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setUploadedImageUrl(data.url);
        markDirty();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to upload image.");
      }
    } catch (err) {
      alert("Network error while uploading image.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!questionTexts.en.trim()) {
      newErrors["question_en"] = "Question prompt (English) is required.";
    }

    if (marks <= 0) {
      newErrors["marks"] = "Marks must be greater than 0.";
    }

    if (questionType === "MCQ") {
      if (options.length < 2) {
        newErrors["options"] = "At least 2 options are required.";
      }
      const emptyOpt = options.some(o => !o.text_en.trim());
      if (emptyOpt) {
        newErrors["options"] = "All option texts must be filled.";
      }
      const correctCount = options.filter(o => o.is_correct).length;
      if (correctCount !== 1) {
        newErrors["options"] = "Please select exactly one correct option.";
      }
    } else if (questionType === "MULTI_SELECT") {
      if (options.length < 2) {
        newErrors["options"] = "At least 2 options are required.";
      }
      const emptyOpt = options.some(o => !o.text_en.trim());
      if (emptyOpt) {
        newErrors["options"] = "All option texts must be filled.";
      }
      const correctCount = options.filter(o => o.is_correct).length;
      if (correctCount < 1) {
        newErrors["options"] = "Please select at least one correct option.";
      }
    } else if (questionType === "SHORT_ANSWER") {
      if (!modelAnswer.trim()) {
        newErrors["model_answer"] = "Model answer is required for short answer evaluation.";
      }
    } else if (questionType === "LONG_ANSWER") {
      if (!modelAnswer.trim()) {
        newErrors["model_answer"] = "Model answer is required for rubric guidance.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save Question payload builder
  const buildPayload = (forceStatus?: string) => {
    const tagsArray = tagInput.split(",").map(t => t.trim()).filter(Boolean);

    let formattedOptions: any[] = [];
    if (questionType === "MCQ" || questionType === "MULTI_SELECT") {
      formattedOptions = options.map(opt => ({
        option_key: opt.key,
        text_en: opt.text_en,
        is_correct: opt.is_correct
      }));
    }

    return {
      bank_id: bankId ? parseInt(bankId) : null,
      subject_id: subjectId ? parseInt(subjectId) : null,
      topic_id: topicId ? parseInt(topicId) : null,
      question_type: questionType,
      difficulty,
      marks: parseFloat(String(marks)),
      negative_marks: parseFloat(String(negativeMarks || 0)),
      question_en: questionTexts.en,
      question_ta: questionTexts.ta || null,
      question_hi: questionTexts.hi || null,
      question_ml: questionTexts.ml || null,
      question_te: questionTexts.te || null,
      question_kn: questionTexts.kn || null,
      model_answer: modelAnswer || null,
      explanation: explanation || null,
      rubric: questionType === "LONG_ANSWER" ? rubricItems : null,
      coding_starter_code: questionType === "CODING" ? codingStarter : null,
      coding_language: questionType === "CODING" ? codingLanguage : null,
      coding_test_cases: questionType === "CODING" ? testCases : null,
      tags: tagsArray,
      status: forceStatus || status,
      options: formattedOptions
    };
  };

  // Submission handler
  const handleSave = async (mode: "save" | "draft" | "another") => {
    if (mode !== "draft") {
      if (!validateForm()) {
        setFeedback({ type: "error", text: "Unable to create question. Please check the highlighted fields." });
        return;
      }
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const token = localStorage.getItem("evalora_token");
      const targetStatus = mode === "draft" ? "DRAFT" : "ACTIVE";
      const payload = buildPayload(targetStatus);

      const res = await fetch(`${API_BASE}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        isDirty.current = false;
        if (mode === "another") {
          setFeedback({ type: "success", text: "✓ Question created successfully. You can now add another." });
          // Reset form fields
          setQuestionTexts({ en: "", ta: "", hi: "", ml: "", te: "", kn: "" });
          setModelAnswer("");
          setExplanation("");
          setUploadedImageUrl("");
          setOptions([
            { key: "A", text_en: "", is_correct: true },
            { key: "B", text_en: "", is_correct: false },
            { key: "C", text_en: "", is_correct: false },
            { key: "D", text_en: "", is_correct: false }
          ]);
        } else {
          router.push("/examiner/question-bank");
        }
      } else {
        const err = await res.json();
        setFeedback({ type: "error", text: err.detail || "Failed to save question." });
      }
    } catch (e) {
      setFeedback({ type: "error", text: "Network error saving question. Please check backend connection." });
    } finally {
      setSubmitting(false);
    }
  };

  // Find selected subject's topics
  const currentSubjectObj = subjects.find(s => String(s.id) === subjectId);
  const availableTopics = currentSubjectObj ? currentSubjectObj.topics || [] : [];

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden select-none">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-4">
            <Link
              href="/examiner/question-bank"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Assessment Question</h1>
                {/* Autosave status indicator */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                  {autosaveStatus === "saving" && (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin text-[#123B7A]" />
                      <span>Saving draft...</span>
                    </>
                  )}
                  {autosaveStatus === "saved" && (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Draft Saved</span>
                    </>
                  )}
                  {autosaveStatus === "idle" && (
                    <span className="text-slate-400">Ready</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">Configure question parameters, multilingual translations and grading rubrics.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setPreviewRole("student");
                setShowPreview(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview Question</span>
            </button>

            <button
              onClick={() => handleSave("draft")}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>Save Draft</span>
            </button>

            <button
              onClick={() => handleSave("another")}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#123B7A]/30 bg-blue-50/50 hover:bg-blue-50 text-[#123B7A] text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save & Add Another</span>
            </button>

            <button
              onClick={() => handleSave("save")}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#123B7A] hover:bg-[#1E4B94] text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Question</span>
            </button>
          </div>
        </header>

        {/* Feedback Alert Banner */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`px-8 py-3 text-sm font-semibold flex items-center justify-between border-b ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{feedback.text}</span>
              </div>
              <button onClick={() => setFeedback(null)} className="p-1 hover:bg-black/5 rounded">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* SECTION 1: QUESTION TYPE SELECTION */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Question Type <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-400 mb-3">Choose the format of this assessment question</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {QUESTION_TYPES.map((t) => {
                  const selected = questionType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setQuestionType(t.id);
                        markDirty();
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        selected
                          ? "bg-blue-50/70 border-[#123B7A] ring-1 ring-[#123B7A] shadow-xs"
                          : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${selected ? "text-[#123B7A]" : "text-slate-800"}`}>
                          {t.label}
                        </span>
                        {selected && <Check className="w-3.5 h-3.5 text-[#123B7A]" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                        {t.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: COMMON QUESTION METADATA */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Assessment Metadata
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Question Bank */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Question Bank
                </label>
                <select
                  value={bankId}
                  onChange={(e) => {
                    setBankId(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                >
                  <option value="">General Repository (Unassigned)</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <select
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    setTopicId("");
                    markDirty();
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Topic
                </label>
                <select
                  value={topicId}
                  onChange={(e) => {
                    setTopicId(e.target.value);
                    markDirty();
                  }}
                  disabled={!subjectId}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A] disabled:opacity-50"
                >
                  <option value="">Select Topic (Optional)</option>
                  {availableTopics.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Difficulty Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value);
                    markDirty();
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              {/* Marks */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Marks Awarded <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={marks}
                  onChange={(e) => {
                    setMarks(parseFloat(e.target.value) || 0);
                    markDirty();
                  }}
                  className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none ${
                    errors["marks"] ? "border-rose-400 bg-rose-50" : "border-slate-200 focus:ring-1 focus:ring-[#123B7A]"
                  }`}
                />
                {errors["marks"] && <p className="text-xs text-rose-500 mt-1">{errors["marks"]}</p>}
              </div>

              {/* Negative Marks */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Negative Marks (Penalty)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={negativeMarks}
                  onChange={(e) => {
                    setNegativeMarks(parseFloat(e.target.value) || 0);
                    markDirty();
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Classification Tags
              </label>
              <input
                type="text"
                placeholder="Comma-separated tags (e.g. arrays, sorting, data structures)"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  markDirty();
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
              />
            </div>
          </div>

          {/* SECTION 3: MULTILINGUAL QUESTION TEXT */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Question Prompt & Regional Languages
                </h3>
                <p className="text-xs text-slate-400">English prompt is required; translations are optional.</p>
              </div>

              {/* Language Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {LANGUAGES.map(l => {
                  const active = activeLangTab === l.id;
                  const hasContent = Boolean(questionTexts[l.id as keyof typeof questionTexts]);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setActiveLangTab(l.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative ${
                        active
                          ? "bg-[#123B7A] text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                      }`}
                    >
                      {l.native}
                      {hasContent && !active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1 right-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Active Language Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Question Prompt ({LANGUAGES.find(l => l.id === activeLangTab)?.label})
                  {activeLangTab === "en" && <span className="text-rose-500 ml-1">*</span>}
                </label>
                {activeLangTab !== "en" && (
                  <span className="text-[11px] text-slate-400">Optional Translation</span>
                )}
              </div>

              <textarea
                rows={4}
                value={questionTexts[activeLangTab as keyof typeof questionTexts]}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuestionTexts(prev => ({ ...prev, [activeLangTab]: val }));
                  markDirty();
                }}
                placeholder={
                  activeLangTab === "en"
                    ? "Enter question prompt in English (e.g. What is the time complexity of Binary Search?)"
                    : `Enter translation in ${LANGUAGES.find(l => l.id === activeLangTab)?.label}...`
                }
                className={`w-full p-3.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none ${
                  activeLangTab === "en" && errors["question_en"]
                    ? "border-rose-400 bg-rose-50"
                    : "border-slate-200 focus:ring-1 focus:ring-[#123B7A]"
                }`}
              />
              {activeLangTab === "en" && errors["question_en"] && (
                <p className="text-xs text-rose-500 mt-1">{errors["question_en"]}</p>
              )}
            </div>
          </div>

          {/* SECTION 4: DYNAMIC QUESTION TYPE SPECIFIC FIELDS */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            {/* TYPE: MCQ OR MULTI-SELECT */}
            {(questionType === "MCQ" || questionType === "MULTI_SELECT") && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {questionType === "MCQ" ? "Multiple Choice Options" : "Multi-Select Options"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {questionType === "MCQ"
                        ? "Select exactly one option as the correct answer"
                        : "Select all valid options as correct answers"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#123B7A] hover:bg-blue-100 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Option</span>
                  </button>
                </div>

                {errors["options"] && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errors["options"]}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {options.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                        opt.is_correct
                          ? "bg-emerald-50/70 border-emerald-300"
                          : "bg-slate-50/50 border-slate-200"
                      }`}
                    >
                      {/* Checkbox or Radio */}
                      <button
                        type="button"
                        onClick={() => handleToggleCorrectOption(idx)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                          opt.is_correct
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-white border border-slate-300 text-slate-600 hover:border-slate-400"
                        }`}
                        title={opt.is_correct ? "Correct Option" : "Click to mark as correct"}
                      >
                        {opt.is_correct ? <Check className="w-4 h-4" /> : opt.key}
                      </button>

                      {/* Option text */}
                      <input
                        type="text"
                        placeholder={`Option ${opt.key} text...`}
                        value={opt.text_en}
                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                      />

                      {/* Delete Option button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        disabled={options.length <= 2}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TYPE: SHORT ANSWER */}
            {questionType === "SHORT_ANSWER" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Short Answer Evaluation Criteria
                </h3>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Model / Expected Answer <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={modelAnswer}
                    onChange={(e) => {
                      setModelAnswer(e.target.value);
                      markDirty();
                    }}
                    placeholder="Provide canonical expected answer for AI evaluation comparison..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                  />
                  {errors["model_answer"] && <p className="text-xs text-rose-500 mt-1">{errors["model_answer"]}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Expected Key Concepts & Keywords
                  </label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => {
                      setKeywords(e.target.value);
                      markDirty();
                    }}
                    placeholder="e.g. redundancy, 3NF, functional dependency, integrity"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                  />
                </div>
              </div>
            )}

            {/* TYPE: LONG ANSWER */}
            {questionType === "LONG_ANSWER" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Subjective Evaluation & Rubric
                </h3>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Model Answer / Comprehensive Response <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={modelAnswer}
                    onChange={(e) => {
                      setModelAnswer(e.target.value);
                      markDirty();
                    }}
                    placeholder="Enter full model answer covering all core points expected from the candidate..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                  />
                  {errors["model_answer"] && <p className="text-xs text-rose-500 mt-1">{errors["model_answer"]}</p>}
                </div>

                {/* Rubric Items Builder */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Evaluation Rubric Breakdown
                    </label>
                    <button
                      type="button"
                      onClick={handleAddRubricItem}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-[#123B7A] hover:bg-blue-100 text-xs font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Rubric Dimension</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {rubricItems.map((r, i) => (
                      <div key={i} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <input
                          type="text"
                          value={r.criteria}
                          onChange={(e) => {
                            const updated = [...rubricItems];
                            updated[i].criteria = e.target.value;
                            setRubricItems(updated);
                            markDirty();
                          }}
                          placeholder="Criteria dimension (e.g. Concept understanding, Architecture, Examples)"
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500 font-bold">Marks:</span>
                          <input
                            type="number"
                            step="0.5"
                            min="0.5"
                            value={r.marks}
                            onChange={(e) => {
                              const updated = [...rubricItems];
                              updated[i].marks = parseFloat(e.target.value) || 0;
                              setRubricItems(updated);
                              markDirty();
                            }}
                            className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold font-mono text-slate-800"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRubricItem(i)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TYPE: IMAGE UPLOAD */}
            {questionType === "IMAGE_UPLOAD" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Handwritten / Diagram Answer Configuration
                </h3>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Candidate Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={imageInstructions}
                    onChange={(e) => {
                      setImageInstructions(e.target.value);
                      markDirty();
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
                  />
                </div>

                {/* Reference Diagram / Question Asset Upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Question Reference Diagram / Graphic (Optional)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />

                  {uploadedImageUrl ? (
                    <div className="relative p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                      <img
                        src={uploadedImageUrl}
                        alt="Question Diagram"
                        className="w-20 h-20 object-cover rounded-lg border border-slate-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800">Diagram Uploaded</p>
                        <p className="text-[11px] text-slate-400 truncate">{uploadedImageUrl}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImageUrl("");
                          markDirty();
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="w-full p-6 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-blue-50/50 hover:border-[#123B7A]/50 transition-colors text-center space-y-2"
                    >
                      <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">
                        {uploadingImage ? "Uploading diagram..." : "Click to upload reference image (JPEG, PNG, WEBP)"}
                      </p>
                      <p className="text-[11px] text-slate-400">Files up to 10MB will be processed and rendered to candidates</p>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TYPE: CODING */}
            {questionType === "CODING" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Coding Problem Environment
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Programming Language
                    </label>
                    <select
                      value={codingLanguage}
                      onChange={(e) => {
                        setCodingLanguage(e.target.value);
                        markDirty();
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="python">Python 3</option>
                      <option value="javascript">JavaScript / TypeScript</option>
                      <option value="java">Java 17</option>
                      <option value="cpp">C++ (GCC 11)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Starter Code Template
                  </label>
                  <textarea
                    rows={6}
                    value={codingStarter}
                    onChange={(e) => {
                      setCodingStarter(e.target.value);
                      markDirty();
                    }}
                    className="w-full p-3 bg-slate-900 text-emerald-400 font-mono rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* EXPLANATION / SOLUTION NOTES */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Solution Explanation (Shown to students after exam results published)
              </label>
              <textarea
                rows={2}
                value={explanation}
                onChange={(e) => {
                  setExplanation(e.target.value);
                  markDirty();
                }}
                placeholder="Provide conceptual justification or reference solution..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123B7A]"
              />
            </div>
          </div>
        </main>
      </div>

      {/* PREVIEW MODAL / DRAWER */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#123B7A] text-white">
                      {questionType}
                    </span>
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      {marks} Marks
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">Live Candidate Preview</h3>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-bold">
                    <button
                      onClick={() => setPreviewRole("student")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${previewRole === "student" ? "bg-[#123B7A] text-white" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      Student View
                    </button>
                    <button
                      onClick={() => setPreviewRole("examiner")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${previewRole === "examiner" ? "bg-[#123B7A] text-white" : "text-slate-600 hover:text-slate-900"}`}
                    >
                      Examiner Key
                    </button>
                  </div>

                  <button
                    onClick={() => setShowPreview(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {previewRole === "student" && (
                  <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-800 font-medium flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Candidate preview: Correct answers and rubric are hidden.</span>
                  </div>
                )}

                {/* Prompt */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Prompt</span>
                  <div className="text-base font-bold text-slate-900 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {questionTexts[activeLangTab as keyof typeof questionTexts] || questionTexts.en || "No question prompt entered yet."}
                  </div>
                </div>

                {/* Image Reference if uploaded */}
                {uploadedImageUrl && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reference Diagram</span>
                    <img src={uploadedImageUrl} alt="Reference" className="mt-2 max-h-60 rounded-xl border border-slate-300" />
                  </div>
                )}

                {/* Options */}
                {(questionType === "MCQ" || questionType === "MULTI_SELECT") && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Candidate Choice Options</span>
                    <div className="space-y-2">
                      {options.map((opt, i) => {
                        const showCorrect = previewRole === "examiner" && opt.is_correct;
                        return (
                          <div
                            key={i}
                            className={`p-3.5 rounded-xl border flex items-center justify-between text-sm ${
                              showCorrect
                                ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                                : "bg-white border-slate-200 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                                showCorrect ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                              }`}>
                                {opt.key}
                              </span>
                              <span>{opt.text_en || `Option ${opt.key}`}</span>
                            </div>
                            {showCorrect && (
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
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
                <button
                  onClick={() => setShowPreview(false)}
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
