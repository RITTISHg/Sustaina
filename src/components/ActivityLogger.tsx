import React, { useState, useEffect } from 'react';
import { ActivityLog, CarType, DietType, WasteLevel } from '../types';
import { calculateLogEmissions } from '../data';
import { Car, Zap, Utensils, ShoppingBag, CheckCircle, Calendar, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ActivityLoggerProps {
  onSaveLog: (log: Omit<ActivityLog, 'id' | 'calculatedEmissions'>, date: string) => void;
  existingLogs: ActivityLog[];
}

const CATEGORIES = [
  { id: 'transport', label: 'Transport', icon: Car, color: 'text-[#4A4A3A] bg-[#efefdf] border-[#e5e5d1]' },
  { id: 'energy', label: 'Energy', icon: Zap, color: 'text-[#4A4A3A] bg-[#fbfbf8] border-[#e5e5d1]' },
  { id: 'food', label: 'Food & Diet', icon: Utensils, color: 'text-[#4A4A3A] bg-[#f4f4ec] border-[#e5e5d1]' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'text-[#4A4A3A] bg-[#efefdf] border-[#e5e5d1]' },
];

export default function ActivityLogger({ onSaveLog, existingLogs }: ActivityLoggerProps) {
  const [activeSegment, setActiveSegment] = useState<'transport' | 'energy' | 'food' | 'shopping'>('transport');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Transport state
  const [carDistance, setCarDistance] = useState<number>(15);
  const [carType, setCarType] = useState<CarType>('petrol');
  const [transitDistance, setTransitDistance] = useState<number>(0);
  const [flightDistance, setFlightDistance] = useState<number>(0);
  const [activeDistance, setActiveDistance] = useState<number>(2);

  // Energy state
  const [electricityKwh, setElectricityKwh] = useState<number>(8);
  const [naturalGasKwh, setNaturalGasKwh] = useState<number>(5);
  const [solarPercentage, setSolarPercentage] = useState<number>(0);

  // Food state
  const [dietType, setDietType] = useState<DietType>('average');
  const [localFoodPercentage, setLocalFoodPercentage] = useState<number>(20);
  const [wasteLevel, setWasteLevel] = useState<WasteLevel>('medium');

  // Shopping state
  const [clothingItems, setClothingItems] = useState<number>(0);
  const [electronicsItems, setElectronicsItems] = useState<number>(0);
  const [otherItems, setOtherItems] = useState<number>(1);

  // Success message state
  const [showSuccess, setShowSuccess] = useState(false);

  // Load existing log if date changes
  useEffect(() => {
    const existing = existingLogs.find(l => l.date === selectedDate);
    if (existing) {
      // populate form
      setCarDistance(existing.transport.carDistance);
      setCarType(existing.transport.carType);
      setTransitDistance(existing.transport.transitDistance);
      setFlightDistance(existing.transport.flightDistance || 0);
      setActiveDistance(existing.transport.activeDistance || 0);

      setElectricityKwh(existing.energy.electricityKwh);
      setNaturalGasKwh(existing.energy.naturalGasKwh);
      setSolarPercentage(existing.energy.solarPercentage);

      setDietType(existing.food.dietType);
      setLocalFoodPercentage(existing.food.localFoodPercentage);
      setWasteLevel(existing.food.wasteLevel);

      setClothingItems(existing.shopping.clothingItems);
      setElectronicsItems(existing.shopping.electronicsItems);
      setOtherItems(existing.shopping.otherItems);
    } else {
      // set defaults
      setCarDistance(15);
      setCarType('petrol');
      setTransitDistance(0);
      setFlightDistance(0);
      setActiveDistance(2);
      
      setElectricityKwh(8);
      setNaturalGasKwh(5);
      setSolarPercentage(0);

      setDietType('average');
      setLocalFoodPercentage(20);
      setWasteLevel('medium');

      setClothingItems(0);
      setElectronicsItems(0);
      setOtherItems(1);
    }
  }, [selectedDate, existingLogs]);

  // Read current draft values
  const draftLog = {
    date: selectedDate,
    transport: { carDistance, carType, transitDistance, flightDistance, activeDistance },
    energy: { electricityKwh, naturalGasKwh, solarPercentage },
    food: { dietType, localFoodPercentage, wasteLevel },
    shopping: { clothingItems, electronicsItems, otherItems }
  };

  const instantEmissions = calculateLogEmissions(draftLog);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveLog(draftLog, selectedDate);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-serif italic text-3xl sm:text-4xl text-[#4A4A3A]">Log Daily Activities</h1>
          <p className="text-sm text-[#8b8b74] mt-1.5">
            Input travel, utility bills, food choices, & purchases to map your footprint.
          </p>
        </div>

        {/* Date choice */}
        <div className="flex items-center space-x-2 bg-[#efefdf] border border-[#e5e5d1] rounded-2xl px-4 py-2 w-fit">
          <Calendar className="h-4 w-4 text-[#5A5A40]" />
          <span className="text-xs font-bold text-[#4A4A3A]">Select Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="text-xs font-bold text-[#4A4A3A] border-none bg-transparent focus:ring-0 cursor-pointer outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main form section */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white border border-[#e5e5d1] rounded-[32px] sm:rounded-[40px] shadow-xs p-6 sm:p-8">
          {/* Form Tabs */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-3 mb-6">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeSegment === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setActiveSegment(cat.id as any)}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? `${cat.color} ring-4 ring-[#5A5A40]/10 font-bold scale-[1.02] shadow-xs`
                      : 'border-[#e5e5d1] bg-[#fbfbf8] hover:bg-[#efefdf] hover:border-[#e5e5d1] text-[#6b6b5a]'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1 ${isSelected ? 'text-[#4A4A3A]' : 'text-[#8b8b74]'}`} />
                  <span className="text-[10px] sm:text-xs font-extrabold tracking-tight block leading-none">{cat.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Form Segment Container */}
          <div className="min-h-[290px] border-b border-[#e5e5d1] pb-6 mb-6">
            <AnimatePresence mode="wait">
              {activeSegment === 'transport' && (
                <motion.div
                  key="transport"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  <h3 className="font-serif italic text-xl text-[#4A4A3A] flex items-center gap-2">
                    <Car className="h-5 w-5 text-[#5A5A40]" /> Commuting & Transit Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Car type */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-[#6b6b5a] mb-1.5">Primary Vehicle Fuel</label>
                      <select
                        value={carType}
                        onChange={(e) => setCarType(e.target.value as CarType)}
                        className="rounded-2xl border border-[#e5e5d1] p-3 text-sm text-[#4A4A3A] bg-[#fbfbf8] focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] transition-all outline-none"
                      >
                        <option value="petrol">🚗 Petrol / Diesel Car</option>
                        <option value="diesel">🚙 Diesel Engine</option>
                        <option value="hybrid">🚘 Hybrid Electric (HEV)</option>
                        <option value="electric">⚡ Fully Electric Vehicle (EV)</option>
                        <option value="none">🚶 No personal vehicle transit today</option>
                      </select>
                    </div>

                    {/* Car distance */}
                    {carType !== 'none' && (
                      <div className="flex flex-col">
                        <label className="text-xs font-bold text-[#6b6b5a] mb-1.5 flex justify-between">
                          <span>Car Distance</span>
                          <span className="text-[#5A5A40] font-mono font-bold">{carDistance} km</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          step="1"
                          value={carDistance}
                          onChange={(e) => setCarDistance(Number(e.target.value))}
                          className="w-full h-1.5 bg-[#efefdf] rounded-lg cursor-pointer accent-[#5A5A40]"
                        />
                        <div className="flex justify-between text-[10px] text-[#8b8b74] font-medium mt-1 font-mono">
                          <span>0 km</span>
                          <span>100 km</span>
                          <span>200 km+</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <hr className="border-dashed border-[#e5e5d1]/50" />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Transit distance */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-[#6b6b5a] mb-1.5 flex justify-between">
                        <span>Bus & Train</span>
                        <span className="text-[#5A5A40] font-mono font-bold">{transitDistance} km</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="300"
                        value={transitDistance === 0 ? '' : transitDistance}
                        placeholder="0"
                        onChange={(e) => setTransitDistance(Number(e.target.value))}
                        className="rounded-2xl border border-[#e5e5d1] p-3 text-sm text-[#4A4A3A] bg-[#fbfbf8] focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] transition-all outline-none"
                      />
                    </div>

                    {/* Flight distance */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-[#6b6b5a] mb-1.5 flex justify-between">
                        <span>Flights (Air travel)</span>
                        <span className="text-[#5A5A40] font-mono font-bold">{flightDistance} km</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5000"
                        value={flightDistance === 0 ? '' : flightDistance}
                        placeholder="0"
                        onChange={(e) => setFlightDistance(Number(e.target.value))}
                        className="rounded-2xl border border-[#e5e5d1] p-3 text-sm text-[#4A4A3A] bg-[#fbfbf8] focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] transition-all outline-none"
                      />
                    </div>

                    {/* Active travel */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-[#6b6b5a] mb-1.5 flex justify-between">
                        <span>Walk / Bike (0g CO2)</span>
                        <span className="text-[#8B9474] font-mono font-bold">{activeDistance} km</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={activeDistance === 0 ? '' : activeDistance}
                        placeholder="0"
                        onChange={(e) => setActiveDistance(Number(e.target.value))}
                        className="rounded-2xl border border-[#e5e5d1] p-3 text-sm text-[#4A4A3A] bg-[#fbfbf8] focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] transition-all outline-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSegment === 'energy' && (
                <motion.div
                  key="energy"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  <h3 className="font-serif italic text-xl text-[#4A4A3A] flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#D9C5B2]" /> Utility Power & Renewable Shares
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Electricity consumption */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-[#6b6b5a] mb-1.5 flex justify-between">
                        <span>Electricity Usage</span>
                        <span className="text-[#5A5A40] font-mono font-bold">{electricityKwh} kWh</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="60"
                        step="0.5"
                        value={electricityKwh}
                        onChange={(e) => setElectricityKwh(Number(e.target.value))}
                        className="w-full h-1.5 bg-[#efefdf] rounded-lg cursor-pointer accent-[#5A5A40]"
                      />
                      <div className="flex justify-between text-[10px] text-[#8b8b74] font-medium mt-1 font-mono">
                        <span>0 kWh (Off-grid)</span>
                        <span>30 kWh</span>
                        <span>60 kWh</span>
                      </div>
                      <p className="text-[10px] text-[#8b8b74] mt-2 italic">Avg. household daily share is ~10-20 kWh.</p>
                    </div>

                    {/* Solar power offset */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-[#6b6b5a] mb-1.5 flex justify-between">
                        <span>Solar/Renewable Share</span>
                        <span className="text-[#8B9474] font-mono font-bold">{solarPercentage}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={solarPercentage}
                        onChange={(e) => setSolarPercentage(Number(e.target.value))}
                        className="w-full h-1.5 bg-[#efefdf] rounded-lg cursor-pointer accent-[#5A5A40]"
                      />
                      <div className="flex justify-between text-[10px] text-[#8b8b74] font-medium mt-1 font-mono">
                        <span>0% (Grid only)</span>
                        <span>50%</span>
                        <span>100% (Clean energy)</span>
                      </div>
                      <p className="text-[10px] text-[#8b8b74] mt-2 italic">Reduces emissions from electricity grid consumption.</p>
                    </div>
                  </div>

                  <hr className="border-dashed border-[#e5e5d1]/50" />

                  {/* Gas heating */}
                  <div className="flex flex-col max-w-sm">
                    <label className="text-xs font-bold text-[#6b6b5a] mb-1.5 flex justify-between">
                      <span>Natural Gas Heating/Stove daily estimate</span>
                      <span className="text-[#5A5A40] font-mono font-bold">{naturalGasKwh} kWh</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="150"
                      value={naturalGasKwh === 0 ? '' : naturalGasKwh}
                      placeholder="0"
                      onChange={(e) => setNaturalGasKwh(Number(e.target.value))}
                      className="rounded-2xl border border-[#e5e5d1] p-3 text-sm text-[#4A4A3A] bg-[#fbfbf8] focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] transition-all outline-none"
                    />
                  </div>
                </motion.div>
              )}

              {activeSegment === 'food' && (
                <motion.div
                  key="food"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  <h3 className="font-serif italic text-xl text-[#4A4A3A] flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-[#8B9474]" /> Dietary Baseline & Food Habits
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Diet type */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-[#6b6b5a] mb-1.5">Today Diet Profile</label>
                      <select
                        value={dietType}
                        onChange={(e) => setDietType(e.target.value as DietType)}
                        className="rounded-2xl border border-[#e5e5d1] p-3 text-sm text-[#4A4A3A] bg-[#fbfbf8] focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] transition-all outline-none"
                      >
                        <option value="heavy-meat">🥩 Heavy Meat (beef/lamb daily)</option>
                        <option value="average">🍗 Average (moderate mixed meats)</option>
                        <option value="low-meat">🐟 Low-Meat Profile (poultry/fish/rare beef)</option>
                        <option value="vegetarian">🍳 Vegetarian (no meats, eats eggs/dairy)</option>
                        <option value="vegan">🌱 Pure Vegan (100% plant-based)</option>
                      </select>
                      <p className="text-[10px] text-[#8b8b74] mt-2 italic">Diets containing red meat produce up to 3x the carbon intensity of vegan nutrition.</p>
                    </div>

                    {/* Waste level */}
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-[#6b6b5a] mb-1.5">Leftovers / Food Waste today</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['low', 'medium', 'high'] as const).map((level) => (
                          <button
                            type="button"
                            key={level}
                            onClick={() => setWasteLevel(level)}
                            className={`py-2 px-1 rounded-xl border text-xs font-bold capitalize transition-all cursor-pointer ${
                              wasteLevel === level
                                ? 'bg-[#8B9474] text-white border-transparent shadow-xs'
                                : 'bg-[#fbfbf8] border-[#e5e5d1] text-[#6b6b5a] hover:bg-[#efefdf]'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-[#8b8b74] mt-2 italic">Landfilled food waste releases methane-intensive gases.</p>
                    </div>
                  </div>

                  <hr className="border-dashed border-[#e5e5d1]/50" />

                  {/* Local food sourcing */}
                  <div className="flex flex-col max-w-md">
                    <label className="text-xs font-bold text-[#6b6b5a] mb-1.5 flex justify-between">
                      <span>Proportion of Local & Seasonal Food</span>
                      <span className="text-[#8B9474] font-mono font-bold">{localFoodPercentage}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={localFoodPercentage}
                      onChange={(e) => setLocalFoodPercentage(Number(e.target.value))}
                      className="w-full h-1.5 bg-[#efefdf] rounded-lg cursor-pointer accent-[#5A5A40]"
                    />
                    <div className="flex justify-between text-[10px] text-[#8b8b74] font-medium mt-1 font-mono">
                      <span>0% (All Imports)</span>
                      <span>50%</span>
                      <span>100% (Local Farm-to-Table)</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSegment === 'shopping' && (
                <motion.div
                  key="shopping"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-5"
                >
                  <h3 className="font-serif italic text-xl text-[#4A4A3A] flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-[#C18C74]" /> Material Goods Purchases
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Clothing */}
                    <div className="flex flex-col bg-[#fbfbf8] p-4 rounded-2xl border border-[#e5e5d1]">
                      <label className="text-xs font-bold text-[#4A4A3A] mb-1 flex justify-between">
                        <span>Clothing Items</span>
                        <span className="text-[#C18C74] font-mono font-bold">{clothingItems}</span>
                      </label>
                      <p className="text-[10px] text-[#8b8b74] mb-3">Shoes, shirts, coats purchased today</p>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setClothingItems(Math.max(0, clothingItems - 1))}
                          className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-[#e5e5d1] hover:bg-[#efefdf] text-[#4A4A3A] font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={clothingItems}
                          onChange={(e) => setClothingItems(Math.max(0, Number(e.target.value)))}
                          className="w-12 text-center text-sm font-semibold border border-[#e5e5d1] rounded-xl py-1 outline-none bg-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setClothingItems(clothingItems + 1)}
                          className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-[#e5e5d1] hover:bg-[#efefdf] text-[#4A4A3A] font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Electronics */}
                    <div className="flex flex-col bg-[#fbfbf8] p-4 rounded-2xl border border-[#e5e5d1]">
                      <label className="text-xs font-bold text-[#4A4A3A] mb-1 flex justify-between">
                        <span>Electronics</span>
                        <span className="text-[#C18C74] font-mono font-bold">{electronicsItems}</span>
                      </label>
                      <p className="text-[10px] text-[#8b8b74] mb-3">Phones, cables, accessories, computers</p>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setElectronicsItems(Math.max(0, electronicsItems - 1))}
                          className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-[#e5e5d1] hover:bg-[#efefdf] text-[#4A4A3A] font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={electronicsItems}
                          onChange={(e) => setElectronicsItems(Math.max(0, Number(e.target.value)))}
                          className="w-12 text-center text-sm font-semibold border border-[#e5e5d1] rounded-xl py-1 outline-none bg-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setElectronicsItems(electronicsItems + 1)}
                          className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-[#e5e5d1] hover:bg-[#efefdf] text-[#4A4A3A] font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* General Goods */}
                    <div className="flex flex-col bg-[#fbfbf8] p-4 rounded-2xl border border-[#e5e5d1]">
                      <label className="text-xs font-bold text-[#4A4A3A] mb-1 flex justify-between">
                        <span>Other Purchases</span>
                        <span className="text-[#C18C74] font-mono font-bold">{otherItems}</span>
                      </label>
                      <p className="text-[10px] text-[#8b8b74] mb-3">Packaging, beauty products, books, household</p>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setOtherItems(Math.max(0, otherItems - 1))}
                          className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-[#e5e5d1] hover:bg-[#efefdf] text-[#4A4A3A] font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={otherItems}
                          onChange={(e) => setOtherItems(Math.max(0, Number(e.target.value)))}
                          className="w-12 text-center text-sm font-semibold border border-[#e5e5d1] rounded-xl py-1 outline-none bg-white font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setOtherItems(otherItems + 1)}
                          className="h-8 w-8 flex items-center justify-center rounded-xl bg-white border border-[#e5e5d1] hover:bg-[#efefdf] text-[#4A4A3A] font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action buttons with status messages */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4.5 w-4.5 text-[#5A5A40] animate-pulse" />
              <span className="text-xs font-medium text-[#8b8b74]">
                Your log is securely cached in local storage and can be updated at any time.
              </span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-1.5 text-[#4A4A3A] bg-[#f4f4ec] border border-[#e5e5d1] rounded-xl py-2 px-3.5 shadow-xs"
                >
                  <CheckCircle className="h-4.5 w-4.5 text-[#8B9474]" />
                  <span className="text-xs font-bold">Saved successfully</span>
                </motion.div>
              )}
              
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#5A5A40] hover:bg-[#4A4A3A] text-white font-serif text-sm font-bold shadow-xs transition-all cursor-pointer hover:scale-[1.01]"
              >
                Log Entry For {selectedDate}
              </button>
            </div>
          </div>
        </form>

        {/* Real-time calculated emissions feedback */}
        <div className="bg-[#4A4A3A] text-[#fbfbf8] border border-[#e5e5d1]/25 rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between shadow-xs">
          {/* Subtle background glow decorator */}
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-white/5 filter blur-2xl"></div>

          <div>
            <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-[#D9C5B2]">REAL-TIME FOOTPRINT</span>
            <div className="mt-3 flex items-baseline space-x-1.5">
              <span className="font-serif italic text-5xl font-extrabold tracking-tight text-white">{instantEmissions.total.toFixed(1)}</span>
              <span className="font-serif text-lg font-medium text-[#efefdf]/80">kg CO₂e</span>
            </div>
            
            {/* Target warning indicator */}
            <div className="mt-4 flex items-center space-x-2">
              {instantEmissions.total <= 5.0 ? (
                <span className="inline-flex items-center rounded-xl bg-[#8B9474]/30 border border-[#8B9474]/40 px-2.5 py-1 text-xs font-semibold text-[#efefdf]">
                  ☘️ Excellent Keep It Up
                </span>
              ) : instantEmissions.total <= 12.0 ? (
                <span className="inline-flex items-center rounded-xl bg-[#D9C5B2]/30 border border-[#D9C5B2]/40 px-2.5 py-1 text-xs font-semibold text-[#efefdf]">
                  📊 Moderate Carbon Tier
                </span>
              ) : (
                <span className="inline-flex items-center rounded-xl bg-[#C18C74]/30 border border-[#C18C74]/40 px-2.5 py-1 text-xs font-semibold text-[#efefdf] font-sans">
                  ⚠️ Above standard limits
                </span>
              )}
            </div>

            <hr className="my-6 border-[#efefdf]/10" />

            {/* Category breakdown rows */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 bg-[#5A5A40] rounded-full"></span>
                  <span className="text-xs text-[#efefdf]">Transport:</span>
                </div>
                <span className="font-mono text-sm font-bold text-white">{instantEmissions.transport} kg</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 bg-[#D9C5B2] rounded-full"></span>
                  <span className="text-xs text-[#efefdf]">Energy:</span>
                </div>
                <span className="font-mono text-sm font-bold text-white">{instantEmissions.energy} kg</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 bg-[#8B9474] rounded-full"></span>
                  <span className="text-xs text-[#efefdf]">Food Diet:</span>
                </div>
                <span className="font-mono text-sm font-bold text-white">{instantEmissions.food} kg</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 bg-[#C18C74] rounded-full"></span>
                  <span className="text-xs text-[#efefdf]">Shopping:</span>
                </div>
                <span className="font-mono text-sm font-bold text-white">{instantEmissions.shopping} kg</span>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white/5 p-4 rounded-2xl border border-white/5">
            <h4 className="text-xs font-bold text-[#D9C5B2] uppercase tracking-widest flex items-center gap-1.5 mb-1.5 font-mono">
              💡 Impact Quick Fact
            </h4>
            <p className="text-xs text-[#efefdf]/80 leading-relaxed font-sans font-medium">
              To keep global warming under 1.5°C, each person should ideally target a max budget of **5 kg CO₂e / day**. The average global citizen emits ~12 kg, while average US residents emit ~44.5 kg daily.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
