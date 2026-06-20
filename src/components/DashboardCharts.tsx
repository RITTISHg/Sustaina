import React, { useState } from 'react';
import { ActivityLog } from '../types';
import { COMPARISONS } from '../data';
import { TrendingDown, TreePine, AlertCircle, ShoppingBag, Car, Zap, Utensils, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardChartsProps {
  logs: ActivityLog[];
}

export default function DashboardCharts({ logs }: DashboardChartsProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [globeLayer, setGlobeLayer] = useState<'carbon' | 'canopy' | 'ocean'>('carbon');
  const [globeSpinSpeed, setGlobeSpinSpeed] = useState<number>(24); // in seconds for 360 deg spin
  const [hoveredCard, setHoveredCard] = useState<'daily' | 'biggest' | 'impact' | null>(null);
  const [hoveredComparison, setHoveredComparison] = useState<string | null>(null);

  // If no logs exist
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-xs">
        <AlertCircle className="h-10 w-10 text-emerald-500 mb-3" />
        <h3 className="font-sans text-lg font-bold text-slate-800">No activity logged yet</h3>
        <p className="text-sm text-slate-500 max-w-sm mt-1">
          Go to the "Log Activity" page to log your commute, home utility usage, diets, and shopping.
        </p>
      </div>
    );
  }

  // 1. Calculate General metrics
  const totalLogsCount = logs.length;
  
  // Totals by Category
  let sumTransport = 0;
  let sumEnergy = 0;
  let sumFood = 0;
  let sumShopping = 0;
  let sumTotal = 0;

  logs.forEach(log => {
    sumTransport += log.calculatedEmissions.transport;
    sumEnergy += log.calculatedEmissions.energy;
    sumFood += log.calculatedEmissions.food;
    sumShopping += log.calculatedEmissions.shopping;
    sumTotal += log.calculatedEmissions.total;
  });

  const avgDailyEmissions = sumTotal / totalLogsCount;
  const avgTransport = sumTransport / totalLogsCount;
  const avgEnergy = sumEnergy / totalLogsCount;
  const avgFood = sumFood / totalLogsCount;
  const avgShopping = sumShopping / totalLogsCount;

  // Find biggest category emitter
  const categories = [
    { id: 'transport', label: 'Transport', avg: avgTransport, icon: Car, color: 'text-[#4A4A3A] bg-[#efefdf] border-[#e5e5d1]', barBg: 'bg-[#5A5A40]', stroke: '#5A5A40' },
    { id: 'energy', label: 'Energy Utilities', avg: avgEnergy, icon: Zap, color: 'text-[#4A4A3A] bg-[#fbfbf8] border-[#e5e5d1]', barBg: 'bg-[#D9C5B2]', stroke: '#D9C5B2' },
    { id: 'food', label: 'Food Diet', avg: avgFood, icon: Utensils, color: 'text-[#4A4A3A] bg-[#f4f4ec] border-[#e5e5d1]', barBg: 'bg-[#8B9474]', stroke: '#8B9474' },
    { id: 'shopping', label: 'Shopping Goods', avg: avgShopping, icon: ShoppingBag, color: 'text-[#4A4A3A] bg-[#efefdf] border-[#e5e5d1]', barBg: 'bg-[#C18C74]', stroke: '#C18C74' },
  ];

  const highestCategoryObj = [...categories].sort((a, b) => b.avg - a.avg)[0];

  // Tree Offset Helper
  const usAverageFootprint = 44.5;
  const dailyCo2Savings = Math.max(0, usAverageFootprint - avgDailyEmissions);
  const potentialTreeAcresSaved = (dailyCo2Savings * 365) / 22; // annual saved equivalent in mature trees

  // Chronological sort of logs for timeline
  const chronologicalLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-10); // show last 10 logs max

  // Donut values math for breakdown SVG
  const totalCombinedAvg = avgTransport + avgEnergy + avgFood + avgShopping;
  let cumulativeAngle = 0;
  const donutRadius = 60;
  const donutCircumference = 2 * Math.PI * donutRadius;

  const donutSlices = categories.map((cat) => {
    const value = totalCombinedAvg > 0 ? cat.avg : 0.25; // default split if all zero
    const percentage = totalCombinedAvg > 0 ? (value / totalCombinedAvg) * 100 : 25;
    
    // Circle stroke math
    const strokeDasharray = `${(percentage / 100) * donutCircumference} ${donutCircumference}`;
    const strokeDashoffset = `${donutCircumference - (cumulativeAngle / 100) * donutCircumference}`;
    cumulativeAngle += percentage;

    return {
      ...cat,
      value,
      percentage,
      strokeDasharray,
      strokeDashoffset
    };
  });

  // Dynamic values based on selected interactive globe layer
  const getGlobeTheme = () => {
    switch (globeLayer) {
      case 'carbon':
        return {
          title: 'Atmospheric Carbon (Co₂e) Index',
          status: avgDailyEmissions <= 12 ? 'Protected / Stable' : 'High Density Load',
          statusColor: avgDailyEmissions <= 12 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-800 bg-amber-50',
          baseColor: 'from-[#0B1528] via-[#0E2C5E] to-[#1E3B70]',
          glowGradients: ['#0496FF', '#1E3B70'],
          fact: 'Atmospheric carbon filters carbon load metrics directly according to daily individual offsets.'
        };
      case 'canopy':
        return {
          title: 'Forest Canopy & Biodiversity Grid',
          status: potentialTreeAcresSaved >= 50 ? 'Strong Canopy Regrowth' : 'Moderate Carbon Absorption',
          statusColor: 'text-[#4A5A40] bg-[#efefdf]',
          baseColor: 'from-[#03220F] via-[#0E3D1E] to-[#1E5D2A]',
          glowGradients: ['#00FF87', '#1E5D2A'],
          fact: 'Canopy grids show how mature plants consume logged domestic carbon outputs annually.'
        };
      case 'ocean':
        return {
          title: 'Oceanic Thermal Balance Grid',
          status: 'Neutral Thermal Inertia',
          statusColor: 'text-blue-700 bg-blue-50',
          baseColor: 'from-[#031525] via-[#083055] to-[#0A4B85]',
          glowGradients: ['#38BDF8', '#0A4B85'],
          fact: 'Seawater heat coefficients map directly to heavy-intensity carbon goods and shipping.'
        };
    }
  };

  const globeTheme = getGlobeTheme();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-8">
      
      {/* 1. Interactive 3D Planet Showcase Segment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Bento: Stats Stack with subtle 3D lift & revealable tooltips on hover */}
        <div className="lg:col-span-12 xl:col-span-5 grid grid-cols-1 md:grid-cols-3 xl:flex xl:flex-col gap-5 justify-between">
          
          {/* Daily average block */}
          <div 
            className="bg-white border border-[#e5e5d1] p-6 rounded-[30px] hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[130px] shadow-xs group cursor-help"
            onMouseEnter={() => setHoveredCard('daily')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="absolute top-2 right-4 text-3xl opacity-20 group-hover:scale-110 transition-transform select-none">📊</div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#8b8b74] font-semibold">DAILY COMPASS</span>
                <span className="text-[9.5px] text-[#5A5A40] bg-[#f4f4ec] px-1.5 py-0.2 rounded-full font-bold">Info ▸</span>
              </div>
              <h4 className="font-serif italic text-3xl font-bold text-[#4A4A3A] mt-1 flex items-baseline">
                {avgDailyEmissions.toFixed(1)} <span className="font-sans text-xs font-light text-[#8b8b74] ml-1.5">kg CO₂e</span>
              </h4>
            </div>
            <div className="flex items-center justify-between text-xs text-[#6b6b5a] pt-1">
              <span className="text-[10px]">Overall Score:</span>
              {avgDailyEmissions <= 12.0 ? (
                <span className="text-[#5A5A40] font-bold bg-[#f4f4ec] border border-[#e5e5d1]/60 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">🌱 Green Standard</span>
              ) : (
                <span className="text-amber-800 font-bold bg-[#efefdf] border border-[#e5e5d1]/60 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">⚠️ Adjusting Tier</span>
              )}
            </div>

            {/* Premium Slide-Up Tooltip Explanation */}
            <div className="absolute inset-0 bg-[#4A4A3A] text-white p-5 text-[11px] leading-relaxed transition-all duration-300 transform translate-y-full group-hover:translate-y-0 flex flex-col justify-center z-30 select-none">
              <p className="font-bold uppercase text-[9px] font-mono tracking-widest text-[#D9C5B2] mb-1">What is CO₂e?</p>
              <p className="opacity-90">Carbon dioxide equivalent. It standardizes carbon footprint, methane, and greenhouse gases. A score below 12.0 kg is considered a healthy sustainable tier.</p>
            </div>
          </div>

          {/* Biggest emitter block */}
          <div 
            className="bg-white border border-[#e5e5d1] p-6 rounded-[30px] hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[130px] shadow-xs group cursor-help"
            onMouseEnter={() => setHoveredCard('biggest')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="absolute top-2 right-4 text-3xl opacity-20 group-hover:scale-110 transition-transform select-none">💡</div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#8b8b74] font-semibold">CARBON INTENSITY</span>
                <span className="text-[9.5px] text-[#D9C5B2] bg-[#fbfbf8] border border-[#e5e5d1]/60 px-1.5 py-0.2 rounded-full font-bold">Tips ▸</span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <div className="h-6 w-6 rounded-lg flex items-center justify-center bg-[#5A5A40] text-white">
                  <highestCategoryObj.icon className="h-3.5 w-3.5" />
                </div>
                <h4 className="font-serif italic text-lg text-[#4A4A3A] font-bold">{highestCategoryObj.label}</h4>
              </div>
            </div>
            <div className="text-[10px] text-[#8b8b74] leading-relaxed">
              Contributing <span className="font-mono font-bold text-[#4A4A3A]">{highestCategoryObj.avg.toFixed(1)} kg</span> to your daily average budget.
            </div>

            {/* Premium Slide-Up Tooltip Explanation */}
            <div className="absolute inset-0 bg-[#4A4A3A] text-white p-5 text-[11px] leading-relaxed transition-all duration-300 transform translate-y-full group-hover:translate-y-0 flex flex-col justify-center z-30 select-none">
              <p className="font-bold uppercase text-[9px] font-mono tracking-widest text-[#D9C5B2] mb-1">Peak Redactor Point</p>
              <p className="opacity-90">This identifies which lifestyle sector generates your absolute highest carbon emissions. Optimizing or cutting down here yields the fastest, highest impact results.</p>
            </div>
          </div>

          {/* Conservation Impact and equivalent trees */}
          <div 
            className="bg-[#f4f4ec] border border-[#e5e5d1] p-6 rounded-[30px] hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-[130px] shadow-xs group cursor-help"
            onMouseEnter={() => setHoveredCard('impact')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className="absolute top-2 right-4 text-3xl opacity-25 group-hover:scale-110 transition-transform select-none">🌲</div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#5A5A40] font-semibold">Canopy Impact</span>
                <span className="text-[9.5px] text-[#5A5A40] bg-white border border-[#e5e5d1] px-1.5 py-0.2 rounded-full font-bold">Scale ▸</span>
              </div>
              <h4 className="font-serif italic text-2xl font-bold text-[#4A4A3A] mt-1 flex items-baseline">
                {potentialTreeAcresSaved.toFixed(1)} <span className="font-sans text-xs font-light text-[#8b8b74] ml-1.5">absorbing trees / yr</span>
              </h4>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] text-[#5A5A40] font-bold">
              <TreePine className="h-3.5 w-3.5 text-[#5A5A40] animate-bounce" />
              <span>Saved equivalent against US baseline metrics</span>
            </div>

            {/* Premium Slide-Up Tooltip Explanation */}
            <div className="absolute inset-0 bg-[#4A4A3A] text-white p-5 text-[11px] leading-relaxed transition-all duration-300 transform translate-y-full group-hover:translate-y-0 flex flex-col justify-center z-30 select-none">
              <p className="font-bold uppercase text-[9px] font-mono tracking-widest text-[#D9C5B2] mb-1">Woodland Equivalence</p>
              <p className="opacity-90">Shows the number of mature trees required to absorb the CO₂ you saved compared to the US national average (44.5 kg daily). Every gram saved preserves natural forest canopy!</p>
            </div>
          </div>

        </div>

        {/* Right Bento: Huge Interactive 3D Globe Visual Board resembling actual photo-referred Earth */}
        <div className="lg:col-span-12 xl:col-span-7 bg-white border border-[#e5e5d1] rounded-[40px] p-6 sm:p-8 shadow-xs flex flex-col justify-between relative overflow-hidden min-h-[460px]">
          
          {/* Decorative grid pattern in background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#efefdf_1px,transparent_1px),linear-gradient(to_bottom,#efefdf_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-30 pointer-events-none"></div>
          
          <div className="relative z-15 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#8b8b74] font-bold">CORE ECO-CHRONOPHERE</span>
              <h3 className="font-serif italic text-2xl font-bold text-[#4A4A3A] mt-1">{globeTheme.title}</h3>
              <p className="text-[11px] text-[#6b6b5a] mt-1 pr-6 leading-relaxed max-w-md">{globeTheme.fact}</p>
            </div>
            
            {/* Layer controllers */}
            <div className="flex flex-row sm:flex-col gap-1.5 shrink-0 bg-[#f4f4ec] p-1.5 rounded-2xl border border-[#e5e5d1]">
              <button 
                onClick={() => setGlobeLayer('carbon')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${globeLayer === 'carbon' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6b6b5a] hover:bg-[#efefdf]'}`}
              >
                Atmo Carbon
              </button>
              <button 
                onClick={() => setGlobeLayer('canopy')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${globeLayer === 'canopy' ? 'bg-[#8B9474] text-white shadow-xs' : 'text-[#6b6b5a] hover:bg-[#efefdf]'}`}
              >
                Canopy Cover
              </button>
              <button 
                onClick={() => setGlobeLayer('ocean')}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${globeLayer === 'ocean' ? 'bg-[#235882] text-white shadow-xs' : 'text-[#6b6b5a] hover:bg-[#efefdf]'}`}
              >
                Ocean thermal
              </button>
            </div>
          </div>

          {/* High-Fidelity 3D Planet stage reproducing the exact blue-earth atmosphere & photo-referred rendering style */}
          <div className="my-6 relative flex items-center justify-center py-6 min-h-[220px]">
            
            {/* 1. Surrounding Atmospheric Blue Halo Ring (Space Atmosphere Boundary) */}
            <div className="absolute h-[212px] w-[212px] rounded-full bg-gradient-to-tr from-blue-500 via-sky-400 to-cyan-300 filter blur-md opacity-85 z-0 pointer-events-none animate-pulse"></div>
            <div className="absolute h-48 w-48 rounded-full border-2 border-sky-400/60 pointer-events-none z-0 shadow-[0_0_28px_rgba(14,165,233,0.7)]"></div>

            {/* 2. Photo-Realistic Outer Sphere with overflow clipping */}
            <div className="relative h-44 w-44 rounded-full overflow-hidden border border-sky-200 shadow-2xl z-10 cursor-pointer animate-float group flex items-center justify-center">
              
              {/* Layer 0: Deep marine blue ocean base */}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0a1b32] via-[#0e2a4f] to-[#1a4478] z-0"></div>

              {/* Layer 1: Horizontal translating Map containing terrestrial land outlines with rich forest and desert gold gradients */}
              <div 
                className="absolute top-0 left-0 h-full flex transition-all duration-1000 z-5"
                style={{ 
                  width: '300%', 
                  transform: 'translateX(0)',
                  animation: `spin-globe ${globeSpinSpeed}s linear infinite` 
                }}
              >
                {[0, 1, 2].map((idx) => (
                  <svg key={idx} className="h-full w-1/3 shrink-0" viewBox="0 0 360 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`landGrad-${idx}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FFFFFF" />       {/* Glacial Caps */}
                        <stop offset="12%" stopColor="#D4E6F1" />      {/* Polar margins */}
                        <stop offset="30%" stopColor="#2D5E1F" />      {/* European & Northern forests */}
                        <stop offset="42%" stopColor="#CB9C68" />      {/* warm desert bands (Sahara, Arabia) */}
                        <stop offset="65%" stopColor="#1B4D22" />      {/* Equatorial dense rainforests */}
                        <stop offset="82%" stopColor="#8A965B" />      {/* Sub-tropical savannas */}
                        <stop offset="100%" stopColor="#FFFFFF" />     {/* Antarctic glacier caps */}
                      </linearGradient>
                      <linearGradient id={`desertGrad-${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#CB9C68" />
                        <stop offset="100%" stopColor="#E5C294" />
                      </linearGradient>
                    </defs>

                    {/* Greenland glaciers */}
                    <path d="M 55 5 L 70 8 L 65 20 L 50 15 Z" fill="#F8F9FA" opacity="0.95" />

                    {/* North America */}
                    <path d="M 30 25 C 28 35 24 45 32 55 C 38 62 48 58 55 68 C 60 74 52 82 48 88 C 45 84 42 78 40 76 C 36 78 30 68 28 58 C 24 50 18 42 22 34 Z" fill={`url(#landGrad-${idx})`} />

                    {/* South America */}
                    <path d="M 55 68 C 62 76 68 85 64 98 C 60 110 52 125 46 142 C 43 148 40 144 38 135 C 36 122 32 108 34 98 C 36 84 45 78 55 68 Z" fill={`url(#landGrad-${idx})`} />

                    {/* Africa wedge */}
                    <path d="M 152 70 C 158 64 172 65 185 70 C 196 74 205 88 198 102 C 192 118 184 132 176 148 C 172 152 170 146 168 138 C 165 125 158 112 154 100 C 148 88 144 78 152 70 Z" fill={`url(#landGrad-${idx})`} />

                    {/* Realistic Golden Sandy Sahara Overlay */}
                    <path d="M 153 71 C 158 66 170 66 182 71 C 192 73 198 80 196 86 C 192 90 180 92 172 90 C 165 88 155 86 153 71 Z" fill={`url(#desertGrad-${idx})`} opacity="0.85" />

                    {/* Eurasia (Europe + Asia) */}
                    <path d="M 148 70 L 138 52 C 142 42 155 35 170 28 C 185 24 215 18 240 15 C 265 12 285 18 295 28 C 298 38 290 48 275 55 C 260 62 248 72 235 84 L 218 88 L 198 88 Z" fill={`url(#landGrad-${idx})`} />

                    {/* India peninsula */}
                    <path d="M 218 84 L 225 96 L 232 88 Z" fill="#CB9C68" />

                    {/* Indochina / SE Asia */}
                    <path d="M 242 85 C 245 92 250 96 255 102 L 258 98 L 248 84 Z" fill={`url(#landGrad-${idx})`} />

                    {/* Australia continent */}
                    <path d="M 255 110 T 275 105 T 285 115 T 280 130 T 260 130 Z" fill="#CBB89A" />

                    {/* Antarctic Snow Cap */}
                    <path d="M 10 172 L 350 172 L 350 180 L 10 180 Z" fill="#FFFFFF" opacity="0.95" />
                  </svg>
                ))}
              </div>

              {/* Layer 2: Swirling High-Fidelity Active Clouds (Fast Parallax movement speed config) */}
              <div 
                className="absolute top-0 left-0 h-full flex pointer-events-none opacity-[0.55] mix-blend-screen z-10"
                style={{ 
                  width: '300%', 
                  transform: 'translateX(0)',
                  animation: `spin-clouds ${globeSpinSpeed * 0.75}s linear infinite` 
                }}
              >
                {[0, 1, 2].map((i) => (
                  <svg key={i} className="h-full w-1/3 shrink-0" viewBox="0 0 360 180" preserveAspectRatio="none">
                    {/* Exquisite wispy cloud bands swirling dynamically over the earth oceans and forests */}
                    <path d="M 20 40 Q 60 20 110 35 T 210 50 T 310 30 Q 340 50 280 70 T 150 65 T 40 55 Z" fill="rgba(255,255,255,0.72)" />
                    <path d="M 40 100 Q 90 120 140 105 T 240 115 T 320 95 Q 350 120 290 135 T 180 130 T 50 115 Z" fill="rgba(255,255,255,0.65)" />
                    <path d="M 120 15 Q 160 5 210 12 T 290 18 T 350 10 Q 320 28 250 25 T 140 22 T 110 18 Z" fill="rgba(255,255,255,0.45)" />
                  </svg>
                ))}
              </div>

              {/* Layer 3: Dynamic overlay spot indicator responding to Active layer selection */}
              <div className="absolute inset-0 pointer-events-none z-15 mix-blend-overlay">
                {globeLayer === 'canopy' && (
                  <div className="absolute inset-0 bg-green-500/25 blur-md animate-pulse"></div>
                )}
                {globeLayer === 'carbon' && (
                  <div className="absolute inset-0 bg-amber-500/15 blur-sm animate-pulse"></div>
                )}
                {globeLayer === 'ocean' && (
                  <div className="absolute inset-0 bg-blue-400/20 blur-sm animate-pulse"></div>
                )}
              </div>

              {/* Layer 4: Volumetric Shading & Dark Crescent overlay to shape spherical 3D depth */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,transparent_35%,rgba(5,15,35,0.45)_72%,rgba(2,6,18,0.92)_100%)] pointer-events-none z-20"></div>

              {/* Layer 5: Glass/Sky atmospheric halo reflection */}
              <div className="absolute inset-0 shadow-[inset_0_0_24px_rgba(56,189,248,0.7),inset_12px_12px_20px_rgba(255,255,255,0.22),inset_-10px_-10px_25px_rgba(0,0,0,0.85)] rounded-full z-25 pointer-events-none"></div>
            </div>

            {/* Interactive layer status below planet sphere */}
            <div className="absolute bottom-1 right-4 flex items-center space-x-1.5 text-[10px] text-[#8b8b74] font-mono select-none">
              <span className="animate-pulse text-sky-500">●</span>
              <span>Layer Status: </span>
              <span className={`px-2 py-0.5 rounded-md font-bold uppercase transition-all tracking-wider ${globeTheme.statusColor}`}>
                {globeTheme.status}
              </span>
            </div>

            <div className="absolute bottom-1 left-4 flex items-center space-x-2">
              <button 
                onClick={() => setGlobeSpinSpeed(prev => Math.min(120, prev + 8))}
                className="hover:bg-[#efefdf] text-[#4A4A3A] p-1.5 rounded-lg border border-[#e5e5d1] text-[10px] font-bold cursor-pointer transition-transform hover:scale-105 active:scale-95"
                title="Slower orbit"
              >
                Slow 🐢
              </button>
              <button 
                onClick={() => setGlobeSpinSpeed(prev => Math.max(4, prev - 8))}
                className="hover:bg-[#efefdf] text-[#4A4A3A] p-1.5 rounded-lg border border-[#e5e5d1] text-[10px] font-bold cursor-pointer transition-transform hover:scale-105 active:scale-95"
                title="Faster spin"
              >
                Orbiteer 🚀
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center bg-[#f4f4ec] border border-[#e5e5d1] p-3.5 rounded-2xl relative z-10">
            <div className="text-[10px] text-[#6b6b5a] max-w-[80%]">
              <p className="font-bold text-[#4A4A3A] uppercase tracking-wider font-mono">Atmosphere Reading</p>
              <p className="font-sans mt-0.5 leading-relaxed font-semibold">Your current log values balance ocean and forest canopy loads. Swap layers to audit environmental factors.</p>
            </div>
            <span className="text-xl shrink-0">🌍</span>
          </div>

        </div>

      </div>

      {/* Styled inline animations to support 3D Globe continuous spinning & float */}
      <style>{`
        @keyframes spin-globe {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333333%); }
        }
        @keyframes spin-clouds {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-33.333333%); }
        }
        .animate-float {
          animation: float-planet 6s ease-in-out infinite;
        }
        @keyframes float-planet {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
      `}</style>
        
      {/* 2. Visual Graphs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Category breakdown (Donut SVG Chart) */}
        <div className="bg-white border border-[#e5e5d1] rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-serif italic text-2xl text-[#4A4A3A]">Emissions Breakdown</h3>
            <p className="text-xs text-[#8b8b74] mt-1">Average contribution percentage by core activities.</p>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative h-44 w-44">
              {/* Doughnut SVG */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={donutRadius}
                  className="fill-none stroke-[#efefdf]"
                  strokeWidth="15"
                />
                {donutSlices.map((slice) => (
                  <circle
                    key={slice.id}
                    cx="80"
                    cy="80"
                    r={donutRadius}
                    className="fill-none transition-all duration-300 pointer-events-auto cursor-pointer"
                    strokeWidth={hoveredCategory === slice.id ? "20" : "15"}
                    stroke={slice.stroke}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="round"
                    onMouseEnter={() => setHoveredCategory(slice.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  />
                ))}
              </svg>
              {/* Center value overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#8b8b74]">Total Avg</span>
                <span className="font-serif italic text-2xl font-bold text-[#4A4A3A]">
                  {totalCombinedAvg.toFixed(1)}
                </span>
                <span className="text-[10px] text-[#8b8b74] font-sans">kg/day</span>
              </div>
            </div>

            {/* Hover statement */}
            <div className="h-4 text-center mt-3">
              <p className="text-xs font-semibold text-[#4A4A3A]">
                {hoveredCategory 
                  ? `${donutSlices.find(s => s.id === hoveredCategory)?.label}: ${donutSlices.find(s => s.id === hoveredCategory)?.percentage.toFixed(0)}%`
                  : 'Hover segments for shares'
                }
              </p>
            </div>
          </div>

          {/* Dynamic Legends */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#e5e5d1]/50">
            {donutSlices.map((slice) => (
              <div 
                key={slice.id} 
                className={`flex items-center space-x-2.5 p-2 rounded-xl transition-all cursor-pointer ${
                  hoveredCategory === slice.id ? 'bg-[#efefdf]' : ''
                }`}
                onMouseEnter={() => setHoveredCategory(slice.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slice.stroke }}></span>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-[#4A4A3A] truncate">{slice.label}</span>
                  <span className="block text-[9px] font-mono text-[#8b8b74]">{slice.percentage.toFixed(0)}% ({slice.value.toFixed(1)} kg)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Informational Explanation Sub-panel */}
          <div className="mt-4 p-4 rounded-2xl bg-[#f4f4ec] border border-[#e5e5d1] min-h-[96px] flex items-start space-x-2.5 relative overflow-hidden transition-all duration-300">
            <span className="text-base select-none mt-0.5 shrink-0">💡</span>
            <div>
              <p className="text-xs font-bold text-[#4A4A3A] transition-all">
                {hoveredCategory === 'transport' && "Transport Commute Metric"}
                {hoveredCategory === 'energy' && "Home & Utilities electricity load"}
                {hoveredCategory === 'food' && "Food Choice & Agro-Dietary Output"}
                {hoveredCategory === 'shopping' && "Goods Manufacturing & Retail Supply"}
                {!hoveredCategory && "Interactive Insights Engine"}
              </p>
              <p className="text-[10.5px] text-[#6b6b5a] mt-1 pr-1 leading-relaxed">
                {hoveredCategory === 'transport' && "Measures direct vehicle fuel burning, aviation, and transit. Shifting to active commutes, rail, or electric options cuts transportation loads up to 80%."}
                {hoveredCategory === 'energy' && "Measures household power, cooking heat, and HVAC loads. Swapping to high-efficiency appliances or solar energy cleanly reduces grid load."}
                {hoveredCategory === 'food' && "Calculates nutrition carbon density. Meat production is resource-intensive. Opting for plant-rich ingredients effectively reduces grocery footprint."}
                {hoveredCategory === 'shopping' && "Captures the industrial footprint of retail manufacturing, packing, and shipping. Repairing or buying second-hand saves raw resource extraction."}
                {!hoveredCategory && "Hover over any slice segment or list category above to learn what is tracked and access real-world mitigation tips."}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline of emissions (Interactive SVG Bar/Area Chart) */}
        <div className="bg-white border border-[#e5e5d1] rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xs flex flex-col justify-between lg:col-span-2">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif italic text-2xl text-[#4A4A3A]">Emissions Trail</h3>
                <p className="text-xs text-[#8b8b74] mt-1">Footprint log points plotted chronologically (last {chronologicalLogs.length} entries).</p>
              </div>
              <div className="flex items-center space-x-1.5 text-[10px] text-[#5A5A40] font-mono bg-[#efefdf] border border-[#e5e5d1] rounded-xl px-2.5 py-1">
                <Calendar className="h-3.5 w-3.5" />
                <span className="font-bold uppercase tracking-wider">By Entry</span>
              </div>
            </div>
          </div>

          {/* Core Timeline Generator */}
          <div className="my-6 relative min-h-[180px] w-full flex items-end">
            {/* Zero and Max labels Y-Axis */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] font-mono text-[#8b8b74] pr-2.5 border-r border-[#e5e5d1] z-10 select-none">
              <span className="font-bold">{Math.ceil(Math.max(...chronologicalLogs.map(l => l.calculatedEmissions.total), 40))} kg</span>
              <span className="font-bold">20 kg</span>
              <span className="font-bold">0 kg</span>
            </div>

            {/* Grid of bar charts sorted */}
            <div className="flex-1 h-full flex justify-around items-end pl-8 select-none">
              {chronologicalLogs.map((log) => {
                const totalEm = log.calculatedEmissions.total;
                const maxInChronology = Math.max(...chronologicalLogs.map(l => l.calculatedEmissions.total), 40);
                // Calculate proportional height percentage
                const heightPercent = Math.min(100, Math.max(8, (totalEm / maxInChronology) * 100));

                const tRatio = log.calculatedEmissions.transport / totalEm;
                const eRatio = log.calculatedEmissions.energy / totalEm;
                const fRatio = log.calculatedEmissions.food  / totalEm;
                const sRatio = log.calculatedEmissions.shopping / totalEm;

                return (
                  <div key={log.id} className="flex flex-col items-center group relative flex-1 mx-1.5 max-w-[32px]">
                    {/* Floating Tooltip info on hover */}
                    <div className="absolute bottom-full mb-2 bg-[#4A4A3A] text-white text-[10px] p-2.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-30 min-w-[130px] border border-[#e5e5d1]/30">
                      <p className="font-serif italic font-bold border-b border-white/20 pb-1 mb-1">{log.date}</p>
                      <ul className="space-y-0.5 font-mono text-[9px]">
                        <li>🚗 Trans: {log.calculatedEmissions.transport.toFixed(1)} kg</li>
                        <li>⚡ Utility: {log.calculatedEmissions.energy.toFixed(1)} kg</li>
                        <li>🍏 Food: {log.calculatedEmissions.food.toFixed(1)} kg</li>
                        <li>🛍️ Goods: {log.calculatedEmissions.shopping.toFixed(1)} kg</li>
                        <li className="font-bold border-t border-white/25 mt-1 pt-1 text-white">Total: {totalEm.toFixed(1)} kg</li>
                      </ul>
                    </div>

                    {/* Proportional Stacked Column */}
                    <div 
                      className="w-full rounded-lg overflow-hidden flex flex-col justify-end transition-transform duration-200 cursor-pointer group-hover:scale-[1.05] border border-[#e5e5d1]/20"
                      style={{ height: `${heightPercent}%`, minHeight: '16px' }}
                    >
                      {/* Transport segment */}
                      <span className="block bg-[#5A5A40] w-full" style={{ height: `${tRatio * 100}%` }}></span>
                      {/* Energy segment */}
                      <span className="block bg-[#D9C5B2] w-full" style={{ height: `${eRatio * 100}%` }}></span>
                      {/* Food segment */}
                      <span className="block bg-[#8B9474] w-full" style={{ height: `${fRatio * 100}%` }}></span>
                      {/* Shopping segment */}
                      <span className="block bg-[#C18C74] w-full" style={{ height: `${sRatio * 100}%` }}></span>
                    </div>

                    {/* Date subtitle indicator */}
                    <span className="text-[9px] font-mono text-[#8b8b74] mt-2 rotate-45 origin-left tracking-tighter truncate w-10">
                      {log.date.substring(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-center flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-mono text-[#8b8b74] font-bold uppercase tracking-wider pt-4 border-t border-[#e5e5d1]/50">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#5A5A40] block"></span>
              <span>Transport</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#D9C5B2] block"></span>
              <span>Energy</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#8B9474] block"></span>
              <span>Food choice</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded bg-[#C18C74] block"></span>
              <span>Shopping</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Averages Benchmark Comparison Slider */}
      <div className="bg-white border border-[#e5e5d1] rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xs">
        <div>
          <h3 className="font-serif italic text-2xl text-[#4A4A3A]">How You Rank Globally</h3>
          <p className="text-xs text-[#8b8b74] mt-1">Comparing your daily average footprint against international segments and target levels.</p>
        </div>

        <div className="mt-8 space-y-5">
          {COMPARISONS.map((avg) => {
            return (
              <div 
                key={avg.region} 
                className="space-y-1.5 relative cursor-help group/row p-1 rounded-xl hover:bg-[#efefdf]/40 transition-colors"
                onMouseEnter={() => setHoveredComparison(avg.region)}
                onMouseLeave={() => setHoveredComparison(null)}
              >
                <div className="flex justify-between text-xs font-semibold text-[#4A4A3A]">
                  <span className="flex items-center space-x-1">
                    <span>{avg.region}</span>
                    <span className="text-[9.5px] text-[#8b8b74] font-medium bg-[#efefdf] px-1 py-0.2 rounded-md hover:text-[#4A4A3A] transition-colors">Context ▾</span>
                  </span>
                  <span className="font-mono text-[#8b8b74]">{avg.dailyEmissionsKg} kg/day ({avg.yearlyEmissionsTonnes} tonnes/yr)</span>
                </div>
                <div className="w-full bg-[#efefdf] h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all" 
                    style={{ 
                      width: `${Math.min(100, (avg.dailyEmissionsKg / 50) * 100)}%`,
                      backgroundColor: avg.dailyEmissionsKg <= 5 ? '#5A5A40' : avg.dailyEmissionsKg <= 15 ? '#8B9474' : '#C18C74'
                    }}
                  ></div>
                </div>

                {/* Flying / Tooltip context panel relative to hovered row */}
                {hoveredComparison === avg.region && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-[#4A4A3A] text-white text-[11px] p-3.5 rounded-2xl shadow-xl z-30 border border-[#e5e5d1]/20 animate-fade-in leading-relaxed select-none">
                    <p className="font-serif italic font-bold text-[#E6D9CC] mb-0.5">{avg.region} Energy Factor</p>
                    <p className="text-white/90">
                      {avg.region.includes('United States') && "High per-capita loads are driven by extensive continental highway freight, large average residential floor areas, high private car ownership rates, and residual gas/coal grid pipelines."}
                      {avg.region.includes('United Kingdom') && "Reflects successful industrial transitions, high integration of North Sea offshore wind power, historical coal production phases, and densely populated rail-connected transit networks."}
                      {avg.region.includes('Global 1.5°C') && "The science-based maximum budget individual cap suggested by the IPCC. Trimming yearly individual output below 2.0 tonnes is key to halting irreversible climate runaway."}
                      {avg.region.includes('India') && "Characterized by dense localized fresh produce lines, high non-motorized and public rail commuting rates, a highly plant-forward dietary culture, and low central residential cooling intensity."}
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* User's entry added as comparison */}
          <div className="space-y-1.5 p-5 bg-[#f4f4ec] border border-[#e5e5d1] rounded-2xl relative mt-8">
            <div className="absolute -top-3 left-4 bg-[#5A5A40] text-[9px] uppercase font-bold text-white px-3 py-1 rounded-full tracking-widest font-mono shadow-xs">
              Your Current Standing
            </div>
            <div className="flex justify-between text-xs mt-1.5 font-bold text-[#4A4A3A]">
              <span>⚡ Your Daily Log Average</span>
              <span className="font-mono text-[#5A5A40]">
                {avgDailyEmissions.toFixed(1)} kg/day ({(avgDailyEmissions * 365 / 1000).toFixed(2)} tonnes/yr)
              </span>
            </div>
            <div className="w-full bg-[#efefdf] h-3 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all bg-[#5A5A40] shadow-xs" 
                style={{ width: `${Math.min(100, (avgDailyEmissions / 50) * 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-[#6b6b5a] leading-relaxed font-sans mt-3">
              {avgDailyEmissions <= 5.0 
                ? '⭐ Climate Champion! Your average emissions align perfectly with maintaining global temperatures under the 1.5°C threshold.' 
                : avgDailyEmissions <= 12.0 
                ? '👍 Good! You are significantly below high Western averages, though still above the ultimate 2.0 tonnes sustainability limit.'
                : avgDailyEmissions <= 25.0
                ? '📋 Your footprint is comparable to average European levels. Conserving transport energy or eating lower emissions foods can help you reduce.'
                : '⚠️ Emission profile matches high consumption footprints. Request customized suggestions or check the Smart AI Coach tab.'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
