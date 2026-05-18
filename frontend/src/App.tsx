import { useState, useMemo } from 'react';

type ApartmentStatus = 'חדש' | 'יצרנו קשר' | 'נקבע סיור' | 'ראינו את הדירה' | 'במשא ומתן' | 'נחתם חוזה! 🎉' | 'ארכיון' | 'נפסל';

const STATUS_OPTIONS: ApartmentStatus[] = ['חדש', 'יצרנו קשר', 'נקבע סיור', 'ראינו את הדירה', 'במשא ומתן', 'נחתם חוזה! 🎉', 'ארכיון', 'נפסל'];

interface Criterion {
  id: string;
  label: string;
  weight: number;
}

interface Apartment {
  id: string;
  createdAt: string;
  status: ApartmentStatus;
  originalText: string;
  extractedData: {
    price: number;
    rooms: number;
    area: string;
    contactPhone?: string;
    contactName?: string; 
    moveInDate: string; 
    criteriaValues: Record<string, string>;
  };
  userNotes: string;
}

const CRITERIA_ICONS: Record<string, string> = {
  budget: '🏷️',
  moveInDate: '🗓️',
  protected_space: '🛡️',
  pet_friendly: '🐾',
  outdoor_space: '🪴',
  furnished_status: '🛋️'
};

const INITIAL_APARTMENTS: Apartment[] = [
  {
    id: '1',
    createdAt: '2026-05-18',
    status: 'חדש',
    originalText: 'דירת 3 חדרים מהממת בבנימינה, יש ממ"ד ומרפסת שמש, מותר בעלי חיים! מחיר 4,500 ש"ח',
    extractedData: {
      price: 4500,
      rooms: 3,
      area: 'בנימינה',
      contactName: 'רונית (בעלת הבית)',
      contactPhone: '050-1234567',
      moveInDate: '2026-07',
      criteriaValues: {
        protected_space: 'ממ"ד',
        pet_friendly: 'כן',
        outdoor_space: 'כן',
        furnished_status: 'לא'
      }
    },
    userNotes: 'נראית מושלמת, קרובה לרכבת.'
  },
  {
    id: '2',
    createdAt: '2026-05-17',
    status: 'במשא ומתן',
    originalText: 'דירת חדרים וחצי בגבעת עדה, 5,300 ש"ח. ללא ממ"ד, חניה בשפע.',
    extractedData: {
      price: 5300,
      rooms: 2.5,
      area: 'גבעת עדה',
      contactName: 'אילן מתווך',
      contactPhone: '054-9876543',
      moveInDate: '2026-09',
      criteriaValues: {
        protected_space: 'ללא',
        pet_friendly: 'כן',
        outdoor_space: 'לא',
        furnished_status: 'חלקי'
      }
    },
    userNotes: 'קצת יקרה ומעל התקציב האידיאלי, אבל שווה בדיקה.'
  }
];

const MONTHS_HEBREW = [
  { value: '01', label: 'ינואר' }, { value: '02', label: 'פברואר' }, { value: '03', label: 'מרץ' },
  { value: '04', label: 'אפריל' }, { value: '05', label: 'מאי' }, { value: '06', label: 'יוני' },
  { value: '07', label: 'יולי' }, { value: '08', label: 'אוגוסט' }, { value: '09', label: 'ספטמבר' },
  { value: '10', label: 'אוקטובר' }, { value: '11', label: 'נובמבר' }, { value: '12', label: 'דצמבר' }
];

