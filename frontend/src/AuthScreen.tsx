import { useState } from 'react';
import { login, loginDemo, register } from './api';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
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
      className="min-h-screen bg-[#f7f4eb] flex items-center justify-center p-5 font-sans"
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
    </div>
  );
}
