import React, { useState } from 'react';
import { ArrowRight, Shield, ShieldAlert, ShieldCheck, AlertTriangle, Link2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeURL, analyzeEmail, type AnalysisResult, type EmailAnalysisResult } from './services/geminiService';

type Tab = 'url' | 'email';

// Animated score counter
function Counter({ to }: { to: number }) {
  const [n, setN] = useState(0);
  React.useEffect(() => {
    let f: number;
    const start = Date.now();
    const dur = 1200;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = () => {
      const t = Math.min((Date.now() - start) / dur, 1);
      setN(Math.round(ease(t) * to));
      if (t < 1) f = requestAnimationFrame(tick);
    };
    f = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(f);
  }, [to]);
  return <>{n}</>;
}

const scoreColor = (s: number) => s >= 70 ? '#f87171' : s >= 40 ? '#fbbf24' : '#34d399';

export default function App() {
  const [tab, setTab] = useState<Tab>('url');

  // URL
  const [url, setUrl] = useState('');
  const [urlRes, setUrlRes] = useState<AnalysisResult | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlErr, setUrlErr] = useState<string | null>(null);

  // Email
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [emailRes, setEmailRes] = useState<EmailAnalysisResult | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailErr, setEmailErr] = useState<string | null>(null);

  const canSubmitUrl = url.trim().length > 0 && !urlLoading;
  const canSubmitEmail = (subject.trim() || body.trim()) && !emailLoading;

  async function submitUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmitUrl) return;
    let u = url.trim();
    if (!u.startsWith('http')) u = 'https://' + u;
    try { new URL(u); } catch { setUrlErr('Please enter a valid URL'); return; }
    setUrlLoading(true); setUrlErr(null); setUrlRes(null);
    try { setUrlRes(await analyzeURL(u)); } catch (err: any) { setUrlErr(err.message || 'Analysis failed'); }
    finally { setUrlLoading(false); }
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmitEmail) return;
    setEmailLoading(true); setEmailErr(null); setEmailRes(null);
    try { setEmailRes(await analyzeEmail(subject, body)); } catch (err: any) { setEmailErr(err.message || 'Analysis failed'); }
    finally { setEmailLoading(false); }
  }

  function switchTab(t: Tab) {
    setTab(t);
    setUrlRes(null); setUrlErr(null);
    setEmailRes(null); setEmailErr(null);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

      {/* ── Heading ── */}
      <motion.h1
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ fontSize: 28, fontWeight: 600, color: '#fff', marginBottom: 28, textAlign: 'center', letterSpacing: '-0.02em' }}
      >
        {tab === 'url' ? 'Check a suspicious URL.' : 'Analyze a suspicious email.'}
      </motion.h1>

      {/* ── Input card ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{ width: '100%', maxWidth: 520 }}
      >
        <AnimatePresence mode="wait">
          {tab === 'url' ? (
            <motion.form key="url-form" onSubmit={submitUrl} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="input-card">
                <input
                  className="ghost-input"
                  placeholder="Paste a URL to scan…"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setUrlErr(null); setUrlRes(null); }}
                  style={{ marginBottom: 12 }}
                  autoFocus
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Link2 size={13} /> URL Scanner
                  </span>
                  <button type="submit" disabled={!canSubmitUrl} className={`send-btn ${canSubmitUrl ? 'send-btn-active' : ''}`}>
                    {urlLoading
                      ? <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      : <ArrowRight size={14} />}
                  </button>
                </div>
              </div>
            </motion.form>
          ) : (
            <motion.form key="email-form" onSubmit={submitEmail} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="input-card">
                <input
                  className="ghost-input"
                  placeholder="Email subject…"
                  value={subject}
                  onChange={e => { setSubject(e.target.value); setEmailErr(null); setEmailRes(null); }}
                  style={{ marginBottom: 8, fontSize: 14, fontWeight: 500 }}
                  autoFocus
                />
                <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 8 }} />
                <textarea
                  className="ghost-input"
                  placeholder="Paste email body here…"
                  value={body}
                  onChange={e => { setBody(e.target.value); setEmailErr(null); setEmailRes(null); }}
                  rows={5}
                  style={{ marginBottom: 12 }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Mail size={13} /> Email Analyzer
                  </span>
                  <button type="submit" disabled={!canSubmitEmail} className={`send-btn ${canSubmitEmail ? 'send-btn-active' : ''}`}>
                    {emailLoading
                      ? <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                      : <ArrowRight size={14} />}
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ── Error ── */}
        <AnimatePresence>
          {(urlErr || emailErr) && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#f87171', marginTop: 10, paddingLeft: 4 }}
            >
              <AlertTriangle size={13} />
              {urlErr || emailErr}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── URL Result ── */}
        <AnimatePresence>
          {urlRes && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="result-card"
              style={{ marginTop: 12 }}
            >
              {/* Verdict row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {urlRes.isPhishing
                    ? <ShieldAlert size={18} style={{ color: '#f87171' }} />
                    : <ShieldCheck size={18} style={{ color: '#34d399' }} />}
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    {urlRes.isPhishing ? 'Phishing Detected' : 'Likely Safe'}
                  </span>
                </div>
                <span className={`chip ${urlRes.isPhishing ? 'chip-danger' : 'chip-safe'}`}>
                  {urlRes.threatLevel}
                </span>
              </div>

              {/* Score bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                  <span>Risk Score</span>
                  <span style={{ color: scoreColor(urlRes.riskScore), fontWeight: 600 }}>
                    <Counter to={urlRes.riskScore} />%
                  </span>
                </div>
                <div className="score-bar">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${urlRes.riskScore}%` }}
                    transition={{ duration: 1.1, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{ height: '100%', background: scoreColor(urlRes.riskScore), borderRadius: 2 }}
                  />
                </div>
              </div>

              {/* Domain */}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
                Domain: <span style={{ color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace' }}>{urlRes.domainInfo.domain}</span>
                {urlRes.domainInfo.isLikelySpoofed && (
                  <span style={{ color: '#f87171', marginLeft: 8 }}>↳ Spoofing {urlRes.domainInfo.spoofedTarget}</span>
                )}
              </div>

              {/* Reasons */}
              {urlRes.reasons?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Risk Indicators</div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {urlRes.reasons.map((r, i) => (
                      <li key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', display: 'flex', gap: 8 }}>
                        <span style={{ color: '#f87171', flexShrink: 0 }}>—</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {urlRes.recommendations?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Recommendations</div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {urlRes.recommendations.map((r, i) => (
                      <li key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', display: 'flex', gap: 8 }}>
                        <span style={{ color: '#34d399', flexShrink: 0 }}>→</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Email Result ── */}
        <AnimatePresence>
          {emailRes && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="result-card"
              style={{ marginTop: 12 }}
            >
              {/* Verdict row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {emailRes.isPhishing
                    ? <ShieldAlert size={18} style={{ color: '#f87171' }} />
                    : <ShieldCheck size={18} style={{ color: '#34d399' }} />}
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    {emailRes.isPhishing ? 'Phishing Email' : 'Looks Legitimate'}
                  </span>
                </div>
                <span className={`chip ${emailRes.isPhishing ? 'chip-danger' : 'chip-safe'}`}>
                  {emailRes.threatLevel}
                </span>
              </div>

              {/* Urgency score */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                  <span>Urgency Score</span>
                  <span style={{ color: scoreColor(emailRes.urgencyScore), fontWeight: 600 }}>
                    <Counter to={emailRes.urgencyScore} />%
                  </span>
                </div>
                <div className="score-bar">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${emailRes.urgencyScore}%` }}
                    transition={{ duration: 1.1, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{ height: '100%', background: scoreColor(emailRes.urgencyScore), borderRadius: 2 }}
                  />
                </div>
              </div>

              {/* Impersonated brand */}
              {emailRes.impersonatedBrand && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                  Impersonating: <span style={{ color: '#f87171', fontWeight: 600 }}>{emailRes.impersonatedBrand}</span>
                </div>
              )}

              {/* Detected tricks */}
              {emailRes.detectedTricks?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Techniques Detected</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {emailRes.detectedTricks.map((t, i) => <span key={i} className="trick">{t}</span>)}
                  </div>
                </div>
              )}

              {/* Reasons */}
              {emailRes.reasons?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Risk Indicators</div>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {emailRes.reasons.map((r, i) => (
                      <li key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', display: 'flex', gap: 8 }}>
                        <span style={{ color: '#f87171', flexShrink: 0 }}>—</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suspicious links */}
              {emailRes.suspiciousLinks?.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Suspicious Links</div>
                  {emailRes.suspiciousLinks.map((l, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l}</div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Tab bar (bottom) ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ display: 'flex', gap: 4, marginTop: 36, padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: 9999, border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button className={`tab-pill ${tab === 'url' ? 'tab-pill-active' : 'tab-pill-inactive'}`} onClick={() => switchTab('url')}>
          URL Scanner
        </button>
        <button className={`tab-pill ${tab === 'email' ? 'tab-pill-active' : 'tab-pill-inactive'}`} onClick={() => switchTab('email')}>
          Email Analyzer
        </button>
      </motion.div>

    </div>
  );
}
