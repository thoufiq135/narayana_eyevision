import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  MapPin, Building2, Utensils, ChevronRight, Eye, ArrowLeft,
  CheckCircle, Search, Home, Sparkles, X
} from 'lucide-react';
import { useAppStore } from '../store';
import { statesData } from '../data/mock';
import { State, Branch, Hall } from '../types';

type Step = 'state' | 'branch' | 'hall';

// ============================================================
// Landmark data — maps a state name to its most iconic
// landmark on Wikipedia. The actual photo is fetched live
// from Wikipedia's public REST API (no API key required, and
// every image served this way is freely licensed), so the
// card always shows a real, correctly-attributed image of
// that state's most recognisable place.
//
// Scoped to the states where Narayana Health actually operates
// hospitals today (per narayanahealth.org's network — Karnataka,
// Delhi-NCR, West Bengal, Gujarat, Rajasthan, Maharashtra,
// Jharkhand, Assam, and Jammu & Kashmir). Add an entry here the
// day NH opens in a new state; anything missing automatically
// falls back to (1) the state's own Wikipedia page image, and
// if that also fails, (2) a hand-tuned gradient "stamp" so the
// UI never shows a broken image.
// ============================================================
const STATE_LANDMARKS: Record<string, { wikiTitle: string; label: string }> = {
  'karnataka': { wikiTitle: 'Mysore Palace', label: 'Mysore Palace, Karnataka' },
  'delhi': { wikiTitle: 'India Gate', label: 'India Gate, New Delhi' },
  'new delhi': { wikiTitle: 'India Gate', label: 'India Gate, New Delhi' },
  'ncr': { wikiTitle: 'India Gate', label: 'India Gate, New Delhi' },
  'west bengal': { wikiTitle: 'Victoria Memorial, Kolkata', label: 'Victoria Memorial, Kolkata' },
  'gujarat': { wikiTitle: 'Statue of Unity', label: 'Statue of Unity, Gujarat' },
  'rajasthan': { wikiTitle: 'Hawa Mahal', label: 'Hawa Mahal, Jaipur' },
  'maharashtra': { wikiTitle: 'Gateway of India', label: 'Gateway of India, Mumbai' },
  'jharkhand': { wikiTitle: 'Baidyanath Temple', label: 'Baidyanath Dham, Deoghar' },
  'assam': { wikiTitle: 'Kamakhya Temple', label: 'Kamakhya Temple, Guwahati' },
  'jammu and kashmir': { wikiTitle: 'Vaishno Devi', label: 'Vaishno Devi Shrine, Jammu' },
  'jammu & kashmir': { wikiTitle: 'Vaishno Devi', label: 'Vaishno Devi Shrine, Jammu' },
};

// module-level cache so the same landmark image is only ever
// fetched once per session, no matter how many cards render it
const imageCache = new Map<string, string | null>();

