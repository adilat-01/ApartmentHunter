import { useState, useMemo, useEffect, useCallback } from 'react';
import AuthScreen from './AuthScreen';
import ImageLightbox from './ImageLightbox';
import MainWorkspace from './MainWorkspace';
import { buildManualFromForm } from './apartmentPayload';
import {
  type Apartment,
  type ApartmentImage,
  clearAuth,
  createApartmentFromSources,
  deleteApartment,
  deleteApartmentImage,
  fetchApartments,
  authDisplayName,
  type AuthUser,
  getStoredUser,
  updateApartment,
  uploadApartmentImage,
} from './api';

type ApartmentStatus = 'חדש' | 'יצרנו קשר' | 'נקבע סיור' | 'ראינו את הדירה' | 'במשא ומתן' | 'נחתם חוזה! 🎉' | 'ארכיון' | 'נפסל';

const STATUS_OPTIONS: ApartmentStatus[] = ['חדש', 'יצרנו קשר', 'נקבע סיור', 'ראינו את הדירה', 'במשא ומתן', 'נחתם חוזה! 🎉', 'ארכיון', 'נפסל'];

const INACTIVE_STATUSES = new Set<ApartmentStatus>(['ארכיון', 'נפסל']);

export function isInactiveApartmentStatus(status: string): boolean {
  return INACTIVE_STATUSES.has(status as ApartmentStatus);
}

interface Criterion {
  id: string;
  label: string;
  weight: number;
}

const CRITERIA_ICONS: Record<string, string> = {
  budget: '🏷️',
  moveInDate: '🗓️',
  protected_space: '🛡️',
  pet_friendly: '🐾',
  outdoor_space: '🪴',
  furnished_status: '🛋️'
};

const MAX_APARTMENT_IMAGES = 5;

const MONTHS_HEBREW = [
  { value: '01', label: 'ינואר' }, { value: '02', label: 'פברואר' }, { value: '03', label: 'מרץ' },
  { value: '04', label: 'אפריל' }, { value: '05', label: 'מאי' }, { value: '06', label: 'יוני' },
  { value: '07', label: 'יולי' }, { value: '08', label: 'אוגוסט' }, { value: '09', label: 'ספטמבר' },
  { value: '10', label: 'אוקטובר' }, { value: '11', label: 'נובמבר' }, { value: '12', label: 'דצמבר' }
];

type AppTab = 'dashboard' | 'add';

interface ManualFormState {
  city: string;
  price: string;
  rooms: string;
  moveInMonth: string;
  moveInYear: string;
  contactName: string;
  contactPhone: string;
  userNotes: string;
  protected_space: string;
  pet_friendly: string;
  outdoor_space: string;
  furnished_status: string;
}

const EMPTY_MANUAL_FORM: ManualFormState = {
  city: '',
  price: '',
  rooms: '',
  moveInMonth: '07',
  moveInYear: '2026',
  contactName: '',
  contactPhone: '',
  userNotes: '',
  protected_space: 'ללא',
  pet_friendly: 'לא',
  outdoor_space: 'לא',
  furnished_status: 'לא',
};

