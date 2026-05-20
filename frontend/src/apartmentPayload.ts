import type { Apartment } from './api';

/** Manual fields for POST /api/apartments/from-sources */
export interface ManualApartmentPayload {
  city?: string;
  price?: number;
  rooms?: number;
  moveInDate?: string;
  contactName?: string;
  contactPhone?: string;
  protected_space?: string;
  pet_friendly?: string;
  outdoor_space?: string;
  furnished_status?: string;
}

export interface ManualFormInput {
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

const CRITERIA_DEFAULTS: Record<string, string> = {
  protected_space: 'ללא',
  pet_friendly: 'לא',
  outdoor_space: 'לא',
  furnished_status: 'לא',
};

/** Parse user text to a finite number, or undefined if empty/invalid. */
export function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim().replace(/,/g, '');
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

export function parseOptionalInt(value: string): number | undefined {
  const n = parseOptionalNumber(value);
  if (n === undefined) return undefined;
  return Math.round(n);
}

function setIfString(
  target: ManualApartmentPayload,
  key: keyof ManualApartmentPayload,
  value: string
) {
  const trimmed = value.trim();
  if (trimmed) {
    target[key] = trimmed as never;
  }
}

function setIfCriterion(
  target: ManualApartmentPayload,
  key: 'protected_space' | 'pet_friendly' | 'outdoor_space' | 'furnished_status',
  value: string
) {
  const trimmed = value.trim();
  if (trimmed && trimmed !== CRITERIA_DEFAULTS[key]) {
    target[key] = trimmed;
  }
}

/** Build a clean manual object for the API from the add-apartment form. */
export function buildManualFromForm(
  form: ManualFormInput
): ManualApartmentPayload | undefined {
  const manual: ManualApartmentPayload = {};

  setIfString(manual, 'city', form.city);

  const price = parseOptionalInt(form.price);
  if (price !== undefined) manual.price = price;

  const rooms = parseOptionalNumber(form.rooms);
  if (rooms !== undefined) manual.rooms = rooms;

  if (form.moveInMonth.trim() && form.moveInYear.trim()) {
    manual.moveInDate = `${form.moveInYear.trim()}-${form.moveInMonth.trim()}`;
  }

  setIfString(manual, 'contactName', form.contactName);
  setIfString(manual, 'contactPhone', form.contactPhone);

  setIfCriterion(manual, 'protected_space', form.protected_space);
  setIfCriterion(manual, 'pet_friendly', form.pet_friendly);
  setIfCriterion(manual, 'outdoor_space', form.outdoor_space);
  setIfCriterion(manual, 'furnished_status', form.furnished_status);

  return Object.keys(manual).length > 0 ? manual : undefined;
}

/** Normalize extracted data for POST /api/apartments. */
export function sanitizeExtractedData(
  data: Partial<Apartment['extractedData']> | undefined
): Apartment['extractedData'] {
  const criteria = { ...CRITERIA_DEFAULTS };
  const rawCriteria = data?.criteriaValues;
  if (rawCriteria && typeof rawCriteria === 'object') {
    for (const [key, val] of Object.entries(rawCriteria)) {
      if (val != null && String(val).trim()) {
        criteria[key] = String(val).trim();
      }
    }
  }

  return {
    price: parseOptionalInt(String(data?.price ?? '')) ?? 0,
    rooms: parseOptionalNumber(String(data?.rooms ?? '')) ?? 2,
    area: (data?.area ?? '').trim(),
    contactName: (data?.contactName ?? '').trim(),
    contactPhone: (data?.contactPhone ?? '').trim(),
    moveInDate: (data?.moveInDate ?? '').trim() || '2026-07',
    criteriaValues: criteria,
  };
}

export interface CreateFromSourcesPayload {
  postText: string;
  manual?: ManualApartmentPayload;
  userNotes?: string;
  status?: string;
  createdAt?: string;
}

/** JSON-safe body for POST /api/apartments/from-sources. */
export function buildCreateFromSourcesBody(
  payload: CreateFromSourcesPayload
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    postText: payload.postText.trim(),
    userNotes: (payload.userNotes ?? '').trim(),
    status: (payload.status ?? 'חדש').trim() || 'חדש',
  };

  if (payload.manual && Object.keys(payload.manual).length > 0) {
    body.manual = payload.manual;
  }

  const createdAt = payload.createdAt?.trim();
  if (createdAt) {
    body.createdAt = createdAt.slice(0, 10);
  }

  return body;
}

export interface CreateApartmentPayload {
  originalText?: string;
  extractedData?: Partial<Apartment['extractedData']>;
  userNotes?: string;
  status?: string;
  createdAt?: string;
}

/** JSON-safe body for POST /api/apartments. */
export function buildCreateApartmentBody(
  payload: CreateApartmentPayload
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    originalText: (payload.originalText ?? '').trim(),
    extractedData: sanitizeExtractedData(payload.extractedData),
    userNotes: (payload.userNotes ?? '').trim(),
    status: (payload.status ?? 'חדש').trim() || 'חדש',
  };

  const createdAt = payload.createdAt?.trim();
  if (createdAt) {
    body.createdAt = createdAt.slice(0, 10);
  }

  return body;
}
