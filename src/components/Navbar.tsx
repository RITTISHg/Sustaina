import React from 'react';
import { Leaf, Award, BarChart3, HelpCircle } from 'lucide-react';

interface NavbarProps {
  currentStreak: number;
  totalSavedCo2: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Navbar({ currentStreak, totalSavedCo2, activeTab, setActiveTab }: NavbarProps) {
  const tabs = [
    { id: 'dashboard', label: 'Emissions Hub', icon: BarChart3 },
    { id: 'log', label: 'Log Activity', icon: Leaf },
    { id: 'challenges', label: 'Eco-Challenges', icon: Award },
    { id: 'coach', label: 'Smart AI Coach', icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e5e5d1] bg-[#fbfbf8]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5A5A40] text-white shadow-xs">
            <Leaf className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="font-serif italic text-2xl font-bold tracking-tight text-[#4A4A3A]">Sustaina</span>
            <span className="block font-mono text-[9px] tracking-widest text-[#8b8b74] uppercase mt-[-2px]">Carbon Manager</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex space-x-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                aria-label={`Switch to ${tab.label}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-2xl font-sans text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#5A5A40] text-white shadow-xs border border-[#5A5A40]'
                    : 'text-[#6b6b5a] hover:bg-[#efefdf] hover:text-[#4A4A3A] border border-transparent'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Stats Summary */}
        <div className="flex items-center space-x-3">
          {/* Active streak */}
          <div className="flex items-center space-x-1.5 rounded-full bg-[#efefdf] border border-[#e5e5d1] px-3.5 py-1 text-[#4A4A3A] shadow-xs">
            <span className="text-xs">🔥</span>
            <span className="font-mono text-xs font-bold">{currentStreak} Day Streak</span>
          </div>

          {/* Offsets saved */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="font-mono text-[9px] text-[#8b8b74] uppercase tracking-widest font-bold">SAVED CO2</span>
            <span className="font-sans text-sm font-bold text-[#5A5A40]">{totalSavedCo2.toFixed(1)} kg</span>
          </div>
        </div>
      </div>

      {/* Mobile Tab Rail */}
      <div className="md:hidden flex border-t border-[#e5e5d1] bg-[#fbfbf8] justify-around py-1.5 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`mobile-nav-tab-${tab.id}`}
              aria-label={`Switch to ${tab.label}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive ? 'text-[#5A5A40]' : 'text-[#6b6b5a] hover:text-[#4A4A3A]'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 mb-1 ${isActive ? 'text-[#5A5A40]' : 'text-[#8b8b74]'}`} aria-hidden="true" />
              <span className="text-[10px]">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
