import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ActivityLogger from './components/ActivityLogger';
import DashboardCharts from './components/DashboardCharts';
import Challenges from './components/Challenges';
import AiCoach from './components/AiCoach';
import { SeasonalAmbience } from './components/SeasonalAmbience';
import { ActivityLog, Challenge } from './types';
import { getInitialHistoryLogs, INITIAL_CHALLENGES, calculateLogEmissions } from './data';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, Award, BarChart3, HelpCircle, FileText } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  // Helper to play highly-satisfying organic synthesized chime
  const playInteractionChime = (type: 'log' | 'complete' | 'click') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, startTime: number, duration: number, gainVal: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(gainVal, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      if (type === 'log') {
        // Satisfying log cadence: major chord progression
        const now = ctx.currentTime;
        playTone(392, now, 0.4, 0.1);       // G4
        playTone(523.25, now + 0.08, 0.5, 0.12); // C5
        playTone(659.25, now + 0.16, 0.6, 0.12); // E5
        playTone(783.99, now + 0.24, 0.8, 0.15); // G5
      } else if (type === 'complete') {
        // High-fidelity accomplishment arpeggio
        const now = ctx.currentTime;
        playTone(523.25, now, 0.3, 0.1); // C5
        playTone(659.25, now + 0.06, 0.3, 0.1); // E5
        playTone(783.99, now + 0.12, 0.4, 0.12); // G5
        playTone(1046.5, now + 0.18, 0.8, 0.15); // C6
      } else {
        // Tiny structural tab change click
        const now = ctx.currentTime;
        playTone(440, now, 0.15, 0.06); // A4
      }
    } catch (e) {
      // AudioContext is blocked or unsupported, ignore gracefully
    }
  };

  // 1. Initial State Loading from LocalStorage
  useEffect(() => {
    // Check local storage for logs
    const storedLogs = localStorage.getItem('sustaina_carbon_logs_v1');
    if (storedLogs) {
      try {
        const parsed = JSON.parse(storedLogs);
        if (Array.isArray(parsed)) {
          setLogs(parsed);
        } else {
          throw new Error("Stored logs are not an array structure.");
        }
      } catch (e) {
        console.error("Failed to parse local carbon logs, loading seed data.", e);
        const seeds = getInitialHistoryLogs();
        setLogs(seeds);
        localStorage.setItem('sustaina_carbon_logs_v1', JSON.stringify(seeds));
      }
    } else {
      const seeds = getInitialHistoryLogs();
      setLogs(seeds);
      localStorage.setItem('sustaina_carbon_logs_v1', JSON.stringify(seeds));
    }

    // Check challenge states
    const storedChallenges = localStorage.getItem('sustaina_challenges_v1');
    if (storedChallenges) {
      try {
        const parsed = JSON.parse(storedChallenges);
        if (Array.isArray(parsed)) {
          setChallenges(parsed);
        } else {
          throw new Error("Stored challenges are not an array structure.");
        }
      } catch (e) {
        console.error("Failed to parse local challenges, reloading seeds.", e);
        setChallenges(INITIAL_CHALLENGES);
        localStorage.setItem('sustaina_challenges_v1', JSON.stringify(INITIAL_CHALLENGES));
      }
    } else {
      setChallenges(INITIAL_CHALLENGES);
      localStorage.setItem('sustaina_challenges_v1', JSON.stringify(INITIAL_CHALLENGES));
    }
  }, []);

  // 2. State persistence trigger
  const saveLogsToStorage = (updatedLogs: ActivityLog[]) => {
    setLogs(updatedLogs);
    localStorage.setItem('sustaina_carbon_logs_v1', JSON.stringify(updatedLogs));
  };

  const saveChallengesToStorage = (updatedChallenges: Challenge[]) => {
    setChallenges(updatedChallenges);
    localStorage.setItem('sustaina_challenges_v1', JSON.stringify(updatedChallenges));
  };

  // 3. User Handlers
  const handleSaveLog = (draftMetrics: Omit<ActivityLog, 'transport' | 'energy' | 'food' | 'shopping' | 'id' | 'calculatedEmissions'> & any, date: string) => {
    // Check if entry for date already exists
    const emissions = calculateLogEmissions(draftMetrics);
    
    const updated = [...logs];
    const existingIdx = updated.findIndex((l) => l.date === date);

    if (existingIdx !== -1) {
      // Overwrite existing log for that calendar day
      updated[existingIdx] = {
        ...updated[existingIdx],
        transport: draftMetrics.transport,
        energy: draftMetrics.energy,
        food: draftMetrics.food,
        shopping: draftMetrics.shopping,
        calculatedEmissions: emissions
      };
    } else {
      // Append a completely fresh new day entry
      const newEntry: ActivityLog = {
        id: `log_${Date.now()}`,
        date,
        transport: draftMetrics.transport,
        energy: draftMetrics.energy,
        food: draftMetrics.food,
        shopping: draftMetrics.shopping,
        calculatedEmissions: emissions
      };
      updated.push(newEntry);
    }

    // Sort logs chronologically to keep charts pristine
    updated.sort((a, b) => a.date.localeCompare(b.date));
    saveLogsToStorage(updated);
    playInteractionChime('log');
  };

  const handleToggleChallenge = (challengeId: string) => {
    let triggeredTone: 'complete' | 'click' = 'click';
    const updated = challenges.map((c) => {
      if (c.id === challengeId) {
        triggeredTone = !c.completed ? 'complete' : 'click';
        return { ...c, completed: !c.completed };
      }
      return c;
    });
    saveChallengesToStorage(updated);
    playInteractionChime(triggeredTone);
  };

  // 4. Cumulative calculations for Navbar summary stats
  const totalSavedCo2 = challenges
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.co2Savings, 0);

  // Approximate streak by tracking how many of the last 7 calendar days have a matching log entry
  const calculateStreak = () => {
    if (logs.length === 0) return 0;
    
    // Sort reverse chronological
    const sortedDates = logs.map(l => l.date).filter((val, idx, self) => self.indexOf(val) === idx).sort((a, b) => b.localeCompare(a));
    
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = yesterdayObj.toISOString().split('T')[0];

    // If they logged neither today nor yesterday, active streak resets to 0
    if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
      return 0;
    }

    let streak = 0;
    let checkDateObj = new Date(sortedDates[0]); // begin checking consecutive dates backwards
    
    for (let i = 0; i < sortedDates.length; i++) {
      const matchStr = checkDateObj.toISOString().split('T')[0];
      if (sortedDates.includes(matchStr)) {
        streak++;
        checkDateObj.setDate(checkDateObj.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  return (
    <div className="min-h-screen bg-transparent text-[#3d3d3d] flex flex-col justify-between font-sans antialiased selection:bg-[#efefdf] selection:text-[#4A4A3A]">
      <SeasonalAmbience />
      <div className="flex-1 relative z-10">
        {/* Navbar component */}
        <Navbar 
          currentStreak={calculateStreak()} 
          totalSavedCo2={totalSavedCo2} 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            playInteractionChime('click');
          }} 
        />

        {/* Core Screen Transitions */}
        <main className="py-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <DashboardCharts logs={logs} />
              </motion.div>
            )}

            {activeTab === 'log' && (
              <motion.div
                key="log-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <ActivityLogger onSaveLog={handleSaveLog} existingLogs={logs} />
              </motion.div>
            )}

            {activeTab === 'challenges' && (
              <motion.div
                key="challenges-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <Challenges challenges={challenges} onToggleChallenge={handleToggleChallenge} />
              </motion.div>
            )}

            {activeTab === 'coach' && (
              <motion.div
                key="coach-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <AiCoach logs={logs} challenges={challenges} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Styled Footer */}
      <footer className="bg-[#efefdf]/40 border-t border-[#e5e5d1] py-8 mt-12 text-center text-xs text-[#8b8b74] select-none">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-1.5">
          <p className="font-serif italic text-sm font-semibold text-[#4A4A3A]">Sustaina Carbon Footprint Tracker</p>
          <p className="text-[11px]">Analyzing global footprint offsets to track your journey to a smaller footprint.</p>
        </div>
      </footer>
    </div>
  );
}
