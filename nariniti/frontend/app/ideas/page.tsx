'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Type, Lightbulb, CheckCircle, Loader2, RefreshCw, ChevronDown, ChevronUp, ExternalLink, Bookmark, AlertCircle } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

// ─── Types ───────────────────────────────────────────────
interface SchemeMatch { scheme: { id: number; name: string; description: string; ministry: string; state: string; benefits_text: string; eligibility_text: string; documents_required: string[]; official_website: string }; match_score: number; match_reasons: string[] }
interface MentorMatch { mentor: { id: number; name: string; bio: string; expertise: string[]; sectors: string[]; languages: string[]; state: string; district: string; experience_years: number; availability: string; contact_method: string }; match_score: number; match_reasons: string[] }
interface NGOMatch { ngo: { id: number; name: string; description: string; state: string; focus_areas: string[]; services: string[]; website: string; contact: string }; match_score: number; match_reasons: string[] }
interface Analysis { business_type: string; sector: string; location: string; capital: number | null; business_stage: string; goal: string; target_customers: string[]; keywords: string[]; is_vague: boolean; follow_up_questions: string[] }
interface IdeaResult { id: number; original_text: string; detected_language: string; title: string; analysis: Analysis; scheme_matches: SchemeMatch[]; mentor_matches: MentorMatch[]; ngo_matches: NGOMatch[]; transcription?: string }

type InputMode = 'text' | 'voice';
type ResultTab = 'schemes' | 'mentors' | 'ngos';

const SECTOR_LABELS: Record<string, string> = {
  food_processing: 'Food Processing', textiles_apparel: 'Textiles / Apparel',
  beauty_wellness: 'Beauty & Wellness', agriculture: 'Agriculture', dairy: 'Dairy',
  handicrafts: 'Handicrafts', retail: 'Retail', education: 'Education',
  technology: 'Technology', manufacturing: 'Manufacturing', services: 'Services',
  healthcare: 'Healthcare', other: 'General',
};

const STAGE_LABELS: Record<string, string> = {
  idea: 'Idea / Pre-launch', startup: 'Startup', growth: 'Growth', established: 'Established'
};

const STEPS = [
  'Understanding your idea…',
  'Identifying your business sector…',
  'Finding government schemes…',
  'Matching mentors to your idea…',
  'Finding NGO support organizations…',
];

