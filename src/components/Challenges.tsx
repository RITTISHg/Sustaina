import React from 'react';
import { Challenge } from '../types';
import { Award, Leaf, Zap, Utensils, ShoppingBag, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'motion/react';

interface ChallengesProps {
  challenges: Challenge[];
  onToggleChallenge: (id: string) => void;
}

export default function Challenges({ challenges, onToggleChallenge }: ChallengesProps) {
  const completedCount = challenges.filter(c => c.completed).length;
  const progressPercent = challenges.length > 0 ? (completedCount / challenges.length) * 100 : 0;

  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'transport':
        return { tag: 'Transport', icon: Leaf, badgeStyle: 'text-[#4A4A3A] bg-[#efefdf] border-[#e5e5d1]', accentBg: 'bg-[#5A5A40]' };
      case 'energy':
        return { tag: 'Utilities', icon: Zap, badgeStyle: 'text-[#4A4A3A] bg-[#f4f4ec] border-[#e5e5d1]', accentBg: 'bg-[#D9C5B2]' };
      case 'food':
        return { tag: 'Food Choice', icon: Utensils, badgeStyle: 'text-[#4A4A3A] bg-[#efefdf] border-[#e5e5d1]', accentBg: 'bg-[#8B9474]' };
      case 'shopping':
        return { tag: 'Consumables', icon: ShoppingBag, badgeStyle: 'text-[#4A4A3A] bg-[#f4f4ec] border-[#e5e5d1]', accentBg: 'bg-[#C18C74]' };
      default:
        return { tag: 'Eco Habit', icon: Award, badgeStyle: 'text-[#4A4A3A] bg-[#fbfbf8] border-[#e5e5d1]', accentBg: 'bg-[#8B9474]' };
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-serif italic text-3xl font-extrabold text-[#4A4A3A]">Eco-Challenges</h1>
        <p className="text-sm text-[#6b6b5a] mt-1.5">
          Perform high-leverage sustainable micro-habits today and record your active CO₂ savings.
        </p>
      </div>

      {/* Progress Card */}
      <div className="bg-[#4A4A3A] text-[#fbfbf8] border border-[#e5e5d1]/20 rounded-[32px] sm:rounded-[36px] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Decorative ambient bulb */}
        <div className="absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-white/5 filter blur-xl"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#D9C5B2] font-bold">TODAY PROGRESS JOURNAL</span>
            <h3 className="font-serif italic text-2xl font-bold text-white">Daily Challenges Complete</h3>
            <p className="text-xs text-[#efefdf]/80">
              Complete tasks to elevate your daily saving margins and unlock champion achievements.
            </p>
          </div>
          <div className="text-right">
            <span className="font-serif italic text-4xl font-extrabold text-[#D9C5B2]">{completedCount} <span className="text-xs text-[#efefdf]/60 font-sans font-normal not-italic">of {challenges.length} Done</span></span>
          </div>
        </div>

        <div className="w-full bg-[#5A5A40] h-2 rounded-full overflow-hidden mt-6 relative z-10">
          <motion.div 
            className="h-full rounded-full bg-[#8B9474]" 
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          ></motion.div>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {challenges.map((challenge, index) => {
          const theme = getCategoryTheme(challenge.category);
          const IconComponent = theme.icon;
          
          return (
            <div 
              key={challenge.id}
              onClick={() => onToggleChallenge(challenge.id)}
              className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left select-none ${
                challenge.completed
                  ? 'bg-[#f4f4ec] border-[#e5e5d1] opacity-90'
                  : 'bg-[#fbfbf8] border-[#e5e5d1] shadow-xs hover:border-[#5A5A40] hover:bg-[#f4f4ec]/55'
              }`}
            >
              {/* Checkbox state indicator */}
              <div className="mt-1 flex-shrink-0 transition-transform duration-200 group-hover:scale-[1.08]">
                {challenge.completed ? (
                  <CheckCircle2 className="h-5.5 w-5.5 text-[#8B9474] fill-[#efefdf]" />
                ) : (
                  <Circle className="h-5.5 w-5.5 text-[#8b8b74] group-hover:text-[#5A5A40]" />
                )}
              </div>

              {/* Challenge Information */}
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Category Pill */}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border ${theme.badgeStyle} font-mono uppercase tracking-widest`}>
                    {theme.tag}
                  </span>
                  {/* Potential co2 metric tag */}
                  <span className="inline-flex items-center text-[10px] text-[#8B9474] bg-[#fbfbf8] border border-[#e5e5d1] px-1.5 py-0.5 rounded-md font-mono font-bold">
                    -{challenge.co2Savings} kg/day
                  </span>
                </div>

                <h4 className={`font-serif italic text-sm font-bold truncate transition-colors ${
                  challenge.completed ? 'text-[#8b8b74] line-through' : 'text-[#4A4A3A] group-hover:text-[#5A5A40]'
                }`}>
                  {challenge.title}
                </h4>

                <p className={`text-xs leading-relaxed ${
                  challenge.completed ? 'text-[#8b8b74]' : 'text-[#6b6b5a]'
                }`}>
                  {challenge.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Achievement Footer */}
      <div className="bg-[#f4f4ec] border border-[#e5e5d1] p-5 rounded-3xl flex items-center space-x-3">
        <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-[#e5e5d1]/50 flex items-center justify-center text-lg text-[#5A5A40]">
          🏆
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#4A4A3A] font-serif italic">Micro Habits, Macro Offsets</h4>
          <p className="text-xs text-[#6b6b5a] leading-relaxed mt-0.5">
            Micro-habits logged today compound into hundreds of kilograms of carbon footprint avoided annually. Encourage friends to lock down home utility vampire loads as well!
          </p>
        </div>
      </div>

    </div>
  );
}
