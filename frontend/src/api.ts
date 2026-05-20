import {
  buildCreateApartmentBody,
  buildCreateFromSourcesBody,
  type CreateApartmentPayload,
  type CreateFromSourcesPayload,
} from './apartmentPayload';

/** Backend origin; empty = same-origin (Vite dev proxy). Set via VITE_API_URL in production. */
function normalizeApiBase(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed) return '';
  return trimmed.replace(/\/+$/, '');
}

export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL);

const TOKEN_KEY = 'apartment_hunter_token';
const USER_KEY = 'apartment_hunter_user';

export interface AuthUser {
  id: number;
  username: string;
  isDemoSession?: boolean;
}

export function authDisplayName(user: AuthUser): string {
  if (user.isDemoSession || user.username.startsWith('demo_temp_')) {
    return 'סביבת דמו אישית';
  }
  return user.username;
}

export interface ApartmentImage {
  id: number;
  apartmentId: number;
  originalFilename: string;
  url: string;
}

export interface Apartment {
  id: string;
  createdAt: string;
  status: string;
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
  images?: ApartmentImage[];
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

/** Wipe auth on every full page load / new tab so users always start at login. */
export function resetAuthOnPageLoad(): void {
  clearAuth();
}

export function saveAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers = new Headers(options.headers);

  if (auth) {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && auth) {
    clearAuth();
    throw new Error('Session expired');
  }

  if (!response.ok) {
    let detail = 'Request failed';
    try {
      const err = await response.json();
      const raw = err.detail ?? err.message ?? detail;
      if (Array.isArray(raw)) {
        detail = raw
          .map((item: { msg?: string; loc?: unknown[] }) => {
            const field = Array.isArray(item.loc)
              ? item.loc.filter((p) => p !== 'body').join('.')
              : '';
            return field ? `${field}: ${item.msg ?? 'invalid'}` : item.msg ?? 'invalid';
          })
          .join('; ');
      } else if (typeof raw === 'string') {
        detail = raw;
      } else {
        detail = JSON.stringify(raw);
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function register(
  username: string,
  password: string
): Promise<AuthUser> {
  const data = await apiFetch<{
    access_token: string;
    username: string;
    user_id: number;
  }>(
    '/api/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
    false
  );
  const user = { id: data.user_id, username: data.username };
  saveAuth(data.access_token, user);
  return user;
}

export async function loginDemo(): Promise<AuthUser> {
  const data = await apiFetch<{
    access_token: string;
    username: string;
    user_id: number;
    is_demo_session?: boolean;
  }>('/api/auth/demo', { method: 'POST' }, false);
  const user: AuthUser = {
    id: data.user_id,
    username: data.username,
    isDemoSession: data.is_demo_session ?? true,
  };
  saveAuth(data.access_token, user);
  return user;
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<{
    access_token: string;
    username: string;
    user_id: number;
  }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    },
    false
  );
  const user = { id: data.user_id, username: data.username };
  saveAuth(data.access_token, user);
  return user;
}

export async function fetchApartments(): Promise<Apartment[]> {
  return apiFetch<Apartment[]>('/api/apartments');
}

export async function analyzePost(text: string) {
  return apiFetch<{
    status: string;
    extractedData: Apartment['extractedData'];
    userNotes: string;
  }>('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function createApartment(
  payload: CreateApartmentPayload
): Promise<Apartment> {
  return apiFetch<Apartment>('/api/apartments', {
    method: 'POST',
    body: JSON.stringify(buildCreateApartmentBody(payload)),
  });
}

export async function createApartmentFromSources(
  payload: CreateFromSourcesPayload
): Promise<Apartment> {
  return apiFetch<Apartment>('/api/apartments/from-sources', {
    method: 'POST',
    body: JSON.stringify(buildCreateFromSourcesBody(payload)),
  });
}

export async function updateApartment(
  id: string,
  payload: {
    status?: string;
    userNotes?: string;
    extractedData?: Apartment['extractedData'];
  }
): Promise<Apartment> {
  return apiFetch<Apartment>(`/api/apartments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteApartment(id: string): Promise<void> {
  await apiFetch(`/api/apartments/${id}`, { method: 'DELETE' });
}

export async function uploadApartmentImage(
  apartmentId: string,
  file: File
): Promise<ApartmentImage> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch<ApartmentImage>(`/api/apartments/${apartmentId}/images`, {
    method: 'POST',
    body: form,
  });
}

export async function deleteApartmentImage(
  apartmentId: string,
  imageId: number
): Promise<void> {
  await apiFetch(`/api/apartments/${apartmentId}/images/${imageId}`, {
    method: 'DELETE',
  });
}

/** Fetch image blob with auth header for <img src> via object URL */
export async function fetchImageBlobUrl(path: string): Promise<string> {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to load image');
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
