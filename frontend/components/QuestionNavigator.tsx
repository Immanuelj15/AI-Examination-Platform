"use client";

import React from "react";
import { Flag, CheckCircle, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export interface QuestionStatusItem {
  index: number;
  id: number;
  isAnswered: boolean;
  isFlagged: boolean;
  section: string;
}

interface QuestionNavigatorProps {
  questions: QuestionStatusItem[];
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
}

export function QuestionNavigator({
  questions,
  currentIndex,
  onSelectQuestion
}: QuestionNavigatorProps) {
  const answeredCount = questions.filter((q) => q.isAnswered).length;
  const flaggedCount = questions.filter((q) => q.isFlagged).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col h-full select-none">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
          Question Navigator
        </h3>
        <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
          {answeredCount}/{questions.length} Answered
        </span>
      </div>

      {/* Legend with clear readable typography */}
      <div className="grid grid-cols-3 gap-2 py-3.5 border-b border-slate-100 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
          <span>Answered ({answeredCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-200 flex-shrink-0" />
          <span>Pending ({unansweredCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 flex-shrink-0" />
          <span>Flagged ({flaggedCount})</span>
        </div>
      </div>

      {/* Question Grid: 44px x 44px comfortable touch & click targets */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            let bgColor = "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200";

            if (q.isAnswered) {
              bgColor = "bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-700 shadow-sm";
            } else if (q.isFlagged) {
              bgColor = "bg-amber-400 text-slate-900 hover:bg-amber-500 border border-amber-500 shadow-sm";
            }

            const currentRing = isCurrent
              ? "ring-2 ring-[#2563EB] ring-offset-2 scale-[1.04] font-extrabold z-10"
              : "font-semibold";

            return (
              <motion.button
                key={q.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelectQuestion(idx)}
                className={`relative w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl text-[15px] flex items-center justify-center transition-all ${bgColor} ${currentRing}`}
                title={`Question ${idx + 1} (${q.section})`}
              >
                <span>{String(idx + 1).padStart(2, "0")}</span>
                {q.isFlagged && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                    <Flag className="w-2 h-2 text-slate-900 fill-slate-900" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
