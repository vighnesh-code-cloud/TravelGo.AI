import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, User, Bot, Sparkles, MapPin, IndianRupee, Calendar, Users, Briefcase, 
  Trash2, Copy, Eye, History, ArrowLeft, RefreshCw, X, HelpCircle, Compass,
  Check, Pencil, AlertTriangle
} from 'lucide-react';
import { ChatMessage, TravelParams, SavedTrip, TravelPlan } from '../types';

interface ChatAssistantProps {
  onBack: () => void;
  onPlanGenerated: (plan: TravelPlan, tripId: string, params: TravelParams) => void;
  savedTrips: SavedTrip[];
  onSelectTrip: (trip: SavedTrip) => void;
  onDeleteTrip: (id: string) => void;
  onDuplicateTrip: (trip: SavedTrip) => void;
  predefinedParams?: Partial<TravelParams> | null;
}

export default function ChatAssistant({ 
  onBack, 
  onPlanGenerated, 
  savedTrips, 
  onSelectTrip, 
  onDeleteTrip, 
  onDuplicateTrip,
  predefinedParams
}: ChatAssistantProps) {
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hi! I'm your AI Travel Assistant from TravelGo.AI powered by Gemma. Where would you like to travel? (e.g., Goa, Kyoto, Swiss Alps, Ladakh)",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [capturedParams, setCapturedParams] = useState<TravelParams>({});
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const generatingRef = useRef(false);
  const tripIdRef = useRef<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Experience options for quick selection
  const experienceOptions = [
    "Adventure", "Beaches", "Mountains", "Nature", "Food", "Shopping", "Luxury", "Budget", "Family", "Solo"
  ];

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, awaitingConfirmation, isGenerating, generationError]);

  // Handle predefined choices clicked on the landing page
  useEffect(() => {
    if (predefinedParams) {
      setCapturedParams(predefinedParams);
      handlePredefinedPlan(predefinedParams);
    }
  }, [predefinedParams]);

  const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const addBotMessage = (content: string) => {
    setMessages(prev => [...prev, { id: `bot-msg-${Date.now()}`, role: 'assistant', content, timestamp: nowTime() }]);
  };

  // Predefined trips already contain every detail, so go straight to confirmation
  const handlePredefinedPlan = (params: Partial<TravelParams>) => {
    const userMsg: ChatMessage = {
      id: `predef-user-${Date.now()}`,
      role: 'user',
      content: `Create my customized plan for ${params.destination} with a budget of ${params.budget || 'any'} for ${params.duration} days, ${params.travelers} traveler(s), aiming for ${params.experience?.join(", ") || "General"} experience style.`,
      timestamp: nowTime()
    };
    const botMsg: ChatMessage = {
      id: `predef-bot-${Date.now()}`,
      role: 'assistant',
      content: "Great choice! Please review your trip details below and click OK to generate your itinerary.",
      timestamp: nowTime()
    };
    setMessages(prev => [...prev, userMsg, botMsg]);
    tripIdRef.current = null;
    setGenerationError(null);
    setAwaitingConfirmation(true);
  };

  // Generates the itinerary for the confirmed trip details (guarded against double clicks)
  const handleConfirmTrip = async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    if (!tripIdRef.current) tripIdRef.current = `trip-${Date.now()}`;
    const tripId = tripIdRef.current;
    const confirmedParams = { ...capturedParams };

    setGenerationError(null);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params: confirmedParams })
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data.travelPlan) {
        onPlanGenerated(data.travelPlan, tripId, confirmedParams);
        return;
      }

      if (data.error === 'MISSING_TRIP_DETAILS') {
        setAwaitingConfirmation(false);
        addBotMessage(data.message || "Some trip details are missing. Could you provide them?");
        return;
      }

      setGenerationError(data.message || "Itinerary generation failed. Please try again.");
    } catch (err: any) {
      console.error("Itinerary API error:", err);
      setGenerationError("Could not reach the TravelGo.AI server. Please make sure it is running and try again.");
    } finally {
      generatingRef.current = false;
      setIsGenerating(false);
    }
  };

  const handleEditDetails = () => {
    setAwaitingConfirmation(false);
    setGenerationError(null);
    tripIdRef.current = null;
    addBotMessage("Sure! Tell me what you'd like to change — destination, budget, duration, travelers or experience.");
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isGenerating) return;

    setInputText('');
    setAwaitingConfirmation(false);
    setGenerationError(null);
    tripIdRef.current = null;

    const newUserMsg: ChatMessage = {
      id: `user-msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          currentParams: capturedParams
        })
      });

      const data = await response.json();

      // Update captured parameters in state if present
      if (data.collectedData) {
        setCapturedParams(prev => ({
          ...prev,
          ...data.collectedData
        }));
      }

      // Add AI reply message
      const replyContent = data.reply || (data.error ? `⚠️ ${data.error}: ${data.details || ''}` : "I'm having trouble processing that right now.");
      const botMsg: ChatMessage = {
        id: `bot-msg-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);

      // All details collected: ask the user to confirm before generating the itinerary
      if (data.isComplete) {
        setAwaitingConfirmation(true);
      }

    } catch (err: any) {
      console.error("Chat API error:", err);
      const botMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Communication error: ${err?.message || "Failed to contact backend service"}. Please ensure the server is running.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickExperienceClick = (exp: string) => {
    // Append tag to experience list or toggle it
    const currentExps = capturedParams.experience || [];
    let updatedExps = [...currentExps];
    if (currentExps.includes(exp)) {
      updatedExps = updatedExps.filter(e => e !== exp);
    } else {
      updatedExps.push(exp);
    }
    
    setCapturedParams(prev => ({
      ...prev,
      experience: updatedExps
    }));

    handleSend(`Experience: ${exp}`);
  };

  return (
    <div id="chat-assistant-container" className="flex flex-col lg:grid lg:grid-cols-12 min-h-[calc(100vh-60px)] bg-slate-950 text-white font-sans overflow-hidden">
      
      {/* LEFT PANEL: History & Preference Tracker (lg:col-span-4) */}
      <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-900 bg-slate-950 p-6 flex flex-col justify-between h-[300px] lg:h-full overflow-y-auto">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button 
              id="btn-back-landing"
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-900 cursor-pointer"
            >
              <ArrowLeft size={14} />
              Landing Page
            </button>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Live Tracker
            </span>
          </div>

          {/* Captured preference progress tracker */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-900 p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles size={14} className="text-emerald-400" />
              Preferences Captured
            </h3>

            <div className="space-y-3 text-sm">
              {/* Destination */}
              <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin size={15} />
                  <span>Destination</span>
                </div>
                <span className={`font-medium ${capturedParams.destination ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {capturedParams.destination || "Waiting..."}
                </span>
              </div>

              {/* Budget */}
              <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                <div className="flex items-center gap-2 text-slate-400">
                  <IndianRupee size={15} />
                  <span>Budget</span>
                </div>
                <span className={`font-medium ${capturedParams.budget ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {capturedParams.budget || "Waiting..."}
                </span>
              </div>

              {/* Duration */}
              <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                <div className="flex items-center gap-2 text-slate-400">
                  <Calendar size={15} />
                  <span>Duration</span>
                </div>
                <span className={`font-medium ${capturedParams.duration ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {capturedParams.duration ? `${capturedParams.duration} Days` : "Waiting..."}
                </span>
              </div>

              {/* Travelers */}
              <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                <div className="flex items-center gap-2 text-slate-400">
                  <Users size={15} />
                  <span>Travelers</span>
                </div>
                <span className={`font-medium ${capturedParams.travelers ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {capturedParams.travelers ? `${capturedParams.travelers} ${capturedParams.travelers > 1 ? 'People' : 'Person'}` : "Waiting..."}
                </span>
              </div>

              {/* Experience */}
              <div className="flex items-start justify-between py-1">
                <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                  <Briefcase size={15} />
                  <span>Experience</span>
                </div>
                <div className="text-right flex flex-wrap gap-1 justify-end max-w-[60%]">
                  {capturedParams.experience && capturedParams.experience.length > 0 ? (
                    capturedParams.experience.map((tag, idx) => (
                      <span key={idx} className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-600">Waiting...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TRIP HISTORY PANEL */}
        <div className="mt-6 pt-4 border-t border-slate-900 flex-grow flex flex-col min-h-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <History size={14} className="text-blue-400" />
            <span>Saved Travel Plans ({savedTrips.length})</span>
          </div>

          {savedTrips.length === 0 ? (
            <div className="flex-grow flex items-center justify-center border border-dashed border-slate-900 rounded-xl p-4 text-center text-xs text-slate-600">
              Your generated plans will automatically be saved here.
            </div>
          ) : (
            <div className="flex-grow space-y-2 overflow-y-auto max-h-[160px] lg:max-h-none pr-1">
              {savedTrips.map((trip) => (
                <div 
                  key={trip.id}
                  className="group relative flex items-center justify-between rounded-xl bg-slate-900/40 border border-slate-900 hover:border-slate-800 p-3 transition-colors hover:bg-slate-900/80"
                >
                  <div 
                    onClick={() => onSelectTrip(trip)}
                    className="flex-grow text-left cursor-pointer pr-16"
                  >
                    <p className="font-bold text-sm text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                      {trip.plan.destination}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                      <span>₹{trip.plan.budget.toLocaleString('en-IN')}</span>
                      <span>•</span>
                      <span>{trip.plan.duration} Days</span>
                    </div>
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-80 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button
                      title="View Plan"
                      onClick={() => onSelectTrip(trip)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 cursor-pointer"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      title="Duplicate Plan"
                      onClick={() => onDuplicateTrip(trip)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-blue-400 cursor-pointer"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      title="Delete Plan"
                      onClick={() => onDeleteTrip(trip.id)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Conversational ChatGPT-like UI (lg:col-span-8) */}
      <div className="lg:col-span-8 flex flex-col h-[500px] lg:h-full relative bg-slate-950">
        
        {/* Chat Stream Area */}
        <div className="flex-grow p-6 overflow-y-auto space-y-6">
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3.5 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar Icon */}
                <div className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center ${
                  m.role === 'user' 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' 
                    : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>

                {/* Message Balloon */}
                <div className="space-y-1 text-left">
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'glass-dark text-slate-200 rounded-tl-none border border-slate-800/80 shadow-md'
                  }`}>
                    {m.content}
                  </div>
                  <p className={`text-[10px] text-slate-500 px-1 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {m.timestamp}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Trip Confirmation Card */}
          {awaitingConfirmation && !isLoading && (
            <motion.div
              id="trip-confirmation-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3.5 max-w-[85%]"
            >
              <div className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center bg-emerald-600/20 text-emerald-400 border border-emerald-500/20">
                <Sparkles size={16} />
              </div>
              <div className="glass-dark rounded-2xl rounded-tl-none border border-emerald-500/20 shadow-md p-4 text-left text-sm space-y-3 w-full max-w-md">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Confirm your trip</p>
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-500" /> {capturedParams.destination}</div>
                  <div className="flex items-center gap-2"><IndianRupee size={14} className="text-slate-500" /> {capturedParams.budget} total budget</div>
                  <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-500" /> {capturedParams.duration} Days</div>
                  <div className="flex items-center gap-2"><Users size={14} className="text-slate-500" /> {capturedParams.travelers} {(capturedParams.travelers || 0) > 1 ? 'People' : 'Person'}</div>
                  <div className="flex items-center gap-2"><Briefcase size={14} className="text-slate-500" /> {capturedParams.experience?.join(', ')}</div>
                </div>

                {isGenerating && (
                  <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-3 py-2">
                    <RefreshCw size={13} className="animate-spin" />
                    Generating your itinerary with Gemma… this can take a minute or two.
                  </div>
                )}

                {generationError && !isGenerating && (
                  <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/5 border border-rose-500/20 rounded-xl px-3 py-2">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    <span>{generationError} Your trip details are kept — you can retry.</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    id="btn-confirm-trip"
                    onClick={handleConfirmTrip}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {generationError ? <RefreshCw size={13} /> : <Check size={13} />}
                    {isGenerating ? 'Generating…' : generationError ? 'Retry' : 'OK, Generate Itinerary'}
                  </button>
                  <button
                    id="btn-edit-trip"
                    onClick={handleEditDetails}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <Pencil size={13} />
                    Edit Details
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Typing Loading Indicator */}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3.5 max-w-[80%]"
            >
              <div className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center bg-emerald-600/20 text-emerald-400 border border-emerald-500/20">
                <Bot size={16} className="animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              <div className="rounded-2xl px-4 py-3.5 bg-slate-900/50 border border-slate-900 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating Quick tag suggestions inside Chat (only visible when experience is being collected) */}
        {(!capturedParams.experience || capturedParams.experience.length === 0) && (
          <div className="px-6 py-2 border-t border-slate-900 bg-slate-950/80 flex items-center gap-2 overflow-x-auto select-none no-scrollbar">
            <span className="text-[10px] text-slate-500 shrink-0 font-bold uppercase tracking-wider">Quick Select style:</span>
            {experienceOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => quickExperienceClick(opt)}
                className={`text-xs px-3 py-1 rounded-full shrink-0 border transition-all cursor-pointer ${
                  capturedParams.experience?.includes(opt)
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Input Text Box Form */}
        <div className="p-6 border-t border-slate-900 bg-slate-950/90 flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) handleSend();
            }}
            placeholder="Type your travel preferences naturally... (e.g., 'Goa for 5 days under 40k')"
            disabled={isLoading || isGenerating}
            className="flex-grow rounded-xl bg-slate-900 border border-slate-800 px-4 py-3.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-60"
          />
          <button
            id="btn-chat-send"
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isLoading || isGenerating}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:bg-slate-900 disabled:text-slate-600 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 disabled:scale-100"
          >
            <Send size={18} />
          </button>
        </div>

      </div>

    </div>
  );
}
