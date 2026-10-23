import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Plane, Map, ShieldCheck, Sparkles, MapPin, Users, Globe2, ArrowRight, MessageSquare, History } from 'lucide-react';

interface LandingPageProps {
  onPlanTrip: () => void;
  onOpenChat: () => void;
  onSelectPredefined: (destination: string, budget: string, duration: number, travelers: number, exp: string[]) => void;
  onOpenHistory: () => void;
}

export default function LandingPage({ 
  onPlanTrip, 
  onOpenChat, 
  onSelectPredefined, 
  onOpenHistory
}: LandingPageProps) {
  const [airplaneTrigger, setAirplaneTrigger] = useState(0);

  // Re-trigger airplane animation every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAirplaneTrigger(prev => prev + 1);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Stats Counters state
  const [tripsCount, setTripsCount] = useState(18200);
  const [travelersCount, setTravelersCount] = useState(9400);
  const [countriesCount, setCountriesCount] = useState(62);

  useEffect(() => {
    // Slowly increment stats for live feel
    const interval = setInterval(() => {
      setTripsCount(prev => prev + Math.floor(Math.random() * 3) + 1);
      setTravelersCount(prev => prev + Math.floor(Math.random() * 2) + 1);
      if (Math.random() > 0.95) setCountriesCount(prev => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const featuredDestinations = [
    {
      name: "Ladakh, India",
      image: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=400&q=80",
      budget: "₹25,000",
      duration: 6,
      travelers: 2,
      exp: ["Mountains", "Adventure", "Nature"],
      tag: "Adventurous"
    },
    {
      name: "Goa, India",
      image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=400&q=80",
      budget: "₹18,000",
      duration: 4,
      travelers: 2,
      exp: ["Beaches", "Food", "Budget"],
      tag: "Coastal Relax"
    },
    {
      name: "Kyoto, Japan",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=80",
      budget: "₹1,80,000",
      duration: 7,
      travelers: 1,
      exp: ["Culture", "Nature", "Shopping", "Solo"],
      tag: "Cultural Zen"
    }
  ];

  return (
    <div id="landing-container" className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-white select-none">
      
      {/* Dynamic Animated Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-[40%] -left-[20%] h-[80%] w-[60%] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] -right-[10%] h-[70%] w-[50%] rounded-full bg-blue-500/10 blur-[130px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute -bottom-[20%] left-[10%] h-[60%] w-[50%] rounded-full bg-teal-500/10 blur-[110px] animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(2,6,23,0.95))]" />
      </div>

      {/* Grid Overlay for Modern Tech Look */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0" />

      {/* Floating Animated Clouds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 opacity-30">
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: '105vw' }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute top-[15%] left-0 w-64 h-24 bg-gradient-to-r from-slate-400/5 to-slate-200/10 rounded-full blur-xl"
        />
        <motion.div
          initial={{ x: -200 }}
          animate={{ x: '105vw' }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear", delay: 10 }}
          className="absolute top-[40%] left-0 w-96 h-32 bg-gradient-to-r from-slate-500/5 to-slate-200/5 rounded-full blur-2xl"
        />
        <motion.div
          initial={{ x: -400 }}
          animate={{ x: '105vw' }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear", delay: 5 }}
          className="absolute top-[65%] left-0 w-80 h-20 bg-gradient-to-r from-teal-500/5 to-blue-500/5 rounded-full blur-xl"
        />
      </div>

      {/* Airplane Flying Across the Screen */}
      <AnimatePresence mode="wait">
        <motion.div
          key={airplaneTrigger}
          initial={{ x: "-10vw", y: "45vh", rotate: 15, opacity: 0 }}
          animate={{
            x: "110vw",
            y: ["45vh", "25vh", "15vh", "10vh"],
            rotate: [15, 10, 0, -5],
            opacity: [0, 0.9, 0.9, 0]
          }}
          transition={{ duration: 10, ease: "easeInOut" }}
          className="absolute pointer-events-none z-20 text-emerald-400/80 drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]"
        >
          <div className="relative">
            <Plane size={48} className="rotate-90" />
            {/* Contrail Trail */}
            <div className="absolute top-1/2 right-full -translate-y-1/2 w-48 h-[2px] bg-gradient-to-l from-emerald-400/40 to-transparent blur-[1px]" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Header/Navbar */}
      <header id="landing-header" className="relative z-30 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div className="flex h-10 w-10 items-center justify-between rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 p-[1.5px] shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Compass className="h-5 w-5 text-emerald-400 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400 bg-clip-text text-transparent font-display">
            TravelGo.AI
          </span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <button 
            id="btn-header-assistant"
            onClick={onOpenChat}
            className="hidden sm:flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer"
          >
            <MessageSquare size={16} />
            AI Assistant
          </button>
          <button 
            id="btn-header-history"
            onClick={onOpenHistory}
            className="hidden sm:flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors duration-200 cursor-pointer"
          >
            <History size={16} className="text-emerald-400" />
            My Saved Trips
          </button>

          <button 
            id="btn-header-cta"
            onClick={onPlanTrip}
            className="relative overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 px-5 py-2 text-sm font-medium shadow-[0_4px_15px_rgba(16,185,129,0.25)] transition-all hover:scale-105 hover:shadow-[0_4px_20px_rgba(16,185,129,0.4)] cursor-pointer"
          >
            Start Planning
          </button>
        </motion.div>
      </header>

      {/* Hero Section Content */}
      <main className="relative z-30 max-w-7xl mx-auto px-6 pt-12 pb-24 grid lg:grid-cols-12 gap-12 items-center min-h-[calc(100vh-100px)]">
        
        {/* Left: Text copy & Buttons */}
        <div className="lg:col-span-7 flex flex-col items-start space-y-8">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-semibold text-emerald-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
          >
            <Sparkles size={12} className="animate-pulse" />
            The Future of Travel Planning is Here
          </motion.div>

          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-6xl xl:text-7xl font-extrabold tracking-tight leading-none font-display text-left"
            >
              TravelGo<span className="text-emerald-400">.</span>AI
            </motion.h1>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl md:text-3xl text-slate-300 font-light text-left leading-snug"
            >
              "Your AI Travel Companion That Plans Every Journey For You."
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base text-slate-400 max-w-lg text-left leading-relaxed"
          >
            Skip the tedious spreadsheets and hundred-tab searches. Tell our conversational AI your dream, budget, and travel companions, and watch a detailed day-by-day itinerary, optimized cost estimate, packing checklist, and local secret recommendations appear in seconds.
          </motion.p>

          {/* Interactive Hero Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-4 w-full justify-start"
          >
            <button
              id="btn-hero-plan"
              onClick={onPlanTrip}
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 px-8 py-4 font-semibold shadow-[0_4px_25px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_4px_30px_rgba(16,185,129,0.55)] cursor-pointer"
            >
              Plan My Trip
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              id="btn-hero-explore"
              onClick={() => {
                const el = document.getElementById('featured-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 px-6 py-4 font-semibold transition-colors cursor-pointer"
            >
              <Map size={18} className="text-blue-400" />
              Explore Destinations
            </button>

            <button
              id="btn-hero-assistant"
              onClick={onOpenChat}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 px-6 py-4 font-semibold transition-all hover:text-emerald-400 cursor-pointer"
            >
              <Compass size={18} className="text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
              AI Assistant
            </button>
          </motion.div>

          {/* Glowing Animated Statistics Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-6 md:gap-12 w-full max-w-md pt-8 border-t border-slate-800/60"
          >
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
                <Compass className="text-emerald-400 h-5 w-5 shrink-0 hidden sm:block" />
                <span>{tripsCount.toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Trips Planned</p>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
                <Users className="text-blue-400 h-5 w-5 shrink-0 hidden sm:block" />
                <span>{travelersCount.toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Happy Travelers</p>
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-2xl md:text-3xl font-extrabold tracking-tight text-white font-display">
                <Globe2 className="text-teal-400 h-5 w-5 shrink-0 hidden sm:block" />
                <span>{countriesCount}+</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Countries Covered</p>
            </div>
          </motion.div>
        </div>

        {/* Right: Glassmorphism Floating Destination Showcase */}
        <div className="lg:col-span-5 relative w-full flex flex-col items-center justify-center gap-6 min-h-[500px] py-6">
          
          {/* Main Backdrop Glowing Portal */}
          <div className="absolute h-80 w-80 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none" />
          <div className="absolute h-64 w-64 rounded-full bg-blue-500/10 blur-[90px] translate-x-12 translate-y-12 pointer-events-none" />

          {/* Top Info Widgets Row */}
          <div className="grid grid-cols-2 gap-4 w-full z-30">
            {/* Widget 1: Real-time Budget Sync */}
            <motion.div
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex items-center gap-3 rounded-2xl bg-slate-900/90 border border-slate-800 px-4 py-3 shadow-lg hover:border-slate-700/60 transition-all"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck size={16} />
              </div>
              <div className="text-left">
                <p className="font-bold text-xs text-slate-200">Real-time Budget</p>
                <p className="text-[10px] text-slate-400">100% conversion</p>
              </div>
            </motion.div>

            {/* Widget 2: Spots Curated */}
            <motion.div
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="flex items-center gap-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 px-4 py-3 shadow-lg hover:border-slate-700/60 transition-all"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/20">
                <MapPin size={16} className="animate-pulse" />
              </div>
              <div className="text-left">
                <p className="font-bold text-xs text-slate-200">18k+ Spots</p>
                <p className="text-[10px] text-slate-400">Curated itineraries</p>
              </div>
            </motion.div>
          </div>

          {/* 2x2 Premium Destination Grid */}
          <div className="grid grid-cols-2 gap-4 w-full z-20">
            {/* Card 1: Kyoto, Japan */}
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                y: {
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              onClick={() => onSelectPredefined("Kyoto, Japan", "₹1,25,000", 5, 2, ["Culture", "History", "Nature"])}
              className="group rounded-2xl glass-dark p-3 border border-slate-800/80 hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between min-h-[190px]"
            >
              <div>
                <div className="relative h-24 w-full rounded-xl overflow-hidden mb-2">
                  <img 
                    src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=300&q=80" 
                    alt="Kyoto" 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 right-1.5 rounded-full bg-slate-950/80 px-2 py-0.5 text-[8px] font-bold text-emerald-400 uppercase tracking-wider border border-emerald-500/20">
                    Culture
                  </div>
                </div>
                <h3 className="font-bold text-xs text-left text-white group-hover:text-emerald-400 transition-colors">Kyoto, Japan 🌸</h3>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800/60 mt-2 pt-1.5 text-[10px] text-slate-400">
                <span className="flex items-center gap-0.5"><Compass size={10} className="text-slate-500" /> 5 Days</span>
                <span className="font-bold text-emerald-400">₹1.25L</span>
              </div>
            </motion.div>

            {/* Card 2: Santorini, Greece */}
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              animate={{
                y: [0, -6, 0],
              }}
              transition={{
                y: {
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }
              }}
              onClick={() => onSelectPredefined("Santorini, Greece", "₹1,85,000", 7, 2, ["Romantic", "Beaches", "Luxury"])}
              className="group rounded-2xl glass-dark p-3 border border-slate-800/80 hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between min-h-[190px]"
            >
              <div>
                <div className="relative h-24 w-full rounded-xl overflow-hidden mb-2">
                  <img 
                    src="https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=300&q=80" 
                    alt="Santorini" 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 right-1.5 rounded-full bg-slate-950/80 px-2 py-0.5 text-[8px] font-bold text-teal-400 uppercase tracking-wider border border-teal-500/20">
                    Romantic
                  </div>
                </div>
                <h3 className="font-bold text-xs text-left text-white group-hover:text-emerald-400 transition-colors">Santorini, Greece 🌊</h3>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800/60 mt-2 pt-1.5 text-[10px] text-slate-400">
                <span className="flex items-center gap-0.5"><Compass size={10} className="text-slate-500" /> 7 Days</span>
                <span className="font-bold text-emerald-400">₹1.85L</span>
              </div>
            </motion.div>

            {/* Card 3: Swiss Alps, Switzerland */}
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              animate={{
                y: [0, -5.5, 0],
              }}
              transition={{
                y: {
                  duration: 5.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }
              }}
              onClick={() => onSelectPredefined("Swiss Alps, Switzerland", "₹2,10,000", 6, 2, ["Mountains", "Adventure", "Nature"])}
              className="group rounded-2xl glass-dark p-3 border border-slate-800/80 hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between min-h-[190px]"
            >
              <div>
                <div className="relative h-24 w-full rounded-xl overflow-hidden mb-2">
                  <img 
                    src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80" 
                    alt="Swiss Alps" 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 right-1.5 rounded-full bg-slate-950/80 px-2 py-0.5 text-[8px] font-bold text-blue-400 uppercase tracking-wider border border-blue-500/20">
                    Mountains
                  </div>
                </div>
                <h3 className="font-bold text-xs text-left text-white group-hover:text-emerald-400 transition-colors">Swiss Alps, Swiss 🏔️</h3>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800/60 mt-2 pt-1.5 text-[10px] text-slate-400">
                <span className="flex items-center gap-0.5"><Compass size={10} className="text-slate-500" /> 6 Days</span>
                <span className="font-bold text-emerald-400">₹2.10L</span>
              </div>
            </motion.div>

            {/* Card 4: Bali, Indonesia */}
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              animate={{
                y: [0, -6.5, 0],
              }}
              transition={{
                y: {
                  duration: 6.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5
                }
              }}
              onClick={() => onSelectPredefined("Bali, Indonesia", "₹45,000", 5, 1, ["Beaches", "Nature", "Relaxation"])}
              className="group rounded-2xl glass-dark p-3 border border-slate-800/80 hover:border-emerald-500/30 hover:bg-slate-900/60 transition-all cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between min-h-[190px]"
            >
              <div>
                <div className="relative h-24 w-full rounded-xl overflow-hidden mb-2">
                  <img 
                    src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=300&q=80" 
                    alt="Bali" 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 right-1.5 rounded-full bg-slate-950/80 px-2 py-0.5 text-[8px] font-bold text-teal-300 uppercase tracking-wider border border-teal-500/20">
                    Beach
                  </div>
                </div>
                <h3 className="font-bold text-xs text-left text-white group-hover:text-emerald-400 transition-colors">Bali, Indonesia 🌴</h3>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800/60 mt-2 pt-1.5 text-[10px] text-slate-400">
                <span className="flex items-center gap-0.5"><Compass size={10} className="text-slate-500" /> 5 Days</span>
                <span className="font-bold text-emerald-400">₹45K</span>
              </div>
            </motion.div>
          </div>

        </div>
      </main>

      {/* Featured Destinations Row Scroll Anchor */}
      <section id="featured-section" className="relative z-30 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
          <div className="text-left">
            <h2 className="text-3xl font-extrabold tracking-tight font-display">Instant Inspiration</h2>
            <p className="text-sm text-slate-400 mt-2">Or, click a pre-made preference mix to see a plan created in seconds.</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <span className="text-xs text-slate-500 flex items-center gap-1.5 border border-slate-800/60 rounded-full px-3 py-1 bg-slate-900/20">
              <Sparkles size={12} className="text-emerald-400" /> Powered by Gemma AI
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredDestinations.map((dest, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -8 }}
              className="group relative flex flex-col rounded-3xl overflow-hidden bg-slate-900/40 border border-slate-800/50 hover:border-slate-700/80 transition-all p-3 cursor-pointer shadow-xl h-full"
              onClick={() => onSelectPredefined(dest.name, dest.budget, dest.duration, dest.travelers, dest.exp)}
            >
              <div className="relative h-48 w-full rounded-2xl overflow-hidden mb-4">
                <img 
                  src={dest.image} 
                  alt={dest.name} 
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 rounded-full bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-bold text-teal-300 uppercase tracking-wider border border-teal-500/20">
                  {dest.tag}
                </div>
              </div>
              <div className="px-2 flex-grow flex flex-col justify-between">
                <div className="text-left">
                  <h3 className="font-extrabold text-lg text-white group-hover:text-emerald-400 transition-colors">{dest.name}</h3>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {dest.exp.map((e, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-800/60 text-slate-300 rounded-md px-2 py-0.5">
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-slate-800/60 mt-4 pt-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Compass size={12} className="text-emerald-400" /> {dest.duration} Days • {dest.travelers} traveler{dest.travelers > 1 ? 's' : ''}</span>
                  <span className="font-bold text-sm text-emerald-400">Under {dest.budget}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Subtle Footer */}
      <footer className="relative z-30 max-w-7xl mx-auto px-6 py-8 border-t border-slate-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© 2026 TravelGo.AI. All rights reserved. Designed for optimal travel curation.</p>
        <p className="flex items-center gap-2">
          <span>Secure</span> • <span>Fast</span> • <span>Offline History Persistent</span>
        </p>
      </footer>

    </div>
  );
}
