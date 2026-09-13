import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Zap, Upload, CheckCircle2, ChevronRight, ChevronLeft,
  ShieldCheck, Activity, Globe2, Info, Cpu, Compass, Check
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://led.stackvil.com/_/backend';

// Available preset locations for visual selection
const SUGGESTED_LOCATIONS = [
  {
    name: 'Benz Circle, Vijayawada',
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    address: 'Near Benz Circle, Ring Road Intersection, Vijayawada, AP - 520010',
    landmark: 'Opposite Jyothi Mall',
    lat: 16.5015,
    lng: 80.6438,
    traffic: '120,000+ vehicles/day',
    roadType: 'Highway / Major Arterial'
  },
  {
    name: 'Gachibowli ORR Junction, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    address: 'Gachibowli Outer Ring Road Flyover Entry Point, Hyderabad, TS - 500032',
    landmark: 'Opposite Westin Hotel Entrance',
    lat: 17.4428,
    lng: 78.3489,
    traffic: '180,000+ vehicles/day',
    roadType: 'IT Corridor / Airport Route'
  },
  {
    name: 'RK Beach Road, Visakhapatnam',
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    address: 'Near Kali Temple Intersection, Beach Road Promenade, Visakhapatnam, AP - 530002',
    landmark: 'Adjacent to INS Kursura Submarine Museum',
    lat: 17.7145,
    lng: 83.3235,
    traffic: '85,000+ vehicles/day',
    roadType: 'Tourist / Scenic Corridor'
  },
  {
    name: 'Connaught Place Outer Circle, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    address: 'E-Block Inner Radial Road, Connaught Place, New Delhi, DL - 110001',
    landmark: 'Opposite Rajiv Chowk Metro Gate 3',
    lat: 28.6304,
    lng: 77.2177,
    traffic: '210,000+ vehicles/day',
    roadType: 'Commercial Center'
  },
  {
    name: 'Bandra Linking Road, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Linking Road Promenade Intersection, Bandra West, Mumbai, MH - 400050',
    landmark: 'Near National College crossing',
    lat: 19.0596,
    lng: 72.8295,
    traffic: '150,050+ vehicles/day',
    roadType: 'Premium Shopping Zone'
  }
];

