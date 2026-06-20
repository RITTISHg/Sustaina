import React, { useState, useEffect, useRef } from 'react';
import { ActivityLog, Challenge } from '../types';
import { Sparkles, Send, BrainCircuit, User, AlertCircle, ShoppingBag, Car, Zap, Utensils, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AiCoachProps {
  logs: ActivityLog[];
  challenges: Challenge[];
}

interface SmartTip {
  category: 'transport' | 'energy' | 'food' | 'shopping' | 'general';
  title: string;
  description: string;
  potentialSavingKg?: number;
}

interface CoachData {
  coachStatement: string;
  weeklyGrade: string;
  topImpactCategory: 'transport' | 'energy' | 'food' | 'shopping' | 'general';
  smartTips: SmartTip[];
  isFallback?: boolean;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export default function AiCoach({ logs, challenges }: AiCoachProps) {
  const [coachData, setCoachData] = useState<CoachData | null>(null);
  const [loadingTips, setLoadingTips] = useState<boolean>(false);
  const [errorTips, setErrorTips] = useState<string | null>(null);

  // Chat panel states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Hello! I am your Sustaina Eco-Coach. Ask me any climate questions, diet comparisons, or travel solutions to reduce your footprint!" }
  ]);
  const [typedMessage, setTypedMessage] = useState<string>('');
  const [sendingMsg, setSendingMsg] = useState<boolean>(false);

  const activeChallenges = challenges.filter(c => c.completed);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch coach analysis once
  useEffect(() => {
    if (logs.length === 0) return;

    const fetchTips = async () => {
      setLoadingTips(true);
      setErrorTips(null);
      try {
        const response = await fetch('/api/gemini/tips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logs, activeChallenges })
        });

        if (!response.ok) {
          throw new Error('Failed to generate customized eco coach reports');
        }

        const data = await response.json();
        setCoachData({
          coachStatement: data.coachStatement || "Keep up your logging. The initial steps represent standard calibration.",
          weeklyGrade: data.weeklyGrade || "B",
          topImpactCategory: data.topImpactCategory || "general",
          smartTips: data.smartTips || data.tips || [],
          isFallback: !!data.isFallback
        });
      } catch (err) {
        console.error(err);
        setErrorTips("Failed to sync audit data. Review your server configuration.");
        // Fallback local mock simulation so it always shows content
        setCoachData({
          coachStatement: "Your transport and food indices represent areas of healthy focus. Consider switching short errands to active walking or cycling to easily drop below the sustainable 5kg daily limit.",
          weeklyGrade: "B-",
          topImpactCategory: "transport",
          isFallback: true,
          smartTips: [
            {
              category: "transport",
              title: "Switch to Electric or Carpulsing",
              description: "Commuting represents a significant portion of your logs. Switch short trips to walking or carpool where possible.",
              potentialSavingKg: 6.5
            },
            {
              category: "energy",
              title: "Unplug stand-by energy adapters",
              description: "Chargers and laptops connected overnight continue drawing minor phantom currents that compound.",
              potentialSavingKg: 1.2
            },
            {
              category: "food",
              title: "Opt-in on Vegetarian lunches",
              description: "Reducing red meat intake by even 50% weekly contributes the single largest diet emission offset.",
              potentialSavingKg: 4.8
            }
          ]
        });
      } finally {
        setLoadingTips(false);
      }
    };

    fetchTips();
  }, [logs]);

  // Handle chat submission
  const handleSendMessage = async (msgText: string) => {
    if (!msgText.trim() || sendingMsg) return;

    const userMsg: ChatMessage = { role: 'user', text: msgText };
    setChatMessages((prev) => [...prev, userMsg]);
    setTypedMessage('');
    setSendingMsg(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgText,
          history: [...chatMessages, userMsg]
        })
      });

      if (!response.ok) {
        throw new Error('Network error during coach communication');
      }

      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: 'model', text: data.reply }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: 'model', text: "I'm having trouble reaching the eco server grid. Let's trace back: standard active transport or local food selection offers direct, stable buffers!" }]);
    } finally {
      setSendingMsg(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'transport': return 'text-[#5A5A40] bg-[#efefdf] border-[#e5e5d1]';
      case 'energy': return 'text-[#D9C5B2] bg-[#f4f4ec] border-[#e5e5d1]';
      case 'food': return 'text-[#8B9474] bg-[#efefdf] border-[#e5e5d1]';
      case 'shopping': return 'text-[#C18C74] bg-[#f4f4ec] border-[#e5e5d1]';
      default: return 'text-[#4A4A3A] bg-[#fbfbf8] border-[#e5e5d1]';
    }
  };

  const getGradeBg = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-[#8B9474]/15 text-[#8B9474] border-[#8B9474]/30';
    if (grade.startsWith('B')) return 'bg-[#5A5A40]/15 text-[#5A5A40] border-[#5A5A40]/30';
    if (grade.startsWith('C')) return 'bg-[#D9C5B2]/15 text-[#D9C5B2] border-[#D9C5B2]/30';
    return 'bg-[#C18C74]/15 text-[#C18C74] border-[#C18C74]/30';
  };

  const promptSuggestions = [
    "How do I reduce standby utility load?",
    "Is poultry better than beef for CO2?",
    "Does recycling clothing have a big impact?",
    "How does grid solar power lower bills?"
  ];

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#fbfbf8] rounded-3xl border border-[#e5e5d1] shadow-xs max-w-xl mx-auto my-8">
        <BrainCircuit className="h-12 w-12 text-[#8B9474] mb-3 animate-pulse" />
        <h3 className="font-serif italic text-lg font-bold text-[#4A4A3A]">Coach Calibration in progress</h3>
        <p className="text-sm text-[#6b6b5a] max-w-sm mt-1 leading-relaxed">
          The Eco-Coach requires at least 1 logged daily activity to generate intelligent custom grades and footprint reviews. Head over to the logging hub!
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      
      {/* Page Header */}
      <div className="flex items-center space-x-3 mb-2">
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#5A5A40] text-white shadow-xs">
          <BrainCircuit className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-serif italic text-3xl font-extrabold text-[#4A4A3A]">Eco-Coach AI</h1>
          <p className="text-xs text-[#6b6b5a] mt-1.5">Real-time custom environmental auditing, emission grade analysis, and instant smart suggestions.</p>
        </div>
      </div>

      {/* 2. Top Block: AI AUDIT DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left section: Grade Card & Statement of Coach */}
        <div className="lg:col-span-1 bg-[#fbfbf8] border border-[#e5e5d1] rounded-3xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
          {loadingTips ? (
            <div className="flex flex-col items-center justify-center h-full py-12 space-y-3">
              <div className="h-12 w-12 border-4 border-[#8B9474] border-t-transparent rounded-full animate-spin"></div>
              <span className="font-mono text-xs text-[#8b8b74]">Summoning Coach report...</span>
            </div>
          ) : coachData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#e5e5d1]/50 pb-4">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#8b8b74] font-bold">FOOTPRINT GRADE</span>
                {coachData.isFallback && (
                  <span className="text-[10px] bg-[#f4f4ec] text-[#6b6b5a] px-2.5 py-0.5 rounded-full font-sans border border-[#e5e5d1]">
                    Fallback mode
                  </span>
                )}
              </div>

              {/* Big Grade display Dial */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className={`h-24 w-24 rounded-full border-4 flex flex-col items-center justify-center shadow-inner font-serif italic ${getGradeBg(coachData.weeklyGrade)}`}>
                  <span className="text-4xl font-extrabold tracking-tight">{coachData.weeklyGrade}</span>
                  <span className="text-[9px] font-sans uppercase tracking-wider opacity-80 mt-0.5 font-bold">Weekly Index</span>
                </div>
              </div>

              {/* Coach Quote Statement */}
              <div className="bg-[#f4f4ec] p-4 rounded-2xl border border-[#e5e5d1] relative">
                <span className="absolute top-1 left-2 text-4xl text-[#8B9474]/30 font-serif leading-none select-none">“</span>
                <p className="text-xs leading-relaxed text-[#4A4A3A] font-medium pl-6 italic animate-fade-in">
                  {coachData.coachStatement}
                </p>
              </div>

              {/* Top impact identifier */}
              <div className="pt-4 border-t border-[#e5e5d1]/50 flex justify-between items-center text-xs">
                <span className="text-[#6b6b5a] font-sans font-medium">Primary carbon leakage:</span>
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider text-[#C18C74] bg-[#C18C74]/15 border border-[#C18C74]/30 font-mono">
                  ⚠️ {coachData.topImpactCategory}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-[#8b8b74] text-xs text-center py-12">Failed to retrieve grade profiles</div>
          )}
        </div>

        {/* Right section: Core Smart tips card segments */}
        <div className="lg:col-span-2 bg-[#fbfbf8] border border-[#e5e5d1] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-serif italic text-lg font-bold text-[#4A4A3A] flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-[#8B9474]" />
              Tailored Carbon Audits
            </h3>
            <p className="text-xs text-[#6b6b5a] mt-1.5">Surgically generated steps mapped to your logged travel, utility rates, and grocery profiles.</p>
          </div>

          <div className="my-6 space-y-4">
            {loadingTips ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="animate-pulse flex space-x-4 p-4 border border-[#e5e5d1] rounded-2xl bg-white/50">
                  <div className="rounded-full bg-[#efefdf] h-10 w-10"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3.5 bg-[#efefdf] rounded-md w-1/3"></div>
                    <div className="h-3 bg-[#f4f4ec] rounded-md w-3/4"></div>
                  </div>
                </div>
              ))
            ) : coachData && coachData.smartTips ? (
              coachData.smartTips.map((tip, idx) => (
                <div key={idx} className="flex gap-4 p-4 border border-[#e5e5d1]/60 hover:border-[#e5e5d1] hover:shadow-xs rounded-2xl transition-all bg-white/60">
                  <div className={`h-10 w-10 flex-shrink-0 rounded-xl flex items-center justify-center border ${getCategoryColor(tip.category)}`}>
                    {tip.category === 'transport' ? <Car className="h-5 w-5" /> :
                     tip.category === 'energy' ? <Zap className="h-5 w-5" /> :
                     tip.category === 'food' ? <Utensils className="h-5 w-5" /> :
                     tip.category === 'shopping' ? <ShoppingBag className="h-5 w-5" /> :
                     <HelpCircle className="h-5 w-5" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-serif italic text-sm font-bold text-[#4A4A3A] leading-none">{tip.title}</h4>
                      {tip.potentialSavingKg && (
                        <span className="text-[10px] font-mono font-bold text-[#8B9474] bg-[#efefdf] border border-[#e5e5d1] px-1.5 py-0.5 rounded-md">
                          -{tip.potentialSavingKg} kg co2 offset
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6b6b5a] leading-relaxed font-sans mt-1">
                      {tip.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#8b8b74] text-center">No tips registered yet</p>
            )}
          </div>

          <p className="text-[11px] text-[#8b8b74] mt-2 font-mono">
            *Tips refresh dynamically as you add more entries to trace high-intensity carbon patterns.
          </p>
        </div>

      </div>

      {/* 3. Bottom Block: REAL-TIME CHAT INTERACTION WINDOW */}
      <div className="bg-[#fbfbf8] border border-[#e5e5d1] rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="border-b border-[#e5e5d1]/50 pb-4 mb-4">
          <h3 className="font-serif italic text-lg font-bold text-[#4A4A3A] flex items-center gap-2">
            💬 Interactive Climate Support
          </h3>
          <p className="text-xs text-[#6b6b5a] mt-1.5">
            Analyze offset trade-offs, utility metrics, and flight details with your personal carbon scientist.
          </p>
        </div>

        {/* Message stack */}
        <div className="min-h-[220px] max-h-[380px] overflow-y-auto border border-[#e5e5d1]/60 rounded-2xl bg-[#f4f4ec]/50 p-4 space-y-4 font-sans text-sm">
          {chatMessages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div 
                key={idx} 
                className={`flex items-start gap-2.5 max-w-[85%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar Icon */}
                <div className={`h-8 w-8 flex-shrink-0 rounded-lg flex items-center justify-center font-bold ${
                  isUser 
                    ? 'bg-[#e5e5d1] text-[#4A4A3A]' 
                    : 'bg-[#5A5A40] text-white shadow-xs'
                }`}>
                  {isUser ? <User className="h-4 w-4" /> : 'S'}
                </div>

                {/* Bubble Text */}
                <div className={`p-3 rounded-2xl leading-relaxed text-xs sm:text-sm ${
                  isUser 
                    ? 'bg-[#4A4A3A] text-[#fbfbf8] rounded-tr-none' 
                    : 'bg-white text-[#4A4A3A] border border-[#e5e5d1] rounded-tl-none shadow-xs'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          
          {sendingMsg && (
            <div className="flex items-start gap-2.5 max-w-[80%]">
              <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-[#5A5A40] text-white flex items-center justify-center font-bold animate-pulse">
                S
              </div>
              <div className="bg-white border border-[#e5e5d1] p-3 rounded-2xl rounded-tl-none text-xs text-[#8b8b74] font-semibold flex items-center space-x-2">
                <span className="h-1.5 w-1.5 bg-[#8b8b74] rounded-full animate-bounce"></span>
                <span className="h-1.5 w-1.5 bg-[#8b8b74] rounded-full animate-bounce delay-100"></span>
                <span className="h-1.5 w-1.5 bg-[#8b8b74] rounded-full animate-bounce delay-200"></span>
                <span>Eco-Coach is thinking...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef}></div>
        </div>

        {/* Suggestion pills quick-clicks */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono tracking-wider text-[#8b8b74] font-bold uppercase">Quick Questions:</span>
          {promptSuggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(s)}
              className="py-1.5 px-3.5 rounded-full border border-[#e5e5d1] bg-white hover:bg-[#efefdf] text-[10px] sm:text-xs font-bold text-[#6b6b5a] hover:text-[#4A4A3A] shadow-3xs cursor-pointer select-none transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(typedMessage);
          }}
          className="mt-4 flex gap-2"
        >
          <input
            type="text"
            id="eco-chat-input"
            aria-label="Ask the Eco-Coach AI"
            value={typedMessage}
            placeholder="Ex: Should I choose paper or plastic storage options to prevent carbon leakage?..."
            onChange={(e) => setTypedMessage(e.target.value)}
            disabled={sendingMsg}
            className="flex-grow rounded-2xl border border-[#e5e5d1] p-3 text-xs sm:text-sm text-[#4A4A3A] placeholder-[#8b8b74] focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] transition-all outline-none bg-white font-sans disabled:opacity-60 font-medium"
          />
          <button
            type="submit"
            id="eco-chat-submit"
            aria-label="Send message"
            disabled={sendingMsg || !typedMessage.trim()}
            className="bg-[#5A5A40] hover:bg-[#4A4A3A] disabled:opacity-60 disabled:hover:bg-[#5A5A40] text-white font-bold font-sans py-2.5 px-5 rounded-2xl shadow-xs flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-[1.01] transition-transform"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>

    </div>
  );
}
