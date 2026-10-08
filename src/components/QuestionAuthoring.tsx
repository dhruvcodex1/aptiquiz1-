import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles, Save, Edit3, Table, Image, CheckCircle, FileText, RefreshCw, X } from 'lucide-react';
import { Question, QuestionSet, UserSettings } from '../types';

interface QuestionAuthoringProps {
  onSelectSetForRoom?: (set: QuestionSet) => void;
  settings: UserSettings;
}

export const QuestionAuthoring: React.FC<QuestionAuthoringProps> = ({
  onSelectSetForRoom,
  settings,
}) => {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [activeSet, setActiveSet] = useState<QuestionSet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // AI Generator Modal State
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiTopic, setAiTopic] = useState<'quantitative' | 'logical' | 'verbal' | 'data_interpretation'>('quantitative');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiCount, setAiCount] = useState<number>(3);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Editing Question Modal
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editIndex, setEditIndex] = useState<number>(-1);

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/question-sets');
      const data = await res.json();
      if (data.success && data.questionSets) {
        setSets(data.questionSets);
        if (!activeSet && data.questionSets.length > 0) {
          setActiveSet(data.questionSets[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewSet = () => {
    const newSet: QuestionSet = {
      id: `qs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: 'New Campus Placement Assessment',
      description: 'Custom placement aptitude assessment set.',
      createdAt: Date.now(),
      questions: [],
    };
    setActiveSet(newSet);
  };

  const handleSaveSet = async () => {
    if (!activeSet) return;
    if (!activeSet.title.trim()) {
      setMessage({ text: 'Please provide a title for the question set.', type: 'error' });
      return;
    }
    if (activeSet.questions.length === 0) {
      setMessage({ text: 'Please add at least 1 question to the set.', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/question-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeSet),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: 'Question set saved successfully!', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
        fetchSets();
      }
    } catch (e: any) {
      setMessage({ text: e.message || 'Failed saving question set.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSet = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question set?')) return;
    try {
      await fetch(`/api/question-sets/${id}`, { method: 'DELETE' });
      const updated = sets.filter(s => s.id !== id);
      setSets(updated);
      if (activeSet?.id === id) {
        setActiveSet(updated.length > 0 ? updated[0] : null);
      }
    } catch (e) {}
  };

  // Reorder questions
  const moveQuestion = (idx: number, direction: 'up' | 'down') => {
    if (!activeSet) return;
    const newQuestions = [...activeSet.questions];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newQuestions.length) return;

    const [moved] = newQuestions.splice(idx, 1);
    newQuestions.splice(targetIdx, 0, moved);

    setActiveSet({
      ...activeSet,
      questions: newQuestions,
    });
  };

  const removeQuestion = (idx: number) => {
    if (!activeSet) return;
    const newQuestions = activeSet.questions.filter((_, i) => i !== idx);
    setActiveSet({
      ...activeSet,
      questions: newQuestions,
    });
  };

  // AI Question Generation
  const handleGenerateAI = async () => {
    try {
      setAiLoading(true);
      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          difficulty: aiDifficulty,
          count: aiCount,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        if (activeSet) {
          setActiveSet({
            ...activeSet,
            questions: [...activeSet.questions, ...data.questions],
          });
        }
        setShowAiModal(false);
        setMessage({ text: `Generated and added ${data.questions.length} questions with AI!`, type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (e: any) {
      alert('AI generation failed: ' + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Open Question Editor Modal
  const openQuestionEditor = (q?: Question, idx?: number) => {
    if (q && typeof idx === 'number') {
      setEditingQuestion(JSON.parse(JSON.stringify(q)));
      setEditIndex(idx);
    } else {
      setEditingQuestion({
        id: `q-${Date.now()}`,
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        topic: 'quantitative',
        difficulty: 'medium',
        explanation: '',
      });
      setEditIndex(-1);
    }
  };

  const saveEditedQuestion = () => {
    if (!editingQuestion || !activeSet) return;
    if (!editingQuestion.text.trim()) {
      alert('Question statement is required.');
      return;
    }
    if (editingQuestion.options.some(o => !o.trim())) {
      alert('All 4 options must be filled.');
      return;
    }

    const newQuestions = [...activeSet.questions];
    if (editIndex >= 0) {
      newQuestions[editIndex] = editingQuestion;
    } else {
      newQuestions.push(editingQuestion);
    }

    setActiveSet({
      ...activeSet,
      questions: newQuestions,
    });
    setEditingQuestion(null);
  };

  return (
    <div className={`max-w-6xl mx-auto p-4 sm:p-6 space-y-6 ${settings.largeTextMode ? 'text-lg' : 'text-base'}`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide">
            Question Authoring & Assessment Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build, edit, reorder, and generate placement test questions using AI. Seed 15 placement questions included.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition-transform active:scale-95 shadow-md shadow-purple-600/20 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate with AI</span>
          </button>

          <button
            onClick={handleCreateNewSet}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition-transform active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Set</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid: Sets List on Left, Active Set on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved Sets Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Saved Question Sets ({sets.length})
          </span>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {sets.map((set) => (
              <div
                key={set.id}
                onClick={() => setActiveSet(set)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  activeSet?.id === set.id
                    ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-sm leading-snug">{set.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {set.questions.length} questions · {set.collegeName || 'National Arena'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSet(set.id);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                    title="Delete set"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Set Editor */}
        {activeSet && (
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={activeSet.title}
                  onChange={(e) => setActiveSet({ ...activeSet, title: e.target.value })}
                  placeholder="Question Set Title"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold text-base sm:text-lg focus:outline-none focus:border-amber-500/60"
                />
                <input
                  type="text"
                  value={activeSet.description}
                  onChange={(e) => setActiveSet({ ...activeSet, description: e.target.value })}
                  placeholder="Set description..."
                  className="w-full bg-transparent text-xs text-slate-400 mt-1 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openQuestionEditor()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>

                <button
                  onClick={handleSaveSet}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-transform active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Set'}</span>
                </button>
              </div>
            </div>

            {/* Questions List with Drag/Reorder buttons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                <span>Questions in Assessment ({activeSet.questions.length})</span>
                <span>Use arrows to reorder question sequence</span>
              </div>

              {activeSet.questions.length === 0 ? (
                <div className="text-center py-10 bg-slate-950/60 rounded-xl border border-slate-800/80 text-slate-500 text-xs">
                  No questions yet. Click "Add Question" or "Generate with AI" above!
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                  {activeSet.questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-start justify-between gap-3 group hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="font-mono font-bold text-amber-400 text-xs shrink-0 mt-0.5">
                          #{idx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white leading-relaxed">
                            {q.text}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
                            <span className="capitalize px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                              {q.topic.replace('_', ' ')}
                            </span>
                            <span className="uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {q.difficulty}
                            </span>
                            <span className="text-emerald-400 font-medium">
                              Ans: Option {String.fromCharCode(65 + (q.correctAnswer ?? 0))}
                            </span>
                            {q.table && (
                              <span className="flex items-center gap-1 text-sky-400">
                                <Table className="w-3 h-3" /> Tabular
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reorder and Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveQuestion(idx, 'down')}
                          disabled={idx === activeSet.questions.length - 1}
                          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openQuestionEditor(q, idx)}
                          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-sky-300 cursor-pointer"
                          title="Edit question"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeQuestion(idx)}
                          className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-rose-400 hover:text-rose-300 cursor-pointer"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI GENERATOR MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border-2 border-purple-500/50 rounded-3xl max-w-lg w-full p-6 text-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">AI Question Generator</h3>
                  <p className="text-xs text-purple-300 font-semibold">Campus Recruitment Intelligence</p>
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Aptitude Domain Topic:</label>
                <select
                  value={aiTopic}
                  onChange={(e: any) => setAiTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-purple-500"
                >
                  <option value="quantitative">Quantitative Aptitude (Speed Math, Arithmetic)</option>
                  <option value="logical">Logical Reasoning (Syllogisms, Arrangements)</option>
                  <option value="verbal">Verbal Ability (Grammar, Vocabulary, Comprehension)</option>
                  <option value="data_interpretation">Data Interpretation (Tabular Funnels & Growth)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Target Difficulty Level:</label>
                <select
                  value={aiDifficulty}
                  onChange={(e: any) => setAiDifficulty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-purple-500"
                >
                  <option value="easy">Easy (Warm-up / Baseline Round)</option>
                  <option value="medium">Medium (Pressure / Standard Assessment)</option>
                  <option value="hard">Hard (Final Boss / Tier-1 Screening)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Number of Questions to Generate:</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={aiCount}
                  onChange={(e) => setAiCount(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              Generated questions include 4 options, verified correct answers, and full step-by-step solutions for candidates to review.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAI}
                disabled={aiLoading}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-transform active:scale-95 cursor-pointer"
              >
                {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{aiLoading ? 'Generating Questions...' : 'Generate Questions'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUESTION EDIT / ADD MODAL */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editIndex >= 0 ? `Edit Question #${editIndex + 1}` : 'Create New Question'}
              </h3>
              <button onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Question Statement */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">Question Statement:</label>
                <textarea
                  rows={3}
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                  placeholder="Enter full aptitude problem statement..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Topic & Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Topic:</label>
                  <select
                    value={editingQuestion.topic}
                    onChange={(e: any) => setEditingQuestion({ ...editingQuestion, topic: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="quantitative">Quantitative</option>
                    <option value="logical">Logical</option>
                    <option value="verbal">Verbal</option>
                    <option value="data_interpretation">Data Interpretation</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Difficulty:</label>
                  <select
                    value={editingQuestion.difficulty}
                    onChange={(e: any) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="easy">Easy (Warm-up)</option>
                    <option value="medium">Medium (Pressure)</option>
                    <option value="hard">Hard (Final Boss)</option>
                  </select>
                </div>
              </div>

              {/* 4 Options & Correct Answer Selector */}
              <div className="space-y-2">
                <label className="font-bold text-slate-300 block">4 Answer Options (Select Correct Radio):</label>
                {editingQuestion.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={editingQuestion.correctAnswer === oIdx}
                      onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: oIdx })}
                      className="w-4 h-4 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-bold text-amber-400 font-mono text-xs w-6">
                      {String.fromCharCode(65 + oIdx)}:
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...editingQuestion.options];
                        newOpts[oIdx] = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + oIdx)} text`}
                      className="flex-1 bg-transparent text-white focus:outline-none text-xs sm:text-sm"
                    />
                  </div>
                ))}
              </div>

              {/* Step-by-Step Explanation */}
              <div>
                <label className="font-bold text-slate-300 block mb-1">Step-by-Step Solution / Explanation:</label>
                <textarea
                  rows={2}
                  value={editingQuestion.explanation || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  placeholder="Explain formula, shortcut, or reasoning for candidates to learn..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Optional Table Editor for Data Interpretation */}
              <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-sky-400" />
                    <span>Optional Data Interpretation Table</span>
                  </span>
                  {!editingQuestion.table ? (
                    <button
                      onClick={() =>
                        setEditingQuestion({
                          ...editingQuestion,
                          table: { headers: ['Category', '2023', '2024'], rows: [['Group A', '100', '150']] },
                        })
                      }
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
                    >
                      + Add Matrix Table
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingQuestion({ ...editingQuestion, table: undefined })}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Remove Table
                    </button>
                  )}
                </div>

                {editingQuestion.table && (
                  <div className="text-xs space-y-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr>
                            {editingQuestion.table.headers.map((h, i) => (
                              <th key={i} className="p-1">
                                <input
                                  type="text"
                                  value={h}
                                  onChange={(e) => {
                                    const newHeaders = [...editingQuestion.table!.headers];
                                    newHeaders[i] = e.target.value;
                                    setEditingQuestion({
                                      ...editingQuestion,
                                      table: { ...editingQuestion.table!, headers: newHeaders },
                                    });
                                  }}
                                  className="w-full bg-slate-900 border border-slate-700 px-2 py-1 rounded text-amber-300"
                                />
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {editingQuestion.table.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-1">
                                  <input
                                    type="text"
                                    value={cell}
                                    onChange={(e) => {
                                      const newRows = [...editingQuestion.table!.rows];
                                      newRows[rIdx][cIdx] = e.target.value;
                                      setEditingQuestion({
                                        ...editingQuestion,
                                        table: { ...editingQuestion.table!, rows: newRows },
                                      });
                                    }}
                                    className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-200"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedQuestion}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
