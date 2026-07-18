import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Calendar, IndianRupee, MapPin, Users, Sparkles, Check, CheckSquare, 
  Square, AlertTriangle, CloudSun, Compass, ShieldAlert, Navigation, Info, 
  HelpCircle, Download, Copy, Share2, Eye
} from 'lucide-react';
import { TravelPlan, PackingCategory, PackingItem } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TravelDashboardProps {
  plan: TravelPlan;
  onBackToChat: () => void;
  onSaveToLocal: (plan: TravelPlan) => void;
}

export default function TravelDashboard({ plan, onBackToChat, onSaveToLocal }: TravelDashboardProps) {
  const [activeTab, setActiveTab] = useState<'itinerary' | 'budget' | 'packing' | 'tips'>('itinerary');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [packingState, setPackingState] = useState<PackingCategory[]>(plan.packingList || []);

  // Update checkbox state
  const handleTogglePack = (categoryIdx: number, itemIdx: number) => {
    const updated = [...packingState];
    updated[categoryIdx].items[itemIdx].packed = !updated[categoryIdx].items[itemIdx].packed;
    setPackingState(updated);
  };

  // Recharts data format
  const chartData = [
    { name: 'Flights/Transport', value: plan.budgetBreakdown.transport, color: '#10B981' }, // emerald-500
    { name: 'Hotel/Lodging', value: plan.budgetBreakdown.hotel, color: '#3B82F6' }, // blue-500
    { name: 'Food/Dining', value: plan.budgetBreakdown.food, color: '#F59E0B' }, // amber-500
    { name: 'Activities/Sightseeing', value: plan.budgetBreakdown.activities, color: '#8B5CF6' }, // purple-500
    { name: 'Shopping', value: plan.budgetBreakdown.shopping, color: '#EC4899' }, // pink-500
    { name: 'Emergency Buffer', value: plan.budgetBreakdown.emergency, color: '#EF4444' }, // red-500
  ];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[10px] font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <div id="travel-dashboard-container" className="min-h-[calc(100vh-60px)] bg-slate-950 text-white font-sans overflow-y-auto pb-16 px-4 md:px-8 pt-8">
      
        {/* Dashboard Top Navigation & Status */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button
            id="btn-back-to-assistant"
            onClick={onBackToChat}
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
            title="Return to assistant"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                AI Generated Itinerary
              </span>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                ₹ INR Ready
              </span>
            </div>
            <h1 className="text-2xl md:text-3.5xl font-extrabold tracking-tight font-display mt-1">
              Your Custom Trip to {plan.destination}
            </h1>
          </div>
        </div>

        {/* Action button bar */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto py-1">
          <button
            id="btn-save-itinerary"
            onClick={() => onSaveToLocal(plan)}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-[0_4px_15px_rgba(16,185,129,0.25)]"
          >
            <Sparkles size={14} />
            Save Trip to History
          </button>
        </div>
      </div>

      {/* Main Stats Banner Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        
        {/* Stat Card 1: Budget */}
        <div className="rounded-2xl glass-dark p-4 flex items-center gap-4 border border-slate-900">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <IndianRupee size={20} />
          </div>
          <div className="text-left truncate">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Budget</p>
            <p className="text-lg md:text-xl font-extrabold font-display">₹{plan.budget.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Stat Card 2: Duration */}
        <div className="rounded-2xl glass-dark p-4 flex items-center gap-4 border border-slate-900">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Calendar size={20} />
          </div>
          <div className="text-left truncate">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Duration</p>
            <p className="text-lg md:text-xl font-extrabold font-display">{plan.duration} Days / {plan.duration - 1} Nights</p>
          </div>
        </div>

        {/* Stat Card 3: Travelers */}
        <div className="rounded-2xl glass-dark p-4 flex items-center gap-4 border border-slate-900">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Users size={20} />
          </div>
          <div className="text-left truncate">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Travelers</p>
            <p className="text-lg md:text-xl font-extrabold font-display">{plan.travelers} {plan.travelers > 1 ? 'People' : 'Person'}</p>
          </div>
        </div>

        {/* Stat Card 4: Experience style */}
        <div className="rounded-2xl glass-dark p-4 flex items-center gap-4 border border-slate-900">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Compass size={20} />
          </div>
          <div className="text-left truncate">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Experience Theme</p>
            <p className="text-sm font-bold text-slate-300 truncate mt-0.5">{plan.experience.slice(0, 2).join(' & ')}</p>
          </div>
        </div>

      </div>

      {/* Destination Recommendation Details Section */}
      <div className="max-w-7xl mx-auto mb-8 rounded-3xl bg-slate-900/40 border border-slate-900 p-6">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-left">
          <MapPin size={18} className="text-emerald-400" />
          📍 Curated Destination Recommendations
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {plan.destinations.map((dest, i) => (
            <div key={i} className="rounded-2xl bg-slate-950/60 border border-slate-800 p-5 flex flex-col justify-between text-left hover:border-slate-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-slate-200 text-lg">{dest.name}</h3>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded border border-emerald-500/20">
                    {dest.matchingScore}% Match
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">{dest.description}</p>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 rounded-xl p-3 border border-slate-850">
                  <span className="font-bold text-emerald-400">Why Recommended: </span>
                  {dest.reason}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation tabs for categories */}
      <div className="max-w-7xl mx-auto mb-6 flex border-b border-slate-900 overflow-x-auto no-scrollbar">
        <button
          id="tab-itinerary"
          onClick={() => setActiveTab('itinerary')}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'itinerary' 
              ? 'border-emerald-400 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          🗓 Day-wise Itinerary
        </button>
        <button
          id="tab-budget"
          onClick={() => setActiveTab('budget')}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'budget' 
              ? 'border-emerald-400 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          💰 Budget Estimate
        </button>
        <button
          id="tab-packing"
          onClick={() => setActiveTab('packing')}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'packing' 
              ? 'border-emerald-400 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          🎒 Smart Packing Checklist
        </button>
        <button
          id="tab-tips"
          onClick={() => setActiveTab('tips')}
          className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'tips' 
              ? 'border-emerald-400 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          🤖 Local Recommendations & Tips
        </button>
      </div>

      {/* Main Tabs Contents with Animations */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: ITINERARY */}
          {activeTab === 'itinerary' && (
            <motion.div
              key="itinerary-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid lg:grid-cols-12 gap-8 text-left"
            >
              {/* Day selection dial (lg:col-span-3) */}
              <div className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto max-h-[300px] no-scrollbar">
                {plan.itinerary.map((day) => (
                  <button
                    key={day.day}
                    onClick={() => setSelectedDay(day.day)}
                    className={`flex items-center gap-3 w-full rounded-xl px-4 py-3 border text-left shrink-0 transition-all cursor-pointer ${
                      selectedDay === day.day
                        ? 'bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500 text-emerald-400 font-bold shadow-[0_2px_10px_rgba(16,185,129,0.1)]'
                        : 'bg-slate-900/30 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs ${
                      selectedDay === day.day ? 'bg-emerald-500 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {day.day}
                    </div>
                    <span className="truncate text-xs">Day {day.day}: {day.title.split(':')[1]?.trim() || day.title}</span>
                  </button>
                ))}
              </div>

              {/* Day details view (lg:col-span-9) */}
              <div className="lg:col-span-9 space-y-6">
                {plan.itinerary.filter(d => d.day === selectedDay).map((day) => (
                  <div key={day.day} className="space-y-6">
                    <div className="rounded-2xl bg-slate-900/60 border border-slate-900 p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                        <div>
                          <h2 className="text-xl font-extrabold font-display text-white">
                            Day {day.day}: {day.title}
                          </h2>
                          <p className="text-xs text-slate-400 mt-1">Carefully spaced daily plan optimized for high visual comfort.</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-xl border border-slate-850">
                          <IndianRupee size={14} className="text-emerald-400" />
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">Estimated Cost</span>
                            <span className="text-sm font-bold text-white">₹{day.dailyExpense.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Day Stages: Morning, Afternoon, Evening */}
                      <div className="grid md:grid-cols-3 gap-6">
                        {/* Morning */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">🌅 Morning</h3>
                          </div>
                          <div className="rounded-xl bg-slate-950/80 border border-slate-850 p-4 space-y-2 min-h-[140px] flex flex-col justify-between">
                            <div>
                              <p className="text-xs font-semibold text-white mb-1">Attraction: <span className="text-emerald-300 font-bold">{day.morning.attraction}</span></p>
                              <p className="text-xs text-slate-400 leading-relaxed">{day.morning.activity}</p>
                            </div>
                            <div className="text-[11px] text-slate-500 italic border-t border-slate-900 pt-2 mt-2">
                              🍲 Breakfast: {day.morning.food}
                            </div>
                          </div>
                        </div>

                        {/* Afternoon */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">☀️ Afternoon</h3>
                          </div>
                          <div className="rounded-xl bg-slate-950/80 border border-slate-850 p-4 space-y-2 min-h-[140px] flex flex-col justify-between">
                            <div>
                              <p className="text-xs font-semibold text-white mb-1">Attraction: <span className="text-blue-300 font-bold">{day.afternoon.attraction}</span></p>
                              <p className="text-xs text-slate-400 leading-relaxed">{day.afternoon.activity}</p>
                            </div>
                            <div className="text-[11px] text-slate-500 italic border-t border-slate-900 pt-2 mt-2">
                              🍱 Lunch: {day.afternoon.food}
                            </div>
                          </div>
                        </div>

                        {/* Evening */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-400">🌆 Evening</h3>
                          </div>
                          <div className="rounded-xl bg-slate-950/80 border border-slate-850 p-4 space-y-2 min-h-[140px] flex flex-col justify-between">
                            <div>
                              <p className="text-xs font-semibold text-white mb-1">Attraction: <span className="text-purple-300 font-bold">{day.evening.attraction}</span></p>
                              <p className="text-xs text-slate-400 leading-relaxed">{day.evening.activity}</p>
                            </div>
                            <div className="text-[11px] text-slate-500 italic border-t border-slate-900 pt-2 mt-2">
                              🥂 Dinner: {day.evening.food}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 2: BUDGET BREAKDOWN */}
          {activeTab === 'budget' && (
            <motion.div
              key="budget-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid lg:grid-cols-12 gap-8 text-left"
            >
              {/* Left Side: Summary & Categories List (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Visual Bar of Budget Utilisation */}
                <div className="rounded-2xl bg-slate-900/60 border border-slate-900 p-6 space-y-4">
                  <h3 className="font-bold text-sm text-slate-300">Financial Summary</h3>
                  
                  <div className="grid grid-cols-3 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Total Budget</span>
                      <span className="text-base font-bold text-slate-200">₹{plan.budgetBreakdown.totalBudget.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Estimated Cost</span>
                      <span className="text-base font-bold text-emerald-400">₹{plan.budgetBreakdown.estimatedCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Remaining Balance</span>
                      <span className="text-base font-bold text-blue-400">₹{plan.budgetBreakdown.remainingBudget.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Visual Progress bar */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Budget Spent Percent</span>
                      <span className="text-emerald-400">{Math.round((plan.budgetBreakdown.estimatedCost / plan.budgetBreakdown.totalBudget) * 100)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-[1px] border border-slate-850">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 rounded-full" 
                        style={{ width: `${Math.min(100, (plan.budgetBreakdown.estimatedCost / plan.budgetBreakdown.totalBudget) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Categories Table list */}
                <div className="rounded-2xl bg-slate-900/60 border border-slate-900 p-6 space-y-4">
                  <h3 className="font-bold text-sm text-slate-300">Detailed Allocation</h3>
                  <div className="space-y-2">
                    {chartData.map((cat, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-850 hover:border-slate-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="h-3.5 w-3.5 rounded-md" style={{ backgroundColor: cat.color }} />
                          <span className="text-xs font-bold text-slate-300">{cat.name}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-100">₹{cat.value.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Side: Beautiful Pie Chart (lg:col-span-5) */}
              <div className="lg:col-span-5 flex flex-col justify-center items-center rounded-2xl bg-slate-900/60 border border-slate-900 p-6 min-h-[400px]">
                <h3 className="font-bold text-sm text-slate-300 mb-6 w-full text-center">Interactive Cost Allocation Chart</h3>
                
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        innerRadius={45}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: number) => [`₹${val.toLocaleString('en-IN')}`, 'Estimate']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontFamily: 'Inter' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-3.5 w-full mt-4 text-[10px] text-slate-400">
                  {chartData.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: SMART PACKING CHECKLIST */}
          {activeTab === 'packing' && (
            <motion.div
              key="packing-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6 text-left"
            >
              <div className="rounded-2xl bg-slate-900/60 border border-slate-900 p-6 space-y-2">
                <h2 className="text-lg font-bold font-display text-white">Smart Packing Checklist</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Based on the local climate and weather at <span className="text-emerald-400 font-semibold">{plan.destination}</span>, TravelGo.AI has automatically compiled your smart packing recommendation list. Mark items as packed as you load your luggage!
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {packingState.map((cat, catIdx) => (
                  <div key={catIdx} className="rounded-2xl bg-slate-900/40 border border-slate-900 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wide">{cat.category}</h3>
                      <span className="text-[10px] bg-slate-850 px-2 py-0.5 rounded text-slate-400">
                        {cat.items.filter(i => i.packed).length}/{cat.items.length} Packed
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {cat.items.map((item, itemIdx) => (
                        <div 
                          key={item.id}
                          onClick={() => handleTogglePack(catIdx, itemIdx)}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/70 border border-slate-850 hover:border-slate-800 transition-all cursor-pointer select-none group"
                        >
                          <button className="shrink-0 text-emerald-400 focus:outline-none">
                            {item.packed ? (
                              <CheckSquare size={18} className="text-emerald-400 fill-emerald-500/15" />
                            ) : (
                              <div className="h-[18px] w-[18px] rounded border-2 border-slate-700 group-hover:border-slate-500 transition-colors" />
                            )}
                          </button>
                          <span className={`text-xs transition-colors ${item.packed ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: RECOMS & TIPS */}
          {activeTab === 'tips' && (
            <motion.div
              key="tips-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-8 text-left"
            >
              
              {/* Row 1: Hidden Gems & Restaurants */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Hidden Gems */}
                <div className="rounded-2xl bg-slate-900/40 border border-slate-900 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Sparkles size={16} className="text-emerald-400" />
                    💎 Hidden Gems / Secrets
                  </h3>
                  <div className="space-y-4">
                    {plan.hiddenGems.map((gem, idx) => (
                      <div key={idx} className="bg-slate-950/60 rounded-xl p-4 border border-slate-850">
                        <p className="font-bold text-xs text-white mb-1">{gem.name}</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{gem.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Best Local Dining & Restaurants */}
                <div className="rounded-2xl bg-slate-900/40 border border-slate-900 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Compass size={16} className="text-blue-400 animate-spin" style={{ animationDuration: '8s' }} />
                    🍽️ Curated Restaurants & Cafés
                  </h3>
                  <div className="space-y-4.5">
                    {plan.restaurants.map((rest, idx) => (
                      <div key={idx} className="bg-slate-950/60 rounded-xl p-4 border border-slate-850 flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <p className="font-bold text-xs text-white">{rest.name}</p>
                          <p className="text-[10px] text-slate-500">Cuisine: {rest.cuisine}</p>
                          <p className="text-[11px] text-slate-400"><span className="text-emerald-400 font-semibold">Must-Try:</span> {rest.mustTry}</p>
                        </div>
                        <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded">
                          Price: {rest.priceRange}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Row 2: Must try food list & Weather Panel */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Must Try Local Dishes */}
                <div className="rounded-2xl bg-slate-900/40 border border-slate-900 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                    🍛 Must-Try Local Foods
                  </h3>
                  <div className="space-y-4">
                    {plan.mustTryFoods.map((food, idx) => (
                      <div key={idx} className="bg-slate-950/60 rounded-xl p-4 border border-slate-850">
                        <p className="font-bold text-xs text-emerald-400 mb-1">{food.name}</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{food.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weather & Travel Timing Advice */}
                <div className="rounded-2xl bg-slate-900/40 border border-slate-900 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <CloudSun size={16} className="text-amber-400" />
                    🌤️ Weather & Visiting Hours
                  </h3>
                  
                  <div className="space-y-4 text-xs">
                    <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-850 space-y-1">
                      <p className="font-bold text-slate-300">Weather Forecast & Advice:</p>
                      <p className="text-slate-400 leading-relaxed">{plan.weatherAdvice}</p>
                    </div>

                    <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-850 space-y-1">
                      <p className="font-bold text-slate-300">Visiting Hours Advice:</p>
                      <p className="text-slate-400 leading-relaxed">{plan.bestVisitingHours}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Row 3: Security warnings, local scams, transport, and savings */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Security, Safety & Scams */}
                <div className="rounded-2xl bg-slate-900/40 border border-slate-900 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <ShieldAlert size={16} className="text-rose-400" />
                    ⚠️ Safety & Anti-Scam Shield
                  </h3>
                  
                  <div className="space-y-4 text-xs">
                    {/* Safety tips */}
                    <div className="space-y-2">
                      <p className="font-bold text-slate-300">Guaranteed Safety Guidelines:</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-400 leading-relaxed">
                        {plan.safetyTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Scams to avoid */}
                    <div className="space-y-2 pt-2 border-t border-slate-850">
                      <p className="font-bold text-rose-300 flex items-center gap-1">
                        <AlertTriangle size={12} /> Scams to Avoid:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-400 leading-relaxed">
                        {plan.scamsToAvoid.map((scam, idx) => (
                          <li key={idx}>{scam}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Transport and Money Saving hacks */}
                <div className="rounded-2xl bg-slate-900/40 border border-slate-900 p-6 space-y-4">
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-300 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Navigation size={16} className="text-emerald-400" />
                    🚗 Transit & Money Hacks
                  </h3>

                  <div className="space-y-4 text-xs">
                    {/* Transportation tips */}
                    <div className="space-y-2">
                      <p className="font-bold text-slate-300">Local Transit Advice:</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-400 leading-relaxed">
                        {plan.transportationTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Money-saving tips */}
                    <div className="space-y-2 pt-2 border-t border-slate-850">
                      <p className="font-bold text-emerald-400">Money Saving Hacks:</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-400 leading-relaxed">
                        {plan.moneySavingTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>



    </div>
  );
}