function getFeaturedImage(apt: Apartment): ApartmentImage | null {
  const images = apt.images ?? [];
  if (images.length === 0) return null;
  const idx = parseInt(apt.id, 10) % images.length;
  return images[idx] ?? images[0];
}

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(true);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [idealBudget, setIdealBudget] = useState<number>(4000);
  const [maxBudget, setMaxBudget] = useState<number>(5000);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [targetMonth, setTargetMonth] = useState('07');
  const [targetYear, setTargetYear] = useState('2026');
  
  const targetMonthStr = useMemo(() => `${targetYear}-${targetMonth}`, [targetMonth, targetYear]);

  const [dateWeight, setDateWeight] = useState(4);
  const [budgetWeight, setBudgetWeight] = useState(5);

  const [confetti, setConfetti] = useState<{
    id: number;
    left: number;
    type: 'house' | 'circle' | 'square';
    color: string;
    duration: number;
    delay: number;
    scale: number;
  }[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all'); 
  const [isLoading, setIsLoading] = useState(false);

  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: 'protected_space', label: 'מרחב מוגן (ממ"ד)', weight: 5 },
    { id: 'pet_friendly', label: 'בעלי חיים', weight: 4 },
    { id: 'outdoor_space', label: 'מרפסת / גינה', weight: 3 },
    { id: 'furnished_status', label: 'ריהוט', weight: 2 },
  ]);

  const [newCriterionLabel, setNewCriterionLabel] = useState('');
  const [fbPostText, setFbPostText] = useState('');
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [manualForm, setManualForm] = useState<ManualFormState>(EMPTY_MANUAL_FORM);
  const [lightbox, setLightbox] = useState<{
    images: ApartmentImage[];
    index: number;
  } | null>(null);

  const loadApartments = useCallback(async () => {
    try {
      const data = await fetchApartments();
      setApartments(data);
      setSelectedAptId((prev) =>
        prev && data.some((a) => a.id === prev) ? prev : null
      );
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message === 'Session expired') {
        clearAuth();
        setAuthUser(null);
      }
    }
  }, []);

  useEffect(() => {
    if (authUser) {
      setAuthChecked(false);
      loadApartments().finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, [authUser, loadApartments]);

  const handleLogout = () => {
    clearAuth();
    setAuthUser(null);
    setApartments([]);
    setSelectedAptId(null);
    setAuthChecked(true);
  };

  const triggerConfetti = () => {
    const colors = [
      'text-[#e9c46a]',
      'text-[#2a9d8f]',
      'text-[#e76f51]',
      'text-[#f4a261]',
      'text-[#8ab17d]',
      'text-rose-400',
      'text-amber-400',
      'text-sky-400',
    ];
    const types: ('house' | 'circle' | 'square')[] = [
      'circle',
      'square',
      'house',
      'circle',
    ];

    const particles = Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      type: types[Math.floor(Math.random() * types.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: Math.random() * 2 + 2.8,
      delay: Math.random() * 1.5,
      scale: Math.random() * 0.6 + 0.7,
    }));
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 5000);
  };

  const handleStatusChange = async (id: string, newStatus: ApartmentStatus) => {
    setApartments((prev) =>
      prev.map((apt) =>
        apt.id === id ? { ...apt, status: newStatus } : apt
      )
    );
    if (isInactiveApartmentStatus(newStatus)) {
      setSelectedAptId((current) => (current === id ? null : current));
    }
    if (newStatus === 'נחתם חוזה! 🎉') {
      triggerConfetti();
    }
    try {
      await updateApartment(id, { status: newStatus });
    } catch (error) {
      console.error(error);
      loadApartments();
    }
  };

  const handleNotesChange = (id: string, notes: string) => {
    setApartments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, userNotes: notes } : apt))
    );
  };

  const handleNotesBlur = async (id: string, notes: string) => {
    try {
      await updateApartment(id, { userNotes: notes });
    } catch (error) {
      console.error(error);
      loadApartments();
    }
  };

  const handleDeleteApartment = async (id: string) => {
    if (
      !confirm(
        'למחוק את הדירה מהמעקב? כל התמונות והנתונים יימחקו לצמיתות.'
      )
    ) {
      return;
    }

    const previous = apartments;
    const previousSelected = selectedAptId;
    const remaining = previous.filter((apt) => apt.id !== id);
    setApartments(remaining);
    setSelectedAptId((current) => {
      if (current !== id) return current;
      return remaining[0]?.id ?? null;
    });

    try {
      await deleteApartment(id);
    } catch (error) {
      setApartments(previous);
      setSelectedAptId(previousSelected);
      alert(
        error instanceof Error ? error.message : 'שגיאה במחיקת הדירה'
      );
    }
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

  const handleAptCriteriaValueChange = async (
    aptId: string,
    criterionId: string,
    value: string
  ) => {
    const apt = apartments.find((a) => a.id === aptId);
    if (!apt) return;

    const extractedData = {
      ...apt.extractedData,
      criteriaValues: {
        ...apt.extractedData.criteriaValues,
        [criterionId]: value,
      },
    };

    setApartments((prev) =>
      prev.map((a) =>
        a.id === aptId ? { ...a, extractedData } : a
      )
    );

    try {
      await updateApartment(aptId, { extractedData });
    } catch (error) {
      console.error(error);
      loadApartments();
    }
  };

  const handleImageUpload = async (
    aptId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageCount =
      apartments.find((a) => a.id === aptId)?.images?.length ?? 0;
    if (imageCount >= MAX_APARTMENT_IMAGES) {
      alert(
        'ניתן להעלות עד 5 תמונות לכל דירה. מחקו תמונה קיימת כדי להוסיף אחת חדשה.'
      );
      e.target.value = '';
      return;
    }

    setUploadingImage(true);
    try {
      const image = await uploadApartmentImage(aptId, file);
      setApartments((prev) =>
        prev.map((apt) =>
          apt.id === aptId
            ? { ...apt, images: [...(apt.images ?? []), image] }
            : apt
        )
      );
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'שגיאה בהעלאת תמונה'
      );
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleImageDelete = async (aptId: string, imageId: number) => {
    try {
      await deleteApartmentImage(aptId, imageId);
      setApartments((prev) =>
        prev.map((apt) =>
          apt.id === aptId
            ? {
                ...apt,
                images: (apt.images ?? []).filter((img) => img.id !== imageId),
              }
            : apt
        )
      );
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'שגיאה במחיקת תמונה'
      );
    }
  };

  const resetAddForm = () => {
    setFbPostText('');
    setManualForm(EMPTY_MANUAL_FORM);
  };

  const handleCreateApartment = async () => {
    if (isLoading) return;

    if (!fbPostText.trim() && !manualForm.city.trim()) {
      alert('מלאו לפחות עיר ידנית או הדביקו פוסט מפייסבוק.');
      return;
    }

    setIsLoading(true);
    try {
      const newApt = await createApartmentFromSources({
        postText: fbPostText.trim(),
        manual: buildManualFromForm(manualForm),
        userNotes: manualForm.userNotes.trim(),
        status: 'חדש',
        createdAt: new Date().toISOString().split('T')[0],
      });

      setApartments((prev) => [newApt, ...prev]);
      resetAddForm();
      setActiveTab('dashboard');
      setSelectedAptId(newApt.id);
      triggerConfetti();
    } catch (error) {
      alert(
        error instanceof Error ? error.message : 'שגיאה ביצירת הדירה'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const openLightbox = (images: ApartmentImage[], index: number) => {
    setLightbox({ images, index });
  };

  const processedApartments = useMemo(() => {
    return apartments.map(apt => {
      const extracted = apt.extractedData ?? {
        price: 0,
        rooms: 0,
        area: '',
        moveInDate: '2026-01',
        criteriaValues: {},
      };
      const criteriaValues = extracted.criteriaValues ?? {};
      const price = Number(extracted.price) || 0;
      const moveInDate = extracted.moveInDate ?? '2026-01';
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
      const [aptYear, aptMonthNum] = moveInDate.split('-').map(Number);
      const monthDistance = Math.abs((targetY * 12 + targetM) - (aptYear * 12 + aptMonthNum));
      const sDate = Math.max(0, 1.0 - (monthDistance * 0.25));

      let totalNumerator = (budgetWeight * sBudget) + (dateWeight * sDate);
      let totalDenominator = budgetWeight + dateWeight;

      const breakdownRows = [
        { id: 'budget', criterion: 'תקציב חודשי', value: `${price.toLocaleString()} ₪`, weight: budgetWeight, normalized: sBudget, weightedPoints: budgetWeight * sBudget },
        { id: 'moveInDate', criterion: 'חודש כניסה', value: moveInDate, weight: dateWeight, normalized: sDate, weightedPoints: dateWeight * sDate }
      ];

      criteria.forEach(c => {
        const val = criteriaValues[c.id] || 'לא';
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

  const archivedCount = useMemo(
    () =>
      processedApartments.filter((apt) =>
        isInactiveApartmentStatus(apt.status)
      ).length,
    [processedApartments]
  );

  const filteredApartments = useMemo(() => {
    if (activeFilter === 'archive') {
      return processedApartments.filter((apt) =>
        isInactiveApartmentStatus(apt.status)
      );
    }

    const activeListings = processedApartments.filter(
      (apt) => !isInactiveApartmentStatus(apt.status)
    );

    if (activeFilter === 'all') return activeListings;

    return activeListings.filter((apt) => {
      const val = apt.extractedData?.criteriaValues?.[activeFilter];
      return val === 'כן' || val === 'ממ"ד';
    });
  }, [processedApartments, activeFilter]);

  useEffect(() => {
    if (activeFilter === 'archive' || !selectedAptId) return;
    const selected = processedApartments.find((a) => a.id === selectedAptId);
    if (selected && isInactiveApartmentStatus(selected.status)) {
      setSelectedAptId(null);
    }
  }, [activeFilter, selectedAptId, processedApartments]);

  const activeApartmentDetails = processedApartments.find(a => a.id === selectedAptId);

  const formatMonthHebrew = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  };

  if (!authUser) {
    return (
      <AuthScreen
        onAuthenticated={() => {
          setAuthUser(getStoredUser());
          setAuthChecked(false);
        }}
      />
    );
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#f7f4eb] flex items-center justify-center font-sans text-stone-600">
        טוען...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4eb] text-stone-800 font-sans antialiased flex w-full relative overflow-x-hidden select-none" dir="rtl">
      
      <style>{`
        @keyframes confettiRain {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(540deg); opacity: 0; }
        }
        .animate-confetti-rain {
          animation: confettiRain var(--dur) linear forwards;
          top: -2rem;
        }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #ca6a43; cursor: pointer; transition: transform 0.1s; }
        input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.3); }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      `}</style>

      {confetti.map((p) => (
        <div
          key={p.id}
          className={`absolute font-sans font-black z-50 pointer-events-none select-none animate-confetti-rain ${p.color}`}
          style={{
            left: `${p.left}%`,
            fontSize: `${p.scale}rem`,
            ['--dur' as string]: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.type === 'house' ? '🏠' : p.type === 'circle' ? '●' : '■'}
        </div>
      ))}
      
      <MainWorkspace
        authUsername={authDisplayName(authUser)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        statsApartments={processedApartments}
        filteredApartments={filteredApartments}
        selectedAptId={selectedAptId}
        onSelectApartment={setSelectedAptId}
        activeApartmentDetails={activeApartmentDetails}
        activeFilter={activeFilter}
        onActiveFilterChange={setActiveFilter}
        archivedCount={archivedCount}
        criteria={criteria}
        criteriaIcons={CRITERIA_ICONS}
        statusOptions={STATUS_OPTIONS}
        targetMonth={targetMonth}
        onTargetMonthChange={setTargetMonth}
        targetYear={targetYear}
        onTargetYearChange={setTargetYear}
        monthsHebrew={MONTHS_HEBREW}
        idealBudget={idealBudget}
        onIdealBudgetChange={setIdealBudget}
        maxBudget={maxBudget}
        onMaxBudgetChange={setMaxBudget}
        budgetWeight={budgetWeight}
        onBudgetWeightChange={setBudgetWeight}
        dateWeight={dateWeight}
        onDateWeightChange={setDateWeight}
        onCriterionWeightChange={handleWeightChange}
        onDeleteCriterion={handleDeleteCriterion}
        newCriterionLabel={newCriterionLabel}
        onNewCriterionLabelChange={setNewCriterionLabel}
        onAddCriterion={handleAddCriterion}
        onStatusChange={handleStatusChange}
        onDeleteApartment={handleDeleteApartment}
        onAptCriteriaValueChange={handleAptCriteriaValueChange}
        onNotesChange={handleNotesChange}
        onNotesBlur={handleNotesBlur}
        onImageUpload={handleImageUpload}
        onImageDelete={handleImageDelete}
        uploadingImage={uploadingImage}
        maxApartmentImages={MAX_APARTMENT_IMAGES}
        getFeaturedImage={getFeaturedImage}
        formatMonthHebrew={formatMonthHebrew}
        openLightbox={openLightbox}
        fbPostText={fbPostText}
        onFbPostTextChange={setFbPostText}
        manualForm={manualForm}
        setManualForm={setManualForm}
        onCreateApartment={handleCreateApartment}
        isLoading={isLoading}
      />

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(index) =>
            setLightbox((prev) => (prev ? { ...prev, index } : null))
          }
        />
      )}

    </div>
  );
}