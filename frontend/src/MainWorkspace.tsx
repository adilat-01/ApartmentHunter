import type { ChangeEvent, FormEvent } from 'react';
import AuthenticatedImage from './AuthenticatedImage';
import type { Apartment, ApartmentImage } from './api';

type ApartmentStatus =
  | 'חדש'
  | 'יצרנו קשר'
  | 'נקבע סיור'
  | 'ראינו את הדירה'
  | 'במשא ומתן'
  | 'נחתם חוזה! 🎉'
  | 'ארכיון'
  | 'נפסל';

type AppTab = 'dashboard' | 'add';

export interface ManualFormState {
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

export interface Criterion {
  id: string;
  label: string;
  weight: number;
}

export interface BreakdownRow {
  id: string;
  criterion: string;
  value: string;
  weight: number;
  normalized: number;
  weightedPoints: number;
}

export interface ProcessedApartment extends Apartment {
  isOverBudget: boolean;
  matchScore: number;
  breakdown: BreakdownRow[];
}

export interface MainWorkspaceProps {
  authUsername: string;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onLogout: () => void;

  statsApartments: ProcessedApartment[];
  filteredApartments: ProcessedApartment[];
  selectedAptId: string | null;
  onSelectApartment: (id: string | null) => void;
  activeApartmentDetails: ProcessedApartment | undefined;
  activeFilter: string;
  onActiveFilterChange: (filter: string) => void;
  criteria: Criterion[];
  criteriaIcons: Record<string, string>;
  statusOptions: ApartmentStatus[];

  targetMonth: string;
  onTargetMonthChange: (value: string) => void;
  targetYear: string;
  onTargetYearChange: (value: string) => void;
  monthsHebrew: { value: string; label: string }[];
  idealBudget: number;
  onIdealBudgetChange: (value: number) => void;
  maxBudget: number;
  onMaxBudgetChange: (value: number) => void;
  budgetWeight: number;
  onBudgetWeightChange: (value: number) => void;
  dateWeight: number;
  onDateWeightChange: (value: number) => void;
  onCriterionWeightChange: (id: string, weight: number) => void;
  onDeleteCriterion: (id: string) => void;
  newCriterionLabel: string;
  onNewCriterionLabelChange: (value: string) => void;
  onAddCriterion: (e: FormEvent) => void;

  onStatusChange: (id: string, status: ApartmentStatus) => void;
  onDeleteApartment: (id: string) => void;
  onAptCriteriaValueChange: (
    aptId: string,
    criterionId: string,
    value: string
  ) => void;
  onNotesChange: (id: string, notes: string) => void;
  onNotesBlur: (id: string, notes: string) => void;
  onImageUpload: (aptId: string, e: ChangeEvent<HTMLInputElement>) => void;
  onImageDelete: (aptId: string, imageId: number) => void;
  uploadingImage: boolean;
  maxApartmentImages: number;

  getFeaturedImage: (apt: Apartment) => ApartmentImage | null;
  formatMonthHebrew: (dateStr: string) => string;
  openLightbox: (images: ApartmentImage[], index: number) => void;

  fbPostText: string;
  onFbPostTextChange: (value: string) => void;
  manualForm: ManualFormState;
  setManualForm: React.Dispatch<React.SetStateAction<ManualFormState>>;
  onCreateApartment: () => void;
  isLoading: boolean;
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-3.5 h-3.5"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 00-.53.898l.12 1.07A12.91 12.91 0 003 8.5v5.75A2.75 2.75 0 005.75 17h8.5A2.75 2.75 0 0017 14.25V8.5a12.91 12.91 0 00-.175-1.936l.12-1.07a.75.75 0 00-.53-.898 41.5 41.5 0 00-2.365-.298V3.75A2.75 2.75 0 0011.25 1h-2.5zM8 3.75V4h4v-.25a1.25 1.25 0 00-1.25-1.25h-1.5A1.25 1.25 0 008 3.75zm1.25 4.5a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0v-5.5zm3.5 0a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0v-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function countByStatus(
  apartments: ProcessedApartment[],
  status: ApartmentStatus
) {
  return apartments.filter((a) => a.status === status).length;
}

const WEIGHT_OPTIONS = [5, 4, 3, 2, 1] as const;

function CriterionValueSelect({
  criterionId,
  value,
  onChange,
}: {
  criterionId: string;
  value: string;
  onChange: (value: string) => void;
}) {
  if (criterionId === 'protected_space') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white text-[10px] font-sans font-bold border-0 shadow-sm rounded-md p-1 text-stone-800 outline-none cursor-pointer"
      >
        <option value='ממ"ד'>ממ&quot;ד 🛡️</option>
        <option value="מקלט">מקלט 🧱</option>
        <option value="ללא">ללא ⚠️</option>
      </select>
    );
  }

  if (criterionId === 'pet_friendly') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white text-[10px] font-sans font-bold border-0 shadow-sm rounded-md p-1 text-stone-800 outline-none cursor-pointer"
      >
        <option value="כן">כן 🐾</option>
        <option value="לא">לא ✕</option>
      </select>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white text-[10px] font-sans font-bold border-0 shadow-sm rounded-md p-1 text-stone-800 outline-none cursor-pointer"
    >
      <option value="כן">כן</option>
      <option value="חלקי">חלקי</option>
      <option value="לא">לא</option>
    </select>
  );
}