const App = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Owner Info
    fullName: '',
    phoneNumber: '',
    email: '',
    companyName: '',
    gstNumber: '',
    
    // Step 2: Location
    state: '',
    city: '',
    fullAddress: '',
    landmark: '',
    googleMapsLink: '',
    latitude: '',
    longitude: '',
    
    // Step 3: Screen Details
    totalScreens: '1',
    screenType: 'LED Billboard', // LED Billboard, Transit Screen, Unipole, Mall Display
    mountType: 'Pole', // Pole, Wall Mount, Rooftop, Gantry
    sideType: 'Single Side', // Single Side, Double Side, Three Side
    width: '20',
    height: '10',
    resolution: '1920x1080',
    pixelPitch: 'P4', // P3, P4, P6, P10
    environment: 'Outdoor',
    
    // Step 4: Traffic & Visibility
    roadType: 'Commercial Area', // Highway, Business District, Shopping Zone, IT Hub, Airport Route, Residential Area
    dailyTraffic: '50,000 - 100,000',
    visibilityDistance: '100m',
    facingDirection: 'Facing North',
    operatingHours: '16 Hours (6 AM - 10 PM)',
    
    // Step 5: Tech
    internetAvailable: 'Yes',
    remoteAccess: 'Yes',
    powerBackup: 'Yes',
    controlSystem: 'Novastar',
  });

  // Photo uploads
  const [uploadedPhotos, setUploadedPhotos] = useState<Record<string, { file: File, preview: string }>>({});
  const [isAnalyzing, setIsAnalyzing] = useState<Record<string, boolean>>({});
  const [analysisResult, setAnalysisResult] = useState<Record<string, { quality: string, score: number, trafficScore: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Custom Simulated Map Pin Dropping State
  const [selectedMapPin, setSelectedMapPin] = useState<{ lat: number, lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Time remaining calculator based on active step
  const timeRemainingText = useMemo(() => {
    switch(step) {
      case 1: return '4 minutes remaining';
      case 2: return '3 minutes remaining';
      case 3: return '2 minutes remaining';
      case 4: return '2 minutes remaining';
      case 5: return '1 minute remaining';
      case 6: return '1 minute remaining';
      case 7: return 'Final review';
      default: return 'Ready';
    }
  }, [step]);

  // Real-time dynamic calculator logic
  const calculatedMetrics = useMemo(() => {
    // Determine base rate based on Mount Type
    let baseRate = 120000;
    if (formData.mountType === 'Wall Mount') baseRate = 150000;
    if (formData.mountType === 'Rooftop') baseRate = 190000;
    if (formData.mountType === 'Gantry') baseRate = 240000;

    // Apply side multiplier
    let sideMultiplier = 1.0;
    if (formData.sideType === 'Double Side') sideMultiplier = 1.8;
    if (formData.sideType === 'Three Side') sideMultiplier = 2.4;

    // Dimension factor
    const w = parseFloat(formData.width) || 20;
    const h = parseFloat(formData.height) || 10;
    const area = w * h;
    const sizeMultiplier = 1 + (area - 200) * 0.002;

    // Environment factor
    let envMultiplier = 1.0;
    if (formData.environment === 'Outdoor') envMultiplier = 1.25;
    if (formData.environment === 'Semi-Outdoor') envMultiplier = 1.1;

    // Traffic factor
    let trafficMultiplier = 1.0;
    if (formData.roadType === 'IT Hub') trafficMultiplier = 1.35;
    if (formData.roadType === 'Highway') trafficMultiplier = 1.45;
    if (formData.roadType === 'Airport Route') trafficMultiplier = 1.5;
    if (formData.roadType === 'Business District') trafficMultiplier = 1.4;
    if (formData.roadType === 'Shopping Zone') trafficMultiplier = 1.3;
    if (formData.roadType === 'Residential Area') trafficMultiplier = 1.05;

    // Technical Infrastructure bonuses
    let techBonus = 0;
    if (formData.internetAvailable === 'Yes') techBonus += 0.05;
    if (formData.remoteAccess === 'Yes') techBonus += 0.05;
    if (formData.powerBackup === 'Yes') techBonus += 0.05;

    // Photo uploads bonuses
    const photoCount = Object.keys(uploadedPhotos).length;
    const photoBonus = photoCount * 0.03;

    // Subtotal monthly revenue calculation
    const calculatedMonthlyBase = Math.round(baseRate * sideMultiplier * sizeMultiplier * envMultiplier * trafficMultiplier * (1 + techBonus + photoBonus));

    // Visibility Score aggregation
    let score = 45;
    if (formData.fullName && formData.phoneNumber && formData.email) score += 10;
    if (formData.fullAddress && formData.latitude) score += 15;
    if (w >= 20 && h >= 10) score += 10;
    if (formData.pixelPitch === 'P3' || formData.pixelPitch === 'P4') score += 10;
    if (formData.roadType === 'Highway' || formData.roadType === 'Airport Route' || formData.roadType === 'Business District') score += 10;
    if (formData.internetAvailable === 'Yes' && formData.remoteAccess === 'Yes') score += 5;
    if (photoCount >= 3) score += 10;

    // Constrain visibility score
    const finalScore = Math.min(score, 98);

    // Calculate tier and demand levels
    let tier = 'Bronze';
    if (finalScore >= 60 && finalScore < 75) tier = 'Silver';
    if (finalScore >= 75 && finalScore < 90) tier = 'Gold';
    if (finalScore >= 90) tier = 'Platinum';

    let demand = 'Medium';
    if (finalScore >= 70 && finalScore < 85) demand = 'High';
    if (finalScore >= 85) demand = 'Very High';

    return {
      monthlyMin: Math.round(calculatedMonthlyBase * 0.8),
      monthlyMax: Math.round(calculatedMonthlyBase * 1.2),
      visibilityScore: finalScore,
      tier,
      demand,
      completionRate: Math.round((step / 7) * 100)
    };
  }, [formData, uploadedPhotos, step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectPresetLocation = (loc: typeof SUGGESTED_LOCATIONS[number]) => {
    setFormData(prev => ({
      ...prev,
      city: loc.city,
      state: loc.state,
      fullAddress: loc.address,
      landmark: loc.landmark,
      latitude: loc.lat.toString(),
      longitude: loc.lng.toString(),
      googleMapsLink: `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
    }));
    setSelectedMapPin({ lat: loc.lat, lng: loc.lng });
    setSearchQuery(loc.name);
    setShowSuggestions(false);
  };

  const handlePhotoUpload = (slot: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      
      setUploadedPhotos(prev => ({
        ...prev,
        [slot]: { file, preview }
      }));

      // Trigger visual AI Scanning Effect
      setIsAnalyzing(prev => ({ ...prev, [slot]: true }));
      setTimeout(() => {
        setIsAnalyzing(prev => ({ ...prev, [slot]: false }));
        setAnalysisResult(prev => ({
          ...prev,
          [slot]: {
            quality: 'High Resolution (Clean)',
            score: Math.round(82 + Math.random() * 16),
            trafficScore: 'Optimal View Angle Detected'
          }
        }));
      }, 2000);
    }
  };

  const removePhoto = (slot: string) => {
    setUploadedPhotos(prev => {
      const copy = { ...prev };
      delete copy[slot];
      return copy;
    });
    setAnalysisResult(prev => {
      const copy = { ...prev };
      delete copy[slot];
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const formDataToSend = new FormData();
      
      const mapsLink = formData.googleMapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.fullAddress || formData.city || 'India')}`;
      const finalTotalScreens = formData.totalScreens || '1';

      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'googleMapsLink') {
          formDataToSend.append(key, mapsLink);
        } else if (key === 'totalScreens') {
          formDataToSend.append(key, finalTotalScreens);
        } else {
          formDataToSend.append(key, value);
        }
      });
      
      // Add photos
      Object.entries(uploadedPhotos).forEach(([key, photoData]) => {
        formDataToSend.append('media', photoData.file);
        formDataToSend.append('media_slots', key);
      });

      const response = await fetch(`${API_URL}/api/partner-requests`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error('Failed to submit onboarding request');
      }

      setIsSuccess(true);
    } catch (error) {
      console.error('Submission error:', error);
      setErrorMsg('Onboarding submission failed. Please check your network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper checkmark validation
  const isValid = (field: string) => {
    const val = (formData as any)[field];
    if (!val) return false;
    if (field === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (field === 'phoneNumber') return val.length >= 10;
    return val.trim().length > 0;
  };

  if (isSuccess) {
    return (
      <div className="app-bg min-h-screen py-24 px-6 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-[32px] shadow-[0_12px_40px_rgba(0,0,0,0.03)] max-w-2xl text-center border border-[rgba(17,24,39,0.08)]"
        >
          <div className="w-20 h-20 bg-[#00E676]/10 text-[#00E676] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black text-[#111827] mb-3 leading-tight">Screen Onboarding Successful!</h2>
          <p className="text-slate-500 font-medium text-base mb-6 max-w-md mx-auto leading-relaxed">
            Your screen profiles have been saved, and our technical evaluation team is already reviewing your location details.
          </p>
          
          {/* Estimated summary box */}
          <div className="bg-[#FAF7F2] border border-[rgba(17,24,39,0.08)] p-6 rounded-2xl mb-8 flex justify-around items-center text-left max-w-md mx-auto">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Visibility Class</span>
              <span className="text-lg font-black text-[#6C47FF]">{calculatedMetrics.tier} Partner</span>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Potential</span>
              <span className="text-lg font-black text-slate-800">₹{calculatedMetrics.monthlyMin.toLocaleString()} - ₹{calculatedMetrics.monthlyMax.toLocaleString()}/mo</span>
            </div>
          </div>

          <button 
            onClick={() => {
              setStep(1);
              setIsSuccess(false);
              setUploadedPhotos({});
            }}
            className="px-8 py-3.5 bg-[#6C47FF] hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-md shadow-indigo-100"
          >
            Register Another Screen
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-bg min-h-screen flex flex-col font-sans text-[#111827]">
      
      {/* ─── STICKY PROGRESS HEADER ───────────────────────── */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[rgba(17,24,39,0.08)] z-40 px-6 py-3.5 shadow-[0_2px_15px_rgba(0,0,0,0.01)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#6C47FF] flex items-center justify-center text-white font-black text-sm">J</div>
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block leading-none">Onboarding Portal</span>
              <h2 className="text-sm font-black text-slate-800 tracking-tight leading-none mt-1">JAAN Partner Network</h2>
            </div>
          </div>
          
          {/* Progress node checklist */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
            {[
              { num: 1, label: 'Owner' },
              { num: 2, label: 'Location' },
              { num: 3, label: 'Screen' },
              { num: 4, label: 'Traffic' },
              { num: 5, label: 'Technical' },
              { num: 6, label: 'Media' },
              { num: 7, label: 'Submit' }
            ].map(sNode => {
              const active = step === sNode.num;
              const completed = step > sNode.num;
              return (
                <div key={sNode.num} className="flex items-center gap-1.5 shrink-0">
                  <div 
                    onClick={() => { if (completed || sNode.num < step) setStep(sNode.num) }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all border ${
                      active ? 'bg-[#6C47FF] border-[#6C47FF] text-white ring-4 ring-indigo-50' : 
                      completed ? 'bg-[#00E676] border-[#00E676] text-white' : 
                      'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {completed ? <Check size={10} strokeWidth={3} /> : sNode.num}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-wider hidden sm:inline ${active ? 'text-[#6C47FF]' : completed ? 'text-[#00E676]' : 'text-slate-400'}`}>
                    {sNode.label}
                  </span>
                  {sNode.num < 7 && <div className="w-3 h-px bg-slate-200" />}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[rgba(17,24,39,0.08)] px-3 py-1.5 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5EA8] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5EA8]">
              {timeRemainingText}
            </span>
          </div>
        </div>
      </header>

      {/* ─── MAIN PLATFORM GRID ───────────────────────────── */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Steps Form (2/3 width) */}
        <section className="lg:col-span-2 space-y-8">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: OWNER INFORMATION & HERO */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Visual Premium Hero Header */}
                <div className="bg-white p-8 rounded-[24px] border border-[rgba(17,24,39,0.08)] relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#6C47FF]/5 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#FF5EA8]/5 rounded-full blur-2xl" />
                  
                  <div className="relative z-10 space-y-4">
                    <span className="inline-block bg-indigo-50 border border-indigo-100 text-[#6C47FF] text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                      Network Launch Wizard
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                      Turn Your LED Screen <br />
                      <span className="text-[#6C47FF]">Into A Revenue Engine</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm max-w-lg leading-relaxed">
                      Join India's fastest-growing DOOH network and earn consistent recurring revenue from national brands. Fill in your details below to get started.
                    </p>

                    {/* Dashboard metrics preview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 mt-6">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Average Monthly Pot.</span>
                        <span className="text-lg font-black text-[#6C47FF]">₹1.8L - ₹4.5L</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Campaign Demand</span>
                        <span className="text-lg font-black text-[#FF5EA8]">Ultra High</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Active Screens</span>
                        <span className="text-lg font-black text-slate-800">5,400+</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Location Reach</span>
                        <span className="text-lg font-black text-emerald-600">8.5M+ Daily</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                <div className="bg-white p-8 rounded-[24px] border border-[rgba(17,24,39,0.08)] shadow-sm space-y-6">
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight mb-1">Owner Information</h3>
                    <p className="text-xs text-slate-400 font-medium">Please specify the legal credentials of the screen owner or manager.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Full Name */}
                    <div className="relative">
                      <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1">Full Name *</label>
                      <div className="relative">
                        <input 
                          required
                          type="text" 
                          name="fullName"
                          value={formData.fullName} 
                          onChange={handleInputChange} 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 focus:border-[#6C47FF] focus:bg-white rounded-xl text-xs font-semibold outline-none transition-all pr-10" 
                          placeholder="e.g. Sharmila Konapala"
                        />
                        {isValid('fullName') && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00E676]">
                            <CheckCircle2 size={15} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1">Phone Number *</label>
                      <div className="relative">
                        <input 
                          required
                          type="tel" 
                          name="phoneNumber"
                          value={formData.phoneNumber} 
                          onChange={handleInputChange} 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 focus:border-[#6C47FF] focus:bg-white rounded-xl text-xs font-semibold outline-none transition-all pr-10" 
                          placeholder="e.g. +91 98765 43210"
                        />
                        {isValid('phoneNumber') && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00E676]">
                            <CheckCircle2 size={15} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1">Email Address *</label>
                      <div className="relative">
                        <input 
                          required
                          type="email" 
                          name="email"
                          value={formData.email} 
                          onChange={handleInputChange} 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 focus:border-[#6C47FF] focus:bg-white rounded-xl text-xs font-semibold outline-none transition-all pr-10" 
                          placeholder="e.g. sharmila@jaan.com"
                        />
                        {isValid('email') && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00E676]">
                            <CheckCircle2 size={15} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Company */}
                    <div>
                      <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1">Company Name (Optional)</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          name="companyName"
                          value={formData.companyName} 
                          onChange={handleInputChange} 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 focus:border-[#6C47FF] focus:bg-white rounded-xl text-xs font-semibold outline-none transition-all pr-10" 
                          placeholder="e.g. Media Ventures Ltd."
                        />
                        {isValid('companyName') && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00E676]">
                            <CheckCircle2 size={15} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* GST */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1">GST Registration Number (Optional)</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          name="gstNumber"
                          value={formData.gstNumber} 
                          onChange={handleInputChange} 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 focus:border-[#6C47FF] focus:bg-white rounded-xl text-xs font-semibold outline-none transition-all" 
                          placeholder="e.g. 37AAAAA0000A1Z5"
                        />
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: LOCATION INFORMATION */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white p-8 rounded-[24px] border border-[rgba(17,24,39,0.08)] shadow-sm space-y-6"
              >
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight mb-1">Location Settings</h3>
                  <p className="text-xs text-slate-450 font-medium">Use visual search suggestions to auto-detect location details and drop coordinates pin.</p>
                </div>

                {/* Location Search Simulation */}
                <div className="space-y-2 relative">
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1">Search & Drop Pin *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Type corridor or landmark name (e.g. Benz Circle)..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full px-4 py-3 bg-[#FAF7F2] border border-slate-200 focus:border-[#6C47FF] rounded-xl text-xs font-semibold outline-none transition-all"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => { setSearchQuery(''); setShowSuggestions(true); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Dropdown Suggestions */}
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[rgba(17,24,39,0.08)] rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                      <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest px-2.5 py-1">Quick Presets</span>
                      {SUGGESTED_LOCATIONS.filter(item => 
                        !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map(item => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => selectPresetLocation(item)}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-indigo-50/50 flex flex-col transition-all group"
                        >
                          <span className="text-xs font-black text-slate-800 group-hover:text-[#6C47FF]">{item.name}</span>
                          <span className="text-[9px] text-slate-450 font-bold truncate mt-0.5">{item.address}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Simulated Interactive Map Block */}
                <div className="relative h-48 w-full bg-slate-100 rounded-2xl overflow-hidden border border-[rgba(17,24,39,0.08)] flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-slate-100 to-pink-50/30 bg-[size:16px_16px] bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)]" />
                  
                  {selectedMapPin ? (
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative z-10 flex flex-col items-center gap-1.5"
                    >
                      <MapPin size={36} className="text-[#FF5EA8] filter drop-shadow-[0_4px_6px_rgba(255,94,168,0.3)]" />
                      <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-center shadow-md">
                        <p className="text-[10px] font-black text-slate-800 leading-none">{formData.city || 'Dropped Pin'}</p>
                        <p className="text-[8px] font-medium text-slate-400 mt-1">Lat: {formData.latitude} | Lng: {formData.longitude}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center z-10 px-6 max-w-xs">
                      <Compass size={28} className="text-[#6C47FF] mx-auto mb-2.5 animate-bounce" />
                      <p className="text-[10px] font-black text-slate-600">Select a suggested corridor or type to drop map pin marker.</p>
                    </div>
                  )}
                </div>

                {/* Autofilled Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1">State *</label>
                    <input required type="text" name="state" value={formData.state} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-[#6C47FF]" placeholder="State" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1">City *</label>
                    <input required type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-[#6C47FF]" placeholder="City" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1">Full Address *</label>
                    <textarea required name="fullAddress" value={formData.fullAddress} onChange={handleInputChange} rows={2} className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold outline-none resize-none focus:bg-white focus:border-[#6C47FF]" placeholder="Full address" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1">Landmark</label>
                    <input type="text" name="landmark" value={formData.landmark} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-[#6C47FF]" placeholder="e.g. Near bus terminal" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1">Coordinates (Lat, Lng) *</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input required type="text" name="latitude" value={formData.latitude} onChange={handleInputChange} className="w-full px-3 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-[#6C47FF]" placeholder="Lat" />
                      <input required type="text" name="longitude" value={formData.longitude} onChange={handleInputChange} className="w-full px-3 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-[#6C47FF]" placeholder="Lng" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: SCREEN DETAILS & SPECIFICATIONS */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white p-8 rounded-[24px] border border-[rgba(17,24,39,0.08)] shadow-sm space-y-8"
              >
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight mb-1">LED Technical Specifications</h3>
                  <p className="text-xs text-slate-450 font-medium">Select screen build properties and custom mounting attributes.</p>
                </div>

                {/* Screen Mount and Structure Visual Selection Grid */}
                <div className="space-y-4">
                  <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">Mounting Style</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { type: 'Pole', label: 'LED Pole', desc: 'Installed on street-poles' },
                      { type: 'Wall Mount', label: 'Wall Mount', desc: 'Facade displays' },
                      { type: 'Rooftop', label: 'Rooftop Board', desc: 'High-elevation banners' },
                      { type: 'Gantry', label: 'Gantry Overhead', desc: 'Overhead highway view' }
                    ].map(item => {
                      const active = formData.mountType === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, mountType: item.type }))}
                          className={`p-3.5 rounded-xl border text-left flex flex-col gap-1.5 transition-all outline-none ${
                            active 
                              ? 'bg-indigo-50/20 border-[#6C47FF] shadow-sm ring-2 ring-[#6C47FF]/10' 
                              : 'bg-white border-slate-200/85 hover:border-slate-350'
                          }`}
                        >
                          <span className={`text-[10px] font-black uppercase ${active ? 'text-[#6C47FF]' : 'text-slate-800'}`}>
                            {item.label}
                          </span>
                          <span className="text-[9px] text-slate-450 leading-tight font-medium">
                            {item.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Screen Type & Side Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">Display Sides</span>
                    <div className="grid grid-cols-3 gap-2 bg-[#FAF7F2] p-1 rounded-xl border border-[rgba(17,24,39,0.08)]">
                      {['Single Side', 'Double Side', 'Three Side'].map(item => {
                        const active = formData.sideType === item;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, sideType: item }))}
                            className={`py-2 px-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                              active ? 'bg-[#6C47FF] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {item.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">Environment</span>
                    <div className="grid grid-cols-2 gap-2 bg-[#FAF7F2] p-1 rounded-xl border border-[rgba(17,24,39,0.08)]">
                      {['Outdoor', 'Indoor'].map(item => {
                        const active = formData.environment === item;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, environment: item }))}
                            className={`py-2 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                              active ? 'bg-[#6C47FF] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Dimension Picker & Live illustrated Aspect Box */}
                <div className="border border-[rgba(17,24,39,0.08)] bg-[#FAF7F2] p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
                  
                  {/* Left size controls */}
                  <div className="flex-1 space-y-4 w-full">
                    <span className="block text-[10px] font-black text-slate-450 uppercase tracking-widest leading-none">Size Settings</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Width (Feet)</label>
                        <input 
                          type="number" 
                          name="width"
                          value={formData.width} 
                          onChange={handleInputChange} 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none focus:border-[#6C47FF]" 
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Height (Feet)</label>
                        <input 
                          type="number" 
                          name="height"
                          value={formData.height} 
                          onChange={handleInputChange} 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none focus:border-[#6C47FF]" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Resolution</label>
                        <select 
                          name="resolution" 
                          value={formData.resolution} 
                          onChange={handleInputChange}
                          className="w-full px-2.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                        >
                          <option>1920x1080 (16:9)</option>
                          <option>1280x720 (16:9)</option>
                          <option>1024x768 (4:3)</option>
                          <option>3840x2160 (4K)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Pixel Pitch</label>
                        <select 
                          name="pixelPitch" 
                          value={formData.pixelPitch} 
                          onChange={handleInputChange}
                          className="w-full px-2.5 py-2.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none"
                        >
                          <option>P3 (Premium Ultra)</option>
                          <option>P4 (Premium Standard)</option>
                          <option>P6 (High-Res Outdoor)</option>
                          <option>P10 (Standard Outdoor)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Total Screens *</label>
                        <input 
                          type="number"
                          name="totalScreens"
                          value={formData.totalScreens}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black outline-none focus:border-[#6C47FF]" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visual Illustration of Screen aspect ratio */}
                  <div className="w-48 h-36 bg-slate-900/90 rounded-2xl flex flex-col items-center justify-between p-3 relative overflow-hidden border border-slate-800 text-center shadow-inner">
                    <span className="text-[7px] text-[#6C47FF] font-black tracking-widest uppercase">Aspect Ratio Mockup</span>
                    
                    {/* Illustrated box container matching inputs */}
                    <div 
                      className="bg-gradient-to-tr from-[#6C47FF] via-[#8A6EFF] to-[#FF5EA8] rounded border border-white/20 shadow-md flex items-center justify-center p-1"
                      style={{ 
                        width: `${Math.min(140, Math.max(60, (parseFloat(formData.width) || 20) * 5))}px`,
                        height: `${Math.min(90, Math.max(30, (parseFloat(formData.height) || 10) * 5))}px`,
                        transition: 'all 0.3s ease-out'
                      }}
                    >
                      <span className="text-white text-[9px] font-black font-mono">
                        {formData.width}' x {formData.height}'
                      </span>
                    </div>

                    <span className="text-[8px] text-slate-400 font-bold tracking-tight">
                      Pitch: {formData.pixelPitch} | Res: {formData.resolution.split(' ')[0]}
                    </span>
                  </div>

                </div>
              </motion.div>
            )}

            {/* STEP 4: TRAFFIC & VISIBILITY AUDIENCE */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white p-8 rounded-[24px] border border-[rgba(17,24,39,0.08)] shadow-sm space-y-8"
              >
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight mb-1">Traffic & Visibility Characteristics</h3>
                  <p className="text-xs text-slate-450 font-medium">Categorize the traffic flow, surrounding zones, and visibility of your installation site.</p>
                </div>

                {/* Zone Type Selection cards */}
                <div className="space-y-4">
                  <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">Area / Zone Profile</span>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { code: 'Highway', label: 'Highway Roadway', desc: 'Fast intercity transit' },
                      { code: 'IT Hub', label: 'Corporate IT Hub', desc: 'Premium working class' },
                      { code: 'Business District', label: 'Business District', desc: 'Dense commercial zones' },
                      { code: 'Shopping Zone', label: 'Shopping Hub', desc: 'High retail shopper footfall' },
                      { code: 'Airport Route', label: 'Airport Connector', desc: 'High-income commuters' },
                      { code: 'Residential Area', label: 'Residential Suburbs', desc: 'Local neighborhood flow' }
                    ].map(item => {
                      const active = formData.roadType === item.code;
                      return (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, roadType: item.code }))}
                          className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 transition-all outline-none ${
                            active 
                              ? 'bg-indigo-50/20 border-[#6C47FF] shadow-sm ring-2 ring-[#6C47FF]/10' 
                              : 'bg-white border-slate-200/85 hover:border-slate-350'
                          }`}
                        >
                          <span className={`text-[10px] font-black uppercase leading-tight ${active ? 'text-[#6C47FF]' : 'text-slate-800'}`}>
                            {item.label}
                          </span>
                          <span className="text-[9.5px] text-slate-400 leading-tight font-medium">
                            {item.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sliders for visibility and traffic values */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Traffic Category Selector */}
                  <div className="space-y-3">
                    <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">Daily Traffic Flow</span>
                    <div className="grid grid-cols-2 gap-2 bg-[#FAF7F2] p-1.5 rounded-2xl border border-[rgba(17,24,39,0.08)]">
                      {[
                        { val: '20,000 - 50,000', label: 'Moderate Flow' },
                        { val: '50,000 - 100,000', label: 'Dense Flow' },
                        { val: '100,000 - 150,000', label: 'Very Heavy Flow' },
                        { val: '150,000+', label: 'Extreme Flow' }
                      ].map(item => {
                        const active = formData.dailyTraffic === item.val;
                        return (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, dailyTraffic: item.val }))}
                            className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
                              active ? 'bg-white border-slate-200 shadow-sm ring-1 ring-[#6C47FF]/10' : 'bg-transparent border-transparent'
                            }`}
                          >
                            <span className="text-[10px] font-black text-slate-800">{item.label}</span>
                            <span className="text-[8px] text-slate-400 font-bold mt-0.5">{item.val}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Visibility range */}
                  <div className="space-y-3">
                    <span className="block text-[10px] font-black text-slate-450 uppercase tracking-wider">Clear Visibility Range</span>
                    <div className="grid grid-cols-2 gap-2 bg-[#FAF7F2] p-1.5 rounded-2xl border border-[rgba(17,24,39,0.08)]">
                      {[
                        { val: '50m', label: 'Short View (<50m)' },
                        { val: '100m', label: 'Standard View (100m)' },
                        { val: '200m', label: 'Long View (200m)' },
                        { val: '300m+', label: 'Extreme View (>300m)' }
                      ].map(item => {
                        const active = formData.visibilityDistance === item.val;
                        return (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, visibilityDistance: item.val }))}
                            className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
                              active ? 'bg-white border-slate-200 shadow-sm ring-1 ring-[#FF5EA8]/10' : 'bg-transparent border-transparent'
                            }`}
                          >
                            <span className="text-[10px] font-black text-slate-800">{item.label}</span>
                            <span className="text-[8px] text-slate-400 font-bold mt-0.5">{item.val}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Additional orientation settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1">Facing Direction</label>
                    <input 
                      type="text" 
                      name="facingDirection"
                      value={formData.facingDirection} 
                      onChange={handleInputChange} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-[#6C47FF]" 
                      placeholder="e.g. Facing towards traffic coming from Auto Nagar"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1">Operating Hours</label>
                    <input 
                      type="text" 
                      name="operatingHours"
                      value={formData.operatingHours} 
                      onChange={handleInputChange} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-[#6C47FF]" 
                      placeholder="e.g. 18 Hours (6 AM - 12 PM)"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: TECHNICAL INFRASTRUCTURE */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white p-8 rounded-[24px] border border-[rgba(17,24,39,0.08)] shadow-sm space-y-8"
              >
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight mb-1">Technical Infrastructure</h3>
                  <p className="text-xs text-slate-450 font-medium">Verify your screen connectivity and technical fail-safes. Standalone apps require remote synchronization.</p>
                </div>

                {/* Yes/No toggle cards with descriptions & icons */}
                <div className="space-y-6">
                  
                  {/* Internet Availability */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#6C47FF] shrink-0">
                        <Globe2 size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase">Active Broadband Internet</h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Required for real-time campaign schedules and program delivery.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {['Yes', 'No'].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, internetAvailable: v }))}
                          className={`w-16 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                            formData.internetAvailable === v 
                              ? 'bg-[#6C47FF] text-white shadow-sm' 
                              : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Remote Access support */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-[#FF5EA8] shrink-0">
                        <Zap size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase">Remote Controller Accessibility</h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Supports automated scheduling and real-time remote diagnostics.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {['Yes', 'No'].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, remoteAccess: v }))}
                          className={`w-16 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                            formData.remoteAccess === v 
                              ? 'bg-[#FF5EA8] text-white shadow-sm' 
                              : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Power Backup backup */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#00E676] shrink-0">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 uppercase">Auxiliary Power Backup (SLA)</h4>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Generator support to guarantee 99.9% uptime compliance.</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {['Yes', 'No'].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, powerBackup: v }))}
                          className={`w-16 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                            formData.powerBackup === v 
                              ? 'bg-[#00E676] text-white shadow-sm' 
                              : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider mb-1">LED Control System Brand</label>
                  <input 
                    type="text" 
                    name="controlSystem"
                    value={formData.controlSystem} 
                    onChange={handleInputChange} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-[#6C47FF]" 
                    placeholder="e.g. Novastar TB60 / Colorlight"
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 6: UPLOAD PHOTOS & AI ANALYSIS */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white p-8 rounded-[24px] border border-[rgba(17,24,39,0.08)] shadow-sm space-y-8"
              >
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight mb-1">Upload Media & Telemetry</h3>
                  <p className="text-xs text-slate-450 font-medium">Provide high-resolution photos of your screen site to calculate quality scores.</p>
                </div>

                {/* Airbnb uploader grid slots */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { id: 'screenClose', label: 'Screen Close-up *', desc: 'Displays panel quality' },
                    { id: 'roadView', label: 'Road/Traffic View *', desc: 'Displays viewing angle' },
                    { id: 'locationLong', label: 'Location Long-shot *', desc: 'Displays surrounding context' },
                    { id: 'controlRoom', label: 'Control Room *', desc: 'Displays receiver cards' },
                    { id: 'droneAngle', label: 'Drone View (Optional)', desc: 'High aerial shot' },
                    { id: 'nightShot', label: 'Night Shot (Optional)', desc: 'Displays luminance' }
                  ].map(slot => {
                    const loaded = !!uploadedPhotos[slot.id];
                    const analyzing = !!isAnalyzing[slot.id];
                    const result = analysisResult[slot.id];

                    return (
                      <div 
                        key={slot.id} 
                        className={`h-40 rounded-2xl border relative flex flex-col justify-between p-3.5 overflow-hidden transition-all bg-slate-50/60 ${
                          loaded ? 'border-slate-200 shadow-sm' : 'border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-100/50'
                        }`}
                      >
                        {/* File upload hidden triggers */}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(slot.id, e)}
                          id={`input-file-${slot.id}`}
                          className="hidden"
                        />

                        {loaded ? (
                          <>
                            {/* Visual Preview */}
                            <div className="absolute inset-0 z-0">
                              <img src={uploadedPhotos[slot.id].preview} alt={slot.label} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-transparent" />
                            </div>

                            {/* Close cross */}
                            <button
                              type="button"
                              onClick={() => removePhoto(slot.id)}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center z-20"
                            >
                              &times;
                            </button>

                            {/* Scan Line effect if active */}
                            {analyzing && (
                              <div className="absolute inset-x-0 h-1 bg-[#00E676]/80 shadow-[0_0_10px_#00E676] z-10 ai-scanner-line" />
                            )}

                            {/* Text labels overlay */}
                            <div className="relative z-10 mt-auto text-left">
                              <span className="text-[8px] font-black text-white uppercase tracking-wider leading-none block">{slot.label}</span>
                              <span className="text-[7.5px] text-[#00E676] font-bold block mt-1 uppercase tracking-wider">
                                {analyzing ? 'AI Scanning...' : result ? `Verified: Score ${result.score}%` : 'Uploaded'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <label
                            htmlFor={`input-file-${slot.id}`}
                            className="w-full h-full flex flex-col justify-between text-left cursor-pointer z-10"
                          >
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                              <Upload size={14} />
                            </div>
                            <div>
                              <span className="text-[9.5px] font-black text-slate-800 uppercase block leading-none">{slot.label}</span>
                              <span className="text-[8.5px] text-slate-400 font-medium leading-tight block mt-1">{slot.desc}</span>
                            </div>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* AI generated insights aggregate */}
                {Object.keys(uploadedPhotos).length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 border border-slate-800"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Cpu size={16} className="text-[#00E676]" />
                        <span className="text-xs font-black uppercase tracking-wider">Simulated AI Quality Analyzer</span>
                      </div>
                      <span className="text-[9px] font-black uppercase text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded">
                        Active Telemetry
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Location Quality</span>
                        <span className="text-base font-black text-[#00E676] mt-1 block">A+ Premium</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Visibility Score</span>
                        <span className="text-base font-black text-white mt-1 block">94% Optimal</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Partner Eligibility</span>
                        <span className="text-base font-black text-[#FF5EA8] mt-1 block">Instant Approval</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Traffic Potential</span>
                        <span className="text-base font-black text-white mt-1 block">Extreme</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 7: REVIEW SUMMARY & SUBMIT */}
            {step === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Visual Aggregation review lists */}
                <div className="bg-white p-8 rounded-[24px] border border-[rgba(17,24,39,0.08)] shadow-sm space-y-6 text-left">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight leading-none">Review & Submit Profile</h3>
                      <p className="text-xs text-slate-400 font-medium mt-1">Check summarized values before onboarding submission.</p>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded bg-indigo-50 border border-indigo-100 text-[#6C47FF] uppercase tracking-widest">
                      Final Phase
                    </span>
                  </div>

                  {errorMsg && (
                    <div className="p-4 bg-rose-50 border border-rose-250 text-rose-700 text-xs font-semibold rounded-xl">
                      {errorMsg}
                    </div>
                  )}

                  <div className="space-y-4">
                    
                    {/* Category 1: Owner */}
                    <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/30 flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Owner Contact Details</span>
                        <p className="text-xs font-black text-slate-800 leading-normal">{formData.fullName || '—'}</p>
                        <p className="text-[10px] font-medium text-slate-500">{formData.email || '—'} | {formData.phoneNumber || '—'}</p>
                      </div>
                      <button onClick={() => setStep(1)} className="text-[10px] font-black text-[#6C47FF] hover:underline uppercase tracking-wider">
                        Edit
                      </button>
                    </div>

                    {/* Category 2: Location */}
                    <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/30 flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Geographic Placement</span>
                        <p className="text-xs font-black text-slate-800 leading-normal truncate max-w-sm">{formData.fullAddress || '—'}</p>
                        <p className="text-[10px] font-medium text-slate-500">{formData.city || '—'}, {formData.state || '—'} | Lat: {formData.latitude || '—'}</p>
                      </div>
                      <button onClick={() => setStep(2)} className="text-[10px] font-black text-[#6C47FF] hover:underline uppercase tracking-wider">
                        Edit
                      </button>
                    </div>

                    {/* Category 3: Screen */}
                    <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/30 flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Display Profile Spec</span>
                        <p className="text-xs font-black text-slate-800 leading-normal">{formData.mountType} Mount | {formData.sideType} ({formData.width}'x{formData.height}')</p>
                        <p className="text-[10px] font-medium text-slate-500">Res: {formData.resolution} | Pitch: {formData.pixelPitch} ({formData.environment})</p>
                      </div>
                      <button onClick={() => setStep(3)} className="text-[10px] font-black text-[#6C47FF] hover:underline uppercase tracking-wider">
                        Edit
                      </button>
                    </div>

                    {/* Category 4: Traffic */}
                    <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/30 flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Audience Profile & Traffic</span>
                        <p className="text-xs font-black text-slate-800 leading-normal">{formData.roadType} Zone | ~{formData.dailyTraffic} Flow</p>
                        <p className="text-[10px] font-medium text-slate-500">Visibility Range: {formData.visibilityDistance} | Orientation: {formData.facingDirection}</p>
                      </div>
                      <button onClick={() => setStep(4)} className="text-[10px] font-black text-[#6C47FF] hover:underline uppercase tracking-wider">
                        Edit
                      </button>
                    </div>

                  </div>

                  <form onSubmit={handleSubmit} className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full md:w-auto px-8 py-3.5 bg-[#6C47FF] hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-100"
                    >
                      {isSubmitting ? 'Submitting Registration...' : 'Complete & Onboard LED'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* LOWER STEPS CONTROLS ACTION FOOTER */}
          {step < 7 && (
            <div className="flex justify-between items-center pt-2">
              {step > 1 ? (
                <button
                  onClick={() => setStep(prev => prev - 1)}
                  className="px-5 py-3 bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold uppercase text-[10px] tracking-wider rounded-xl flex items-center gap-1.5 transition-all outline-none"
                >
                  <ChevronLeft size={14} /> Back
                </button>
              ) : (
                <div />
              )}
              
              <button
                onClick={() => setStep(prev => prev + 1)}
                className="px-6 py-3.5 bg-[#6C47FF] hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-wider rounded-xl flex items-center gap-1.5 transition-all outline-none shadow-md shadow-indigo-50 hover:translate-x-0.5"
              >
                Continue <ChevronRight size={14} />
              </button>
            </div>
          )}

        </section>

        {/* RIGHT COLUMN: Floating Estimator & Completeness Score (1/3 width) */}
        <aside className="sticky top-24 space-y-6">
          
          {/* Completeness Card */}
          <div className="bg-white p-6 rounded-[24px] border border-[rgba(17,24,39,0.08)] shadow-[0_8px_30px_rgba(0,0,0,0.015)] space-y-4">
            
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Activity size={15} className="text-[#6C47FF]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Onboarding Metric</span>
            </div>

            {/* Completion Percentage bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                <span>Completed</span>
                <span className="text-[#6C47FF]">{calculatedMetrics.completionRate}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#6C47FF] to-[#8A6EFF] rounded-full transition-all duration-500" 
                  style={{ width: `${calculatedMetrics.completionRate}%` }} 
                />
              </div>
            </div>

            {/* Network Rating */}
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-450">Network Trust Rating:</span>
              <div className="flex items-center gap-1">
                <span className="text-amber-500">★</span>
                <span className="font-extrabold text-slate-850">4.9/5.0</span>
              </div>
            </div>
          </div>

          {/* Sticky Calculator card */}
          <div className="bg-white p-6 rounded-[24px] border border-[rgba(17,24,39,0.08)] shadow-[0_10px_35px_rgba(0,0,0,0.02)] relative overflow-hidden space-y-5">
            {/* Surcharge accent ribbon */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF5EA8]/5 rounded-full blur-2xl" />
            
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#FF5EA8] bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-full inline-block">
                Live Earnings Potential
              </span>
            </div>

            <div className="space-y-4">
              {/* Counter Display */}
              <div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Estimated Monthly Revenue</span>
                <div className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-baseline gap-1">
                  <span>₹{calculatedMetrics.monthlyMin.toLocaleString()}</span>
                  <span className="text-sm font-semibold text-slate-400 font-sans">-</span>
                  <span>₹{calculatedMetrics.monthlyMax.toLocaleString()}</span>
                </div>
                <span className="text-[8px] font-bold text-slate-400 block mt-1">Calculated based on size, location type & traffic.</span>
              </div>

              {/* Dynamic Badges Grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Visibility Score</span>
                  <span className="text-sm font-black text-[#6C47FF] mt-0.5 block">{calculatedMetrics.visibilityScore}/100</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Partner Tier</span>
                  <span className="text-sm font-black text-slate-800 mt-0.5 block uppercase tracking-tight text-[11px]">{calculatedMetrics.tier}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 col-span-2 flex justify-between items-center">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Campaign Demand</span>
                    <span className="text-xs font-black text-emerald-600 mt-0.5 block">{calculatedMetrics.demand} Demand</span>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>

            </div>

            {/* Quick tips panel */}
            <div className="p-3 bg-indigo-50/30 rounded-xl flex gap-2.5 text-[9px] text-slate-500 font-bold leading-normal">
              <Info size={12} className="text-[#6C47FF] shrink-0 mt-0.5" />
              <p>Tips: Add detailed photos and toggle active power backup backup to automatically qualify for premium Gold and Platinum campaign tier earnings.</p>
            </div>

          </div>

        </aside>

      </main>

    </div>
  );
};

export default App;