// ─── Score Badge ──────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600';
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold ${color}`}>{Math.round(score)}% Match</span>;
}

// ─── Expandable Card ──────────────────────────────────────
function ExpandCard({ children, title, badge }: { children: React.ReactNode; title: string; badge?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <button className="w-full flex items-center justify-between p-5 text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {badge}
          <span className="font-semibold text-slate-900 truncate">{title}</span>
        </div>
        {open ? <ChevronUp size={18} className="text-slate-400 shrink-0" /> : <ChevronDown size={18} className="text-slate-400 shrink-0" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-100 pt-4">{children}</div>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function IdeasPage() {
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [textInput, setTextInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [result, setResult] = useState<IdeaResult | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ResultTab>('schemes');
  const [saved, setSaved] = useState(false);

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'listening' | 'processing' | 'done' | 'error'>('idle');
  const [micAvailable, setMicAvailable] = useState(true);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Animate loading steps
  useEffect(() => {
    if (!isAnalyzing) { setAnalysisStep(0); return; }
    let step = 0;
    const interval = setInterval(() => {
      step = Math.min(step + 1, STEPS.length - 1);
      setAnalysisStep(step);
    }, 900);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Check microphone availability
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) setMicAvailable(false);
  }, []);

  const runAnalysis = async (text: string, audioBlob?: Blob) => {
    setIsAnalyzing(true);
    setError('');
    setResult(null);
    setSaved(false);

    try {
      let response: Response;
      if (audioBlob) {
        const form = new FormData();
        form.append('audio', audioBlob, 'idea.webm');
        response = await fetch('/api/ideas/analyze-audio', { method: 'POST', body: form, credentials: 'include' });
      } else {
        response = await fetch('/api/ideas/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ input_text: text }),
        });
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Error ${response.status}`);
      }

      const data: IdeaResult = await response.json();
      setResult(data);
      if (data.transcription) setTranscription(data.transcription);
    } catch (e: any) {
      setError(e.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Browser Speech Recognition ──
  const startSpeechRecognition = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return false;

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'hi-IN'; // works for English, Hindi, Marathi

    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setTranscription(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setVoiceStatus('done');
    };

    recognition.onerror = (e: any) => {
      setIsRecording(false);
      setVoiceStatus('error');
      if (e.error === 'not-allowed') setMicAvailable(false);
    };

    recognition.start();
    return true;
  }, []);

  // ── MediaRecorder (fallback, sends audio to Gemini) ──
  const startMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setVoiceStatus('processing');
        await runAnalysis('', blob);
      };

      recorder.start();
    } catch {
      setMicAvailable(false);
      setVoiceStatus('error');
    }
  };

  const handleMicClick = async () => {
    if (isRecording) {
      // Stop
      recognitionRef.current?.stop();
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    setTranscription('');
    setVoiceStatus('listening');
    setIsRecording(true);

    const usedBrowser = startSpeechRecognition();
    if (!usedBrowser) {
      await startMediaRecorder();
    }
  };

  const handleTextAnalyze = () => {
    if (!textInput.trim()) { setError('Please describe your business idea first.'); return; }
    runAnalysis(textInput.trim());
  };

  const handleSaveIdea = async () => {
    if (!result) return;
    setSaved(true); // Already saved to DB on analyze — just mark locally
  };

  // ─── UI ───────────────────────────────────────────────
  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lightbulb size={28} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Tell Us About Your Business Idea</h1>
          <p className="text-slate-500 mt-2 max-w-xl mx-auto">Share your idea in your own words — type it or speak to NariNiti. We support <strong>English</strong>, <strong>Hindi</strong>, and <strong>Marathi</strong>.</p>
        </div>

        {/* Input Mode Toggle */}
        {!isAnalyzing && !result && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            {/* Tab bar */}
            <div className="flex border-b border-slate-100">
              {(['text', 'voice'] as InputMode[]).map(mode => (
                <button key={mode} onClick={() => { setInputMode(mode); setError(''); }}
                  className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${inputMode === mode ? 'bg-violet-50 text-violet-700 border-b-2 border-violet-600' : 'text-slate-500 hover:text-slate-700'}`}>
                  {mode === 'text' ? <><Type size={16} /> Type Your Idea</> : <><Mic size={16} /> Speak Your Idea</>}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* ── TEXT MODE ── */}
              {inputMode === 'text' && (
                <>
                  <textarea
                    rows={5}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none placeholder:text-slate-400"
                    placeholder={'Example:\n"I want to start a homemade मसाला business from my village and sell products locally and online."\n\n"मला घरगुती मसाले बनवून विकायचे आहेत. माझ्याकडे जवळपास ५०,००० रुपये आहेत."'}
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                  />
                  {error && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14} />{error}</p>}
                  <button onClick={handleTextAnalyze}
                    className="mt-4 w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                    <Lightbulb size={18} /> Analyze My Idea
                  </button>
                </>
              )}

              {/* ── VOICE MODE ── */}
              {inputMode === 'voice' && (
                <div className="flex flex-col items-center text-center">
                  {!micAvailable ? (
                    <div className="py-6 text-center">
                      <MicOff size={40} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 mb-3">Microphone not available or access denied.</p>
                      <button onClick={() => setInputMode('text')} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium">Type Instead</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={handleMicClick}
                        className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all mb-4 ${isRecording ? 'bg-red-500 animate-pulse scale-110' : 'bg-violet-600 hover:bg-violet-700'}`}>
                        {isRecording ? <MicOff size={40} className="text-white" /> : <Mic size={40} className="text-white" />}
                      </button>

                      <p className="text-slate-500 text-sm mb-1">
                        {voiceStatus === 'idle' && 'Speak naturally in English, Hindi or Marathi'}
                        {voiceStatus === 'listening' && <span className="text-violet-600 font-semibold animate-pulse">Listening…</span>}
                        {voiceStatus === 'processing' && <span className="text-amber-600">Processing your idea…</span>}
                        {voiceStatus === 'done' && <span className="text-green-600 font-semibold flex items-center gap-1 justify-center"><CheckCircle size={16} /> Idea understood ✓</span>}
                        {voiceStatus === 'error' && <span className="text-red-600">Could not capture audio. Try again or type.</span>}
                      </p>

                      {transcription && (
                        <div className="mt-4 w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left">
                          <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">NariNiti heard:</p>
                          <p className="text-slate-800 text-sm">{transcription}</p>
                        </div>
                      )}

                      <div className="flex gap-3 mt-5">
                        {voiceStatus === 'done' && !isAnalyzing && (
                          <>
                            <button onClick={() => { setVoiceStatus('idle'); setTranscription(''); }}
                              className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50">
                              <RefreshCw size={14} /> Record Again
                            </button>
                            <button onClick={() => runAnalysis(transcription)}
                              className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
                              <Lightbulb size={14} /> Analyze
                            </button>
                          </>
                        )}
                      </div>

                      <button onClick={() => setInputMode('text')} className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline">
                        Type instead
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── LOADING STEPS ── */}
        {isAnalyzing && (
          <div className="bg-white border border-violet-100 rounded-2xl p-8 shadow-sm text-center mb-6">
            <Loader2 size={40} className="text-violet-500 animate-spin mx-auto mb-6" />
            <div className="space-y-3 max-w-sm mx-auto">
              {STEPS.map((step, i) => (
                <div key={i} className={`flex items-center gap-3 text-sm transition-opacity ${i <= analysisStep ? 'opacity-100' : 'opacity-30'}`}>
                  {i < analysisStep
                    ? <CheckCircle size={18} className="text-green-500 shrink-0" />
                    : i === analysisStep
                    ? <Loader2 size={18} className="text-violet-500 animate-spin shrink-0" />
                    : <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-200 shrink-0" />}
                  <span className={i <= analysisStep ? 'text-slate-700 font-medium' : 'text-slate-400'}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && !isAnalyzing && !result && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">Analysis Error</p>
              <p className="text-red-600 text-sm mt-0.5">{error}</p>
              <button onClick={() => { setError(''); setResult(null); }} className="mt-2 text-sm text-red-700 underline">Try again</button>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && !isAnalyzing && (
          <div className="space-y-6">
            {/* Business Profile Card */}
            <div className="bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Your Business Opportunity Profile</h2>
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full">{result.detected_language}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div><p className="text-violet-200 text-xs mb-0.5">Business Type</p><p className="font-semibold">{result.analysis?.business_type || '—'}</p></div>
                <div><p className="text-violet-200 text-xs mb-0.5">Sector</p><p className="font-semibold">{SECTOR_LABELS[result.analysis?.sector] || result.analysis?.sector || '—'}</p></div>
                <div><p className="text-violet-200 text-xs mb-0.5">Location</p><p className="font-semibold">{result.analysis?.location || 'Not specified'}</p></div>
                <div><p className="text-violet-200 text-xs mb-0.5">Investment</p><p className="font-semibold">{result.analysis?.capital ? `₹${result.analysis.capital.toLocaleString('en-IN')}` : 'Not specified'}</p></div>
                <div><p className="text-violet-200 text-xs mb-0.5">Stage</p><p className="font-semibold">{STAGE_LABELS[result.analysis?.business_stage] || '—'}</p></div>
                <div><p className="text-violet-200 text-xs mb-0.5">Target Customers</p><p className="font-semibold">{result.analysis?.target_customers?.slice(0, 2).join(', ') || 'Not specified'}</p></div>
              </div>
              {result.analysis?.goal && (
                <div className="mt-4 pt-4 border-t border-white/20 text-sm">
                  <p className="text-violet-200 text-xs mb-1">Your Goal</p>
                  <p>{result.analysis.goal}</p>
                </div>
              )}
            </div>

            {/* Vague idea follow-up */}
            {result.analysis?.is_vague && result.analysis.follow_up_questions?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <p className="font-semibold text-amber-800 mb-3">To find better matches, can you tell us more?</p>
                <ul className="space-y-2">
                  {result.analysis.follow_up_questions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                      <span className="shrink-0 font-bold">{i + 1}.</span>{q}
                    </li>
                  ))}
                </ul>
                <button onClick={() => { setResult(null); setTextInput(result.original_text); setInputMode('text'); }}
                  className="mt-3 text-sm text-amber-700 underline font-medium">Add more detail</button>
              </div>
            )}

            {/* Match counts summary */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { tab: 'schemes' as ResultTab, label: 'Government Schemes', count: result.scheme_matches?.length, icon: '🏛' },
                { tab: 'mentors' as ResultTab, label: 'Mentors', count: result.mentor_matches?.length, icon: '👩‍💼' },
                { tab: 'ngos' as ResultTab, label: 'NGOs', count: result.ngo_matches?.length, icon: '🤝' },
              ].map(({ tab, label, count, icon }) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`rounded-xl p-4 text-center border-2 transition-all ${activeTab === tab ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-300'}`}>
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xl font-bold text-slate-900">{count || 0}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="space-y-3">
              {/* Schemes */}
              {activeTab === 'schemes' && (
                result.scheme_matches?.length > 0
                  ? result.scheme_matches.map((m, i) => (
                    <ExpandCard key={i} title={m.scheme.name} badge={<ScoreBadge score={m.match_score} />}>
                      <p className="text-sm text-slate-600 mb-3">{m.scheme.description}</p>
                      {m.match_reasons?.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Why this matches</p>
                          <ul className="space-y-1">
                            {m.match_reasons.map((r, j) => <li key={j} className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle size={14} className="text-green-500 shrink-0" />{r}</li>)}
                          </ul>
                        </div>
                      )}
                      {m.scheme.benefits_text && <p className="text-sm mb-1"><span className="font-medium">Benefits:</span> {m.scheme.benefits_text}</p>}
                      {m.scheme.eligibility_text && <p className="text-sm mb-3"><span className="font-medium">Eligibility:</span> {m.scheme.eligibility_text}</p>}
                      {m.scheme.official_website && (
                        <a href={m.scheme.official_website} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:underline font-medium">
                          View Official Website <ExternalLink size={13} />
                        </a>
                      )}
                    </ExpandCard>
                  ))
                  : <p className="text-center py-8 text-slate-400">No scheme matches found. Try adding your location or investment range.</p>
              )}

              {/* Mentors */}
              {activeTab === 'mentors' && (
                result.mentor_matches?.length > 0
                  ? result.mentor_matches.map((m, i) => (
                    <ExpandCard key={i} title={m.mentor.name} badge={<ScoreBadge score={m.match_score} />}>
                      <p className="text-sm text-slate-600 mb-3">{m.mentor.bio}</p>
                      {m.match_reasons?.length > 0 && (
                        <ul className="space-y-1 mb-3">
                          {m.match_reasons.map((r, j) => <li key={j} className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle size={14} className="text-green-500 shrink-0" />{r}</li>)}
                        </ul>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-slate-400">Location:</span> <span className="font-medium">{[m.mentor.district, m.mentor.state].filter(Boolean).join(', ') || 'Online'}</span></div>
                        <div><span className="text-slate-400">Languages:</span> <span className="font-medium">{m.mentor.languages?.join(', ')}</span></div>
                        <div><span className="text-slate-400">Experience:</span> <span className="font-medium">{m.mentor.experience_years} years</span></div>
                        <div><span className="text-slate-400">Available:</span> <span className="font-medium">{m.mentor.availability}</span></div>
                      </div>
                      {m.mentor.contact_method && <p className="text-sm mt-2"><span className="text-slate-400">Contact via:</span> <span className="font-medium">{m.mentor.contact_method}</span></p>}
                    </ExpandCard>
                  ))
                  : <p className="text-center py-8 text-slate-400">No mentor matches found for this sector yet.</p>
              )}

              {/* NGOs */}
              {activeTab === 'ngos' && (
                result.ngo_matches?.length > 0
                  ? result.ngo_matches.map((m, i) => (
                    <ExpandCard key={i} title={m.ngo.name} badge={<ScoreBadge score={m.match_score} />}>
                      <p className="text-sm text-slate-600 mb-3">{m.ngo.description}</p>
                      {m.match_reasons?.length > 0 && (
                        <ul className="space-y-1 mb-3">
                          {m.match_reasons.map((r, j) => <li key={j} className="flex items-center gap-2 text-sm text-slate-700"><CheckCircle size={14} className="text-green-500 shrink-0" />{r}</li>)}
                        </ul>
                      )}
                      {m.ngo.focus_areas?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {m.ngo.focus_areas.map((f, j) => <span key={j} className="px-2 py-0.5 bg-violet-50 text-violet-700 text-xs rounded-full">{f}</span>)}
                        </div>
                      )}
                      <div className="flex gap-3 mt-2">
                        {m.ngo.website && <a href={m.ngo.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-violet-600 hover:underline font-medium"><ExternalLink size={13} /> Website</a>}
                        {m.ngo.contact && <span className="text-sm text-slate-600">📞 {m.ngo.contact}</span>}
                      </div>
                    </ExpandCard>
                  ))
                  : <p className="text-center py-8 text-slate-400">No NGO matches found for your location/sector.</p>
              )}
            </div>

            {/* Save + Start over */}
            <div className="flex gap-3 pt-2">
              <button onClick={handleSaveIdea} disabled={saved}
                className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${saved ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}>
                <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
                {saved ? 'Idea Saved to Dashboard' : 'Save This Idea'}
              </button>
              <button onClick={() => { setResult(null); setTextInput(''); setTranscription(''); setVoiceStatus('idle'); setError(''); setSaved(false); }}
                className="px-5 py-3 border border-slate-300 text-slate-600 rounded-xl font-medium hover:bg-slate-50 flex items-center gap-2">
                <RefreshCw size={16} /> New Idea
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
