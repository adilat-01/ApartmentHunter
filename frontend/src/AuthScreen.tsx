import { useState } from 'react';
import { login, loginDemo, register } from './api';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const repoUrl = 'https://github.com/adilat-01/ApartmentHunter';
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemoLogin = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await loginDemo();
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בכניסה לחשבון הדגמה');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(username.trim(), password);
      } else {
        await login(username.trim(), password);
      }
      onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen bg-[#f7f4eb] flex items-center justify-center p-5 pb-24 font-sans"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-5">
        <div className="text-center flex flex-col gap-2">
          <span className="text-2xl">🏹</span>
          <h1 className="text-xl font-bold text-stone-900">ApartmentHunter</h1>
          <p className="text-xs text-stone-500 font-medium">
            {mode === 'login' ? 'התחברות לחשבון שלך' : 'יצירת חשבון חדש'}
          </p>
        </div>

        <div className="flex gap-2 bg-stone-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
              mode === 'login'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500'
            }`}
          >
            התחברות
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition ${
              mode === 'register'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500'
            }`}
          >
            הרשמה
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-stone-600">שם משתמש</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2.5 bg-stone-50 rounded-lg text-xs border-0 outline-none focus:bg-stone-100 text-stone-800"
              required
              minLength={3}
              autoComplete="username"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-stone-600">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 bg-stone-50 rounded-lg text-xs border-0 outline-none focus:bg-stone-100 text-stone-800"
              required
              minLength={6}
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
            />
          </div>
          {error && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 p-3 rounded-xl">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || demoLoading}
            className="bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs py-2.5 rounded-lg shadow-md transition disabled:opacity-50"
          >
            {loading
              ? 'מעבד...'
              : mode === 'login'
                ? 'התחבר'
                : 'צור חשבון'}
          </button>
        </form>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-stone-200" />
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            או
          </span>
          <div className="flex-1 h-px bg-stone-200" />
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading || demoLoading}
            className="w-full bg-[#ca6a43] hover:bg-[#b85f3c] text-white font-bold text-sm py-2.5 rounded-lg shadow-md transition disabled:opacity-50"
          >
            {demoLoading ? 'נכנס לדשבורד...' : 'Explore Demo Account'}
          </button>
          <p className="text-center text-[11px] sm:text-xs text-stone-500 font-medium leading-relaxed px-1">
            סביבת דמו של יוזר פעיל - ללא הרשמה
          </p>
        </div>
      </div>

      <a
        href={repoUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View project on GitHub"
        className="absolute bottom-5 left-1/2 -translate-x-1/2 inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-xl bg-white/90 text-stone-700 border border-stone-200 shadow-sm text-xs font-semibold transition hover:bg-stone-900 hover:text-white active:scale-[0.98] active:bg-stone-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4 shrink-0"
          aria-hidden="true"
        >
          <path d="M12 2C6.476 2 2 6.589 2 12.249c0 4.528 2.865 8.37 6.839 9.727.5.095.683-.222.683-.494 0-.244-.009-.89-.014-1.747-2.782.617-3.369-1.383-3.369-1.383-.455-1.177-1.11-1.49-1.11-1.49-.908-.636.069-.623.069-.623 1.004.072 1.532 1.057 1.532 1.057.892 1.566 2.341 1.113 2.91.851.09-.664.349-1.113.635-1.369-2.22-.259-4.555-1.14-4.555-5.072 0-1.12.39-2.036 1.03-2.754-.103-.26-.446-1.303.098-2.716 0 0 .84-.275 2.75 1.052A9.35 9.35 0 0 1 12 7.66c.85.004 1.707.117 2.507.343 1.909-1.327 2.748-1.052 2.748-1.052.546 1.413.203 2.456.1 2.716.64.718 1.028 1.634 1.028 2.754 0 3.941-2.339 4.81-4.566 5.064.359.317.678.942.678 1.898 0 1.37-.012 2.475-.012 2.812 0 .274.18.593.688.492C19.138 20.616 22 16.775 22 12.249 22 6.589 17.522 2 12 2Z" />
        </svg>
        <span>View on GitHub</span>
      </a>
    </div>
  );
}
