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
  ExternalLink, 
  Info, 
  ArrowRight,
  Shield,
  Lock,
  Globe,
  Trash2,
  CheckCircle2,
  XCircle
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

    // Basic URL validation
    let processedUrl = url.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }

    try {
      new URL(processedUrl);
    } catch (e) {
      setError('Please enter a valid URL');
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
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('phishguard_history');
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 50) return 'bg-orange-500';
    if (score >= 20) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Shield className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">PhishGuard <span className="text-indigo-600">AI</span></h1>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-500">
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it works</a>
            <a href="#tips" className="hover:text-indigo-600 transition-colors">Safety Tips</a>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Analysis Tool */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">URL Security Scanner</h2>
              <p className="text-slate-500 mb-8">Paste a suspicious link below to analyze it for phishing attempts, spoofing, and malicious patterns.</p>
              
              <form onSubmit={handleAnalyze} className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input 
                  type="text"
                  placeholder="https://example.com/login"
                  className="w-full pl-12 pr-32 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm input-focus text-lg"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={isAnalyzing || !url}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
                >
                  {isAnalyzing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Analyze
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-red-500 text-sm flex items-center gap-1"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </motion.p>
              )}
            </section>

            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-6"
                >
                  {/* Result Header Card */}
                  <div className={cn(
                    "p-8 rounded-3xl border-2 flex flex-col md:flex-row items-center gap-8",
                    result.isPhishing ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
                  )}>
                    <div className={cn(
                      "w-24 h-24 rounded-full flex items-center justify-center shrink-0",
                      result.isPhishing ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                    )}>
                      {result.isPhishing ? <ShieldAlert size={48} /> : <ShieldCheck size={48} />}
                    </div>
                    
                    <div className="flex-grow text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                        <h3 className={cn(
                          "text-2xl font-bold",
                          result.isPhishing ? "text-red-900" : "text-emerald-900"
                        )}>
                          {result.isPhishing ? "Phishing Detected" : "Likely Safe"}
                        </h3>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                          getThreatColor(result.threatLevel)
                        )}>
                          {result.threatLevel} Risk
                        </span>
                      </div>
                      <p className="text-slate-600 mb-4 max-w-md">
                        {result.isPhishing 
                          ? `This URL shows strong indicators of a phishing attempt. Avoid entering any credentials or personal information.`
                          : `Our analysis didn't find any obvious phishing patterns for this URL. However, always remain cautious.`}
                      </p>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex-grow max-w-xs bg-slate-200 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${result.riskScore}%` }}
                            className={cn("h-full", getScoreColor(result.riskScore))}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{result.riskScore}% Risk Score</span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6">
                      <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Risk Indicators
                      </h4>
                      <ul className="space-y-3">
                        {result.reasons.map((reason, i) => (
                          <li key={i} className="flex gap-3 text-sm text-slate-600">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="glass-card p-6">
                      <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                        Recommendations
                      </h4>
                      <ul className="space-y-3">
                        {result.recommendations.map((rec, i) => (
                          <li key={i} className="flex gap-3 text-sm text-slate-600">
                            <ArrowRight className="mt-1 w-4 h-4 text-indigo-400 shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Domain Info */}
                  <div className="glass-card p-6 border-l-4 border-l-indigo-500">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">Domain Analysis</h4>
                        <p className="text-sm text-slate-500 mb-3">
                          Domain: <span className="font-mono text-indigo-600 font-semibold">{result.domainInfo.domain}</span>
                        </p>
                        {result.domainInfo.isLikelySpoofed && (
                          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-3 border border-red-100">
                            <Lock className="w-4 h-4 shrink-0" />
                            <span>
                              This domain appears to be spoofing <strong>{result.domainInfo.spoofedTarget}</strong>.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 flex flex-col items-center justify-center text-center"
                >
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <Shield className="absolute inset-0 m-auto w-8 h-8 text-indigo-600 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Analyzing URL Patterns...</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">Our AI is checking for typosquatting, obfuscation, and known phishing signatures.</p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-center px-6"
                >
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                    <Search size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Ready to Scan</h3>
                  <p className="text-slate-500 max-w-sm">Enter a URL above to get a comprehensive security assessment and risk score.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: History & Tips */}
          <div className="space-y-8">
            {/* History Section */}
            <section className="glass-card overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-400" />
                  Recent Scans
                </h3>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
                {history.length > 0 ? (history.map((item, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setUrl(item.url);
                      setResult(item.result);
                    }}
                    className="w-full p-4 text-left hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
                        item.result.isPhishing ? "text-red-600 border-red-100 bg-red-50" : "text-emerald-600 border-emerald-100 bg-emerald-50"
                      )}>
                        {item.result.isPhishing ? "Phishing" : "Safe"}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium truncate group-hover:text-indigo-600 transition-colors">{item.url}</p>
                  </button>
                ))) : (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-xs">No recent scans</p>
                  </div>
                )}
              </div>
            </section>

            {/* Quick Tips */}
            <section id="tips" className="bg-indigo-900 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-300" />
                Safety Checklist
              </h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="mt-1 p-1 bg-indigo-800 rounded-md shrink-0">
                    <Lock className="w-3 h-3 text-indigo-300" />
                  </div>
                  <div className="text-sm">
                    <p className="font-bold mb-0.5">Check for HTTPS</p>
                    <p className="text-indigo-200 leading-relaxed">Legitimate sites use encryption. Look for the padlock icon.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="mt-1 p-1 bg-indigo-800 rounded-md shrink-0">
                    <Globe className="w-3 h-3 text-indigo-300" />
                  </div>
                  <div className="text-sm">
                    <p className="font-bold mb-0.5">Verify Domain Name</p>
                    <p className="text-indigo-200 leading-relaxed">Watch for typos like <span className="font-mono text-white">g00gle.com</span> or <span className="font-mono text-white">paypa1.com</span>.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="mt-1 p-1 bg-indigo-800 rounded-md shrink-0">
                    <AlertTriangle className="w-3 h-3 text-indigo-300" />
                  </div>
                  <div className="text-sm">
                    <p className="font-bold mb-0.5">Sense of Urgency</p>
                    <p className="text-indigo-200 leading-relaxed">Phishing often uses threats like "Your account will be suspended."</p>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="text-indigo-600 w-5 h-5" />
              <span className="font-bold text-slate-900">PhishGuard AI</span>
            </div>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              PhishGuard AI uses advanced machine learning and pattern recognition to identify malicious URLs before they can harm you. Our mission is to make the web safer for everyone.
            </p>
          </div>
          <div id="how-it-works">
            <h4 className="font-bold text-slate-900 mb-4">How it works</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">Heuristic Analysis</p>
                <p className="text-xs text-slate-500">Checking URL structure and domain age.</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">Brand Protection</p>
                <p className="text-xs text-slate-500">Detecting impersonation of major brands.</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">AI Reasoning</p>
                <p className="text-xs text-slate-500">LLM-powered threat assessment.</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">Real-time Scoring</p>
                <p className="text-xs text-slate-500">Instant risk calculation and feedback.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">© 2026 PhishGuard AI. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-slate-400 hover:text-indigo-600">Privacy Policy</a>
            <a href="#" className="text-xs text-slate-400 hover:text-indigo-600">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
