import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, Calendar as CalendarIcon, MapPin, CheckCircle, File as FileIcon, Clock, CreditCard, Zap, X, AlertTriangle, Star, RefreshCw, Monitor, Maximize2, Gift } from 'lucide-react';
import PremiumCalendar from '../components/PremiumCalendar';
import { motion, AnimatePresence } from 'framer-motion';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { uploadVideo, createCampaignBooking, getScreens } from '../services/campaignService';
import { useCorridorPricing } from '../hooks/useCorridorPricing';
import { useAuth } from '../AuthContext';
import API from '../services/api';

// Predefined route options for the route-centric flow
const ROUTES = [
  {
    id: 'vijayawada',
    name: 'Ethree Food Court Screens Corridor',
    from: 'Ethree Entry',
    to: 'Ethree Exit',
    dirAName: 'Ethree Entry ➔ Ethree Exit',
    dirBName: 'Ethree Exit ➔ Ethree Entry',
    dailyAudience: '95,000+',
    vehicleCount: '42,000',
    peakHours: '08:00 AM - 12:00 PM, 05:00 PM - 09:00 PM',
    description: 'High-density commercial food court traffic comprising diners and shoppers.',
    path: 'M 40,160 C 120,160 180,40 260,40 C 340,40 400,160 480,160',
    markers: [
      { id: '1', label: 'Pole 1', x: 70, y: 150 },
      /*
      { id: '2', label: 'Pole 2', x: 120, y: 130 },
      { id: '3', label: 'Pole 3', x: 170, y: 95 },
      { id: '4', label: 'Pole 4', x: 220, y: 65 },
      { id: '5', label: 'Pole 5', x: 270, y: 40 },
      { id: '6', label: 'Pole 6', x: 320, y: 50 },
      { id: '7', label: 'Pole 7', x: 370, y: 85 },
      { id: '8', label: 'Pole 8', x: 420, y: 125 },
      { id: '9', label: 'Pole 9', x: 470, y: 150 },
      */
    ],
  },
  /*
  {
    id: 'hyderabad',
    name: 'Hyderabad Airport Express Corridor',
    from: 'RGIA Airport',
    to: 'Hitech City',
    dirAName: 'RGIA Airport ➔ Hitech City',
    dirBName: 'Hitech City ➔ RGIA Airport',
    dailyAudience: '120,000+',
    vehicleCount: '65,000',
    peakHours: '07:00 AM - 10:30 AM, 06:00 PM - 10:00 PM',
    description: 'Premium business travelers, IT professionals, and airport commuters.',
    path: 'M 460,160 C 350,160 250,50 150,50 C 90,50 60,110 40,120',
    markers: [
      { id: '1', label: 'Pole 1', x: 410, y: 150 },
      { id: '2', label: 'Pole 2', x: 330, y: 120 },
      { id: '3', label: 'Pole 3', x: 250, y: 75 },
      { id: '4', label: 'Pole 4', x: 170, y: 50 },
      { id: '5', label: 'Pole 5', x: 100, y: 65 },
    ],
  },
  {
    id: 'vizag',
    name: 'Vizag Beach Road Scenic Corridor',
    from: 'RK Beach',
    to: 'NAD Junction',
    dirAName: 'RK Beach ➔ NAD Junction',
    dirBName: 'NAD Junction ➔ RK Beach',
    dailyAudience: '80,000+',
    vehicleCount: '35,000',
    peakHours: '04:30 PM - 09:30 PM',
    description: 'Leisure crowds, tourists, and residential commuters.',
    path: 'M 40,40 C 150,60 200,150 320,150 C 420,150 450,80 480,60',
    markers: [
      { id: '6', label: 'Pole 6', x: 100, y: 50 },
      { id: '7', label: 'Pole 7', x: 180, y: 105 },
      { id: '8', label: 'Pole 8', x: 260, y: 150 },
      { id: '9', label: 'Pole 9', x: 380, y: 130 },
    ],
  }
  */
];

