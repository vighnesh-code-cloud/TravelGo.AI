import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, Calendar, IndianRupee, Users, Trash2, Copy, Eye, History, 
  MapPin, Compass, Briefcase, Sparkles, AlertCircle 
} from 'lucide-react';
import { SavedTrip } from '../types';

interface TripHistoryProps {
  savedTrips: SavedTrip[];
  onSelectTrip: (trip: SavedTrip) => void;
  onDuplicateTrip: (trip: SavedTrip) => void;
  onBack: () => void;
  onPlanTrip: () => void;
}

export default function TripHistory({ 
  savedTrips, 
  onSelectTrip, 
  onDuplicateTrip, 
  onBack,
  onPlanTrip
}: TripHistoryProps) {

  // Calculate stats for top banner
  const totalTrips = savedTrips.length;
  const totalBudget = savedTrips.reduce((acc, trip) => acc + (trip.plan.budget || 0), 0);
  const totalDays = savedTrips.reduce((acc, trip) => acc + (trip.plan.duration || 0), 0);
  const uniqueDestinationsCount = new Set(savedTrips.map(t => t.plan.destination.replace(/ \(Copy\)/g, ''))).size;

  return (
    <div id="trip-history-container" className="min-h-[calc(100vh-60px)] bg-slate-950 text-white font-sans overflow-y-auto pb-16 px-4 md:px-8 pt-8">
      
      {/* Top Header */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 text-left">
        <div className="flex items-center gap-4">
          <button
            id="btn-history-back"
            onClick={onBack}
            className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-400 font-bold uppercase tracking-wider bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                Adventure Logs
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display mt-1 flex items-center gap-2">
              <History className="text-emerald-400 h-7 w-7" />
              Your Travel History
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <button
            id="btn-history-new-plan"
            onClick={onPlanTrip}
            className="flex items-center gap-2 text-xs font-bold px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 transition-all cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.25)] hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
          >
            <Sparkles size={14} />
            Create New Travel Plan
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      {totalTrips > 0 && (
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10 text-left">
          
          {/* Stat 1: Total Trips */}
          <div className="rounded-2xl glass-dark p-4 flex items-center gap-4 border border-slate-900">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Compass size={20} />
            </div>
            <div className="truncate">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Saved Trips</p>
              <p className="text-lg md:text-xl font-extrabold font-display">{totalTrips}</p>
            </div>
          </div>

          {/* Stat 2: Total Budget */}
          <div className="rounded-2xl glass-dark p-4 flex items-center gap-4 border border-slate-900">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <IndianRupee size={20} />
            </div>
            <div className="truncate">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Invested Budget</p>
              <p className="text-lg md:text-xl font-extrabold font-display">₹{totalBudget.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Stat 3: Total Days */}
          <div className="rounded-2xl glass-dark p-4 flex items-center gap-4 border border-slate-900">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div className="truncate">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Days Explored</p>
              <p className="text-lg md:text-xl font-extrabold font-display">{totalDays} Days</p>
            </div>
          </div>

          {/* Stat 4: Unique Cities */}
          <div className="rounded-2xl glass-dark p-4 flex items-center gap-4 border border-slate-900">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <div className="truncate">
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Destinations</p>
              <p className="text-lg md:text-xl font-extrabold font-display">{uniqueDestinationsCount} Unique</p>
            </div>
          </div>

        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {savedTrips.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-6 rounded-3xl bg-slate-900/20 border border-slate-900 border-dashed text-center"
          >
            <div className="h-16 w-16 rounded-full bg-slate-900/80 flex items-center justify-center text-slate-500 mb-4 border border-slate-800">
              <History size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-300">No Travel Plans Saved Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
              When you generate itineraries using our TravelGo.AI Assistant, they will automatically be saved here so you never lose track.
            </p>
            <button
              onClick={onPlanTrip}
              className="mt-6 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              Start Planning Now
            </button>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            {savedTrips.map((trip) => (
              <motion.div
                key={trip.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative group rounded-2xl bg-slate-900/50 border border-slate-900 hover:border-slate-800 p-5 flex flex-col justify-between hover:bg-slate-900/80 transition-all shadow-md overflow-hidden"
              >
                {/* Visual Accent Light bar on card */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="font-extrabold text-lg text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {trip.plan.destination}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium shrink-0 pt-1">
                      {trip.createdAt}
                    </span>
                  </div>

                  {/* Badges / Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-850/60 mb-4">
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Budget</span>
                      <span className="text-xs font-bold text-slate-200">₹{trip.plan.budget.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Duration</span>
                      <span className="text-xs font-bold text-emerald-400">{trip.plan.duration} Days</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Travelers</span>
                      <span className="text-xs font-bold text-blue-400">{trip.plan.travelers} {trip.plan.travelers > 1 ? 'Pax' : 'Pax'}</span>
                    </div>
                  </div>

                  {/* Experience style tags list */}
                  {trip.plan.experience && trip.plan.experience.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {trip.plan.experience.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-[10px] bg-emerald-500/5 text-emerald-300 border border-emerald-500/10 px-2 py-0.5 rounded-md">
                          {tag}
                        </span>
                      ))}
                      {trip.plan.experience.length > 3 && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md">
                          +{trip.plan.experience.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between border-t border-slate-850/80 pt-3 mt-4 gap-2">
                  <button
                    onClick={() => onSelectTrip(trip)}
                    className="flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 hover:border-transparent rounded-lg px-3.5 py-2 transition-all flex-grow cursor-pointer"
                  >
                    <Eye size={13} />
                    View Itinerary
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      title="Duplicate Plan"
                      onClick={() => onDuplicateTrip(trip)}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
