/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  History, 
  AlertTriangle, 
  Info, 
  ArrowRight,
  Shield,
  Lock,
  Globe,
  Trash2,
  CheckCircle2,
  Activity,
  Zap,
  ChevronRight,
  Fingerprint,
  Eye,
  Radar,
  Link as LinkIcon,
  Server,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeURL, type AnalysisResult } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HistoryItem {
  url: string;
  result: AnalysisResult;
  timestamp: number;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('phishguard_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (url: string, result: AnalysisResult) => {
    const newItem: HistoryItem = { url, result, timestamp: Date.now() };
    const updatedHistory = [newItem, ...history.filter(item => item.url !== url)].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('phishguard_history', JSON.stringify(updatedHistory));
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url || isAnalyzing) return;

    let processedUrl = url.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }

    try {
      new URL(processedUrl);
    } catch (e) {
      setError('Invalid URL format');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeURL(processedUrl);
      setResult(analysis);
      saveToHistory(processedUrl, analysis);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'High': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'Medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Low': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen flex flex-col tech-grid p-6 md:p-12">
      <div className="max-w-4xl mx-auto w-full space-y-12">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">PhishGuard</h1>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <History size={24} />
          </button>
        </header>

        {/* Scanner */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">URL Security Audit</h2>
            <p className="text-slate-400 text-lg">Deep-scan links for phishing, spoofing, and malicious patterns.</p>
          </div>

          <form onSubmit={handleAnalyze} className="relative group max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
              <LinkIcon size={20} />
            </div>
            <input 
              type="text"
              placeholder="Paste suspicious URL here..."
              className="w-full pl-14 pr-36 py-5 bg-slate-900/50 border border-slate-800 rounded-3xl text-lg text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button 
              type="submit"
              disabled={isAnalyzing || !url}
              className="absolute right-2 top-2 bottom-2 px-8 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/10"
            >
              {isAnalyzing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Scan
                  <Zap size={18} fill="currentColor" />
                </>
              )}
            </button>
          </form>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3"
            >
              <AlertTriangle size={18} />
              {error}
            </motion.div>
          )}
        </section>

        {/* Results */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              {/* Main Result Card */}
              <div className={cn(
                "dark-panel p-8 md:p-12 relative overflow-hidden glow-indigo",
                result.isPhishing ? "border-red-500/20" : "border-emerald-500/20"
              )}>
                <div className="flex flex-col md:flex-row items-center gap-10">
                  <div className="relative shrink-0">
                    <div className={cn(
                      "w-32 h-32 rounded-full flex items-center justify-center",
                      result.isPhishing ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                      {result.isPhishing ? <ShieldAlert size={64} /> : <ShieldCheck size={64} />}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full shadow-xl">
                      <span className="text-xs font-bold text-white tracking-widest uppercase">{result.riskScore}% Risk</span>
                    </div>
                  </div>

                  <div className="flex-grow text-center md:text-left space-y-4">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <h3 className="text-3xl font-bold text-white tracking-tight">
                        {result.isPhishing ? "Threat Detected" : "Likely Safe"}
                      </h3>
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border",
                        getThreatColor(result.threatLevel)
                      )}>
                        {result.threatLevel} Risk
                      </span>
                    </div>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
                      {result.isPhishing 
                        ? "This URL matches multiple phishing signatures. Our AI detected deceptive patterns designed to harvest credentials or sensitive data."
                        : "No obvious phishing signatures detected. The URL structure and domain reputation appear consistent with legitimate services."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 dark-panel p-6 space-y-6">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Shield size={14} className="text-indigo-400" />
                    Threat Factor Breakdown
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {result.threatBreakdown.map((item, i) => (
                      <motion.div 
                        key={i} 
                        whileHover={{ scale: 1.01, backgroundColor: 'rgba(15, 23, 42, 0.5)' }}
                        className="flex flex-col gap-2 p-4 bg-slate-950/30 border border-slate-800 rounded-2xl transition-all cursor-default hover:border-indigo-500/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{item.category}</span>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border",
                            getThreatColor(item.severity)
                          )}>
                            {item.severity} Impact
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{item.finding}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="dark-panel p-6 space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Activity size={14} className="text-indigo-400" />
                      Technical Audit
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: 'IP Address Host', value: result.technicalDetails.usesIpAddress, critical: true },
                        { label: 'Punycode Attack', value: result.technicalDetails.hasPunycode, critical: true },
                        { label: 'URL Shortener', value: result.technicalDetails.isShortened },
                        { label: 'Suspicious TLD', value: result.technicalDetails.suspiciousTld },
                        { label: 'Subdomain Spam', value: result.technicalDetails.excessiveSubdomains },
                        { label: 'Hidden Redirects', value: result.technicalDetails.hiddenRedirects },
                      ].map((detail, i) => (
                        <div key={i} className={cn(
                          "flex items-center justify-between p-2 rounded-lg border transition-colors",
                          detail.value 
                            ? (detail.critical ? "bg-red-500/10 border-red-500/20" : "bg-amber-500/10 border-amber-500/20") 
                            : "bg-slate-950/30 border-slate-800/50"
                        )}>
                          <span className={cn("text-xs", detail.value ? "text-white font-medium" : "text-slate-400")}>{detail.label}</span>
                          {detail.value ? (
                            <AlertTriangle size={12} className={detail.critical ? "text-red-400" : "text-amber-400"} />
                          ) : (
                            <CheckCircle2 size={12} className="text-emerald-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="dark-panel p-6 space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Server size={14} className="text-indigo-400" />
                      Domain Identity
                    </h4>
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">Host</p>
                        <p className="font-mono text-xs text-indigo-400 truncate">{result.domainInfo.domain}</p>
                      </div>
                      {result.domainInfo.ageEstimate && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Calendar size={12} />
                          <span>Age: {result.domainInfo.ageEstimate}</span>
                        </div>
                      )}
                      {result.domainInfo.isLikelySpoofed && (
                        <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Spoofing Target</p>
                          <p className="text-sm text-white font-bold">{result.domainInfo.spoofedTarget}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="dark-panel p-6 space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Globe size={14} className="text-indigo-400" />
                      Network Intelligence
                    </h4>
                    <div className="space-y-4">
                      {result.networkIntelligence ? (
                        <>
                          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">IP Address</p>
                            <p className="font-mono text-xs text-indigo-400">{result.networkIntelligence.ipAddress}</p>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Location</span>
                              <span className="text-slate-300">{result.networkIntelligence.location}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">ISP</span>
                              <span className="text-slate-300 truncate max-w-[120px]">{result.networkIntelligence.isp}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">Reputation</span>
                              <span className={cn(
                                "font-bold",
                                result.networkIntelligence.reputation === 'Malicious' ? 'text-red-400' : 
                                result.networkIntelligence.reputation === 'Suspicious' ? 'text-amber-400' : 'text-emerald-400'
                              )}>
                                {result.networkIntelligence.reputation}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Gathering network data...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="dark-panel p-8">
                <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Shield size={20} className="text-indigo-400" />
                  Security Recommendations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-slate-950/30 border border-slate-800 rounded-2xl">
                      <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={14} className="text-indigo-400" />
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : isAnalyzing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 flex flex-col items-center justify-center text-center space-y-8"
            >
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 border-4 border-slate-800 rounded-full" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Radar className="text-indigo-500 w-12 h-12 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">Auditing Security Patterns</h3>
                <p className="text-slate-500 max-w-sm mx-auto">Evaluating domain reputation, SSL signatures, and heuristic anomalies...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-40 dark-panel border-dashed border-2 flex flex-col items-center justify-center text-center px-6"
            >
              <div className="w-20 h-20 bg-slate-950/50 rounded-3xl flex items-center justify-center text-slate-700 mb-6 shadow-inner">
                <Eye size={40} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ready for Analysis</h3>
              <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                Paste any URL to begin a deep-dive security audit. Our AI evaluates over 50 risk factors in real-time.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History Overlay */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6"
              onClick={() => setShowHistory(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-2xl dark-panel p-8 space-y-6 max-h-[80vh] overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <History className="text-indigo-400" />
                    Scan History
                  </h3>
                  <button 
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('phishguard_history');
                    }}
                    className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    Clear All
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                  {history.length > 0 ? (
                    history.map((item, i) => (
                      <div 
                        key={i}
                        onClick={() => {
                          setUrl(item.url);
                          setResult(item.result);
                          setShowHistory(false);
                        }}
                        className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            item.result.isPhishing ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                          )}>
                            {item.result.isPhishing ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">{item.url}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                              {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center space-y-4">
                      <History size={48} className="text-slate-800 mx-auto" />
                      <p className="text-slate-500">No recent scans found.</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setShowHistory(false)}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <footer className="pt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-indigo-500" />
            <span className="font-bold text-slate-400">PhishGuard Security</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">API Access</a>
          </div>
          <p>© 2026 Neural Security Labs</p>
        </footer>
      </div>
    </div>
  );
}