export default function App() {
  const [apartments, setApartments] = useState<Apartment[]>(INITIAL_APARTMENTS);
  const [idealBudget, setIdealBudget] = useState<number>(4000);
  const [maxBudget, setMaxBudget] = useState<number>(5000);
  const [selectedAptId, setSelectedAptId] = useState<string | null>('1');

  const [targetMonth, setTargetMonth] = useState('07');
  const [targetYear, setTargetYear] = useState('2026');
  
  const targetMonthStr = useMemo(() => `${targetYear}-${targetMonth}`, [targetMonth, targetYear]);

  const [dateWeight, setDateWeight] = useState(4);
  const [budgetWeight, setBudgetWeight] = useState(5);

  const [confetti, setConfetti] = useState<{ id: number; left: number; top: number; type: 'house' | 'circle' | 'square'; color: string; duration: number; delay: number; angleClass: string }[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all'); 

  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: 'protected_space', label: 'מרחב מוגן (ממ"ד)', weight: 5 },
    { id: 'pet_friendly', label: 'בעלי חיים', weight: 4 },
    { id: 'outdoor_space', label: 'מרפסת / גינה', weight: 3 },
    { id: 'furnished_status', label: 'ריהוט', weight: 2 },
  ]);

  const [newCriterionLabel, setNewCriterionLabel] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [fbPostText, setFbPostText] = useState('');
  const [manualPrice, setManualPrice] = useState('4500');
  const [manualArea, setManualArea] = useState('בנימינה');
  const [manualMonth, setManualMonth] = useState('07');
  const [manualYear, setManualYear] = useState('2026');
  const [manualPhone, setManualPhone] = useState('');
  const [manualName, setManualName] = useState(''); 

  const triggerConfetti = () => {
    const colors = ['text-[#e9c46a]', 'text-[#2a9d8f]', 'text-[#e76f51]', 'text-[#f4a261]', 'text-[#8ab17d]', 'text-rose-400', 'text-amber-400', 'text-sky-400'];
    const types: ('house' | 'circle' | 'square')[] = ['circle', 'square', 'house', 'circle'];
    
    const particles = Array.from({ length: 250 }).map((_, i) => {
      let left = Math.random() * 100;
      let top = -20;
      let angleClass = 'animate-confetti-top';
      
      if (i % 3 === 0) { left = -5; top = Math.random() * 50 + 20; angleClass = 'animate-confetti-left'; }
      if (i % 3 === 1) { left = 105; top = Math.random() * 50 + 20; angleClass = 'animate-confetti-right'; }

      return {
        id: i,
        left,
        top,
        type: types[Math.floor(Math.random() * types.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: Math.random() * 2 + 2.5, 
        delay: Math.random() * 0.5,
        angleClass
      };
    });
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 5500);
  };

  const handleStatusChange = (id: string, newStatus: ApartmentStatus) => {
    setApartments(prev => prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt));
    if (newStatus === 'נחתם חוזה! 🎉') {
      triggerConfetti();
    }
  };

  const handleNotesChange = (id: string, notes: string) => {
    setApartments(prev => prev.map(apt => apt.id === id ? { ...apt, userNotes: notes } : apt));
  };

  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriterionLabel.trim()) return;
    const newId = `custom_${Date.now()}`;
    setCriteria(prev => [...prev, { id: newId, label: newCriterionLabel.trim(), weight: 3 }]);
    setNewCriterionLabel('');
  };

  const handleDeleteCriterion = (id: string) => {
    setCriteria(prev => prev.filter(c => c.id !== id));
  };

  const handleWeightChange = (id: string, newWeight: number) => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, weight: newWeight } : c));
  };

  const handleAptCriteriaValueChange = (aptId: string, criterionId: string, value: string) => {
    setApartments(prev => prev.map(apt => {
      if (apt.id !== aptId) return apt;
      return {
        ...apt,
        extractedData: { ...apt.extractedData, criteriaValues: { ...apt.extractedData.criteriaValues, [criterionId]: value } }
      };
    }));
  };

  const handleAddApartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbPostText.trim()) return;

    const defaultValues: Record<string, string> = {};
    criteria.forEach(c => {
      if (c.id === 'protected_space') defaultValues[c.id] = 'ממ"ד';
      else if (c.id === 'pet_friendly') defaultValues[c.id] = 'כן';
      else defaultValues[c.id] = 'כן';
    });

    const newApt: Apartment = {
      id: String(Date.now()),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'חדש',
      originalText: fbPostText,
      extractedData: {
        price: Number(manualPrice),
        rooms: 3,
        area: manualArea,
        moveInDate: `${manualYear}-${manualMonth}`,
        contactName: manualName || undefined,
        contactPhone: manualPhone || undefined,
        criteriaValues: defaultValues
      },
      userNotes: ''
    };

    setApartments(prev => [newApt, ...prev]);
    setFbPostText('');
    setManualPhone('');
    setManualName('');
    setShowAddForm(false);
    setSelectedAptId(newApt.id);
  };

  const processedApartments = useMemo(() => {
    return apartments.map(apt => {
      const price = apt.extractedData.price;
      let sBudget = 0;
      let isOverBudget = false;

      if (price <= idealBudget) {
        sBudget = 1.0;
      } else if (price > maxBudget) {
        sBudget = 0.0;
        isOverBudget = true;
      } else {
        sBudget = 1.0 - ((price - idealBudget) / (maxBudget - idealBudget));
      }

      const [targetY, targetM] = targetMonthStr.split('-').map(Number);
      const [aptYear, aptMonthNum] = apt.extractedData.moveInDate.split('-').map(Number);
      const monthDistance = Math.abs((targetY * 12 + targetM) - (aptYear * 12 + aptMonthNum));
      const sDate = Math.max(0, 1.0 - (monthDistance * 0.25));

      let totalNumerator = (budgetWeight * sBudget) + (dateWeight * sDate);
      let totalDenominator = budgetWeight + dateWeight;

      const breakdownRows = [
        { id: 'budget', criterion: 'תקציב חודשי', value: `${price.toLocaleString()} ₪`, weight: budgetWeight, normalized: sBudget, weightedPoints: budgetWeight * sBudget },
        { id: 'moveInDate', criterion: 'חודש כניסה', value: apt.extractedData.moveInDate, weight: dateWeight, normalized: sDate, weightedPoints: dateWeight * sDate }
      ];

      criteria.forEach(c => {
        const val = apt.extractedData.criteriaValues[c.id] || 'לא';
        let score = 0;

        if (c.id === 'protected_space') {
          if (val === 'ממ"ד') score = 1.0;
          if (val === 'מקלט') score = 0.5;
          if (val === 'ללא') score = -0.5;
        } else {
          if (val === 'כן') score = 1.0;
          if (val === 'חלקי') score = 0.5;
          if (val === 'לא') score = 0.0;
        }

        totalNumerator += c.weight * score;
        totalDenominator += c.weight;

        breakdownRows.push({ id: c.id, criterion: c.label, value: val, weight: c.weight, normalized: score, weightedPoints: c.weight * score });
      });

      const finalScore = Math.max(0, Math.min(100, Math.round((totalNumerator / totalDenominator) * 100)));

      return {
        ...apt,
        isOverBudget,
        matchScore: finalScore,
        breakdown: breakdownRows
      };
    });
  }, [apartments, idealBudget, maxBudget, criteria, targetMonthStr, dateWeight, budgetWeight]);

  const filteredApartments = useMemo(() => {
    if (activeFilter === 'all') return processedApartments;
    return processedApartments.filter(apt => {
      const val = apt.extractedData.criteriaValues[activeFilter];
      return val === 'כן' || val === 'ממ"ד';
    });
  }, [processedApartments, activeFilter]);

  const activeApartmentDetails = processedApartments.find(a => a.id === selectedAptId);

  const formatMonthHebrew = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="min-h-screen bg-[#f7f4eb] text-stone-800 font-sans antialiased flex w-full relative overflow-x-hidden select-none" dir="rtl">
      
      <style>{`
        @keyframes fallTop {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
        @keyframes blastLeft {
          0% { transform: translate(-20px, 0) rotate(0deg) scale(0.5); opacity: 1; }
          50% { transform: translate(35vw, -20vh) rotate(360deg) scale(1.2); }
          100% { transform: translate(70vw, 85vh) rotate(1000deg) opacity: 0; }
        }
        @keyframes blastRight {
          0% { transform: translate(20px, 0) rotate(0deg) scale(0.5); opacity: 1; }
          50% { transform: translate(-35vw, -20vh) rotate(-360deg) scale(1.2); }
          100% { transform: translate(-70vw, 85vh) rotate(-1000deg) opacity: 0; }
        }
        .animate-confetti-top { animation: fallTop var(--dur) cubic-bezier(0.1, 0.8, 0.3, 1) forwards; }
        .animate-confetti-left { animation: blastLeft var(--dur) cubic-bezier(0.1, 0.6, 0.2, 1) forwards; }
        .animate-confetti-right { animation: blastRight var(--dur) cubic-bezier(0.1, 0.6, 0.2, 1) forwards; }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 14px; height: 14px; border-radius: 50%;
          background: #ca6a43; cursor: pointer; transition: transform 0.1s;
        }
        input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.3); }
      `}</style>

      {confetti.map(p => (
        <div 
          key={p.id}
          className={`absolute font-sans font-black z-50 pointer-events-none select-none text-base ${p.angleClass} ${p.color}`}
          style={{ 
            left: `${p.left}%`, 
            top: `${p.top}px`,
            ['--dur' as any]: `${p.duration}s`,
            animationDelay: `${p.delay}s` 
          }}
        >
          {p.type === 'house' ? '🏠' : p.type === 'circle' ? '●' : '■'}
        </div>
      ))}
      
      {/* סרגל צידי */}
      <aside className="w-80 bg-[#ede5d3] p-6 flex flex-col gap-8 sticky top-0 h-screen overflow-y-auto shrink-0 shadow-[4px_0_24px_rgba(120,108,95,0.03)]">
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl text-[#ca6a43]">🏹</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-stone-900 font-sans">ApartmentHunter</h1>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-0.5 font-sans">עדי & שחר • בית משותף</p>
            </div>
          </div>
          
          <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl shadow-[0_4px_20px_rgba(139,120,100,0.02)] flex flex-col gap-2">
            <span className="text-[11px] font-bold text-stone-600 flex items-center gap-1.5 font-sans">
              <span>{CRITERIA_ICONS.moveInDate}</span> תאריך כניסה רצוי
            </span>
            <div className="flex gap-2">
              <select 
                value={targetMonth} 
                onChange={(e) => setTargetMonth(e.target.value)}
                className="flex-1 bg-white font-sans font-medium outline-none rounded-xl p-2.5 text-xs border-0 shadow-sm text-stone-800 cursor-pointer"
              >
                {MONTHS_HEBREW.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select 
                value={targetYear} 
                onChange={(e) => setTargetYear(e.target.value)}
                className="w-24 bg-white font-sans font-medium outline-none rounded-xl p-2.5 text-xs border-0 shadow-sm text-stone-800 cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>
        </div>

        {/* טווח תקציב */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 flex items-center gap-1 font-sans">
            <span>{CRITERIA_ICONS.budget}</span> תקציב ומסגרת
          </h2>
          
          <div className="bg-white/50 p-4 rounded-2xl flex flex-col gap-3 shadow-[0_4px_20px_rgba(139,120,100,0.02)]">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-600 flex justify-between font-medium font-sans">
                <span>תקציב אידיאלי:</span>
                <span className="text-emerald-700 font-bold">{idealBudget.toLocaleString()} ₪</span>
              </label>
              <input 
                type="range" min="3000" max="8000" step="100" 
                value={idealBudget} onChange={(e) => setIdealBudget(Number(e.target.value))}
                className="w-full bg-stone-300/60 h-0.5 rounded-lg appearance-none cursor-pointer outline-none my-2"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-stone-600 flex justify-between font-medium font-sans">
                <span>טווח עליון:</span>
                <span className="text-[#ca6a43] font-bold">{maxBudget.toLocaleString()} ₪</span>
              </label>
              <input 
                type="range" min="4000" max="10000" step="100" 
                value={maxBudget} onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full bg-stone-300/60 h-0.5 rounded-lg appearance-none cursor-pointer outline-none my-2"
              />
            </div>
          </div>
        </div>

        {/* חשיבות פרמטרים */}
        <div className="flex flex-col gap-3">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-stone-500 font-sans">מדדי חשיבות (1-5)</h2>
          
          <div className="flex justify-between items-center bg-white/50 px-3.5 py-2.5 rounded-xl text-xs">
            <span className="font-medium text-stone-700 flex items-center gap-1.5 font-sans">
              <span>{CRITERIA_ICONS.budget}</span> תקציב חודשי
            </span>
            <select value={budgetWeight} onChange={(e) => setBudgetWeight(Number(e.target.value))} className="bg-white text-stone-800 rounded-lg p-1 border-0 outline-none shadow-sm cursor-pointer font-sans font-bold">
              {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div className="flex justify-between items-center bg-white/50 px-3.5 py-2.5 rounded-xl text-xs">
            <span className="font-medium text-stone-700 flex items-center gap-1.5 font-sans">
              <span>{CRITERIA_ICONS.moveInDate}</span> סנכרון תאריך כניסה
            </span>
            <select value={dateWeight} onChange={(e) => setDateWeight(Number(e.target.value))} className="bg-white text-stone-800 rounded-lg p-1 border-0 outline-none shadow-sm cursor-pointer font-sans font-bold">
              {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {criteria.map((c) => (
            <div key={c.id} className="flex justify-between items-center bg-white/50 px-3.5 py-2.5 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <button onClick={() => handleDeleteCriterion(c.id)} className="text-stone-400 hover:text-stone-600 transition font-sans">
                  ✕
                </button>
                <span className="font-medium text-stone-700 flex items-center gap-1.5 font-sans">
                  <span>{CRITERIA_ICONS[c.id] || '✨'}</span> {c.label}
                </span>
              </div>
              <select 
                value={c.weight} 
                onChange={(e) => handleWeightChange(c.id, Number(e.target.value))}
                className="bg-white text-stone-800 rounded-lg p-1 border-0 outline-none shadow-sm cursor-pointer font-sans font-bold"
              >
                {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          ))}

          <form onSubmit={handleAddCriterion} className="mt-2 flex gap-2">
            <input 
              type="text"
              placeholder="פרמטר חדש (חניה, קומה...)"
              value={newCriterionLabel}
              onChange={(e) => setNewCriterionLabel(e.target.value)}
              className="flex-1 bg-white/50 border-0 rounded-xl p-2.5 text-xs outline-none focus:bg-white transition placeholder-stone-400 shadow-inner font-sans text-stone-800"
            />
            <button type="submit" className="bg-stone-700 hover:bg-stone-800 text-white text-xs px-3 rounded-xl font-bold transition shadow-sm font-sans">
              ＋
            </button>
          </form>
        </div>
      </aside>

      {/* אזור תוכן מרכזי */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f7f4eb]">
        
        {/* באנר עליון */}
        <header className="bg-[#f7f4eb]/80 backdrop-blur p-5 sticky top-0 z-10 flex justify-between items-center px-10">
          <div className="flex gap-6">
            <div className="text-center flex flex-col items-start">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider font-sans">נכסים במעקב</span>
              <span className="text-2xl font-bold text-stone-800 mt-0.5 font-sans">{processedApartments.length}</span>
            </div>
            <div className="text-center flex flex-col items-start">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider font-sans">במשא ומתן</span>
              <span className="text-2xl font-bold text-[#ca6a43] mt-0.5 font-sans">
                {processedApartments.filter(a => a.status === 'במשא ומתן').length}
              </span>
            </div>
          </div>

          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-stone-800 hover:bg-stone-900 text-[#fbf9f4] font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition duration-300 font-sans"
          >
            {showAddForm ? 'סגור תפריט פוסט' : '＋ הוספת דירה מפייסבוק'}
          </button>
        </header>

        {/* בר סינון מהיר */}
        <div className="px-10 pb-2 flex gap-2 items-center overflow-x-auto">
          <span className="text-xs text-stone-500 font-bold ml-2 shrink-0 font-sans">סינון מהיר:</span>
          <button 
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition font-sans ${activeFilter === 'all' ? 'bg-[#ca6a43] text-white shadow-sm' : 'bg-white text-stone-700 hover:bg-[#f4ede2]'}`}
          >
            הכל ({processedApartments.length})
          </button>
          {criteria.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveFilter(c.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 font-sans ${activeFilter === c.id ? 'bg-[#557a46] text-white shadow-sm' : 'bg-white text-stone-700 hover:bg-[#f4ede2]'}`}
            >
              <span>{CRITERIA_ICONS[c.id] || '✨'}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* חלונית הוספת דירה */}
        {showAddForm && (
          <div className="mx-10 my-4 p-6 bg-white rounded-3xl shadow-[0_10px_40px_rgba(139,120,100,0.05)] flex flex-col gap-4">
            <h3 className="text-sm font-bold text-stone-800 font-sans">הדבקת פוסט דירה חדש</h3>
            <form onSubmit={handleAddApartment} className="flex flex-col gap-4">
              <textarea 
                rows={3}
                placeholder="הדביקי פה את הטקסט החופשי של הפוסט מהפייסבוק..."
                value={fbPostText}
                onChange={(e) => setFbPostText(e.target.value)}
                className="w-full p-4 bg-stone-50/60 text-xs border-0 rounded-2xl outline-none focus:bg-stone-50 transition text-stone-800 shadow-inner font-sans"
                required
              />
              <div className="grid grid-cols-5 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-stone-500 font-sans">מחיר לחודש:</label>
                  <input type="number" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} className="p-2.5 bg-stone-50/60 text-xs rounded-xl text-stone-800 font-sans" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-stone-500 font-sans">יישוב:</label>
                  <input type="text" value={manualArea} onChange={(e) => setManualArea(e.target.value)} className="p-2.5 bg-stone-50/60 text-xs rounded-xl text-stone-800 font-sans" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-stone-500 font-sans">חודש:</label>
                  <select value={manualMonth} onChange={(e) => setManualMonth(e.target.value)} className="p-2.5 bg-stone-50/60 text-xs rounded-xl text-stone-800 font-sans font-bold">
                    {MONTHS_HEBREW.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-stone-500 font-sans">שם איש קשר:</label>
                  <input type="text" placeholder="למשל: דני (בעל הבית)" value={manualName} onChange={(e) => setManualName(e.target.value)} className="p-2.5 bg-stone-50/60 text-xs rounded-xl text-stone-800 font-sans" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-stone-500 font-sans">מספר טלפון:</label>
                  <input type="text" placeholder="05x-xxxxxxx" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} className="p-2.5 bg-stone-50/60 text-xs rounded-xl text-stone-800 font-sans" />
                </div>
              </div>
              <button type="submit" className="bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs py-3 rounded-xl shadow-md transition font-sans">
                חלץ נתונים והוסף למערכת
              </button>
            </form>
          </div>
        )}

        <div className="p-10 flex flex-col lg:flex-row gap-10 flex-1 overflow-y-auto pt-4">
          
          {/* רשימת הכרטיסיות */}
          <div className="flex-1 flex flex-col gap-5">
            {filteredApartments.length > 0 ? (
              filteredApartments.map((apt) => {
                const isSelected = selectedAptId === apt.id;
                
                let cardStyle = "bg-white shadow-[0_8px_30px_rgba(139,120,100,0.04)] hover:shadow-[0_20px_40px_rgba(139,120,100,0.08)] hover:-translate-y-0.5";
                if (apt.status === 'נחתם חוזה! 🎉') {
                  cardStyle = "bg-[#f1f6f0] shadow-[0_8px_30px_rgba(42,157,143,0.04)]";
                } else if (apt.status === 'נפסל' || apt.status === 'ארכיון') {
                  cardStyle = "bg-white/40 opacity-40 blur-[0.2px] shadow-none"; 
                } else if (isSelected) {
                  cardStyle = "bg-white shadow-[0_20px_40px_rgba(120,108,95,0.12)] ring-1 ring-stone-400/40";
                }

                return (
                  <div 
                    key={apt.id} 
                    onClick={() => setSelectedAptId(apt.id)}
                    className={`p-6 rounded-3xl transition-all duration-300 cursor-pointer flex flex-col gap-4 relative ${cardStyle}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        
                        <select 
                          value={apt.status} 
                          onClick={(e) => e.stopPropagation()} 
                          onChange={(e) => handleStatusChange(apt.id, e.target.value as ApartmentStatus)}
                          className="text-[11px] font-sans font-bold bg-[#f4ede2] text-stone-700 px-3 py-1.5 rounded-xl border-0 outline-none cursor-pointer shadow-sm transition hover:bg-[#ede5d3]"
                        >
                          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>

                        <h3 className="text-lg font-bold text-stone-900 font-sans tracking-tight">
                          {apt.extractedData.area} • <span className="text-stone-500 font-medium">{apt.extractedData.rooms} חדרים</span>
                        </h3>
                      </div>
                      
                      <div className="text-left">
                        <div className={`text-2xl font-black font-sans leading-none ${apt.status === 'נחתם חוזה! 🎉' ? 'text-emerald-600' : apt.matchScore > 80 ? 'text-emerald-600' : 'text-[#ca6a43]'}`}>
                          {apt.matchScore}%
                        </div>
                        <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider font-sans block mt-1">התאמה</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-y-2 gap-x-6 text-xs bg-[#fbfaf7] p-3 rounded-2xl shadow-inner text-stone-700 font-sans">
                      <div>
                        <span className="text-stone-400">💰 שכירות: </span>
                        <span className="font-bold text-stone-800">
                          {apt.extractedData.price.toLocaleString()} ₪
                        </span>
                        {apt.isOverBudget && <span className="text-[10px] text-[#ca6a43] font-bold mr-1.5">(מעל התקציב הרצוי)</span>}
                      </div>
                      <div>
                        <span className="text-stone-400">📅 פינוי: </span>
                        <span className="text-stone-800 font-bold">{formatMonthHebrew(apt.extractedData.moveInDate)}</span>
                      </div>
                      {(apt.extractedData.contactName || apt.extractedData.contactPhone) && (
                        <div>
                          <span className="text-stone-400">👤 קשר: </span>
                          <span className="text-stone-800 font-bold">
                            {apt.extractedData.contactName || 'בעל הנכס'} {apt.extractedData.contactPhone ? `• ${apt.extractedData.contactPhone}` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-stone-400 line-clamp-2 bg-stone-50/30 p-3 rounded-xl italic font-sans leading-relaxed">
                      "{apt.originalText}"
                    </p>

                    {apt.userNotes && (
                      <div className="text-xs text-stone-600 font-medium bg-[#fcfbf9] p-3 rounded-2xl shadow-sm italic font-sans border-r-2 border-[#ca6a43]">
                        📝 {apt.userNotes}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center p-12 text-stone-400 bg-white/40 rounded-3xl italic text-xs font-sans">
                אין דירות התואמות את הסינון המבוקש כרגע
              </div>
            )}
          </div>

          {/* חלונית הפירוט האנליטית */}
          <div className="w-full lg:w-96 shrink-0 flex flex-col gap-4">
            {activeApartmentDetails ? (
              <div className="bg-white rounded-3xl p-6 sticky top-28 shadow-[0_12px_40px_rgba(139,120,100,0.04)] flex flex-col gap-5">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-sans tracking-tight">ציון והתאמת קריטריונים</h3>
                  <p className="text-[11px] text-stone-400 font-medium mt-0.5 font-sans">עדכון ושיוף נתוני הדירה בזמן אמת:</p>
                </div>

                <div className="flex flex-col gap-3">
                  {activeApartmentDetails.breakdown.map((row, i) => {
                    const associatedCriterion = criteria.find(c => c.label === row.criterion);
                    const icon = CRITERIA_ICONS[row.id] || '✨';
                    
                    return (
                      <div key={i} className="bg-stone-50/60 p-3.5 rounded-2xl shadow-sm flex flex-col gap-1.5 text-xs font-sans">
                        <div className="flex justify-between items-center font-bold text-stone-800 font-sans">
                          <span className="font-sans text-stone-700 flex items-center gap-1.5">
                            <span>{icon}</span> {row.criterion}
                          </span>
                          
                          {associatedCriterion ? (
                            <select
                              value={activeApartmentDetails.extractedData.criteriaValues[associatedCriterion.id] || 'לא'}
                              onChange={(e) => handleAptCriteriaValueChange(activeApartmentDetails.id, associatedCriterion.id, e.target.value)}
                              className="bg-white text-[11px] font-sans font-bold border-0 shadow-sm rounded-lg p-1.5 text-stone-800 outline-none cursor-pointer"
                            >
                              {/* שינוי הערכים כאן למנוע קריסה (עטיפת ממ"ד בגרשיים בודדים חיצוניים) */}
                              {associatedCriterion.id === 'protected_space' ? (
                                <>
                                  <option value='ממ"ד'>ממ"ד 🛡️</option>
                                  <option value="מקלט">מקלט 🧱</option>
                                  <option value="ללא">ללא ⚠️</option>
                                </>
                              ) : associatedCriterion.id === 'pet_friendly' ? (
                                <>
                                  <option value="כן">כן 🐾</option>
                                  <option value="לא">לא ✕</option>
                                </>
                              ) : (
                                <>
                                  <option value="כן">כן</option>
                                  <option value="חלקי">חלקי</option>
                                  <option value="לא">לא</option>
                                </>
                              )}
                            </select>
                          ) : (
                            <span className="text-stone-800 font-bold text-[11px] bg-[#f4ede2] px-2.5 py-1 rounded-lg font-sans">
                              {row.id === 'moveInDate' ? formatMonthHebrew(row.value) : row.value}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex justify-between text-[10px] text-stone-400 mt-1 border-t border-stone-200/40 pt-1.5 font-medium font-sans">
                          <span>משקל: {row.weight}</span>
                          <span>מדד: {(row.normalized * 100).toFixed(0)}%</span>
                          <span className={row.weightedPoints < 0 ? 'text-rose-600 font-black' : 'text-emerald-700 font-bold'}>
                            {row.weightedPoints >= 0 ? `+${row.weightedPoints.toFixed(1)}` : row.weightedPoints.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-stone-50/60 p-3.5 rounded-2xl shadow-sm flex flex-col gap-2 text-xs font-sans">
                  <span className="text-stone-500 font-bold font-sans">📝 הערות אישיות על הנכס:</span>
                  <textarea
                    rows={3}
                    placeholder="כתבו פה דברים שסגרתם, התרשמויות מהסיור, מידע על השכנים או חניה..."
                    value={activeApartmentDetails.userNotes}
                    onChange={(e) => handleNotesChange(activeApartmentDetails.id, e.target.value)}
                    className="w-full p-3 bg-white rounded-xl font-sans text-xs text-stone-700 border-0 outline-none shadow-sm resize-none leading-relaxed"
                  />
                </div>
              </div>
            ) : (
              <div className="text-xs text-stone-400 italic p-6 bg-white/40 rounded-3xl text-center font-sans">בחרי דירה כדי להציג את ניתוח ההתאמה</div>
            )}
          </div>

        </div>
      </main>

    </div>
  );
}