type GlobalPreferencesPanelProps = Pick<
  MainWorkspaceProps,
  | 'criteria'
  | 'criteriaIcons'
  | 'monthsHebrew'
  | 'targetMonth'
  | 'onTargetMonthChange'
  | 'targetYear'
  | 'onTargetYearChange'
  | 'idealBudget'
  | 'onIdealBudgetChange'
  | 'maxBudget'
  | 'onMaxBudgetChange'
  | 'budgetWeight'
  | 'onBudgetWeightChange'
  | 'dateWeight'
  | 'onDateWeightChange'
  | 'onCriterionWeightChange'
  | 'onDeleteCriterion'
  | 'newCriterionLabel'
  | 'onNewCriterionLabelChange'
  | 'onAddCriterion'
>;

function GlobalPreferencesPanel(props: GlobalPreferencesPanelProps) {
  const {
    criteria,
    criteriaIcons,
    monthsHebrew,
    targetMonth,
    onTargetMonthChange,
    targetYear,
    onTargetYearChange,
    idealBudget,
    onIdealBudgetChange,
    maxBudget,
    onMaxBudgetChange,
    budgetWeight,
    onBudgetWeightChange,
    dateWeight,
    onDateWeightChange,
    onCriterionWeightChange,
    onDeleteCriterion,
    newCriterionLabel,
    onNewCriterionLabelChange,
    onAddCriterion,
  } = props;

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-stone-300/40">
      <div>
        <h2 className="text-[11px] font-bold text-stone-900 font-sans uppercase tracking-wide">
          העדפות גלובליות
        </h2>
        <p className="text-[9px] text-stone-500 mt-0.5 font-sans">
          תקציב, תאריך כניסה ומשקלי ציון
        </p>
      </div>

      <section className="flex flex-col gap-2.5">
        <div className="app-surface flex flex-col gap-2">
          <span className="text-[10px] font-bold text-stone-600 flex items-center gap-1 font-sans">
            <span>{criteriaIcons.moveInDate}</span> תאריך כניסה רצוי
          </span>
          <div className="flex gap-2">
            <select
              value={targetMonth}
              onChange={(e) => onTargetMonthChange(e.target.value)}
              className="flex-1 app-input cursor-pointer"
            >
              {monthsHebrew.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={targetYear}
              onChange={(e) => onTargetYearChange(e.target.value)}
              className="w-[4.5rem] app-input cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
        </div>

        <div className="app-surface flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-stone-600 flex justify-between font-medium font-sans">
              <span>תקציב אידיאלי:</span>
              <span className="text-emerald-700 font-bold">
                {idealBudget.toLocaleString()} ₪
              </span>
            </label>
            <input
              type="range"
              min="3000"
              max="8000"
              step="100"
              value={idealBudget}
              onChange={(e) => onIdealBudgetChange(Number(e.target.value))}
              className="app-range"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-stone-600 flex justify-between font-medium font-sans">
              <span>טווח עליון:</span>
              <span className="text-[#ca6a43] font-bold">
                {maxBudget.toLocaleString()} ₪
              </span>
            </label>
            <input
              type="range"
              min="4000"
              max="10000"
              step="100"
              value={maxBudget}
              onChange={(e) => onMaxBudgetChange(Number(e.target.value))}
              className="app-range"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center bg-white/80 px-2.5 py-2 rounded-lg text-[10px]">
            <span className="font-medium text-stone-700 flex items-center gap-1 font-sans">
              <span>{criteriaIcons.budget}</span> תקציב חודשי
            </span>
            <select
              value={budgetWeight}
              onChange={(e) => onBudgetWeightChange(Number(e.target.value))}
              className="bg-white text-stone-800 rounded-md p-0.5 text-[10px] border-0 outline-none shadow-sm font-sans font-bold"
            >
              {WEIGHT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-between items-center bg-white/80 px-2.5 py-2 rounded-lg text-[10px]">
            <span className="font-medium text-stone-700 flex items-center gap-1.5 font-sans">
              <span>{criteriaIcons.moveInDate}</span> סנכרון תאריך כניסה
            </span>
            <select
              value={dateWeight}
              onChange={(e) => onDateWeightChange(Number(e.target.value))}
              className="bg-white text-stone-800 rounded-md p-0.5 text-[10px] border-0 outline-none shadow-sm font-sans font-bold"
            >
              {WEIGHT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          {criteria.map((c) => (
            <div
              key={c.id}
              className="flex justify-between items-center bg-white/80 px-2.5 py-2 rounded-lg text-[10px]"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDeleteCriterion(c.id)}
                  className="text-stone-400 hover:text-stone-600 transition"
                >
                  ✕
                </button>
                <span className="font-medium text-stone-700 flex items-center gap-1.5 font-sans">
                  <span>{criteriaIcons[c.id] || '✨'}</span> {c.label}
                </span>
              </div>
              <select
                value={c.weight}
                onChange={(e) =>
                  onCriterionWeightChange(c.id, Number(e.target.value))
                }
                className="bg-white text-stone-800 rounded-md p-0.5 text-[10px] border-0 outline-none shadow-sm font-sans font-bold"
              >
                {WEIGHT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <form onSubmit={onAddCriterion} className="flex gap-2">
            <input
              type="text"
              placeholder="פרמטר חדש (חניה, קומה...)"
              value={newCriterionLabel}
              onChange={(e) => onNewCriterionLabelChange(e.target.value)}
              className="flex-1 bg-white/80 border-0 rounded-lg p-2 text-[10px] outline-none focus:bg-white transition placeholder-stone-400 shadow-inner font-sans text-stone-800"
            />
            <button
              type="submit"
              className="bg-stone-700 hover:bg-stone-800 text-white text-[10px] px-2.5 rounded-lg font-bold shadow-sm"
            >
              ＋
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function ApartmentDetailPanel({
  apt,
  criteria,
  criteriaIcons,
  formatMonthHebrew,
  maxApartmentImages,
  uploadingImage,
  onClose,
  onAptCriteriaValueChange,
  onNotesChange,
  onNotesBlur,
  onImageUpload,
  onImageDelete,
  openLightbox,
}: {
  apt: ProcessedApartment;
  criteria: Criterion[];
  criteriaIcons: Record<string, string>;
  formatMonthHebrew: (d: string) => string;
  maxApartmentImages: number;
  uploadingImage: boolean;
  onClose: () => void;
  onAptCriteriaValueChange: MainWorkspaceProps['onAptCriteriaValueChange'];
  onNotesChange: MainWorkspaceProps['onNotesChange'];
  onNotesBlur: MainWorkspaceProps['onNotesBlur'];
  onImageUpload: MainWorkspaceProps['onImageUpload'];
  onImageDelete: MainWorkspaceProps['onImageDelete'];
  openLightbox: MainWorkspaceProps['openLightbox'];
}) {
  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-stone-300/40">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h2 className="text-xs font-bold text-stone-900 font-sans">
            {apt.extractedData.area}
          </h2>
          <p className="text-[10px] text-stone-500 font-sans mt-0.5">
            {apt.extractedData.rooms} חדרים •{' '}
            {apt.extractedData.price.toLocaleString()} ₪ • התאמה{' '}
            <span className="font-bold text-[#ca6a43]">{apt.matchScore}%</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-stone-500 hover:text-stone-800 w-7 h-7 rounded-lg text-sm bg-white shadow-sm font-bold transition shrink-0"
          aria-label="חזרה להעדפות"
        >
          ✕
        </button>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-[9px] font-bold uppercase tracking-widest text-stone-500 font-sans">
          קריטריונים וציון
        </h3>
        {apt.breakdown.map((row, i) => {
          const associatedCriterion = criteria.find(
            (c) => c.label === row.criterion
          );
          const icon = criteriaIcons[row.id] || '✨';
          return (
            <div
              key={`${row.id}-${i}`}
              className="bg-white p-2.5 rounded-xl shadow-sm flex flex-col gap-1 text-[10px] font-sans"
            >
              <div className="flex justify-between items-center font-bold text-stone-800">
                <span className="flex items-center gap-1.5 text-stone-700">
                  <span>{icon}</span> {row.criterion}
                </span>
                {associatedCriterion ? (
                  <CriterionValueSelect
                    criterionId={associatedCriterion.id}
                    value={
                      apt.extractedData.criteriaValues[
                        associatedCriterion.id
                      ] || 'לא'
                    }
                    onChange={(val) =>
                      onAptCriteriaValueChange(
                        apt.id,
                        associatedCriterion.id,
                        val
                      )
                    }
                  />
                ) : (
                  <span className="text-stone-800 font-bold text-[10px] bg-[#f4ede2] px-2 py-0.5 rounded-md">
                    {row.id === 'moveInDate'
                      ? formatMonthHebrew(row.value)
                      : row.value}
                  </span>
                )}
              </div>
              <div className="flex justify-between text-[10px] text-stone-400 mt-1 border-t border-stone-200/40 pt-1.5 font-medium">
                <span>משקל: {row.weight}</span>
                <span>מדד: {(row.normalized * 100).toFixed(0)}%</span>
                <span
                  className={
                    row.weightedPoints < 0
                      ? 'text-rose-600 font-black'
                      : 'text-emerald-700 font-bold'
                  }
                >
                  {row.weightedPoints >= 0
                    ? `+${row.weightedPoints.toFixed(1)}`
                    : row.weightedPoints.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {(apt.extractedData.contactName || apt.extractedData.contactPhone) && (
        <section className="bg-white p-2.5 rounded-xl text-[10px] font-sans">
          <span className="text-stone-400">👤 קשר: </span>
          <span className="font-bold text-stone-800">
            {apt.extractedData.contactName || 'בעל הנכס'}
            {apt.extractedData.contactPhone
              ? ` • ${apt.extractedData.contactPhone}`
              : ''}
          </span>
        </section>
      )}

      <section className="bg-white p-2.5 rounded-xl shadow-sm flex flex-col gap-1.5 text-[10px] font-sans">
        <span className="text-stone-500 font-bold">📝 הערות אישיות</span>
        <textarea
          rows={2}
          placeholder="כתבו הערות..."
          value={apt.userNotes}
          onChange={(e) => onNotesChange(apt.id, e.target.value)}
          onBlur={(e) => onNotesBlur(apt.id, e.target.value)}
          className="w-full p-2 bg-stone-50 rounded-lg text-[10px] text-stone-700 border-0 outline-none resize-none"
        />
      </section>

      <section className="bg-white p-3.5 rounded-2xl shadow-sm flex flex-col gap-2 text-[10px] font-sans">
        <div className="flex justify-between items-center">
          <span className="text-stone-500 font-bold">
            📷 גלריה ({apt.images?.length ?? 0}/{maxApartmentImages})
          </span>
          <label
            className={`text-[10px] font-bold px-2 py-1 rounded-md transition text-[9px] ${
              uploadingImage ||
              (apt.images?.length ?? 0) >= maxApartmentImages
                ? 'cursor-not-allowed bg-stone-300 text-stone-500'
                : 'cursor-pointer bg-stone-800 hover:bg-stone-900 text-white'
            }`}
          >
            {uploadingImage ? 'מעלה...' : 'העלאה'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={
                uploadingImage ||
                (apt.images?.length ?? 0) >= maxApartmentImages
              }
              onChange={(e) => onImageUpload(apt.id, e)}
            />
          </label>
        </div>
        {(apt.images?.length ?? 0) === 0 ? (
          <p className="text-stone-400 italic text-center py-2">
            אין תמונות עדיין
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {(apt.images ?? []).map((img, idx) => (
              <div key={img.id} className="relative group">
                <button
                  type="button"
                  onClick={() => openLightbox(apt.images ?? [], idx)}
                  className="block w-full"
                >
                  <AuthenticatedImage
                    path={img.url}
                    alt={img.originalFilename}
                    className="w-full h-20 object-cover rounded-lg shadow-sm"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onImageDelete(apt.id, img.id)}
                  className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  מחק
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white p-2.5 rounded-xl shadow-sm">
        <span className="text-[10px] font-bold text-stone-500 block mb-2">
          טקסט מקורי
        </span>
        <p className="text-[10px] text-stone-600 italic leading-relaxed">
          &quot;{apt.originalText}&quot;
        </p>
      </section>
    </div>
  );
}

export default function MainWorkspace({
  authUsername,
  activeTab,
  onTabChange,
  onLogout,
  statsApartments,
  filteredApartments,
  selectedAptId,
  onSelectApartment,
  activeApartmentDetails,
  activeFilter,
  onActiveFilterChange,
  criteria,
  criteriaIcons,
  statusOptions,
  targetMonth,
  onTargetMonthChange,
  targetYear,
  onTargetYearChange,
  monthsHebrew,
  idealBudget,
  onIdealBudgetChange,
  maxBudget,
  onMaxBudgetChange,
  budgetWeight,
  onBudgetWeightChange,
  dateWeight,
  onDateWeightChange,
  onCriterionWeightChange,
  onDeleteCriterion,
  newCriterionLabel,
  onNewCriterionLabelChange,
  onAddCriterion,
  onStatusChange,
  onDeleteApartment,
  onAptCriteriaValueChange,
  onNotesChange,
  onNotesBlur,
  onImageUpload,
  onImageDelete,
  uploadingImage,
  maxApartmentImages,
  getFeaturedImage,
  formatMonthHebrew,
  openLightbox,
  fbPostText,
  onFbPostTextChange,
  manualForm,
  setManualForm,
  onCreateApartment,
  isLoading,
}: MainWorkspaceProps) {
  const showApartmentPanel = Boolean(
    selectedAptId && activeApartmentDetails
  );

  const stats = {
    total: statsApartments.length,
    new: countByStatus(statsApartments, 'חדש'),
    contacted: countByStatus(statsApartments, 'יצרנו קשר'),
    tour: countByStatus(statsApartments, 'נקבע סיור'),
    visited: countByStatus(statsApartments, 'ראינו את הדירה'),
    negotiating: countByStatus(statsApartments, 'במשא ומתן'),
    signed: countByStatus(statsApartments, 'נחתם חוזה! 🎉'),
    archived:
      countByStatus(statsApartments, 'ארכיון') +
      countByStatus(statsApartments, 'נפסל'),
  };

  return (
    <>
<div className="flex flex-1 min-w-0 w-full min-h-screen">
      <aside className="w-[19rem] shrink-0 sticky top-0 h-screen flex flex-col bg-[#ede5d3] shadow-[4px_0_24px_rgba(120,108,95,0.03)] overflow-hidden">
        <div className="p-4 flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl text-[#ca6a43]">🏹</span>
            <div>
              <h1 className="text-base font-bold tracking-tight text-stone-900 font-sans">
                ApartmentHunter
              </h1>
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-0.5 font-sans">
                שלום, {authUsername}
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onTabChange('dashboard')}
              className={`app-btn-nav ${
                activeTab === 'dashboard'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:bg-white/60'
              }`}
            >
              לוח דירות
            </button>
            <button
              type="button"
              onClick={() => onTabChange('add')}
              className={`app-btn-nav ${
                activeTab === 'add'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:bg-white/60'
              }`}
            >
              הוספת דירה
            </button>
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-3">
          {activeTab === 'dashboard' &&
            (showApartmentPanel && activeApartmentDetails ? (
              <ApartmentDetailPanel
                apt={activeApartmentDetails}
                criteria={criteria}
                criteriaIcons={criteriaIcons}
                formatMonthHebrew={formatMonthHebrew}
                maxApartmentImages={maxApartmentImages}
                uploadingImage={uploadingImage}
                onClose={() => onSelectApartment(null)}
                onAptCriteriaValueChange={onAptCriteriaValueChange}
                onNotesChange={onNotesChange}
                onNotesBlur={onNotesBlur}
                onImageUpload={onImageUpload}
                onImageDelete={onImageDelete}
                openLightbox={openLightbox}
              />
            ) : (
              <GlobalPreferencesPanel
                criteria={criteria}
                criteriaIcons={criteriaIcons}
                monthsHebrew={monthsHebrew}
                targetMonth={targetMonth}
                onTargetMonthChange={onTargetMonthChange}
                targetYear={targetYear}
                onTargetYearChange={onTargetYearChange}
                idealBudget={idealBudget}
                onIdealBudgetChange={onIdealBudgetChange}
                maxBudget={maxBudget}
                onMaxBudgetChange={onMaxBudgetChange}
                budgetWeight={budgetWeight}
                onBudgetWeightChange={onBudgetWeightChange}
                dateWeight={dateWeight}
                onDateWeightChange={onDateWeightChange}
                onCriterionWeightChange={onCriterionWeightChange}
                onDeleteCriterion={onDeleteCriterion}
                newCriterionLabel={newCriterionLabel}
                onNewCriterionLabelChange={onNewCriterionLabelChange}
                onAddCriterion={onAddCriterion}
              />
            ))}
        </div>

        <div className="p-4 pt-0 shrink-0 border-t border-stone-300/40">
          <button
            type="button"
            onClick={onLogout}
            className="w-full text-[10px] font-bold text-stone-500 hover:text-stone-800 bg-white/50 px-2 py-1 rounded-md transition text-[9px] font-sans"
          >
            התנתקות
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#f7f4eb]">
        {activeTab === 'dashboard' ? (
          <>
              <div className="px-5 pt-4 pb-3">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 font-sans">
                  סיכום בזמן אמת
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
                  {[
                    { label: 'סה״כ במעקב', value: stats.total, accent: 'text-stone-900' },
                    { label: 'חדשות', value: stats.new, accent: 'text-sky-700' },
                    { label: 'יצרנו קשר', value: stats.contacted, accent: 'text-violet-700' },
                    { label: 'סיורים', value: stats.tour, accent: 'text-amber-700' },
                    { label: 'ביקרנו', value: stats.visited, accent: 'text-[#557a46]' },
                    { label: 'במשא ומתן', value: stats.negotiating, accent: 'text-[#ca6a43]' },
                    {
                      label: 'נחתם / ארכיון',
                      value: `${stats.signed} / ${stats.archived}`,
                      accent: 'text-emerald-700',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white rounded-xl px-3 py-2 shadow-sm border border-stone-100/80"
                    >
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide font-sans">
                        {item.label}
                      </p>
                      <p
                        className={`text-lg font-black mt-0.5 tabular-nums font-sans ${item.accent}`}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-5 pb-1.5 flex gap-1.5 items-center overflow-x-auto">
                <span className="text-[11px] text-stone-500 font-bold ml-2 font-sans shrink-0">
                  סינון מהיר:
                </span>
                <button
                  type="button"
                  onClick={() => onActiveFilterChange('all')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition font-sans shrink-0 ${
                    activeFilter === 'all'
                      ? 'bg-[#ca6a43] text-white shadow-sm'
                      : 'bg-white text-stone-700 hover:bg-[#f4ede2]'
                  }`}
                >
                  הכל
                </button>
                {criteria.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onActiveFilterChange(c.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1.5 font-sans shrink-0 ${
                      activeFilter === c.id
                        ? 'bg-[#557a46] text-white shadow-sm'
                        : 'bg-white text-stone-700 hover:bg-[#f4ede2]'
                    }`}
                  >
                    <span>{criteriaIcons[c.id] || '✨'}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>

              <section className="px-5 pb-6 pt-1.5 flex-1 overflow-y-auto">
                {filteredApartments.length === 0 ? (
                  <p className="text-xs text-stone-400 italic text-center py-12 font-sans">
                    אין דירות להצגה — הוסיפו דירה חדשה או שנו את הסינון
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5">
                    {filteredApartments.map((apt) => {
                      const isSelected = selectedAptId === apt.id;
                      const featured = getFeaturedImage(apt);
                      let cardStyle =
                        'bg-white shadow-[0_8px_30px_rgba(139,120,100,0.04)] hover:shadow-[0_20px_40px_rgba(139,120,100,0.08)] hover:-translate-y-0.5';
                      if (apt.status === 'נחתם חוזה! 🎉') {
                        cardStyle = 'bg-[#f1f6f0]';
                      } else if (
                        apt.status === 'נפסל' ||
                        apt.status === 'ארכיון'
                      ) {
                        cardStyle = 'bg-white/40 opacity-40';
                      } else if (isSelected) {
                        cardStyle =
                          'bg-white ring-2 ring-[#ca6a43]/50 shadow-lg';
                      }

                      return (
                        <article
                          key={apt.id}
                          onClick={() => onSelectApartment(apt.id)}
                          className={`rounded-2xl transition-all duration-300 cursor-pointer flex flex-col overflow-hidden relative ${cardStyle}`}
                        >
                          <button
                            type="button"
                            title="מחק דירה"
                            aria-label="מחק דירה"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteApartment(apt.id);
                            }}
                            className="absolute top-2 end-2 z-20 flex items-center justify-center w-7 h-7 rounded-full bg-white/95 text-stone-500 hover:text-rose-600 hover:bg-rose-50 shadow-md border border-stone-200/80 transition"
                          >
                            <TrashIcon />
                          </button>

                          {featured ? (
                            <AuthenticatedImage
                              path={featured.url}
                              alt={featured.originalFilename}
                              className="w-full h-32 object-cover"
                            />
                          ) : (
                            <div className="w-full h-32 bg-stone-100 flex items-center justify-center text-stone-300 text-xl">
                              📷
                            </div>
                          )}

                          <div className="p-3.5 flex flex-col gap-2">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex flex-col gap-1.5 min-w-0">
                                <select
                                  value={apt.status}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    onStatusChange(
                                      apt.id,
                                      e.target.value as ApartmentStatus
                                    )
                                  }
                                  className="text-[10px] font-sans font-bold bg-[#f4ede2] text-stone-700 px-2.5 py-1 rounded-lg border-0 outline-none cursor-pointer shadow-sm w-fit"
                                >
                                  {statusOptions.map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                                <h3 className="text-sm font-bold text-stone-900 font-sans tracking-tight truncate">
                                  {apt.extractedData.area}
                                </h3>
                                <p className="text-[11px] text-stone-500 font-medium font-sans">
                                  {apt.extractedData.rooms} חדרים •{' '}
                                  {apt.extractedData.price.toLocaleString()} ₪
                                </p>
                              </div>
                              <div className="text-left shrink-0">
                                <div
                                  className={`text-lg font-black font-sans leading-none ${
                                    apt.matchScore > 80
                                      ? 'text-emerald-600'
                                      : 'text-[#ca6a43]'
                                  }`}
                                >
                                  {apt.matchScore}%
                                </div>
                                <span className="text-[8px] text-stone-400 font-bold uppercase tracking-wider font-sans block mt-1">
                                  התאמה
                                </span>
                              </div>
                            </div>

                            <p className="text-[10px] text-stone-400 line-clamp-2 italic font-sans">
                              &quot;{apt.originalText}&quot;
                            </p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
          </>

        ) : (
          <section className="flex flex-col flex-1 p-6 gap-5 overflow-y-auto">
            <header>
              <h2 className="text-base font-bold text-stone-900 font-sans">
                הוספת דירה חדשה
              </h2>
              <p className="text-xs text-stone-500 mt-1 font-sans">
                מלאו ידנית, הדביקו פוסט מפייסבוק, או שניהם — הנתונים ימוזגו
                בשמירה
              </p>
            </header>

            <div className="grid lg:grid-cols-2 gap-5 flex-1">
              <section className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <h3 className="text-xs font-bold text-stone-800 font-sans">
                  חילוץ AI מפייסבוק
                </h3>
                <p className="text-[11px] text-stone-500 font-sans -mt-2">
                  הדביקו פוסט — הניתוח והמיזוג יתבצעו בלחיצה על &quot;צור דירה&quot;
                </p>
                <textarea
                  rows={10}
                  placeholder="הדביקי כאן את הפוסט הגולמי מפייסבוק..."
                  value={fbPostText}
                  onChange={(e) => onFbPostTextChange(e.target.value)}
                  className="w-full flex-1 min-h-[170px] p-3 bg-stone-50/60 text-[11px] border-0 rounded-xl outline-none focus:bg-stone-50 transition text-stone-800 font-sans resize-none"
                />
              </section>

              <section className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <h3 className="text-xs font-bold text-stone-800 font-sans">
                  פרטי דירה ידניים
                </h3>
                <p className="text-[11px] text-stone-500 font-sans -mt-2">
                  שדות שמולאו כאן ידרסו את נתוני ה-AI
                </p>
                <div className="grid grid-cols-2 gap-2.5 text-[11px] font-sans">
                  <label className="flex flex-col gap-1 col-span-2">
                    <span className="font-bold text-stone-600">עיר / אזור</span>
                    <input
                      type="text"
                      value={manualForm.city}
                      onChange={(e) =>
                        setManualForm((f) => ({ ...f, city: e.target.value }))
                      }
                      className="app-input-muted"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-bold text-stone-600">מחיר (₪)</span>
                    <input
                      type="number"
                      value={manualForm.price}
                      onChange={(e) =>
                        setManualForm((f) => ({ ...f, price: e.target.value }))
                      }
                      className="app-input-muted"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-bold text-stone-600">חדרים</span>
                    <input
                      type="number"
                      step="0.5"
                      value={manualForm.rooms}
                      onChange={(e) =>
                        setManualForm((f) => ({ ...f, rooms: e.target.value }))
                      }
                      className="app-input-muted"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-bold text-stone-600">חודש כניסה</span>
                    <select
                      value={manualForm.moveInMonth}
                      onChange={(e) =>
                        setManualForm((f) => ({
                          ...f,
                          moveInMonth: e.target.value,
                        }))
                      }
                      className="app-input-muted cursor-pointer"
                    >
                      {monthsHebrew.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-bold text-stone-600">שנת כניסה</span>
                    <select
                      value={manualForm.moveInYear}
                      onChange={(e) =>
                        setManualForm((f) => ({
                          ...f,
                          moveInYear: e.target.value,
                        }))
                      }
                      className="app-input-muted cursor-pointer"
                    >
                      <option value="2026">2026</option>
                      <option value="2027">2027</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-bold text-stone-600">שם איש קשר</span>
                    <input
                      type="text"
                      value={manualForm.contactName}
                      onChange={(e) =>
                        setManualForm((f) => ({
                          ...f,
                          contactName: e.target.value,
                        }))
                      }
                      className="app-input-muted"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-bold text-stone-600">טלפון</span>
                    <input
                      type="tel"
                      value={manualForm.contactPhone}
                      onChange={(e) =>
                        setManualForm((f) => ({
                          ...f,
                          contactPhone: e.target.value,
                        }))
                      }
                      className="app-input-muted"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-bold text-stone-600">ממ&quot;ד</span>
                    <select
                      value={manualForm.protected_space}
                      onChange={(e) =>
                        setManualForm((f) => ({
                          ...f,
                          protected_space: e.target.value,
                        }))
                      }
                      className="app-input-muted cursor-pointer"
                    >
                      <option value='ממ"ד'>ממ&quot;ד</option>
                      <option value="מקלט">מקלט</option>
                      <option value="ללא">ללא</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-bold text-stone-600">חיות מחמד</span>
                    <select
                      value={manualForm.pet_friendly}
                      onChange={(e) =>
                        setManualForm((f) => ({
                          ...f,
                          pet_friendly: e.target.value,
                        }))
                      }
                      className="app-input-muted cursor-pointer"
                    >
                      <option value="כן">כן</option>
                      <option value="לא">לא</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-bold text-stone-600">מרפסת</span>
                    <select
                      value={manualForm.outdoor_space}
                      onChange={(e) =>
                        setManualForm((f) => ({
                          ...f,
                          outdoor_space: e.target.value,
                        }))
                      }
                      className="app-input-muted cursor-pointer"
                    >
                      <option value="כן">כן</option>
                      <option value="חלקי">חלקי</option>
                      <option value="לא">לא</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 col-span-2">
                    <span className="font-bold text-stone-600">הערות</span>
                    <textarea
                      rows={2}
                      value={manualForm.userNotes}
                      onChange={(e) =>
                        setManualForm((f) => ({
                          ...f,
                          userNotes: e.target.value,
                        }))
                      }
                      className="app-input-muted resize-none"
                    />
                  </label>
                </div>
              </section>
            </div>

            <footer className="pt-2 border-t border-stone-200/60 shrink-0">
              <button
                type="button"
                onClick={onCreateApartment}
                disabled={isLoading}
                className="app-btn-primary w-full disabled:opacity-50"
              >
                {isLoading ? 'ממזג ושומר דירה...' : 'צור דירה'}
              </button>
            </footer>
          </section>
        )}
      </main>
      </div>
    </>
  );
}
