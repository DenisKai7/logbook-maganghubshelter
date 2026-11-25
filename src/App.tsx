import React, { useState, useEffect, useCallback } from 'react';
import { User, PesertaData, MentorData, HRData } from './types';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { PesertaView } from './components/PesertaView';
import { MentorView } from './components/MentorView';
import { HRView } from './components/HRView';
import { ChangePinModal } from './components/ChangePinModal';
import { AlertCircle, RefreshCw } from 'lucide-react';

const SESSION_USER_KEY = 'maganghub_user';
const SESSION_PIN_KEY = 'maganghub_pin';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const raw = sessionStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const [pin, setPin] = useState<string>(() => {
    return sessionStorage.getItem(SESSION_PIN_KEY) || '';
  });

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [changePinOpen, setChangePinOpen] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!user || !pin) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.getData(user.email, pin);
      if (res.status === 'success') {
        setDashboardData(res.data);
      } else {
        setError(res.message || 'Gagal mengambil data dari server.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi gangguan jaringan.');
    } finally {
      setLoading(false);
    }
  }, [user, pin]);

  useEffect(() => {
    if (user && pin) {
      fetchData();
    }
  }, [user, pin, fetchData]);

  const handleLoginSuccess = (authUser: User, authPin: string) => {
    setUser(authUser);
    setPin(authPin);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(authUser));
    sessionStorage.setItem(SESSION_PIN_KEY, authPin);
  };

  const handleLogout = () => {
    setUser(null);
    setPin('');
    setDashboardData(null);
    sessionStorage.removeItem(SESSION_USER_KEY);
    sessionStorage.removeItem(SESSION_PIN_KEY);
  };

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1e1e1e] text-slate-900 dark:text-[#cccccc] flex flex-col font-sans transition-colors duration-200">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenChangePin={() => setChangePinOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-[#341b1d] border border-rose-200/80 dark:border-[#5c2427] flex items-start justify-between gap-3 text-xs text-rose-800 dark:text-[#f48771] animate-fade-in-up">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-[#f48771] shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1 font-semibold text-rose-900 dark:text-[#f48771] underline hover:no-underline cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3 h-3" /> Coba Lagi
            </button>
          </div>
        )}

        {loading && !dashboardData ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-[#0b4e8c] dark:border-[#007acc] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500 dark:text-[#858585] font-medium tracking-wide">Memuat data logbook...</p>
          </div>
        ) : dashboardData ? (
          <>
            {user.role === 'Peserta' && (
              <PesertaView
                user={user}
                data={dashboardData as PesertaData}
                pin={pin}
                onRefresh={fetchData}
              />
            )}
            {user.role === 'Mentor' && (
              <MentorView
                user={user}
                data={dashboardData as MentorData}
                pin={pin}
                onRefresh={fetchData}
              />
            )}
            {user.role === 'HR' && (
              <HRView
                user={user}
                data={dashboardData as HRData}
                pin={pin}
                onRefresh={fetchData}
              />
            )}
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/70 dark:border-[#2d2d2d] bg-white/60 dark:bg-[#181818] py-6 text-center text-xs text-slate-400 dark:text-[#858585] transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} PT. Shelter Indonesia Gemilang — MagangHub Logbook.</p>
          <div className="flex items-center gap-4 text-slate-500 dark:text-[#858585]">
            <button
              onClick={() => setChangePinOpen(true)}
              className="hover:text-[#0b4e8c] dark:hover:text-[#9cdcfe] cursor-pointer transition-colors"
            >
              Ganti PIN
            </button>
            <span>•</span>
            <button
              onClick={fetchData}
              className="hover:text-[#0b4e8c] dark:hover:text-[#9cdcfe] cursor-pointer transition-colors"
            >
              Sinkronisasi Ulang
            </button>
          </div>
        </div>
      </footer>

      <ChangePinModal
        isOpen={changePinOpen}
        onClose={() => setChangePinOpen(false)}
        user={user}
        pin={pin}
        onPinChanged={(newPin) => {
          setPin(newPin);
          sessionStorage.setItem(SESSION_PIN_KEY, newPin);
        }}
      />
    </div>
  );
}
