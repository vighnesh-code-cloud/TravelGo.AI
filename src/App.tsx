import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LandingPage from './components/LandingPage';
import ChatAssistant from './components/ChatAssistant';
import TravelDashboard from './components/TravelDashboard';
import TripHistory from './components/TripHistory';
import AuthModal from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TravelPlan, SavedTrip, TravelParams } from './types';
import { Compass, User as UserIcon, LogOut, Sparkles } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, signOut, openAuthModal } = useAuth();
  const [screen, setScreen] = useState<'landing' | 'chat' | 'dashboard' | 'history'>('landing');
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [activePlan, setActivePlan] = useState<TravelPlan | null>(null);
  const [predefinedParams, setPredefinedParams] = useState<Partial<TravelParams> | null>(null);

  // Load saved trips from local storage on mount and clean up demo/sample data
  useEffect(() => {
    const stored = localStorage.getItem('travelgo_trips');
    if (stored) {
      try {
        const parsed: SavedTrip[] = JSON.parse(stored);
        
        // Filter out any hardcoded/demo trips from past loads
        const demoDestinations = [
          'delhi', 'manali', 'goa', 'jaipur', 'kerala', 'shimla', 
          'mumbai', 'agra', 'ooty', 'leh ladakh', 'leh', 'ladakh', 'demo'
        ];
        
        const filtered = parsed.filter(trip => {
          if (!trip || !trip.plan || !trip.plan.destination) return false;
          
          const destinationLower = trip.plan.destination.toLowerCase();
          const idLower = String(trip.id).toLowerCase();
          
          // Check if ID contains 'demo' or 'sample'
          if (idLower.includes('demo') || idLower.includes('sample')) {
            return false;
          }
          
          // Check if ID is a simple short number (like '1', '2', '10' etc. or 'trip-1')
          const numericPart = idLower.replace('trip-', '').replace('trip-dup-', '');
          if (numericPart.length < 8 && !isNaN(Number(numericPart))) {
            return false;
          }
          
          // Check if destination matches any known demo cities
          const isDemoCity = demoDestinations.some(city => destinationLower.includes(city));
          if (isDemoCity) {
            return false;
          }
          
          return true;
        });

        setSavedTrips(filtered);
        
        // Update local storage to persist the filtered non-demo list
        if (filtered.length !== parsed.length) {
          localStorage.setItem('travelgo_trips', JSON.stringify(filtered));
        }
      } catch (err) {
        console.error("Failed to parse locally stored trips:", err);
      }
    }
  }, []);

  // Save trips to local storage
  const handleSaveTrip = (plan: TravelPlan) => {
    const exists = savedTrips.some(t => 
      t.plan.destination === plan.destination && 
      t.plan.duration === plan.duration && 
      t.plan.budget === plan.budget
    );

    if (exists) {
      alert("This travel plan is already saved in your history!");
      return;
    }

    const newTrip: SavedTrip = {
      id: `trip-${Date.now()}`,
      plan,
      createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const updated = [newTrip, ...savedTrips];
    setSavedTrips(updated);
    localStorage.setItem('travelgo_trips', JSON.stringify(updated));
    alert("🎉 Travel plan successfully saved to your local history!");
  };

  const handleDeleteTrip = (id: string) => {
    try {
      if (confirm("Are you sure you want to delete this saved trip?")) {
        const updated = savedTrips.filter(t => t.id !== id);
        setSavedTrips(updated);
        localStorage.setItem('travelgo_trips', JSON.stringify(updated));
        alert("Trip deleted successfully.");
      }
    } catch (err) {
      console.error("Failed to delete trip:", err);
      alert("An error occurred while deleting the trip. Please try again.");
    }
  };

  const handleDuplicateTrip = (trip: SavedTrip) => {
    const duplicated: SavedTrip = {
      id: `trip-dup-${Date.now()}`,
      plan: {
        ...trip.plan,
        destination: `${trip.plan.destination} (Copy)`
      },
      createdAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const updated = [duplicated, ...savedTrips];
    setSavedTrips(updated);
    localStorage.setItem('travelgo_trips', JSON.stringify(updated));
    alert("📑 Duplicated successfully!");
  };

  const handleSelectTripFromHistory = (trip: SavedTrip) => {
    setActivePlan(trip.plan);
    setScreen('dashboard');
  };

  // Sign-in guard for trip planning
  const handlePlanTripWithAuth = () => {
    if (!isAuthenticated) {
      openAuthModal(() => {
        setPredefinedParams(null);
        setScreen('chat');
      });
      return;
    }
    setPredefinedParams(null);
    setScreen('chat');
  };

  const handleSelectPredefinedWithAuth = (destination: string, budget: string, duration: number, travelers: number, exp: string[]) => {
    const params: Partial<TravelParams> = {
      destination,
      budget,
      duration,
      travelers,
      experience: exp
    };

    if (!isAuthenticated) {
      openAuthModal(() => {
        setPredefinedParams(params);
        setScreen('chat');
      });
      return;
    }

    setPredefinedParams(params);
    setScreen('chat');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden">
      
      {/* Navigation Bar */}
      <nav id="nav-primary" className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/60 px-6 py-4 flex items-center justify-between">
        <div 
          onClick={() => setScreen('landing')}
          className="flex items-center gap-2.5 cursor-pointer select-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 p-[1px]">
            <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-slate-950">
              <Compass className="h-4.5 w-4.5 text-emerald-400" />
            </div>
          </div>
          <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent font-display">
            TravelGo.AI
          </span>
        </div>

        {/* Global Nav Links & Auth Pill */}
        <div className="flex items-center gap-4">
          {screen !== 'landing' && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  setPredefinedParams(null);
                  setScreen('landing');
                }}
                className={`text-xs font-semibold transition-colors py-1.5 px-3 rounded-lg cursor-pointer ${
                  screen === 'landing' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'hover:text-emerald-400 text-slate-300'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => {
                  setPredefinedParams(null);
                  setScreen('chat');
                }}
                className={`text-xs font-semibold transition-colors py-1.5 px-3 rounded-lg cursor-pointer ${
                  screen === 'chat' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'hover:text-emerald-400 text-slate-300'
                }`}
              >
                AI Assistant
              </button>
              <button
                onClick={() => {
                  setPredefinedParams(null);
                  setScreen('history');
                }}
                className={`text-xs font-semibold transition-colors py-1.5 px-3 rounded-lg cursor-pointer ${
                  screen === 'history' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'hover:text-emerald-400 text-slate-300'
                }`}
              >
                Saved Trips
              </button>
            </div>
          )}

          {/* User Auth Badge */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full py-1 px-2.5">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-slate-200 font-medium hidden sm:inline max-w-[100px] truncate">
                  {user.name}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              id="btn-nav-signin"
              onClick={() => openAuthModal()}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white py-1.5 px-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 transition-all cursor-pointer"
            >
              <UserIcon size={13} className="text-emerald-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </nav>

      {/* Screen Router */}
      <AnimatePresence mode="wait">
        
        {screen === 'landing' && (
          <motion.div
            key="landing-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LandingPage 
              onPlanTrip={handlePlanTripWithAuth}
              onOpenChat={handlePlanTripWithAuth}
              onSelectPredefined={handleSelectPredefinedWithAuth}
              onOpenHistory={() => {
                setScreen('history');
              }}
            />
          </motion.div>
        )}

        {screen === 'chat' && (
          <motion.div
            key="chat-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ChatAssistant 
              onBack={() => setScreen('landing')}
              onPlanGenerated={(plan) => {
                setActivePlan(plan);
                // Also automatically save the plan to trip history so the user never loses their generated plan!
                handleSaveTrip(plan);
                setScreen('dashboard');
              }}
              savedTrips={savedTrips}
              onSelectTrip={handleSelectTripFromHistory}
              onDeleteTrip={handleDeleteTrip}
              onDuplicateTrip={handleDuplicateTrip}
              predefinedParams={predefinedParams}
            />
          </motion.div>
        )}

        {screen === 'dashboard' && activePlan && (
          <motion.div
            key="dashboard-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TravelDashboard 
              plan={activePlan}
              onBackToChat={() => setScreen('chat')}
              onSaveToLocal={handleSaveTrip}
            />
          </motion.div>
        )}

        {screen === 'history' && (
          <motion.div
            key="history-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TripHistory 
              savedTrips={savedTrips}
              onSelectTrip={handleSelectTripFromHistory}
              onDuplicateTrip={handleDuplicateTrip}
              onBack={() => setScreen('landing')}
              onPlanTrip={handlePlanTripWithAuth}
            />
          </motion.div>
        )}

      </AnimatePresence>

      {/* Sign-in Modal Overlay */}
      <AuthModal />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
