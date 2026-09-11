import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Search,
  CreditCard,
  Clock,
  TrendingUp,
  ShieldCheck,
  User,
  Brain,
  ClipboardList,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import aiCompanionImg from '../../assets/hero/ai-companion.png';
import FitResQLogo from '../common/FitResQLogo';

export const HeroSection = () => {
  const navigate = useNavigate();
  const [activeNode, setActiveNode] = useState(null);

  const quickPrompts = [
    { label: 'Track my refund', prompt: 'Where is my refund for ORD-10021?' },
    { label: 'Check my case status', prompt: 'What is the current status of case FR-1F40B7F5?' },
    { label: 'Get refund policy', prompt: 'Explain the 3-step FitResQ refund guarantee policy.' },
    { label: 'Talk to an agent', prompt: 'I want to escalate my case to a human support specialist.' },
  ];

  const networkNodes = [
    { id: 'customer', title: 'Customer', icon: User, x: 18, y: 15, color: '#38BDF8', glow: 'shadow-cyan-500/40' },
    { id: 'ai', title: 'AI Intelligence', icon: Brain, x: 50, y: 8, color: '#A855F7', glow: 'shadow-purple-500/40' },
    { id: 'case', title: 'Case Management', icon: ClipboardList, x: 82, y: 22, color: '#6366F1', glow: 'shadow-indigo-500/40' },
    { id: 'refund', title: 'Refund Tracking', icon: CreditCard, x: 86, y: 55, color: '#EC4899', glow: 'shadow-pink-500/40' },
    { id: 'sla', title: 'SLA Monitoring', icon: Clock, x: 68, y: 86, color: '#F59E0B', glow: 'shadow-amber-500/40' },
    { id: 'resolution', title: 'Resolution', icon: CheckCircle2, x: 26, y: 82, color: '#10B981', glow: 'shadow-emerald-500/40' },
  ];

  return (
    <div className="relative overflow-hidden bg-[#070A14] text-white select-none border-b border-slate-800/80">
      {/* Dynamic Background Glows & Grid Mesh */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Deep radial ambient lighting */}
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 left-10 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px]" />

        {/* Futuristic Subtle Grid Mesh */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center min-h-[540px]">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Brand Messaging, Typography, CTAs, Value Props */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 space-y-6 text-left">
            {/* Capsule Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-brand-500/40 shadow-sm shadow-brand-500/15 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-indigo-200 to-cyan-300">
                AI-Powered Customer Resolution Platform
              </span>
            </div>

            {/* Giant Cinematic Headline */}
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
                Support that <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 drop-shadow-sm">
                  actually resolves.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 font-normal leading-relaxed max-w-md pt-2">
                Track your cases, monitor refunds, and get intelligent support — all in one place.
              </p>
            </div>

            {/* 3 Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Button 1: Ask FitResQ AI */}
              <button
                type="button"
                onClick={() => navigate('/ai-support')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500 hover:from-brand-500 hover:to-cyan-400 shadow-lg shadow-brand-500/30 hover:shadow-cyan-500/25 active:scale-95 transition-all duration-200"
              >
                <Sparkles className="w-4 h-4" />
                <span>Ask FitResQ AI</span>
              </button>

              {/* Button 2: Track My Case */}
              <button
                type="button"
                onClick={() => navigate('/cases')}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-slate-200 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 hover:text-white backdrop-blur-md active:scale-95 transition-all duration-200"
              >
                <Search className="w-4 h-4 text-cyan-400" />
                <span>Track My Case</span>
              </button>

              {/* Button 3: Check Refund */}
              <button
                type="button"
                onClick={() => navigate('/refunds')}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold text-slate-200 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 hover:text-white backdrop-blur-md active:scale-95 transition-all duration-200"
              >
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Check Refund</span>
              </button>
            </div>

            {/* Value Assurance Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-400 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
                <span>24h SLA Monitoring</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Real-time Case Tracking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Secure & Private</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Interactive Companion Card + 3D AI Assistant + Circular Network */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 relative flex items-center justify-center min-h-[460px]">
            
            {/* Background Circular Network Canvas with SVG Bezier Lines */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 600 440" fill="none">
                <defs>
                  <linearGradient id="orbitGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#6366F1" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity="0.5" />
                  </linearGradient>
                  <linearGradient id="orbitGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#C084FC" stopOpacity="0.3" />
                  </linearGradient>
                </defs>

                {/* Concentric subtle orbit circles */}
                <ellipse cx="380" cy="220" rx="170" ry="170" stroke="url(#orbitGrad1)" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.6" />
                <ellipse cx="380" cy="220" rx="110" ry="110" stroke="url(#orbitGrad2)" strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />

                {/* Animated data transfer connection curves */}
                <path
                  d="M170 140 C 260 100, 310 130, 380 220"
                  stroke="#38BDF8"
                  strokeWidth="1.5"
                  strokeDasharray="4 8"
                  opacity="0.7"
                  className="motion-safe:animate-pulse"
                />
                <path
                  d="M380 220 C 420 120, 480 120, 510 160"
                  stroke="#818CF8"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                  opacity="0.6"
                />
                <path
                  d="M380 220 C 460 260, 480 300, 520 300"
                  stroke="#EC4899"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                  opacity="0.6"
                />
                <path
                  d="M380 220 C 400 340, 360 370, 300 370"
                  stroke="#10B981"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                  opacity="0.6"
                />
              </svg>
            </div>

            {/* Container for Bot, Companion Card, and Surrounding Network */}
            <div className="relative w-full max-w-[620px] flex items-center justify-between">

              {/* CARD 1: Floating "Your Support Companion" Glass Card (Left of Bot) */}
              <div className="w-52 sm:w-60 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl z-20 space-y-2.5 text-left transition-all hover:border-brand-500/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white leading-tight">Your Support Companion</h3>
                    <p className="text-[10px] text-slate-400">How can I help you today?</p>
                  </div>
                </div>

                {/* Interactive Quick Action Prompts */}
                <div className="space-y-1.5 pt-1">
                  {quickPrompts.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => navigate(`/ai-support?prompt=${encodeURIComponent(item.prompt)}`)}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-brand-600/20 hover:border-brand-500/40 border border-slate-700/50 text-[11px] text-slate-300 hover:text-white flex items-center justify-between group transition-all"
                    >
                      <span className="truncate">{item.label}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D AI Assistant Bot Avatar (Center) */}
              <div className="relative -ml-4 sm:-ml-2 z-10 shrink-0">
                <div className="relative w-44 sm:w-56 h-44 sm:h-56 flex items-center justify-center motion-safe:animate-[bounce_5s_ease-in-out_infinite]">
                  {/* Outer Cyan/Purple Ring Glow */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-cyan-500/30 via-indigo-500/20 to-brand-500/30 blur-xl pointer-events-none" />

                  {/* 3D Bot Image */}
                  <img
                    src={aiCompanionImg}
                    alt="FitResQ AI Companion"
                    className="w-full h-full object-contain relative z-10 drop-shadow-[0_15px_25px_rgba(6,182,212,0.35)]"
                  />
                </div>
              </div>

              {/* CENTRAL NETWORK EMBLEM & CONNECTED NODES (Right of Bot) */}
              <div className="relative w-56 sm:w-64 h-64 sm:h-72 flex items-center justify-center shrink-0">
                
                {/* Central Glowing FitResQ Network Orb */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-900/95 border-2 border-brand-500/60 shadow-[0_0_35px_rgba(139,92,246,0.35)] flex flex-col items-center justify-center text-center p-2 z-15 backdrop-blur-md">
                  <FitResQLogo iconOnly={true} size="md" />
                  <span className="text-[11px] font-extrabold text-white mt-1">FitResQ</span>
                  <span className="text-[8px] font-medium text-slate-400 tracking-tight leading-tight">
                    Customer Support & Refund Resolution
                  </span>
                </div>

                {/* Surrounding Connected Nodes Orbiting */}
                {/* 1. Customer */}
                <div
                  className="absolute top-2 left-6 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-cyan-500/50 shadow-md shadow-cyan-500/20 flex items-center gap-1.5 text-[10px] font-bold text-cyan-300 z-20 transition-transform hover:scale-105"
                  title="Customer Identity & Intake"
                >
                  <User className="w-3 h-3 text-cyan-400" />
                  <span>Customer</span>
                </div>

                {/* 2. AI Intelligence */}
                <div
                  className="absolute top-0 right-10 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-purple-500/50 shadow-md shadow-purple-500/20 flex items-center gap-1.5 text-[10px] font-bold text-purple-300 z-20 transition-transform hover:scale-105"
                  title="AI Intelligence & Context Grounding"
                >
                  <Brain className="w-3 h-3 text-purple-400" />
                  <span>AI Intelligence</span>
                </div>

                {/* 3. Case Management */}
                <div
                  className="absolute top-20 -right-2 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-indigo-500/50 shadow-md shadow-indigo-500/20 flex items-center gap-1.5 text-[10px] font-bold text-indigo-300 z-20 transition-transform hover:scale-105"
                  title="Support Case Lifecycle"
                >
                  <ClipboardList className="w-3 h-3 text-indigo-400" />
                  <span>Case Management</span>
                </div>

                {/* 4. Refund Tracking */}
                <div
                  className="absolute bottom-20 -right-4 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-pink-500/50 shadow-md shadow-pink-500/20 flex items-center gap-1.5 text-[10px] font-bold text-pink-300 z-20 transition-transform hover:scale-105"
                  title="Banking Switch & UPI Tracking"
                >
                  <CreditCard className="w-3 h-3 text-pink-400" />
                  <span>Refund Tracking</span>
                </div>

                {/* 5. SLA Monitoring */}
                <div
                  className="absolute -bottom-2 right-8 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-amber-500/50 shadow-md shadow-amber-500/20 flex items-center gap-1.5 text-[10px] font-bold text-amber-300 z-20 transition-transform hover:scale-105"
                  title="24h SLA Active Countdown"
                >
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>SLA Monitoring</span>
                </div>

                {/* 6. Resolution */}
                <div
                  className="absolute bottom-4 left-4 px-2.5 py-1 rounded-xl bg-slate-900/90 border border-emerald-500/50 shadow-md shadow-emerald-500/20 flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 z-20 transition-transform hover:scale-105"
                  title="Confirmed Resolution & Payout"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Resolution</span>
                </div>
              </div>

            </div>

            {/* Subtle e-commerce reassurance watermark on right */}
            <div className="hidden xl:block absolute -bottom-6 -right-6 text-right opacity-30 select-none pointer-events-none">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block">
                From concerns to confidence.
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Better Shopping Experiences
              </span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default HeroSection;