function useLandmarkImage(wikiTitle: string) {
  const cached = imageCache.get(wikiTitle);
  const [url, setUrl] = useState<string | null>(cached ?? null);
  const [status, setStatus] = useState<'loading' | 'done'>(
    imageCache.has(wikiTitle) ? 'done' : 'loading'
  );

  useEffect(() => {
    if (imageCache.has(wikiTitle)) {
      setUrl(imageCache.get(wikiTitle) ?? null);
      setStatus('done');
      return;
    }
    let cancelled = false;
    setStatus('loading');

    fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        wikiTitle.replace(/ /g, '_')
      )}`
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const src: string | null =
          data?.originalimage?.source || data?.thumbnail?.source || null;
        imageCache.set(wikiTitle, src);
        if (!cancelled) {
          setUrl(src);
          setStatus('done');
        }
      })
      .catch(() => {
        imageCache.set(wikiTitle, null);
        if (!cancelled) {
          setUrl(null);
          setStatus('done');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [wikiTitle]);

  return { url, status };
}

// deterministic, varied "postage stamp" gradient used whenever
// a real landmark photo isn't available, so every card still
// looks intentional rather than blank
const FALLBACK_THEMES = [
  'from-amber-500 via-orange-500 to-rose-500',
  'from-emerald-500 via-teal-500 to-cyan-600',
  'from-violet-500 via-purple-500 to-fuchsia-600',
  'from-blue-600 via-indigo-600 to-violet-600',
  'from-rose-500 via-pink-500 to-purple-600',
  'from-teal-500 via-cyan-500 to-blue-600',
];
function themeForKey(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return FALLBACK_THEMES[hash % FALLBACK_THEMES.length];
}

export default function SelectionFlow() {
  const navigate = useNavigate();
  const params = useParams<{ stateId?: string; branchId?: string; hallId?: string }>();
  
  const { 
    selectedState, 
    selectedBranch, 
    selectedHall,
    setSelectedState, 
    setSelectedBranch, 
    setSelectedHall,
    clearLocation,
    setActiveSection // Add this to set the active section
  } = useAppStore();
  
  const [step, setStep] = useState<Step>('state');
  const [state, setState] = useState<State | null>(selectedState);
  const [branch, setBranch] = useState<Branch | null>(selectedBranch);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Route-based initialization
  useEffect(() => {
    const { stateId, branchId, hallId } = params;

    if (!stateId) return;

    if (stateId && branchId && hallId) {
      const foundState = statesData.find(s => s.id === stateId);
      if (foundState) {
        setState(foundState);
        setSelectedState(foundState);

        const foundBranch = foundState.branches.find(b => b.id === branchId);
        if (foundBranch) {
          setBranch(foundBranch);
          setSelectedBranch(foundBranch);

          const foundHall = foundBranch.halls.find(h => h.id === hallId);
          if (foundHall) {
            setSelectedHall(foundHall);
            // Set active section to overview when navigating to dashboard
            setActiveSection('overview');
            navigate('/dashboard', { replace: true });
            return;
          }
        }
      }

      clearLocation();
      navigate('/select-state', { replace: true });
      return;
    }

    if (stateId && !branchId) {
      const foundState = statesData.find(s => s.id === stateId);
      if (foundState) {
        setState(foundState);
        setSelectedState(foundState);
        setStep('branch');
      } else {
        navigate('/select-state', { replace: true });
      }
    } else if (stateId && branchId && !hallId) {
      const foundState = statesData.find(s => s.id === stateId);
      if (foundState) {
        setState(foundState);
        setSelectedState(foundState);

        const foundBranch = foundState.branches.find(b => b.id === branchId);
        if (foundBranch) {
          setBranch(foundBranch);
          setSelectedBranch(foundBranch);
          setStep('hall');
        } else {
          navigate(`/states/${stateId}/select-branch`, { replace: true });
        }
      } else {
        navigate('/select-state', { replace: true });
      }
    }
  }, [
    params.stateId,
    params.branchId,
    params.hallId,
    navigate,
    setSelectedState,
    setSelectedBranch,
    setSelectedHall,
    clearLocation,
    setActiveSection
  ]);

  const selectState = (s: State) => {
    setState(s);
    setSelectedState(s);
    setStep('branch');
    navigate(`/states/${s.id}/select-branch`);
  };

  const selectBranch = (b: Branch) => {
    if (!state) return;
    setBranch(b);
    setSelectedBranch(b);
    setStep('hall');
    navigate(`/states/${state.id}/branches/${b.id}/select-hall`);
  };

  const selectHall = (h: Hall) => {
    if (!state || !branch) return;
    setSelectedState(state);
    setSelectedBranch(branch);
    setSelectedHall(h);
    setIsLoading(true);
    
    // Set active section to overview when navigating to dashboard
    setActiveSection('overview');
    
    setTimeout(() => {
      navigate(`/dashboard`);
      setIsLoading(false);
    }, 500);
  };

  const goBack = () => {
    if (step === 'branch' && state) {
      setStep('state');
      navigate('/select-state');
    } else if (step === 'hall' && branch && state) {
      setStep('branch');
      navigate(`/states/${state.id}/select-branch`);
    }
  };

  const filteredStates = statesData.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBranches = state?.branches.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.location.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredHalls = branch?.halls.filter(h =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.number.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const steps = [
    { id: 'state', label: 'State', icon: MapPin, done: step !== 'state' },
    { id: 'branch', label: 'Branch', icon: Building2, done: step === 'hall' },
    { id: 'hall', label: 'Dining Hall', icon: Utensils, done: false },
  ];

  const getStepStatus = (stepId: string) => {
    if (stepId === 'state' && step !== 'state') return 'done';
    if (stepId === 'branch' && step === 'hall') return 'done';
    if (stepId === step) return 'active';
    return 'inactive';
  };

  // If already has a selection, redirect to dashboard
  useEffect(() => {
    if (selectedState && selectedBranch && selectedHall) {
      navigate('/dashboard', { replace: true });
    }
  }, [selectedState, selectedBranch, selectedHall, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-brand-primary/20 border-t-brand-primary animate-spin mx-auto mb-6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Eye size={28} className="text-brand-primary animate-pulse" />
            </div>
          </div>
          <p className="text-white/80 font-medium text-lg">Loading your dashboard...</p>
          <p className="text-white/40 text-sm mt-1">Please wait while we set up your workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(30,64,175,0.08) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src="https://www.justmbbs.com/img/college/andhra-pradesh/narayana-medical-college-nellore-logo.jpg" 
              alt="Logo" 
              className="w-15 h-10 rounded-lg shadow-sm group-hover:shadow-md transition-shadow object-cover flex-shrink-0"
            />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-textPrimary flex items-center gap-2">
              NMCH Eye Vision
              <span className="text-[8px] font-medium bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-2 py-0.5 rounded-full">
                ENTERPRISE
              </span>
            </p>
            <p className="text-xs text-brand-textSecondary">Narayana Health · Phase 1 – AI Dining Hall Monitor</p>
          </div>
        </div>
        
        {selectedState && selectedBranch && selectedHall && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setActiveSection('overview');
              navigate(`/dashboard`);
            }}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl text-sm font-medium shadow-lg shadow-brand-primary/25 hover:shadow-xl transition-all"
          >
            <Home size={16} />
            Go to Dashboard
            <Sparkles size={14} className="animate-pulse" />
          </motion.button>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-0 mb-12">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const status = getStepStatus(s.id);
              const isActive = status === 'active';
              const isDone = status === 'done';
              
              return (
                <div key={s.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className={`relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isDone ? 'bg-gradient-to-br from-brand-primary to-brand-secondary border-brand-primary shadow-lg shadow-brand-primary/20' :
                        isActive ? 'bg-white border-brand-primary shadow-lg shadow-brand-primary/20' :
                        'bg-white/50 border-gray-200'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle size={20} className="text-white" />
                      ) : (
                        <Icon size={18} className={isActive ? 'text-brand-primary' : 'text-gray-400'} />
                      )}
                      {isActive && (
                        <motion.div 
                          layoutId="pulse-ring"
                          className="absolute inset-0 rounded-full border-2 border-brand-primary/30 animate-ping"
                        />
                      )}
                    </motion.div>
                    <span className={`text-xs mt-2 font-semibold ${
                      isActive ? 'text-brand-primary' : 
                      isDone ? 'text-brand-primary' : 
                      'text-gray-400'
                    }`}>
                      {s.label}
                    </span>
                    {isDone && (
                      <span className="text-[8px] text-brand-primary/60 font-medium mt-0.5">✓ Complete</span>
                    )}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-16 sm:w-32 h-0.5 mx-3 mb-6 transition-all ${
                      isDone ? 'bg-gradient-to-r from-brand-primary to-brand-secondary' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-primary transition-colors" />
              <input
                type="text"
                placeholder={
                  step === 'state' ? '🔍 Search states...' :
                  step === 'branch' ? '🔍 Search branches...' :
                  '🔍 Search halls...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-gray-200/60 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm shadow-sm hover:shadow-md"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Cards */}
          <AnimatePresence mode="wait">
            {step === 'state' && (
              <motion.div 
                key="state" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-primary/10 rounded-full mb-3"
                  >
                    <MapPin size={14} className="text-brand-primary" />
                    <span className="text-xs font-medium text-brand-primary">Step 1 of 3</span>
                  </motion.div>
                  <h2 className="text-3xl font-bold text-brand-textPrimary">Choose Your State</h2>
                  <p className="text-sm text-brand-textSecondary mt-1">Select the state where your Narayana Health hospital is located</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredStates.length > 0 ? (
                    filteredStates.map((s, index) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <StateLandmarkCard
                          stateItem={s}
                          onClick={() => selectState(s)}
                          selected={state?.id === s.id}
                        />
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <div className="text-4xl mb-3">🔍</div>
                      <p className="text-brand-textSecondary">No states found matching "<strong>{searchTerm}</strong>"</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'branch' && state && (
              <motion.div 
                key="branch" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <button 
                  onClick={goBack} 
                  className="flex items-center gap-2 text-sm text-brand-textSecondary hover:text-brand-primary mb-6 transition-colors group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                  Back to States
                </button>
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-primary/10 rounded-full mb-3"
                  >
                    <Building2 size={14} className="text-brand-primary" />
                    <span className="text-xs font-medium text-brand-primary">Step 2 of 3</span>
                  </motion.div>
                  <h2 className="text-3xl font-bold text-brand-textPrimary">Select Branch</h2>
                  <p className="text-sm text-brand-textSecondary mt-1">
                    <span className="font-medium text-brand-primary">{state.name}</span> — Choose your campus location
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {filteredBranches.length > 0 ? (
                    filteredBranches.map((b, index) => (
                      <motion.div
                        key={b.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <SelectCard
                          icon={<Building2 size={22} className="text-brand-primary" />}
                          title={b.name}
                          subtitle={` ${b.location} · ${b.halls.length} dining halls`}
                          onClick={() => selectBranch(b)}
                          selected={branch?.id === b.id}
                          gradient="from-blue-50 to-purple-50"
                        />
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3">🏢</div>
                      <p className="text-brand-textSecondary">No branches found matching "<strong>{searchTerm}</strong>"</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'hall' && branch && (
              <motion.div 
                key="hall" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <button 
                  onClick={goBack} 
                  className="flex items-center gap-2 text-sm text-brand-textSecondary hover:text-brand-primary mb-6 transition-colors group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                  Back to Branches
                </button>
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-primary/10 rounded-full mb-3"
                  >
                    <Utensils size={14} className="text-brand-primary" />
                    <span className="text-xs font-medium text-brand-primary">Step 3 of 3</span>
                  </motion.div>
                  <h2 className="text-3xl font-bold text-brand-textPrimary">Select Dining Hall</h2>
                  <p className="text-sm text-brand-textSecondary mt-1">
                    <span className="font-medium text-brand-primary">{state?.name}</span> / 
                    <span className="font-medium text-brand-primary ml-1">{branch.name}</span> — Choose your dining hall
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredHalls.length > 0 ? (
                    filteredHalls.map((h, index) => (
                      <motion.div
                        key={h.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <SelectCard
                          icon={<Utensils size={22} className="text-brand-primary" />}
                          title={h.name}
                          subtitle={`${h.number} · ${h.capacity} capacity · ${h.cameras.length} cameras`}
                          badge={h.aiStatus === 'online' ? '● AI Active' : '● AI Offline'}
                          badgeColor={h.aiStatus === 'online' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}
                          onClick={() => selectHall(h)}
                          selected={selectedHall?.id === h.id}
                          gradient="from-purple-50 to-pink-50"
                        />
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-12">
                      <div className="text-4xl mb-3">🍽️</div>
                      <p className="text-brand-textSecondary">No halls found matching "<strong>{searchTerm}</strong>"</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress Indicator */}
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-4 px-6 py-2.5 bg-white/70 backdrop-blur-sm rounded-full shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${step === 'state' ? 'bg-brand-primary' : 'bg-gray-300'}`} />
                <span className={`text-xs font-medium ${step === 'state' ? 'text-brand-primary' : 'text-gray-400'}`}>State</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${step === 'branch' ? 'bg-brand-primary' : step === 'hall' ? 'bg-brand-primary' : 'bg-gray-300'}`} />
                <span className={`text-xs font-medium ${step === 'branch' || step === 'hall' ? 'text-brand-primary' : 'text-gray-400'}`}>Branch</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${step === 'hall' ? 'bg-brand-primary' : 'bg-gray-300'}`} />
                <span className={`text-xs font-medium ${step === 'hall' ? 'text-brand-primary' : 'text-gray-400'}`}>Hall</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-brand-textSecondary/60 border-t border-gray-200/50 bg-white/30 backdrop-blur-sm">
        <span className="font-medium">Stackenzo Eye Vision</span> · Phase 1 · Enterprise AI Dining Hall Monitor for Narayana Health
      </div>
    </div>
  );
}

// ============================================================
// StateLandmarkCard — a "postcard" style card used only for the
// state-selection step. It shows a live photo of that state's
// most famous landmark (fetched from Wikipedia), a white
// postcard border, and a dashed "travel stamp" badge when the
// state is selected. Falls back to a themed gradient + subtle
// dot texture if no photo is available, so it never looks broken.
// ============================================================
function StateLandmarkCard({
  stateItem,
  selected,
  onClick,
}: {
  stateItem: State;
  selected: boolean;
  onClick: () => void;
}) {
  const landmark = STATE_LANDMARKS[stateItem.name.trim().toLowerCase()];
  const wikiTitle = landmark?.wikiTitle ?? stateItem.name;
  const { url, status } = useLandmarkImage(wikiTitle);
  const theme = themeForKey(stateItem.id || stateItem.name);
  const hasPhoto = status === 'done' && !!url;
  const branchCount = stateItem.branches.length;

  return (
    <motion.button
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full text-left group"
    >
      <div
        className={`relative rounded-[22px] p-2 pb-3 bg-white transition-all duration-300 ${
          selected
            ? 'ring-2 ring-brand-primary shadow-2xl shadow-brand-primary/25'
            : 'shadow-md group-hover:shadow-xl group-hover:shadow-black/10'
        }`}
      >
        {/* Landmark image / fallback */}
        <div className="relative h-40 rounded-[16px] overflow-hidden bg-gray-100">
          {hasPhoto && (
            <img
              src={url as string}
              alt={landmark?.label ?? stateItem.name}
              loading="lazy"
              onError={() => imageCache.set(wikiTitle, null)}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          )}

          {!hasPhoto && status === 'loading' && (
            <div className={`absolute inset-0 bg-gradient-to-br ${theme} animate-pulse flex items-center justify-center`}>
              <MapPin size={26} className="text-white/40" />
            </div>
          )}

          {!hasPhoto && status === 'done' && (
            <div className={`absolute inset-0 bg-gradient-to-br ${theme} flex items-center justify-center`}>
              <div
                className="absolute inset-0 opacity-[0.18]"
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '14px 14px',
                }}
              />
              <MapPin size={34} className="text-white/30 relative" />
            </div>
          )}

          {/* legibility gradient so white text always reads clearly */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />

          {/* branch count pill */}
          <span className="absolute top-2 left-2 text-[10px] font-semibold text-white/90 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
            {branchCount} {branchCount === 1 ? 'branch' : 'branches'}
          </span>

          {/* landmark caption, only when we actually have a named landmark */}
          {landmark && (
            <span className="absolute bottom-2 left-2 right-2 text-[10px] text-white/85 italic truncate flex items-center gap-1">
              <MapPin size={10} className="flex-shrink-0" />
              {landmark.label}
            </span>
          )}

          {/* travel-stamp badge for the selected state */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ scale: 0, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: -12, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-2 -right-2 w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-lg border-2 border-dashed border-brand-primary"
              >
                <CheckCircle size={20} className="text-brand-primary" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Postcard label strip */}
        <div className="px-2 pt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p
              className="text-lg font-bold text-brand-textPrimary truncate leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {stateItem.name}
            </p>
            <p className="text-[11px] tracking-wider uppercase text-brand-textSecondary/60 font-medium mt-0.5">
              {stateItem.id}
            </p>
          </div>
          <ChevronRight
            size={18}
            className="text-gray-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all flex-shrink-0 mb-1"
          />
        </div>
      </div>
    </motion.button>
  );
}

// ============================================================
// SelectCard — unchanged generic card, still used for the
// Branch and Dining Hall steps (landmark photos only make sense
// at the state level).
// ============================================================

function SelectCard({ 
  icon, 
  title, 
  subtitle, 
  badge, 
  badgeColor, 
  onClick,
  selected,
  gradient = 'from-blue-50 to-indigo-50'
}: {
  icon: React.ReactNode; 
  title: string; 
  subtitle: string;
  badge?: string; 
  badgeColor?: string; 
  onClick: () => void;
  selected?: boolean;
  gradient?: string;
}) {
  return (
    <motion.button
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full relative group transition-all duration-300 ${
        selected 
          ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-white' 
          : ''
      }`}
    >
      <div className={`relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-all ${
        selected 
          ? 'bg-gradient-to-br from-brand-primary/5 via-white to-brand-secondary/5 border-brand-primary shadow-xl shadow-brand-primary/10' 
          : 'bg-white/80 backdrop-blur-sm border-gray-200/60 hover:border-brand-primary/30 hover:shadow-lg hover:shadow-brand-primary/5'
      }`}>
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        
        {/* Content */}
        <div className="relative flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
            selected 
              ? 'bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/20' 
              : 'bg-gray-50/80 group-hover:bg-brand-primary/10 text-brand-primary border border-gray-100'
          }`}>
            {icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate transition-colors ${
              selected ? 'text-brand-primary' : 'text-brand-textPrimary group-hover:text-brand-primary'
            }`}>
              {title}
            </p>
            <p className="text-xs text-brand-textSecondary/70 truncate mt-0.5">{subtitle}</p>
            {badge && (
              <span className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full border mt-1.5 ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>
          
          <div className="flex-shrink-0">
            {selected ? (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-brand-primary/20">
                <CheckCircle size={14} className="text-white" />
              </div>
            ) : (
              <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-primary transition-all group-hover:translate-x-1" />
            )}
          </div>
        </div>

        {/* Selection Indicator Bar */}
        {selected && (
          <motion.div
            layoutId="selection-bar"
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-primary to-brand-secondary"
          />
        )}
      </div>
    </motion.button>
  );
}