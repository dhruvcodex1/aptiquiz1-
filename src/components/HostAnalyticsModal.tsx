import React from 'react';
import { X, Download, AlertTriangle, Eye, BarChart3, Clock, CheckCircle } from 'lucide-react';

interface QuestionAnalyticsItem {
  questionIndex: number;
  questionText: string;
  topic: string;
  difficulty: string;
  totalAnswered: number;
  correctCount: number;
  accuracy: number;
  averageResponseTimeMs: number;
}

interface SuspiciousPlayer {
  id: string;
  name: string;
  suspiciousCount: number;
  tabSwitchCount: number;
}

interface HostAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  collegeName: string;
  mostMissedQuestions: QuestionAnalyticsItem[];
  perQuestionStats: QuestionAnalyticsItem[];
  topicStrength: Record<string, number>;
  suspiciousPlayers: SuspiciousPlayer[];
}

export const HostAnalyticsModal: React.FC<HostAnalyticsModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  collegeName,
  mostMissedQuestions,
  perQuestionStats,
  topicStrength,
  suspiciousPlayers,
}) => {
  if (!isOpen) return null;

  const handleExportCSV = () => {
    window.open(`/api/rooms/${roomCode}/export-csv`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 text-slate-100 shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                ROOM {roomCode}
              </span>
              <span className="text-xs text-slate-400 font-semibold">{collegeName}</span>
            </div>
            <h2 className="text-2xl font-black text-white">Campus Placement Host Analytics</h2>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-transform active:scale-95 shadow-lg shadow-emerald-500/20 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export Complete CSV</span>
          </button>
        </div>

        {/* Topic-Wise Room Strength */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Cohort Topic-Wise Proficiency</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(topicStrength).map(([topic, acc]) => (
              <div key={topic} className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 capitalize block mb-1">
                  {topic.replace('_', ' ')}
                </span>
                <div className="text-xl font-mono font-black text-white">
                  {acc}%
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      acc >= 75 ? 'bg-emerald-400' : acc >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                    }`}
                    style={{ width: `${acc}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Missed Questions */}
        {mostMissedQuestions.length > 0 && (
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Most Missed Placement Questions (Priority Revision)</span>
            </h3>
            <div className="space-y-2">
              {mostMissedQuestions.map((q) => (
                <div key={q.questionIndex} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <span className="font-bold text-amber-400 mr-2">Q{q.questionIndex + 1}</span>
                    <span className="text-slate-300 font-medium">{q.questionText}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-rose-400 text-sm">{q.accuracy}% acc</span>
                    <span className="text-slate-500 block text-[10px]">avg {(q.averageResponseTimeMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integrity & Anti-Cheat Summary */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-sky-400" />
            <span>Anti-Cheat & Candidate Activity Flags (Host Advisory Only)</span>
          </h3>
          {suspiciousPlayers.length === 0 ? (
            <p className="text-xs text-slate-400">All submissions verified within normal timing parameters.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {suspiciousPlayers.map((p) => (
                <div key={p.id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-white">{p.name}</span>
                  <div className="flex items-center gap-3">
                    {p.tabSwitchCount > 0 && (
                      <span className="text-amber-400 font-medium">
                        {p.tabSwitchCount} tab switch{p.tabSwitchCount > 1 ? 'es' : ''}
                      </span>
                    )}
                    {p.suspiciousCount > 0 && (
                      <span className="text-rose-400 font-medium">
                        {p.suspiciousCount} fast (&lt;400ms)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Per-Question Full Table */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            All Question Stats ({perQuestionStats.length} Total)
          </h3>
          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Topic</th>
                  <th className="py-2 px-2">Difficulty</th>
                  <th className="py-2 px-2">Answered</th>
                  <th className="py-2 px-2">Accuracy</th>
                  <th className="py-2 px-2">Avg Speed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {perQuestionStats.map((q) => (
                  <tr key={q.questionIndex} className="hover:bg-slate-900/50">
                    <td className="py-2 px-2 font-mono font-bold">Q{q.questionIndex + 1}</td>
                    <td className="py-2 px-2 capitalize">{q.topic.replace('_', ' ')}</td>
                    <td className="py-2 px-2 uppercase text-[10px] font-semibold text-amber-400">{q.difficulty}</td>
                    <td className="py-2 px-2">{q.totalAnswered}</td>
                    <td className="py-2 px-2 font-mono font-bold">{q.accuracy}%</td>
                    <td className="py-2 px-2 font-mono">{(q.averageResponseTimeMs / 1000).toFixed(1)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer text-sm"
          >
            Close Analytics
          </button>
        </div>
      </div>
    </div>
  );
};