const LaunchCampaign = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Primary Wizard States
  const [selectedRoute, setSelectedRoute] = useState<string>(() => {
    return localStorage.getItem('campaign_selectedRoute') || 'vijayawada';
  });
  const [selectedDirection, setSelectedDirection] = useState<string>(() => {
    return localStorage.getItem('campaign_selectedDirection') || 'A';
  });
  const [hasWatermark, setHasWatermark] = useState<boolean>(() => {
    const saved = localStorage.getItem('campaign_hasWatermark');
    return saved !== null ? saved === 'true' : true;
  });

  const [selectedFormat, setSelectedFormat] = useState<'65-inch' | '75-inch'>('65-inch');

  // Parse URL search parameters on load
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const routeParam = searchParams.get('route');
    const dirParam = searchParams.get('direction');
    const watermarkParam = searchParams.get('watermark');
    const formatParam = searchParams.get('format');
    if (routeParam) setSelectedRoute(routeParam);
    if (dirParam) setSelectedDirection(dirParam);
    if (watermarkParam === 'false') setHasWatermark(false);
    else if (watermarkParam === 'true') setHasWatermark(true);
    if (formatParam === '65-inch') {
      setSelectedFormat(formatParam);
    }
  }, [location.search]);
  const coverageLevel = 'single_screen';
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastBookingInfo, setLastBookingInfo] = useState<any>(null);
  
  // Timing / Schedule States
  const [startDate, setStartDate] = useState<string>(() => {
    return localStorage.getItem('campaign_startDate') || '';
  });
  const [tempStartDate, setTempStartDate] = useState<string>(() => {
    return localStorage.getItem('campaign_tempStartDate') || '';
  });
  const [startTime, setStartTime] = useState<string>(() => {
    return localStorage.getItem('campaign_startTime') || '08:00';
  });
  const [endTime, setEndTime] = useState<string>(() => {
    return localStorage.getItem('campaign_endTime') || '12:00';
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [datePreset, setDatePreset] = useState<'today' | 'tomorrow' | 'weekend' | 'next-week' | 'next-month' | 'custom'>(() => {
    return (localStorage.getItem('campaign_datePreset') as any) || 'today';
  });
  const [timePreset, setTimePreset] = useState<'morning' | 'daytime' | 'evening' | 'prime' | 'full' | 'custom'>(() => {
    return (localStorage.getItem('campaign_timePreset') as any) || 'morning';
  });
  const [isInstant, setIsInstant] = useState<boolean>(() => {
    const saved = localStorage.getItem('campaign_isInstant');
    return saved === null ? true : saved === 'true';
  });
  const [campaignDuration, setCampaignDuration] = useState<number>(() => {
    const saved = localStorage.getItem('campaign_campaignDuration');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [durationInputStr, setDurationInputStr] = useState<string>(() => {
    return localStorage.getItem('campaign_durationInputStr') || "10";
  });
  const [repeatCount, setRepeatCount] = useState<number>(() => {
    const saved = localStorage.getItem('campaign_repeatCount');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [instantSlotCount, setInstantSlotCount] = useState<number>(() => {
    const saved = localStorage.getItem('campaign_instantSlotCount');
    return saved ? parseInt(saved, 10) : 2;
  });
  const [repeatTimes, setRepeatTimes] = useState<string[]>(() => ['09:00']);

  const generateDefaultRepeatTimes = useCallback((count: number) => {
    const defaultHours = [9, 12, 15, 18, 20, 21, 22, 10, 11, 13, 14, 16, 17, 19];
    const times: string[] = [];
    for (let i = 0; i < count; i++) {
      const h = defaultHours[i % defaultHours.length];
      times.push(`${String(h).padStart(2, '0')}:00`);
    }
    return times;
  }, []);

  useEffect(() => {
    setRepeatTimes(prev => {
      if (prev.length === repeatCount) return prev;
      const next = [...prev];
      if (next.length < repeatCount) {
        const defaults = generateDefaultRepeatTimes(repeatCount);
        for (let i = next.length; i < repeatCount; i++) {
          next.push(defaults[i] || '12:00');
        }
      } else {
        next.splice(repeatCount);
      }
      return next;
    });
  }, [repeatCount, generateDefaultRepeatTimes]);


  const [bookingDuration, setBookingDuration] = useState<'day' | 'week' | 'month'>(() => {
    return (localStorage.getItem('campaign_bookingDuration') as any) || 'day';
  });
  const [isFullScreenPreviewOpen, setIsFullScreenPreviewOpen] = useState(false);

  const parseYYYYMMDD = (str: string): Date => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const formatYYYYMMDD = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getEndDate = (startStr: string, duration: 'day' | 'week' | 'month'): string => {
    if (!startStr) return '';
    const date = parseYYYYMMDD(startStr);
    if (duration === 'day') {
      return startStr;
    } else if (duration === 'week') {
      const end = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
      return formatYYYYMMDD(end);
    } else if (duration === 'month') {
      const end = new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000);
      return formatYYYYMMDD(end);
    }
    return startStr;
  };

  const getDaysCount = (startStr: string, endStr: string): number => {
    if (!startStr || !endStr) return 1;
    const start = parseYYYYMMDD(startStr);
    const end = parseYYYYMMDD(endStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const endDate = useMemo(() => {
    return getEndDate(startDate, bookingDuration);
  }, [startDate, bookingDuration]);

  const daysCount = useMemo(() => {
    return getDaysCount(startDate, endDate);
  }, [startDate, endDate]);

  // Creative & Watermark States
  const [file, setFile] = useState<File | null>(null);
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10
  });
  const [completedCrop, setCompletedCrop] = useState<any>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [rotation, setRotation] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [mockupTheme, setMockupTheme] = useState<'day' | 'night'>('night');
  const [selectedFilter, setSelectedFilter] = useState<
    | 'none'
    | 'bright'
    | 'superBright'
    | 'vibrant'
    | 'contrast'
    | 'vintage'
    | 'warm'
    | 'cool'
    | 'mono'
    | 'retroGold'
    | 'neonGlow'
    | 'summer'
    | 'cyberpunk'
    | 'cinematic'
    | 'drastic'
    | 'sunwashed'
    | 'softLight'
    | 'gothic'
    | 'dreamy'
    | 'invertedNeon'
  >('none');

  const FILTER_STYLES = {
    none: '',
    bright: 'brightness(1.35) contrast(1.1)',
    superBright: 'brightness(1.55) contrast(1.15) saturate(1.15)',
    vibrant: 'saturate(1.75) contrast(1.15) brightness(1.1)',
    contrast: 'contrast(1.5) brightness(1.1)',
    vintage: 'sepia(0.35) contrast(1.1) brightness(0.95)',
    warm: 'sepia(0.2) saturate(1.4) contrast(1.1) brightness(1.05)',
    cool: 'hue-rotate(200deg) saturate(1.2) brightness(1.05)',
    mono: 'grayscale(1) contrast(1.25) brightness(1.05)',
    retroGold: 'sepia(0.4) saturate(1.6) brightness(1.1) hue-rotate(-10deg)',
    neonGlow: 'saturate(2.0) contrast(1.3) brightness(1.1) hue-rotate(10deg)',
    summer: 'saturate(1.3) brightness(1.15) sepia(0.1)',
    cyberpunk: 'hue-rotate(300deg) saturate(1.8) contrast(1.25) brightness(1.1)',
    cinematic: 'contrast(1.3) brightness(0.9) saturate(1.2) sepia(0.1)',
    drastic: 'contrast(1.7) saturate(0.8) brightness(1.1)',
    sunwashed: 'brightness(1.2) saturate(0.7) contrast(0.9)',
    softLight: 'brightness(1.1) contrast(0.95) saturate(1.05)',
    gothic: 'grayscale(0.3) contrast(1.4) brightness(0.85)',
    dreamy: 'brightness(1.15) contrast(0.9) saturate(1.2) sepia(0.05)',
    invertedNeon: 'invert(0.9) hue-rotate(180deg) saturate(1.5) brightness(1.1)',
  };

  const { user, refreshUser } = useAuth();

  // ── Free Trial Eligibility ───────────────────────────────────────────────────
  const isEligibleForFreeTrial = !user?.hasUsedFreeTrial;
  // ────────────────────────────────────────────────────────────────────────────

  // Backend / Booking States
  const [screens, setScreens] = useState<any[]>([]);
  const [selectedScreenIds, setSelectedScreenIds] = useState<string[]>(() => {
    const savedFormat = localStorage.getItem('campaign_selectedFormat') || '65-inch';
    return savedFormat === '75-inch' ? ['ethree-75'] : ['ethree-65'];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');

  // GST State & Handlers
  const [gstInput, setGstInput] = useState('');
  const [companyDetails, setCompanyDetails] = useState<{
    companyName: string;
    address: string;
    gst: string;
    pan?: string;
    entityType?: string;
    natureOfBusiness?: string;
    pincode?: string;
    departmentCode?: string;
    registrationType?: string;
    registrationDate?: string;
    status?: string;
  } | null>(null);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstError, setGstError] = useState<string | null>(null);

  const handleVerifyGst = async (gstCode: string) => {
    const cleanGst = gstCode.trim().toUpperCase();
    if (!cleanGst) return;
    setGstError(null);
    setGstLoading(true);
    try {
      const res = await API.post('/schedule/validate-gst', { gst: cleanGst });
      setCompanyDetails(res.data);
    } catch (err: any) {
      setCompanyDetails(null);
      setGstError(err.response?.data?.message || 'Invalid GST number');
    } finally {
      setGstLoading(false);
    }
  };

  useEffect(() => {
    if (gstInput.trim().length === 15) {
      handleVerifyGst(gstInput);
    } else {
      setCompanyDetails(null);
      setGstError(null);
    }
  }, [gstInput]);



  // Fetch Pricing details using Corridor pricing hook (always request standard watermark rates to get base)
  const {
    totalAmount: baseTotalAmount,
    discountAmount: couponDiscount,
    couponApplied,
    couponError,
    discountPercent: couponDiscountPercent,
  } = useCorridorPricing(selectedScreenIds, campaignDuration || 10, screens, true, daysCount, appliedCouponCode);

  const formatMultiplier = selectedFormat === '75-inch' ? 1.3 : 1.0;

  const isPackageBooking = bookingDuration === 'week' || bookingDuration === 'month' || daysCount >= 7;

  const packageBaseAmount = useMemo(() => {
    if (bookingDuration === 'week') {
      const weeks = Math.ceil(daysCount / 7);
      return 24999 * weeks * selectedScreenIds.length;
    }
    if (bookingDuration === 'month') {
      const months = Math.ceil(daysCount / 30);
      return 79999 * months * Math.ceil(selectedScreenIds.length / 2);
    }
    if (daysCount >= 7) {
      const weeks = Math.ceil(daysCount / 7);
      return 24999 * weeks * selectedScreenIds.length;
    }
    return null;
  }, [bookingDuration, daysCount, selectedScreenIds.length]);

  const priceWithWatermark = useMemo(() => {
    if (packageBaseAmount !== null) return packageBaseAmount * repeatCount;
    return Math.ceil(baseTotalAmount * formatMultiplier * repeatCount);
  }, [packageBaseAmount, baseTotalAmount, formatMultiplier, repeatCount]);

  const priceWithoutWatermark = useMemo(() => {
    if (packageBaseAmount !== null) return Math.ceil(packageBaseAmount * 1.25 * repeatCount);
    return Math.ceil(baseTotalAmount * 1.25 * formatMultiplier * repeatCount);
  }, [packageBaseAmount, baseTotalAmount, formatMultiplier, repeatCount]);

  // Calculate 10s discount amount (only for daily loop bookings)
  const discountWithWatermark = useMemo(() => {
    if (isPackageBooking) return 0;
    const currentSlotMultiplier = Math.max(1, Math.ceil((campaignDuration || 10) / 5));
    const base10sAmount = Math.ceil((baseTotalAmount / currentSlotMultiplier) * 2);
    return Math.ceil(base10sAmount * formatMultiplier);
  }, [isPackageBooking, campaignDuration, baseTotalAmount, formatMultiplier]);

  const discountWithoutWatermark = useMemo(() => {
    if (isPackageBooking) return 0;
    if (discountWithWatermark === 0) return 0;
    return Math.ceil(discountWithWatermark * 1.25);
  }, [isPackageBooking, discountWithWatermark]);

  const freeEmails = [
    'ceo.stackvil@gmail.com',
    'ceo@stackvil.com',
    'jaykureti@gmail.com',
    'vikasarikathota@gmail.com',
    'guntaputejaswini1@gmail.com',
    'gurrala.varun11@gmail.com',
    'tirumalaganeshd@gmail.com',
    'surandervyas897@gmail.com',
    'mamillapallilakshmimahitha@gmail.com',
    'muthikiavinash214@gmail.com'
  ];
  const isCeo = !!user?.email && freeEmails.includes(user.email.toLowerCase().trim());

  const discountAmount = isCeo ? 999999 : (isEligibleForFreeTrial 
    ? (hasWatermark ? discountWithWatermark : discountWithoutWatermark)
    : 0);

  const originalTotalAmount = isCeo ? 0 : (hasWatermark ? priceWithWatermark : priceWithoutWatermark);
  const preCouponTotal = isCeo ? 0 : (isEligibleForFreeTrial 
    ? Math.max(0, originalTotalAmount - discountAmount)
    : originalTotalAmount);

  const totalAmount = isCeo ? 0 : Math.max(0, preCouponTotal - (couponApplied ? couponDiscount : 0));

  const isUsingFreeTrial = isCeo || totalAmount === 0;

  const finalPriceWithWatermark = isCeo ? 0 : (isEligibleForFreeTrial 
    ? Math.max(0, priceWithWatermark - discountWithWatermark)
    : priceWithWatermark);

  const finalPriceWithoutWatermark = isCeo ? 0 : (isEligibleForFreeTrial 
    ? Math.max(0, priceWithoutWatermark - discountWithoutWatermark)
    : priceWithoutWatermark);

  // Initialize dates and presets
  useEffect(() => {
    const savedStart = localStorage.getItem('campaign_startDate');
    const savedTemp = localStorage.getItem('campaign_tempStartDate');
    if (savedStart) {
      setStartDate(savedStart);
    } else {
      const todayStr = getPresetDate('today');
      setStartDate(todayStr);
    }
    if (savedTemp) {
      setTempStartDate(savedTemp);
    } else {
      const todayStr = getPresetDate('today');
      setTempStartDate(todayStr);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('campaign_selectedRoute', selectedRoute);
  }, [selectedRoute]);

  useEffect(() => {
    localStorage.setItem('campaign_selectedDirection', selectedDirection);
  }, [selectedDirection]);

  useEffect(() => {
    localStorage.setItem('campaign_hasWatermark', String(hasWatermark));
  }, [hasWatermark]);

  useEffect(() => {
    localStorage.setItem('campaign_startDate', startDate);
  }, [startDate]);

  useEffect(() => {
    localStorage.setItem('campaign_tempStartDate', tempStartDate);
  }, [tempStartDate]);

  useEffect(() => {
    localStorage.setItem('campaign_startTime', startTime);
  }, [startTime]);

  useEffect(() => {
    localStorage.setItem('campaign_endTime', endTime);
  }, [endTime]);

  useEffect(() => {
    localStorage.setItem('campaign_datePreset', datePreset);
  }, [datePreset]);

  useEffect(() => {
    localStorage.setItem('campaign_timePreset', timePreset);
  }, [timePreset]);

  useEffect(() => {
    localStorage.setItem('campaign_isInstant', String(isInstant));
  }, [isInstant]);

  useEffect(() => {
    localStorage.setItem('campaign_campaignDuration', String(campaignDuration));
  }, [campaignDuration]);

  useEffect(() => {
    localStorage.setItem('campaign_durationInputStr', durationInputStr);
  }, [durationInputStr]);



  useEffect(() => {
    localStorage.setItem('campaign_bookingDuration', bookingDuration);
  }, [bookingDuration]);

  useEffect(() => {
    localStorage.setItem('campaign_selectedScreenIds', JSON.stringify(selectedScreenIds));
  }, [selectedScreenIds]);



  const getPresetDate = (preset: string) => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (3600000 * 5.5));
    
    if (preset === 'today') {
      return ist.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    } else if (preset === 'tomorrow') {
      const tom = new Date(ist.getTime() + 24 * 60 * 60 * 1000);
      return tom.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    } else if (preset === 'weekend') {
      const day = ist.getDay();
      const diff = (day <= 6) ? (6 - day) : 6;
      const sat = new Date(ist.getTime() + diff * 24 * 60 * 60 * 1000);
      return sat.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    } else if (preset === 'next-week') {
      const day = ist.getDay();
      const diff = (day === 0) ? 1 : (8 - day);
      const mon = new Date(ist.getTime() + diff * 24 * 60 * 60 * 1000);
      return mon.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    }
    return '';
  };

  const handleDatePresetClick = (preset: 'today' | 'tomorrow' | 'weekend' | 'next-week' | 'next-month' | 'custom') => {
    setDatePreset(preset);
    if (preset === 'today') {
      setBookingDuration('day');
      const calculated = getPresetDate('today');
      setStartDate(calculated);
      setTempStartDate(calculated);
    } else if (preset === 'tomorrow') {
      setBookingDuration('day');
      const calculated = getPresetDate('tomorrow');
      setStartDate(calculated);
      setTempStartDate(calculated);
    } else if (preset === 'weekend') {
      setBookingDuration('day');
      const calculated = getPresetDate('weekend');
      setStartDate(calculated);
      setTempStartDate(calculated);
    } else if (preset === 'next-week') {
      setBookingDuration('week');
      setIsCalendarOpen(true);
    } else if (preset === 'next-month') {
      setBookingDuration('month');
      setIsCalendarOpen(true);
    } else if (preset === 'custom') {
      setBookingDuration('day');
      setIsCalendarOpen(true);
    }
  };

  const handleTimePresetClick = (preset: 'morning' | 'daytime' | 'evening' | 'prime' | 'full' | 'custom') => {
    setTimePreset(preset);
    if (preset === 'morning') {
      setStartTime('08:00');
      setEndTime('12:00');
    } else if (preset === 'daytime') {
      setStartTime('12:00');
      setEndTime('16:00');
    } else if (preset === 'evening') {
      setStartTime('16:00');
      setEndTime('20:00');
    } else if (preset === 'prime') {
      setStartTime('20:00');
      setEndTime('23:59');
    } else if (preset === 'full') {
      setStartTime('00:00');
      setEndTime('23:59');
    } else if (preset === 'custom') {
      setStartTime('08:00');
      setEndTime('12:00');
    }
  };
  const getIstTime = () => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 3600000 * 5.5);
  };

  const isTodaySelected = () => {
    const ist = getIstTime();
    const yyyy = ist.getFullYear();
    const mm = String(ist.getMonth() + 1).padStart(2, '0');
    const dd = String(ist.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    return startDate === todayStr;
  };

  const isSlotCompleted = (presetId: string) => {
    if (!isTodaySelected()) return false;
    
    const ist = getIstTime();
    const currentHour = ist.getHours();
    const currentMinute = ist.getMinutes();
    const currentTimeVal = currentHour * 60 + currentMinute;
    
    switch (presetId) {
      case 'morning':
        return currentTimeVal >= 8 * 60; // Past 08:00 AM
      case 'daytime':
        return currentTimeVal >= 12 * 60; // Past 12:00 PM
      case 'evening':
        return currentTimeVal >= 16 * 60; // Past 04:00 PM
      case 'prime':
        return currentTimeVal >= 20 * 60; // Past 08:00 PM
      case 'full':
        return currentTimeVal >= 0; // 24 Hours starts at 00:00 (always disabled on today if day has started)
      default:
        return false;
    }
  };

  // Auto-reset timePreset if the currently selected one becomes completed/disabled
  useEffect(() => {
    if (isTodaySelected()) {
      if (isSlotCompleted(timePreset)) {
        const slots: ('morning' | 'daytime' | 'evening' | 'prime' | 'custom')[] = ['morning', 'daytime', 'evening', 'prime'];
        const activeSlot = slots.find(s => !isSlotCompleted(s)) || 'custom';
        handleTimePresetClick(activeSlot);
      }
    }
  }, [startDate]);

  const mockBillboards = [
    { _id: 'ethree-65', poleId: 'POLE-001', name: 'eThree 5×3 Feet (Pole 1)', side: 'A', location: 'eThree Portal', format: '65-inch' },
    { _id: 'ethree-75', poleId: 'POLE-002', name: 'eThree 5×3 Feet (Pole 2)', side: 'B', location: 'eThree Portal', format: '75-inch' }
  ];

  useEffect(() => {
    const fetchScreens = async () => {
      try {
        const screensData = await getScreens();
        const dataToUse = screensData && screensData.length > 0 ? screensData : mockBillboards;
        setScreens(dataToUse.map((s: any) => ({ ...s, _id: String(s._id) })));
      } catch (err) {
        setScreens(mockBillboards);
      }
    };
    fetchScreens();
  }, []);



  // Preview file setup
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);










  // Time Validation Buffer (30 minutes)
  const getMinTime = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istNow = new Date(utc + (3600000 * 5.5));
    const todayStr = istNow.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

    if (startDate === todayStr) {
      const minDate = new Date(istNow.getTime() + 30 * 60 * 1000);
      return minDate.getHours().toString().padStart(2, '0') + ':' + minDate.getMinutes().toString().padStart(2, '0');
    }
    return undefined;
  };

  const isTimeRangeValid = (() => {
    if (isInstant) return true;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return eh > sh || (eh === sh && em > sm);
  })();

  const isStartTimeValid = (() => {
    if (isInstant) return true;
    const minTime = getMinTime();
    if (!minTime) return true;
    const [sh, sm] = startTime.split(':').map(Number);
    const [mh, mm] = minTime.split(':').map(Number);
    return (sh > mh || (sh === mh && sm >= mm));
  })();

  const isFormComplete = !!file && 
    (isInstant || (!!startDate && isStartTimeValid && isTimeRangeValid)) && 
    campaignDuration > 0;



  useEffect(() => {
    let interval: any;
    if (isInstant) {
      interval = setInterval(() => {
        const now = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 5.5));
        const startStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        setStartTime(startStr);
        setEndTime('23:59'); // Instant playback campaigns run until the end of the operating day
      }, 5000);
    } else {
      const minTime = getMinTime();
      if (minTime) {
        const [sh, sm] = startTime.split(':').map(Number);
        const [mh, mm] = minTime.split(':').map(Number);
        if (sh < mh || (sh === mh && sm < mm)) {
          setStartTime(minTime);
        }
      }
    }
    return () => clearInterval(interval);
  }, [isInstant, startDate, startTime]);



  // Drag and Drop creative handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (uploadedFile: File) => {
    setError('');
    const validTypes = ['video/mp4', 'video/webm', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(uploadedFile.type)) {
      setError('Invalid format. Please upload MP4, WebM, PNG, or JPG.');
      return;
    }
    if (uploadedFile.size > 50 * 1024 * 1024) {
      setError('File is too large. Max size is 50MB.');
      return;
    }
    
    if (uploadedFile.type.startsWith('image/')) {
      setTempFile(uploadedFile);
      const url = URL.createObjectURL(uploadedFile);
      setPreviewUrl(url);
      setShowCropModal(true);
    } else {
      setFile(uploadedFile);
    }
  };

  const getCroppedImg = (image: HTMLImageElement, crop: any, fileName: string): Promise<File> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Scale the canvas to the full natural resolution of the crop, not the tiny screen preview size
    const targetWidth = Math.floor(crop.width * scaleX);
    const targetHeight = Math.floor(crop.height * scaleY);
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        image,
        Math.floor(crop.x * scaleX),
        Math.floor(crop.y * scaleY),
        targetWidth,
        targetHeight,
        0,
        0,
        targetWidth,
        targetHeight
      );
    }

    return new Promise((resolve, reject) => {
      // Use maximum quality (1.0) to prevent compression artifacts
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 1.0);
    });
  };

  const handleCropComplete = async () => {
    if (!imgRef.current || !completedCrop || !completedCrop.width || !completedCrop.height) {
      // If no crop was made, just use the original file
      if (tempFile) setFile(tempFile);
      setShowCropModal(false);
      return;
    }

    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop, tempFile?.name || 'cropped.jpg');
      setFile(croppedFile);
      const url = URL.createObjectURL(croppedFile);
      setPreviewUrl(url);
    } catch (e) {
      console.error('Error cropping image:', e);
      if (tempFile) setFile(tempFile);
    }
    setShowCropModal(false);
  };

  const handleSkipCrop = () => {
    if (tempFile) setFile(tempFile);
    setShowCropModal(false);
  };



  const formatTimeAMPM = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  // Submit payment & booking
  const handleSubmit = async () => {
    if (!file || selectedScreenIds.length === 0) return;
    if (!isInstant && !isStartTimeValid) {
      alert("Selected time is in the past. Please choose a future slot.");
      return;
    }
    if (!isInstant && !isTimeRangeValid) {
      alert("End Time must be strictly after Start Time.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const video = await uploadVideo(file, file.name);

      const res = await createCampaignBooking({
        videoId: video._id,
        screenIds: selectedScreenIds,
        date: startDate,
        endDate,
        startTime,
        endTime,
        isInstant: !!isInstant,
        duration: Math.max(1, Math.ceil(campaignDuration / 60)),
        durationSeconds: campaignDuration,
        repeatCount: repeatCount || 1,
        repeatTimes: repeatCount > 1 ? repeatTimes : undefined,
        slotCount: isInstant ? instantSlotCount : Math.ceil(campaignDuration / 5),
        hasWatermark,
        format: selectedFormat,
        couponCode: appliedCouponCode || undefined,
        gst: gstInput || undefined,
        companyName: companyDetails?.companyName || undefined,
      });

      // Update local auth context to reflect used trial state
      try {
        await refreshUser();
      } catch (err) {
        console.warn('Failed to refresh user profile:', err);
      }

      const keysToClear = [
        'campaign_step',
        'campaign_selectedRoute',
        'campaign_selectedDirection',
        'campaign_hasWatermark',
        'campaign_coverageLevel',
        'campaign_bookingDuration',
        'campaign_selectedScreenIds',
        'campaign_startDate',
        'campaign_tempStartDate',
        'campaign_startTime',
        'campaign_endTime',
        'campaign_datePreset',
        'campaign_timePreset',
        'campaign_isInstant',
        'campaign_campaignDuration',
        'campaign_durationInputStr',
        'campaign_selectedFormat'
      ];
      keysToClear.forEach(key => localStorage.removeItem(key));

      if (res.paymentRequired && res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        // Prepare booking details for WhatsApp sharing
        setLastBookingInfo({
          route: currentRoute.name,
          format: selectedFormat === '75-inch' ? '5×4 Feet' : '4×3 Feet',
          startDate,
          endDate,
          startTime,
          endTime,
          duration: campaignDuration,
          screensCount: selectedScreenIds.length
        });
        setShowSuccessModal(true);
      }
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.code === 'PROFILE_INCOMPLETE') {
        navigate('/complete-profile', { replace: true });
        return;
      }
      setError(err.response?.data?.msg || 'Failed to submit campaign request. Please check file format.');
    } finally {
      setLoading(false);
    }
  };

  const currentRoute = ROUTES.find(r => r.id === selectedRoute) || ROUTES[0];

  // Calculate stats based on active screens selection
  const aggregateReach = selectedScreenIds.length * 85000;
  const estimatedImpressions = selectedScreenIds.length * 28000;

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 text-[#111827] font-sans transition-colors duration-300" style={{ backgroundColor: '#FAF7F2' }}>
      <div className="max-w-7xl mx-auto">
        
        {/* Page Header */}
        <div className="border-b border-slate-200 pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#111827]">Book Route Attention</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Target traffic flow directly. Buy customer impressions along major roads.</p>
          </div>
        </div>

        {/* ── Free Trial Banner ───────────────────────────────────────────────── */}
        {isEligibleForFreeTrial && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mb-8"
          >
            {campaignDuration <= 10 ? (
              /* Active free trial state (Completely free) */
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 p-5 shadow-lg shadow-emerald-200">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Gift size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-black text-base tracking-tight">🎉 FREE Trial Active!</p>
                      <p className="text-emerald-100 text-xs font-medium mt-0.5">
                        Your {campaignDuration}s ad is completely free — no payment needed. Book it now!
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 self-start sm:self-auto">
                    <span className="text-white text-xl font-black">₹0</span>
                    <span className="text-emerald-100 text-xs font-semibold line-through">₹{priceWithWatermark.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* 10s discount applied state for longer ads */
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-[#6C47FF] to-indigo-600 p-5 shadow-lg shadow-indigo-150">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Gift size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-black text-base tracking-tight">🎁 10s Welcome Discount Applied!</p>
                        <span className="bg-indigo-400 text-indigo-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">New User Offer</span>
                      </div>
                      <p className="text-indigo-100 text-xs font-medium mt-0.5">
                        The first 10 seconds of your ad are free — saved ₹{discountAmount.toLocaleString()} from your total.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 self-start sm:self-auto">
                    <span className="text-white text-xl font-black">₹{totalAmount.toLocaleString()}</span>
                    <span className="text-indigo-100 text-xs font-semibold line-through">₹{originalTotalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
        {/* ──────────────────────────────────────────────────────────────────────── */}


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Flow Configurations */}
          <div className="lg:col-span-7 relative bg-transparent space-y-8 flex flex-col">
              
              {/* Selected Location Card */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50/70 flex items-center justify-center text-[#6C47FF] shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Location</p>
                    <p className="text-sm font-extrabold text-slate-800 mt-0.5">Ethree Food Court Screens (Vijayawada)</p>
                  </div>
                </div>
              </div>
              {/* PANEL 1: SELECT DISPLAY SIZE FORMAT */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden">
                <div>
                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Select Display Format</h2>
                  <p className="text-xs text-slate-500 mt-1">Choose between the active display formats installed for this trial run.</p>
                </div>

                <div className="flex-1 space-y-6 my-4">
                  {/* Screen Format Selection */}
                  <div className="space-y-3 pt-2">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 tracking-tight">Select Screen Format</h3>
                        <p className="text-xs text-slate-400 font-medium font-sora">Choose the display size format for your campaign loop.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sora">
                        {/* Pole 1 (5x3 Feet) Card */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFormat('65-inch');
                            localStorage.setItem('campaign_selectedFormat', '65-inch');
                            setSelectedScreenIds(['ethree-65']);
                          }}
                          className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group ${selectedFormat === '65-inch' ? 'border-[#6C47FF] bg-indigo-50/20 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Monitor size={14} className={selectedFormat === '65-inch' ? 'text-[#6C47FF]' : 'text-slate-400'} />
                              <span className="text-xs font-black text-slate-850">5×3 Feet Display (Pole 1)</span>
                            </div>
                            <CheckCircle size={14} className={selectedFormat === '65-inch' ? 'text-[#6C47FF]' : 'text-slate-250'} />
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold mt-2">
                            Optimized for dense transit corridors, retail loops, and street-level intersections.
                          </p>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3 block">Size: 5 × 3 Feet • Pole 1 • 2,500 Nits</span>
                        </button>

                        {/* Pole 2 (5x3 Feet) Card */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFormat('75-inch');
                            localStorage.setItem('campaign_selectedFormat', '75-inch');
                            setSelectedScreenIds(['ethree-75', 'ethree-pole1', 'ethree-pole2']);
                          }}
                          className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group ${selectedFormat === '75-inch' ? 'border-[#6C47FF] bg-indigo-50/20 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Monitor size={14} className={selectedFormat === '75-inch' ? 'text-[#6C47FF]' : 'text-slate-400'} />
                              <span className="text-xs font-black text-slate-850">5×3 Feet Display (Pole 2)</span>
                            </div>
                            <CheckCircle size={14} className={selectedFormat === '75-inch' ? 'text-[#6C47FF]' : 'text-slate-250'} />
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold mt-2">
                            Landmark visibility, corporate zones, and maximum exposure exits.
                          </p>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3 block">Size: 5 × 3 Feet • Pole 2 • 3,500 Nits</span>
                        </button>
                      </div>
                    </div>

                </div>
              </div>

              {/* PANEL 2: SCHEDULE & TIME SELECTION */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden mt-8">
                <div>
                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Define Schedule</h2>
                  <p className="text-xs text-slate-500 mt-1">Select date presets, duration rates, and audience peak traffic times.</p>
                </div>
                <div className="flex-1 space-y-6 my-4">
                    {/* Slot Mode Selection Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Card 1: Instant Play */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsInstant(true);
                          const now = new Date(new Date().getTime() + (new Date().getTimezoneOffset() * 60000) + (3600000 * 5.5));
                          setStartDate(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }));
                          setStartTime(now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0'));
                          setCampaignDuration(10);
                          setBookingDuration('day');
                        }}
                        className={`relative p-5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 overflow-hidden ${
                          isInstant 
                            ? 'border-[#6C47FF] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-100/50' 
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                        }`}
                      >
                        {/* Glowing badge */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#6C47FF] text-white text-[8px] font-black uppercase tracking-wider shadow-sm animate-pulse">
                          <Zap size={8} /> RECOMMENDED
                        </div>

                        <div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isInstant ? 'text-[#6C47FF]' : 'text-slate-400'}`}>Real-time Broadcast</span>
                          <h3 className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1.5">
                            ⚡ Instant Playback
                          </h3>
                          <p className="text-xs text-slate-550 font-medium mt-2 leading-relaxed text-slate-500">
                            Deploy your campaign immediately. Your design starts looping live on the physical displays right after payment approval.
                          </p>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span className="text-emerald-600">Zero activation delay</span>
                        </div>
                      </button>

                      {/* Card 2: Manual Slot Schedule */}
                      <button
                        type="button"
                        onClick={() => setIsInstant(false)}
                        className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-300 ${
                          !isInstant 
                            ? 'border-[#6C47FF] bg-indigo-50/20 ring-2 ring-indigo-500/10 shadow-sm' 
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                        }`}
                      >
                        <div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${!isInstant ? 'text-[#6C47FF]' : 'text-slate-400'}`}>Advanced Booking</span>
                          <h3 className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1.5">
                            📅 Custom Schedule
                          </h3>
                          <p className="text-xs text-slate-550 font-medium mt-2 leading-relaxed text-slate-500">
                            Pick specific dates, times, and day-parting slots to target peak hours of commute or premium traffic windows.
                          </p>
                        </div>
                        <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                          <span>Target custom slots & days</span>
                        </div>
                      </button>
                    </div>

                    {!isInstant ? (
                      <div className="space-y-4">
                        {/* Quick Date Presets */}
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Campaign Date</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              { id: 'today', label: 'Today' },
                              { id: 'tomorrow', label: 'Tomorrow' },
                              { id: 'weekend', label: 'This Weekend' },
                              { id: 'next-week', label: 'Full Week (7 Days)' },
                              { id: 'next-month', label: 'Full Month (30 Days)' },
                              { id: 'custom', label: 'Custom Date...' }
                            ].map((preset) => {
                              const active = datePreset === preset.id;
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  onClick={() => handleDatePresetClick(preset.id as any)}
                                  className={`py-3 px-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border text-center ${active ? 'bg-[#6C47FF] border-[#6C47FF] text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                                >
                                  {preset.label}
                                </button>
                              );
                            })}
                          </div>

                          {/* Selected Date Range Information Banner */}
                          <div className="mt-3 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between text-xs">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Playing Period</p>
                              <p className="font-bold text-slate-800 mt-0.5">
                                {bookingDuration === 'day' ? startDate : `${startDate} to ${endDate}`}
                              </p>
                            </div>
                            <span className="px-2.5 py-1 bg-[#6C47FF]/10 text-[#6C47FF] rounded-lg text-[10px] font-black uppercase tracking-wider">
                              {daysCount} {daysCount === 1 ? 'Day' : 'Days'}
                            </span>
                          </div>
                        </div>

                        {/* Audience-based Time Preset select */}
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Target Traffic Time Range</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              { id: 'morning', label: 'Morning Rush', time: '08:00 - 12:00', rating: 4, desc: 'Office Commuters', reach: '85,000' },
                              { id: 'daytime', label: 'Day Traffic', time: '12:00 - 16:00', rating: 3, desc: 'Retail & Shoppers', reach: '60,000' },
                              { id: 'evening', label: 'Evening Peak', time: '16:00 - 20:00', rating: 5, desc: 'Maximum Traffic', reach: '120,000' },
                              { id: 'prime', label: 'Prime Time', time: '20:00 - 23:59', rating: 5, desc: 'Leisure & Dining', reach: '90,000' },
                              { id: 'full', label: '24 Hours', time: '00:00 - 23:59', rating: 5, desc: 'Ultimate Loop Cover', reach: '160,000' },
                              { id: 'custom', label: 'Custom Time', time: timePreset === 'custom' ? `${formatTimeAMPM(startTime)} - ${formatTimeAMPM(endTime)}` : 'Select Hours', rating: 5, desc: 'Custom Schedule Window', reach: 'Variable' }
                            ].map((preset) => {
                              const active = timePreset === preset.id;
                              const completed = isSlotCompleted(preset.id);
                              return (
                                <button
                                  key={preset.id}
                                  type="button"
                                  disabled={completed}
                                  onClick={() => handleTimePresetClick(preset.id as any)}
                                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                                    completed 
                                      ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed pointer-events-none' 
                                      : active 
                                        ? 'border-[#6C47FF] bg-indigo-50/20 ring-2 ring-indigo-500/10' 
                                        : 'border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-xs font-black ${completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{preset.label}</span>
                                      {completed && (
                                        <span className="bg-slate-200 text-slate-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Completed</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                      {Array.from({ length: 5 }).map((_, idx) => (
                                        <Star key={idx} size={10} className={idx < preset.rating ? (completed ? 'text-slate-300 fill-slate-300' : 'text-[#FF5EA8] fill-[#FF5EA8]') : 'text-slate-200'} />
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center mt-2.5 w-full">
                                    <span className={`text-[10px] font-bold flex items-center gap-1 ${completed ? 'text-slate-400 line-through' : 'text-slate-500'}`}><Clock size={10} /> {preset.time}</span>
                                    <span className={`text-[9px] font-black uppercase ${completed ? 'text-slate-450' : 'text-[#6C47FF]/80'}`}>Reach: {preset.reach}</span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {timePreset === 'custom' && (
                            <div className="mt-3 p-4 bg-indigo-50/30 border border-[#6C47FF]/35 rounded-2xl max-w-md space-y-3">
                              <p className="text-[10.5px] font-black text-[#6C47FF] uppercase tracking-wider flex items-center gap-1">
                                ⏰ Click to enter exact hours (e.g. 09:16)
                              </p>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Start Time</label>
                                  <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#6C47FF] focus:ring-2 focus:ring-indigo-500/10"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">End Time</label>
                                  <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#6C47FF] focus:ring-2 focus:ring-indigo-500/10"
                                  />
                                </div>
                              </div>
                              {!isTimeRangeValid && (
                                <p className="text-[10px] font-bold text-rose-500 mt-1">
                                  ⚠️ End Time must be strictly after Start Time.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                        <Zap className="text-[#6C47FF] animate-pulse" size={16} />
                        <div>
                          <p className="text-xs font-black text-indigo-950 uppercase tracking-wide">Instant Playback Mode Enabled</p>
                          <p className="text-[11px] text-slate-500 font-medium">Your ad will start looping live across all targeted displays immediately upon checkout & approval.</p>
                        </div>
                      </div>
                    )}

                    {/* Multi-Slot & Repeat Frequency Controls */}
                    <div className="space-y-6 mt-6">
                      {/* Section 1: Instant Multi-Slot Selection */}
                      {isInstant && (
                        <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-6 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                ⚡ Instant Multi-Slot Selection
                              </label>
                              <p className="text-xs text-slate-500 mt-1">Book 1 or multiple 5-second instant time slots in sequence.</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Reserved Duration</span>
                              <span className="text-2xl font-black text-indigo-600 tracking-tight">
                                {instantSlotCount} {instantSlotCount === 1 ? 'Slot' : 'Slots'} ({instantSlotCount * 5}s)
                              </span>
                            </div>
                          </div>

                          {/* Multi-Slot Presets */}
                          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                            {[
                              { slots: 1, label: '1 Slot (5s)' },
                              { slots: 2, label: '2 Slots (10s)' },
                              { slots: 3, label: '3 Slots (15s)' },
                              { slots: 4, label: '4 Slots (20s)' },
                              { slots: 6, label: '6 Slots (30s)' },
                              { slots: 12, label: '12 Slots (60s)' },
                            ].map((item) => {
                              const active = instantSlotCount === item.slots;
                              return (
                                <button
                                  key={item.slots}
                                  type="button"
                                  onClick={() => {
                                    setInstantSlotCount(item.slots);
                                    setCampaignDuration(item.slots * 5);
                                    setDurationInputStr(String(item.slots * 5));
                                    localStorage.setItem('campaign_instantSlotCount', String(item.slots));
                                    localStorage.setItem('campaign_campaignDuration', String(item.slots * 5));
                                  }}
                                  className={`py-3 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border text-center ${
                                    active
                                      ? 'bg-[#6C47FF] border-[#6C47FF] text-white shadow-md shadow-indigo-600/20'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Section 2: Repeat & Loop Frequency Multiplier */}
                      <div className="bg-indigo-50/40 border border-indigo-100 rounded-3xl p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-wider text-indigo-500">
                              🔄 Repeat & Frequency Multiplier
                            </label>
                            <p className="text-xs text-slate-600 mt-1">
                              Repeat your broadcast multiple times per loop cycle for higher visibility & reach.
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Loop Multiplier</span>
                            <span className="text-2xl font-black text-slate-900 tracking-tight">
                              {repeatCount}x {repeatCount === 1 ? 'Loop' : 'Loops'}
                            </span>
                          </div>
                        </div>

                        {/* Repeat Count Preset Buttons */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                          {[
                            { count: 1, label: '1x (Single)' },
                            { count: 2, label: '2x (Double)' },
                            { count: 5, label: '5x (High)' },
                            { count: 10, label: '10x (Dominant)' },
                            { count: 20, label: '20x (Takeover)' },
                          ].map((item) => {
                            const active = repeatCount === item.count;
                            return (
                              <button
                                key={item.count}
                                type="button"
                                onClick={() => {
                                  setRepeatCount(item.count);
                                  localStorage.setItem('campaign_repeatCount', String(item.count));
                                }}
                                className={`py-3 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border text-center ${
                                  active
                                    ? 'bg-[#6C47FF] border-[#6C47FF] text-white shadow-md shadow-indigo-600/20'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {item.label}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => {
                              const input = prompt('Enter custom repeat count (1–100):', String(repeatCount));
                              if (input) {
                                const val = Math.min(100, Math.max(1, parseInt(input, 10) || 1));
                                setRepeatCount(val);
                                localStorage.setItem('campaign_repeatCount', String(val));
                              }
                            }}
                            className={`py-3 px-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border text-center ${
                              ![1, 2, 5, 10, 20].includes(repeatCount)
                                ? 'bg-[#6C47FF] border-[#6C47FF] text-white shadow-md'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            Custom
                          </button>
                        </div>

                        {/* Broadcast Repeat Summary Card */}
                        <div className="p-4 bg-white rounded-2xl border border-indigo-100/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-[#6C47FF] font-black">
                              🔄
                            </div>
                            <div>
                              <p className="font-black text-slate-800">
                                {repeatCount} Broadcast {repeatCount === 1 ? 'Loop' : 'Loops'} Scheduled
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                Total Air-Time: {campaignDuration * repeatCount}s • {Math.ceil(campaignDuration / 5) * repeatCount} slots
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {repeatCount > 1 && (
                              <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                                💰 ₹{(baseTotalAmount * (selectedFormat === '75-inch' ? 1.3 : 1.0)).toLocaleString()} × {repeatCount}x = ₹{totalAmount.toLocaleString()}
                              </span>
                            )}
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                              {repeatCount > 1 ? `${repeatCount}x Frequency Applied` : 'Standard Single Loop'}
                            </span>
                          </div>
                        </div>

                        {/* Per-Ad Playing Time Pickers */}
                        {repeatCount > 1 && (
                          <div className="bg-white p-6 rounded-3xl border border-indigo-100 space-y-4 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                              <div>
                                <p className="text-xs font-black text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                                  <Clock size={14} className="text-indigo-600 shrink-0" />
                                  Scheduled Broadcast Times for Each Ad ({repeatCount} Repeats)
                                </p>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                  Select the exact hour when each ad loop should play across all targeted screens.
                                </p>
                              </div>
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-xl uppercase tracking-wider shrink-0 border border-indigo-100">
                                🕒 Custom Times
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-1">
                              {repeatTimes.map((timeVal, idx) => {
                                const format12H = (t: string) => {
                                  if (!t) return '';
                                  const [h, m] = t.split(':').map(Number);
                                  if (isNaN(h) || isNaN(m)) return t;
                                  const period = h >= 12 ? 'PM' : 'AM';
                                  const displayH = h % 12 || 12;
                                  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
                                };

                                return (
                                  <div 
                                    key={idx} 
                                    className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all shadow-xs space-y-2 group"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase tracking-wider">
                                        <span className="w-2 h-2 rounded-full bg-indigo-600 group-hover:scale-125 transition-transform" />
                                        Ad #{idx + 1}
                                      </span>
                                      <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest bg-white px-2 py-0.5 rounded-lg border border-slate-200/70">
                                        Slot #{idx + 1}
                                      </span>
                                    </div>

                                    <div className="relative">
                                      <input
                                        type="time"
                                        value={timeVal}
                                        onChange={(e) => {
                                          const updated = [...repeatTimes];
                                          updated[idx] = e.target.value;
                                          setRepeatTimes(updated);
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs cursor-pointer tracking-wider min-w-0"
                                      />
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold pt-0.5">
                                      <span>Playing Time:</span>
                                      <span className="text-indigo-600 font-black px-1.5 py-0.5 bg-indigo-50 rounded-md">
                                        {format12H(timeVal)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

              </div>

              {/* PANEL 3: UPLOAD CREATIVE */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden mt-8">
                <div>
                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Creative Upload</h2>
                  <p className="text-xs text-slate-500 mt-1">Upload your ad asset and validate size constraints.</p>
                </div>

                <div className="flex-1 space-y-6 my-4">
                    {error && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-2">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Drag & Drop zone */}
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${dragActive ? 'border-[#6C47FF] bg-indigo-50/20' : file ? 'border-[#6C47FF]/50 bg-slate-50/50' : 'border-slate-300 hover:border-slate-400'}`}
                    >
                      <input 
                        type="file" 
                        id="creative-file" 
                        onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                      />
                      
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 bg-indigo-50 text-[#6C47FF] rounded-xl flex items-center justify-center">
                          {file ? <FileIcon size={20} /> : <Upload size={20} />}
                        </div>
                        <div>
                          {file ? (
                            <>
                              <p className="text-sm font-black text-slate-800 truncate max-w-xs">{file.name}</p>
                              <p className="text-xs text-slate-500 font-bold mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to upload new</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-black text-slate-800">Upload Ad Video or Image</p>
                              <p className="text-xs text-slate-400 mt-0.5">Drag and drop file here, or click to browse</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Re-crop button */}
                    {tempFile && file && (
                      <div className="flex justify-center -mt-2 mb-2 relative z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const url = URL.createObjectURL(tempFile);
                            setPreviewUrl(url);
                            setShowCropModal(true);
                          }}
                          className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-600 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors border border-indigo-100 shadow-sm"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          Adjust Image Crop
                        </button>
                      </div>
                    )}

                    {/* Guidelines validation block */}
                    <div className="bg-[#FAF7F2] border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Creative Requirements Check</p>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Aspect Ratio: <b>Vertical 9:16 Portrait</b></span>
                        <CheckCircle size={14} className="text-emerald-500" />
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Resolution: <b>1080×1920px (Portrait)</b></span>
                        <CheckCircle size={14} className="text-emerald-500" />
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Formats: <b>MP4, WebM, PNG, JPG</b></span>
                        <CheckCircle size={14} className="text-emerald-500" />
                      </div>
                    </div>
                  </div>

              </div>

              {/* PANEL 4: REVIEW & LAUNCH */}
              <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm flex flex-col justify-between overflow-hidden mt-8">
                <div>
                  <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Review & Launch</h2>
                  <p className="text-xs text-slate-500 mt-1">Verify target traffic metrics and complete booking payment.</p>
                </div>

                <div className="flex-1 space-y-6 my-4">
                    <div className="space-y-4">
                      
                      {/* Detailed Summary block */}
                      <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Campaign Scope</p>
                        
                        <div className="flex justify-between items-center text-xs text-slate-600">
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-[#6C47FF]" /> Targeted Route:</span>
                          <b className="text-slate-800 font-bold">{currentRoute.name}</b>
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-600">
                          <span>Commuter Flow direction:</span>
                          <b className="text-[#6C47FF] font-bold">{selectedDirection === 'A' ? currentRoute.dirAName : currentRoute.dirBName}</b>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-slate-600">
                          <span className="flex items-center gap-1"><CalendarIcon size={12} className="text-[#6C47FF]" /> Date & Time Slot:</span>
                          <b className="text-slate-800 font-bold">
                            {startDate ? new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'} ({formatTimeAMPM(startTime)} - {formatTimeAMPM(endTime)})
                          </b>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-slate-600">
                          <span>Target Screens coverage:</span>
                          <b className="text-slate-800 font-bold capitalize">{coverageLevel.replace('_', ' ')} Pack ({selectedScreenIds.length} Screens)</b>
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-600">
                          <span>Selected Screen Size:</span>
                          <b className="text-slate-800 font-bold">{selectedFormat === '65-inch' ? '5×3 Feet Display (Pole 1)' : '5×3 Feet Display (Pole 2)'}</b>
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-600">
                          <span>Advertisement Duration:</span>
                          <b className="text-slate-800 font-bold">
                            {campaignDuration} Seconds
                          </b>
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-600">
                          <span>Ad Creative name:</span>
                          <b className="text-slate-800 font-bold truncate max-w-[180px]">{file?.name}</b>
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-600">
                          <span>Watermark Program:</span>
                          <b className={`font-bold ${hasWatermark ? 'text-emerald-600' : 'text-slate-800'}`}>{hasWatermark ? 'Enabled (Standard Rate)' : 'Disabled (+25% surcharge)'}</b>
                        </div>
                      </div>

                      {/* Payment items Stripe-style */}
                      <div className="border border-slate-200 rounded-2xl p-4 space-y-3 text-xs bg-white">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Billing Receipt</p>
                        
                        {isEligibleForFreeTrial ? (
                          /* Free Trial or Welcome Discount Billing */
                          <div className="space-y-2">
                            <div className="flex justify-between text-slate-500">
                              <span>Route Standard Loop Price:</span>
                              <span className="font-semibold text-slate-800">₹{priceWithWatermark.toLocaleString()}</span>
                            </div>

                            {!hasWatermark && (
                              <div className="flex justify-between text-slate-500">
                                <span>Surcharge (25% No Watermark):</span>
                                <span className="font-semibold text-[#FF5EA8]">+₹{Math.ceil(priceWithWatermark * 0.25).toLocaleString()}</span>
                              </div>
                            )}

                            <div className="flex justify-between text-emerald-600 font-bold">
                              <span className="flex items-center gap-1"><Gift size={11} />10s Free Trial Discount:</span>
                              <span>-₹{discountAmount.toLocaleString()}</span>
                            </div>

                            {couponApplied && !couponError && (
                              <div className="flex justify-between text-emerald-600 font-bold">
                                <span className="flex items-center gap-1">🎟️ Coupon Discount ({couponApplied}):</span>
                                <span>-₹{couponDiscount.toLocaleString()}</span>
                              </div>
                            )}

                            <div className="flex justify-between text-slate-500">
                              <span>Integrated GST (18%):</span>
                              <span className="font-semibold text-slate-800">₹{Math.ceil(totalAmount * 0.18).toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-black text-slate-800">
                              <span>Grand Total Payable:</span>
                              <span className={`${totalAmount === 0 ? 'text-emerald-600' : 'text-[#6C47FF]'} text-lg`}>
                                {totalAmount === 0 ? '₹0 FREE' : `₹${Math.ceil(totalAmount * 1.18).toLocaleString()}`}
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Normal Billing */
                          <div className="space-y-2">
                            <div className="flex justify-between text-slate-500">
                              <span>Route Standard Loop Price:</span>
                              <span className="font-semibold text-slate-800">₹{priceWithWatermark.toLocaleString()}</span>
                            </div>

                            {!hasWatermark && (
                              <div className="flex justify-between text-slate-500">
                                <span>Surcharge (25% No Watermark):</span>
                                <span className="font-semibold text-[#FF5EA8]">+₹{Math.ceil(priceWithWatermark * 0.25).toLocaleString()}</span>
                              </div>
                            )}

                            {couponApplied && !couponError && (
                              <div className="flex justify-between text-emerald-600 font-bold">
                                <span className="flex items-center gap-1">🎟️ Coupon Discount ({couponApplied}):</span>
                                <span>-₹{couponDiscount.toLocaleString()}</span>
                              </div>
                            )}

                            <div className="flex justify-between text-slate-500">
                              <span>Integrated GST (18%):</span>
                              <span className="font-semibold text-slate-800">₹{Math.ceil(totalAmount * 0.18).toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between border-t border-slate-100 pt-3 text-sm font-black text-slate-800">
                              <span>Grand Total Payable:</span>
                              <span className="text-[#6C47FF] text-lg">₹{Math.ceil(totalAmount * 1.18).toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Coupon Code Input (Placed above the Pay & Launch campaign button) */}
                      <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-slate-200/60 space-y-2 mt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-sans">Promo Code</span>
                          {couponApplied && !couponError && (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-sans">
                              Applied (-{couponDiscountPercent}%)
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="ENTER PROMO CODE"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            className="flex-grow px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6C47FF] uppercase font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => setAppliedCouponCode(couponInput)}
                            className="px-4 py-2 bg-[#6C47FF] hover:bg-[#5936e0] text-white text-xs font-black rounded-xl transition-colors font-sans"
                          >
                            Apply
                          </button>
                        </div>
                        {couponError && (
                          <p className="text-[10px] font-bold text-red-500 text-left font-sans">
                            ⚠️ {couponError}
                          </p>
                        )}
                        {couponApplied && !couponError && (
                          <p className="text-[10px] font-bold text-emerald-600 text-left font-sans">
                            ✓ Coupon "{couponApplied}" applied successfully!
                          </p>
                        )}
                      </div>

                      {/* GST Number Input (For generating tax invoice) */}
                      <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-slate-200/60 space-y-3 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-sans">GSTIN (Optional)</span>
                          {companyDetails && (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-sans">
                              Verified ✓
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={15}
                            placeholder="Enter 15-Digit GSTIN"
                            value={gstInput}
                            onChange={(e) => setGstInput(e.target.value.toUpperCase())}
                            className="flex-grow px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#6C47FF] uppercase font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => handleVerifyGst(gstInput)}
                            disabled={gstLoading || gstInput.length !== 15}
                            className="px-4 py-2 bg-[#6C47FF] hover:bg-[#5936e0] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black rounded-xl transition-all font-sans"
                          >
                            {gstLoading ? '...' : 'Verify'}
                          </button>
                        </div>
                        {gstError && (
                          <p className="text-[10px] font-bold text-red-500 text-left font-sans">
                            ⚠️ {gstError}
                          </p>
                        )}
                        {companyDetails && (
                          <div className="p-4 bg-white border border-slate-200 rounded-2xl text-left space-y-4 animate-fade-in shadow-sm font-sans">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                ✓ VERIFIED GST TAXPAYER
                              </span>
                              <span className="bg-emerald-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                {companyDetails.status || 'ACTIVE'}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">BUSINESS NAME</span>
                                <input
                                  type="text"
                                  value={companyDetails.companyName}
                                  onChange={(e) => setCompanyDetails({ ...companyDetails, companyName: e.target.value })}
                                  className="w-full text-xs font-black text-slate-800 uppercase block mt-0.5 leading-snug bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none font-sans"
                                  placeholder="Enter Trade/Business Name"
                                />
                              </div>
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">PAN</span>
                                <span className="text-xs font-black text-slate-800 uppercase block mt-0.5">{companyDetails.pan || companyDetails.gst.slice(2, 12)}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">ADDRESS</span>
                                <span className="text-xs font-black text-slate-800 uppercase block mt-0.5 leading-snug">{companyDetails.address}</span>
                              </div>

                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">ENTITY TYPE</span>
                                <span className="text-xs font-bold text-slate-700 block mt-0.5">{companyDetails.entityType || 'Private Limited Company'}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">NATURE OF BUSINESS</span>
                                <span className="text-xs font-bold text-slate-700 block mt-0.5">{companyDetails.natureOfBusiness || 'Others'}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">PINCODE</span>
                                <span className="text-xs font-black text-slate-800 block mt-0.5">{companyDetails.pincode || '520008'}</span>
                              </div>

                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">DEPARTMENT CODE</span>
                                <span className="text-xs font-bold text-slate-700 uppercase block mt-0.5">{companyDetails.departmentCode || 'AUTO NAGAR RANGE'}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">REGISTRATION TYPE</span>
                                <span className="text-xs font-bold text-slate-700 block mt-0.5">{companyDetails.registrationType || 'Regular'}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">REGISTRATION DATE</span>
                                <span className="text-xs font-bold text-slate-700 block mt-0.5">{companyDetails.registrationDate || '19/12/2025'}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isFormComplete ? (
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3 text-xs bg-slate-50 border border-dashed border-slate-200 p-4 rounded-xl">
                      <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                      <span className="text-slate-500 font-semibold leading-relaxed">
                        Please upload your ad creative and fill out all schedule parameters to unlock the payment and launch option.
                      </span>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="py-3.5 px-6 bg-[#6C47FF] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {loading ? 'Processing Payment...' : <><CreditCard size={14} /> Pay & Launch Campaign</>}
                      </button>
                    </div>
                  )}
                </div>
              </div>

          {/* Right Column: Sticky Live Campaign Preview */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 bg-white border border-slate-200 rounded-[24px] p-5 shadow-sm space-y-5 flex flex-col">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Campaign Preview</span>
                
                <div className="flex items-center gap-2">
                  {previewUrl && (
                    <div className="flex gap-1.5 items-center">
                      <button
                        type="button"
                        onClick={() => setRotation((r) => (r + 90) % 360)}
                        className="px-2.5 py-1 text-[8px] font-black uppercase rounded-md bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 flex items-center gap-1 transition-all"
                      >
                        <RefreshCw size={8} className="animate-spin" style={{ animationDuration: '3s' }} /> Rotate
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsFullScreenPreviewOpen(true)}
                        className="p-1 rounded-md bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 transition-all flex items-center justify-center"
                        title="View Full Screen Simulator"
                      >
                        <Maximize2 size={10} />
                      </button>
                    </div>
                  )}
                  {/* Mockup Sky Themes */}
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 w-fit">
                    <button 
                      type="button"
                      onClick={() => setMockupTheme('day')}
                      className={`px-2.5 py-1 text-[8px] font-black uppercase rounded-md transition-all ${mockupTheme === 'day' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Day
                    </button>
                    <button 
                      type="button"
                      onClick={() => setMockupTheme('night')}
                      className={`px-2.5 py-1 text-[8px] font-black uppercase rounded-md transition-all ${mockupTheme === 'night' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Night
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium">Behold your design live on a physical LED street billboard.</p>
            </div>

            {/* Realistic LED Billboard Mockup Area */}
            <div 
              className={`relative h-64 w-[240px] mx-auto rounded-2xl overflow-hidden border shadow-inner flex items-center justify-center p-2 transition-colors duration-500 ${mockupTheme === 'day' ? 'bg-gradient-to-b from-sky-200 via-sky-50 to-slate-100 border-slate-200' : 'bg-gradient-to-b from-[#0A0D2A] via-[#1A265E] to-[#050716] border-slate-900 shadow-[0_0_40px_rgba(108,71,255,0.15)_inset]'}`}
            >
              
              {/* Skylines representation (day vs night) */}
              <div className="absolute inset-x-0 bottom-0 h-16 flex items-end opacity-20 pointer-events-none">
                <div className="w-full flex justify-around items-end">
                  <div className={`w-8 h-12 ${mockupTheme === 'day' ? 'bg-slate-500' : 'bg-slate-800'}`} />
                  <div className={`w-12 h-16 ${mockupTheme === 'day' ? 'bg-slate-400' : 'bg-slate-950'}`} />
                  <div className={`w-10 h-14 ${mockupTheme === 'day' ? 'bg-slate-500' : 'bg-slate-900'}`} />
                </div>
              </div>

              {/* Physical Billboard structure */}
              <div className="flex flex-col items-center relative z-10">
                
                {/* LED Screen Wrapper */}
                <div 
                  className={`relative aspect-[9/16] w-[120px] rounded-lg overflow-hidden border-2 bg-slate-900 flex items-center justify-center transition-all ${mockupTheme === 'day' ? 'border-slate-800 shadow-lg' : 'border-slate-950 shadow-[0_0_25px_rgba(108,71,255,0.45)]'}`}
                >
                  
                  {previewUrl ? (
                    file?.type.startsWith('video/') ? (
                      <video
                        src={previewUrl}
                        className="w-full h-full object-contain transition-all duration-300"
                        style={{ 
                          transform: `rotate(${rotation}deg)`,
                          filter: FILTER_STYLES[selectedFilter],
                          width: rotation % 180 !== 0 ? '177.78%' : '100%',
                          height: rotation % 180 !== 0 ? '56.25%' : '100%',
                        }}
                        muted
                        autoPlay
                        loop
                        playsInline
                      />
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Billboard View"
                        className="w-full h-full object-contain object-center transition-all duration-300"
                        style={{ 
                          transform: `rotate(${rotation}deg)`,
                          filter: FILTER_STYLES[selectedFilter],
                          width: rotation % 180 !== 0 ? '177.78%' : '100%',
                          height: rotation % 180 !== 0 ? '56.25%' : '100%',
                        }}
                      />
                    )
                  ) : (
                    /* High-fidelity default placeholder ad */
                    <div className="w-full h-full bg-gradient-to-tr from-[#6C47FF] to-[#FF5EA8] p-2 flex flex-col justify-between items-center text-center text-white relative">
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] z-10 pointer-events-none" />
                      <div className="w-full border-b border-white/20 pb-1 mt-1">
                        <span className="text-[7px] font-black tracking-widest uppercase">E3Di Network</span>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black tracking-tight leading-none uppercase">Your Ad Creative Here</h4>
                        <p className="text-[6px] text-indigo-200 mt-1 font-semibold leading-normal">Ready to go live in minutes</p>
                      </div>
                      <div className="w-full border-t border-white/20 pt-1 mb-1">
                        <span className="text-[5px] font-black uppercase tracking-wider">Own Attention</span>
                      </div>
                    </div>
                  )}

                  {/* Watermark Logo Badge (overlay top-right) */}
                  {hasWatermark && (
                    <div className="absolute top-1.5 right-1.5 px-2 py-1 bg-[#0A0D2A]/95 rounded-md border border-[#6C47FF]/60 shadow-lg z-20 flex items-center justify-center select-none pointer-events-none">
                      <span className="text-[9px] font-black tracking-wide text-white leading-none">
                        E3<span className="text-yellow-400">Di</span>
                      </span>
                    </div>
                  )}

                  {/* Watermark Footer Bar (overlay bottom) */}
                  {hasWatermark && (
                    <div className="absolute bottom-0 left-0 right-0 py-1.5 bg-[#FFD600] flex items-center justify-center z-20 select-none pointer-events-none border-t-2 border-yellow-600/40">
                      <span className="text-[8px] font-black tracking-widest text-black lowercase">
                        www.e3di.org
                      </span>
                    </div>
                  )}
                </div>

                {/* Pole Stand */}
                <div className={`w-1.5 h-6 ${mockupTheme === 'day' ? 'bg-slate-700' : 'bg-slate-900'} relative z-0 -mt-1`} />
                
                {/* Base Foundation block */}
                <div className={`w-10 h-1.5 rounded-md ${mockupTheme === 'day' ? 'bg-slate-600' : 'bg-slate-950'} relative z-0`} />
              </div>

              {/* Day/Night visual elements */}
              {mockupTheme === 'day' ? (
                <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-amber-400 blur-sm pointer-events-none opacity-40 animate-pulse" />
              ) : (
                <div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-slate-200 blur-sm pointer-events-none opacity-25" />
              )}
            </div>

            {/* Scope Summary Details */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-500">
              <div className="flex justify-between items-center">
                <span>Location:</span>
                <span className="font-extrabold text-slate-800">eThree (Fixed)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Screens Chosen:</span>
                <span className="font-extrabold text-slate-800">
                  {selectedFormat === '65-inch' ? 'eThree 5×3 Feet (Pole 1)' : 'eThree 5×3 Feet (Pole 2)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Campaign Date:</span>
                <span className="font-extrabold text-slate-800">
                  {bookingDuration === 'day' ? startDate : `${startDate} to ${endDate}`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Time Slot:</span>
                <span className="font-extrabold text-slate-800">
                  {formatTimeAMPM(startTime)} - {formatTimeAMPM(endTime)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Expected Reach:</span>
                <span className="font-extrabold text-emerald-600">
                  {`${aggregateReach.toLocaleString()}+ Daily Views`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Est. Impressions:</span>
                <span className="font-extrabold text-slate-800">
                  {`${estimatedImpressions.toLocaleString()} views`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Advertisement Duration:</span>
                <span className="font-extrabold text-slate-800">{campaignDuration} Seconds</span>
              </div>

              {/* Integrated Image/Video Enhancer Filters */}
              {previewUrl && (
                <div className="bg-[#FAF7F2] p-2.5 rounded-2xl border border-slate-200/60 space-y-1.5 my-1">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block text-left">Preview Aesthetics (20 Filters)</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
                    {[
                      { id: 'none', name: 'Normal' },
                      { id: 'bright', name: 'Bright' },
                      { id: 'superBright', name: 'Super Bright' },
                      { id: 'vibrant', name: 'Vibrant' },
                      { id: 'contrast', name: 'Contrast' },
                      { id: 'vintage', name: 'Vintage' },
                      { id: 'warm', name: 'Warm' },
                      { id: 'cool', name: 'Cool' },
                      { id: 'mono', name: 'B&W' },
                      { id: 'retroGold', name: 'Retro Gold' },
                      { id: 'neonGlow', name: 'Neon Glow' },
                      { id: 'summer', name: 'Summer' },
                      { id: 'cyberpunk', name: 'Cyberpunk' },
                      { id: 'cinematic', name: 'Cinematic' },
                      { id: 'drastic', name: 'Drastic' },
                      { id: 'sunwashed', name: 'Sunwashed' },
                      { id: 'softLight', name: 'Soft Light' },
                      { id: 'gothic', name: 'Gothic' },
                      { id: 'dreamy', name: 'Dreamy' },
                      { id: 'invertedNeon', name: 'Inverted' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFilter(f.id as any)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[9px] font-black uppercase shrink-0 transition-all ${selectedFilter === f.id ? 'bg-[#6C47FF] border-[#6C47FF] text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}


              {/* Watermark Selector/Comparison inside Sticky Preview */}
              <div className="bg-[#FAF7F2] p-3 rounded-2xl border border-slate-200/60 space-y-2 my-2">
                <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block font-sans">Watermark & Price Decisions</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={selectedScreenIds.length === 0}
                    onClick={() => setHasWatermark(true)}
                    className={`p-2.5 rounded-xl border flex flex-col text-left transition-all ${hasWatermark ? 'bg-white border-[#6C47FF] ring-2 ring-indigo-500/10' : 'bg-transparent border-slate-200 hover:border-slate-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="text-[9px] font-black text-slate-800 font-sans">With Watermark</span>
                    <span className="text-xs font-black text-[#6C47FF] mt-1">
                      {selectedScreenIds.length > 0 ? (finalPriceWithWatermark === 0 ? '₹0 FREE' : `₹${finalPriceWithWatermark.toLocaleString()}`) : '—'}
                    </span>
                    <span className="text-[8px] font-bold text-emerald-600 mt-0.5">Save 20%</span>
                  </button>

                  <button
                    type="button"
                    disabled={selectedScreenIds.length === 0}
                    onClick={() => setHasWatermark(false)}
                    className={`p-2.5 rounded-xl border flex flex-col text-left transition-all ${!hasWatermark ? 'bg-white border-[#6C47FF] ring-2 ring-indigo-500/10' : 'bg-transparent border-slate-200 hover:border-slate-300'} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="text-[9px] font-black text-slate-800 font-sans">No Watermark</span>
                    <span className="text-xs font-black text-slate-800 mt-1">
                      {selectedScreenIds.length > 0 ? (finalPriceWithoutWatermark === 0 ? '₹0 FREE' : `₹${finalPriceWithoutWatermark.toLocaleString()}`) : '—'}
                    </span>
                    <span className="text-[8px] font-bold text-rose-500 mt-0.5">Clean (+25%)</span>
                  </button>
                </div>
              </div>

              {couponApplied && !couponError && (
                <div className="flex justify-between items-center text-xs font-black text-emerald-600 my-1 font-sans">
                  <span>Coupon Discount ({couponApplied}):</span>
                  <span>-₹{couponDiscount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-center border-t border-slate-100 pt-3 font-black text-sm text-[#111827]">
                <span>Total Budget:</span>
                <span className={`text-base ${isUsingFreeTrial ? 'text-emerald-600' : 'text-[#6C47FF]'}`}>
                  {selectedScreenIds.length > 0 ? (isUsingFreeTrial ? '₹0 FREE 🎁' : `₹${totalAmount.toLocaleString()}`) : 'Select screens'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Stylesheet overrides */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E7EB;
          border-radius: 99px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D1D5DB;
        }
        @keyframes dashflow {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-flow-stroke {
          stroke-dasharray: 6, 8;
          animation: dashflow 1.5s linear infinite;
        }
      `}</style>

      {/* Global Full Screen Billboard Mockup Simulator Modal */}
      <AnimatePresence>
        {isFullScreenPreviewOpen && (
          <div className="fixed inset-0 z-[99999] flex flex-col justify-between p-6 bg-slate-950/95 backdrop-blur-md select-none">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <div>
                <h3 className="font-black text-white text-base tracking-tight uppercase">Live Street Billboard Simulation</h3>
                <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">HIGH-FIDELITY ENVIRONMENT SIMULATOR • {currentRoute.name}</p>
              </div>
              <button 
                onClick={() => setIsFullScreenPreviewOpen(false)} 
                className="p-2.5 bg-slate-900 hover:bg-slate-850 rounded-2xl text-slate-400 hover:text-white transition-all flex items-center justify-center border border-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Simulated Environment Area */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div 
                className={`relative w-full max-w-5xl h-[70vh] rounded-[32px] overflow-hidden border flex items-center justify-center transition-colors duration-500 shadow-2xl ${mockupTheme === 'day' ? 'bg-gradient-to-b from-sky-200 via-sky-50 to-slate-100 border-slate-200' : 'bg-gradient-to-b from-[#0A0D2A] via-[#1A265E] to-[#050716] border-slate-900 shadow-[0_0_60px_rgba(108,71,255,0.2)_inset]'}`}
              >
                
                {/* Skylines representation */}
                <div className="absolute inset-x-0 bottom-0 h-32 flex items-end opacity-25 pointer-events-none">
                  <div className="w-full flex justify-around items-end px-10">
                    <div className={`w-16 h-24 ${mockupTheme === 'day' ? 'bg-slate-500' : 'bg-slate-800'}`} />
                    <div className={`w-24 h-36 ${mockupTheme === 'day' ? 'bg-slate-450' : 'bg-slate-950'}`} />
                    <div className={`w-20 h-28 ${mockupTheme === 'day' ? 'bg-slate-500' : 'bg-slate-900'}`} />
                  </div>
                </div>

                {/* Environment Decor */}
                {mockupTheme === 'day' ? (
                  <div className="absolute top-8 left-8 w-16 h-16 rounded-full bg-amber-400 blur-md pointer-events-none opacity-50 animate-pulse" />
                ) : (
                  <div className="absolute top-8 left-8 w-12 h-12 rounded-full bg-slate-100 blur-md pointer-events-none opacity-20" />
                )}

                {/* Billboard Structure */}
                <div className="flex flex-col items-center scale-[1.3] md:scale-[1.6] relative z-10 transition-transform">
                  {/* Screen Frame */}
                  <div 
                    className={`relative aspect-[9/16] w-[110px] rounded-xl overflow-hidden border-2 bg-slate-900 flex items-center justify-center transition-all ${mockupTheme === 'day' ? 'border-slate-800 shadow-xl' : 'border-slate-950 shadow-[0_0_35px_rgba(108,71,255,0.6)]'}`}
                  >
                    {previewUrl ? (
                      file?.type.startsWith('video/') ? (
                        <video
                          src={previewUrl}
                          className="w-full h-full object-contain transition-all duration-300"
                          style={{ 
                            transform: `rotate(${rotation}deg)`,
                            filter: FILTER_STYLES[selectedFilter],
                            width: rotation % 180 !== 0 ? '177.78%' : '100%',
                            height: rotation % 180 !== 0 ? '56.25%' : '100%',
                          }}
                          muted
                          autoPlay
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Billboard View"
                          className="w-full h-full object-contain object-center transition-all duration-300"
                          style={{ 
                            transform: `rotate(${rotation}deg)`,
                            filter: FILTER_STYLES[selectedFilter],
                            width: rotation % 180 !== 0 ? '177.78%' : '100%',
                            height: rotation % 180 !== 0 ? '56.25%' : '100%',
                          }}
                        />
                      )
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-[#6C47FF] to-[#FF5EA8] p-2 flex flex-col justify-between items-center text-center text-white relative">
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] z-10 pointer-events-none" />
                        <div className="w-full border-b border-white/20 pb-1 mt-1">
                          <span className="text-[7px] font-black tracking-widest uppercase">E3Di Network</span>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black tracking-tight leading-none uppercase">Your Ad Creative Here</h4>
                        </div>
                        <div className="w-full border-t border-white/20 pt-1 mb-1">
                          <span className="text-[5px] font-black uppercase tracking-wider">Own Attention</span>
                        </div>
                      </div>
                    )}

                    {hasWatermark && (
                      <div className="absolute top-2 right-2 px-2.5 py-1.5 bg-[#0A0D2A]/95 rounded-lg border border-[#6C47FF]/70 shadow-xl z-20 flex items-center justify-center select-none pointer-events-none">
                        <span className="text-[11px] font-black tracking-wide text-white leading-none">
                          E3<span className="text-yellow-400">Di</span>
                        </span>
                      </div>
                    )}

                    {hasWatermark && (
                      <div className="absolute bottom-0 left-0 right-0 py-2 bg-[#FFD600] flex items-center justify-center z-20 select-none pointer-events-none border-t-2 border-yellow-600/50">
                        <span className="text-[10px] font-black tracking-widest text-black lowercase">
                          www.e3di.org
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Stand */}
                  <div className={`w-1.5 h-8 ${mockupTheme === 'day' ? 'bg-slate-700' : 'bg-slate-900'} relative z-0 -mt-1`} />
                  {/* Base */}
                  <div className={`w-12 h-1.5 rounded-md ${mockupTheme === 'day' ? 'bg-slate-600' : 'bg-slate-950'} relative z-0`} />
                </div>

              </div>
            </div>

            {/* Footer Control Panel */}
            <div className="border-t border-slate-800 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Sky Theme Toggle */}
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-fit">
                  <button 
                    type="button"
                    onClick={() => setMockupTheme('day')}
                    className={`px-3 py-1.5 text-xs font-black uppercase rounded-lg transition-all ${mockupTheme === 'day' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
                  >
                    Daylight Mode
                  </button>
                  <button 
                    type="button"
                    onClick={() => setMockupTheme('night')}
                    className={`px-3 py-1.5 text-xs font-black uppercase rounded-lg transition-all ${mockupTheme === 'night' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
                  >
                    Midnight Mode
                  </button>
                </div>

                {/* Rotate Control */}
                {previewUrl && (
                  <button
                    type="button"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw size={12} /> Rotate Design
                  </button>
                )}
              </div>

              {/* Filters Row */}
              {previewUrl && (
                <div className="flex-1 max-w-xl bg-slate-900 p-2.5 rounded-2xl border border-slate-800 space-y-1.5 md:ml-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block text-left">Simulation Aesthetics</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
                    {[
                      { id: 'none', name: 'Normal' },
                      { id: 'bright', name: 'Bright' },
                      { id: 'superBright', name: 'Super Bright' },
                      { id: 'vibrant', name: 'Vibrant' },
                      { id: 'contrast', name: 'Contrast' },
                      { id: 'vintage', name: 'Vintage' },
                      { id: 'warm', name: 'Warm' },
                      { id: 'cool', name: 'Cool' },
                      { id: 'mono', name: 'B&W' },
                      { id: 'retroGold', name: 'Retro Gold' },
                      { id: 'neonGlow', name: 'Neon Glow' },
                      { id: 'summer', name: 'Summer' },
                      { id: 'cyberpunk', name: 'Cyberpunk' },
                      { id: 'cinematic', name: 'Cinematic' },
                      { id: 'drastic', name: 'Drastic' },
                      { id: 'sunwashed', name: 'Sunwashed' },
                      { id: 'softLight', name: 'Soft Light' },
                      { id: 'gothic', name: 'Gothic' },
                      { id: 'dreamy', name: 'Dreamy' },
                      { id: 'invertedNeon', name: 'Inverted' }
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFilter(f.id as any)}
                        className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase shrink-0 transition-all ${selectedFilter === f.id ? 'bg-[#6C47FF] border-[#6C47FF] text-white shadow-sm' : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-white'}`}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </AnimatePresence>

      {/* Global Calendar Modal */}
      <AnimatePresence>
        {isCalendarOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 w-full max-w-sm flex flex-col shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-slate-900 text-sm">Select Custom Date</h3>
                <button onClick={() => setIsCalendarOpen(false)} className="p-1 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                  <X size={16} />
                </button>
              </div>

              <PremiumCalendar
                onDateSelect={(d: string) => {
                  setTempStartDate(d);
                }}
                selectedDate={tempStartDate}
                endDate={getEndDate(tempStartDate, bookingDuration)}
              />

              <div className="mt-4 pt-3 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setIsCalendarOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (tempStartDate) {
                      setStartDate(tempStartDate);
                      setIsCalendarOpen(false);
                    }
                  }}
                  className="flex-1 py-2.5 bg-[#6C47FF] text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700 shadow-md"
                >
                  Confirm Date
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Crop Modal */}
      <AnimatePresence>
        {showCropModal && previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="font-black text-slate-800 text-lg">Crop Image</h3>
                  <p className="text-xs text-slate-500 font-medium">Adjust the image to fit the LED screen</p>
                </div>
                <button 
                  onClick={handleSkipCrop}
                  className="p-2 bg-white text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors shadow-sm border border-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 flex-1 overflow-auto flex justify-center bg-slate-800 relative">
                <ReactCrop 
                  crop={crop} 
                  onChange={c => setCrop(c)} 
                  onComplete={c => setCompletedCrop(c)}
                  aspect={9 / 16}
                  className="max-h-[60vh] object-contain mx-auto rounded-lg shadow-xl"
                >
                  <img 
                    ref={imgRef}
                    src={previewUrl} 
                    alt="Upload preview" 
                    className="max-h-[60vh] object-contain rounded-lg"
                    onLoad={(e) => {
                      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
                      const imageAspect = width / height;
                      const targetAspect = 9 / 16;
                      let w = 80;
                      let h = 80;
                      if (imageAspect > targetAspect) {
                        h = 80;
                        w = (h * targetAspect) / imageAspect;
                      } else {
                        w = 80;
                        h = (w / targetAspect) * imageAspect;
                      }
                      setCrop({
                        unit: '%',
                        width: w,
                        height: h,
                        x: (100 - w) / 2,
                        y: (100 - h) / 2
                      });
                    }}
                  />
                </ReactCrop>
              </div>

              <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSkipCrop}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Skip Cropping
                </button>
                <button
                  type="button"
                  onClick={handleCropComplete}
                  className="px-6 py-2.5 text-xs font-black text-white bg-[#6C47FF] hover:bg-indigo-700 shadow-md shadow-indigo-200 hover:shadow-lg rounded-xl transition-all"
                >
                  Crop & Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SUCCESS & MULTIPLE MEMBER WHATSAPP NOTIFICATION MODAL ── */}
      <AnimatePresence>
        {showSuccessModal && lastBookingInfo && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/admin');
              }}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl text-center space-y-6 z-10 overflow-hidden"
            >
              {/* Confetti / Success Header */}
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle size={32} />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Campaign Booked!</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Your ad campaign has been successfully registered. You can monitor the approval status directly from your dashboard.
                </p>
              </div>

              {/* Booking Details Summary */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left text-xs font-semibold text-slate-600 space-y-2.5">
                <div className="flex justify-between">
                  <span>Selected Size:</span>
                  <span className="text-slate-900 font-bold">{lastBookingInfo.format}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="text-slate-900 font-bold">{lastBookingInfo.duration} Seconds</span>
                </div>
                <div className="flex justify-between">
                  <span>Start Date:</span>
                  <span className="text-slate-900 font-bold">{lastBookingInfo.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Range:</span>
                  <span className="text-slate-900 font-bold">{lastBookingInfo.startTime} - {lastBookingInfo.endTime}</span>
                </div>
              </div>

              {/* Dashboard Proceed Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate('/admin');
                  }}
                  className="w-full py-4 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-[0.98]"
                >
                  Proceed to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LaunchCampaign;
