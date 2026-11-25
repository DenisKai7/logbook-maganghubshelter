import React, { useState } from 'react';
import { api } from '../api';
import { User } from '../types';
import { Modal } from './Modal';
import { useTheme } from '../context/ThemeContext';
import {
  Mail,
  ArrowRight,
  KeyRound,
  Shield,
  Sun,
  Moon,
  CheckCircle,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  Award,
  Users
} from 'lucide-react';

interface Props {
  onLoginSuccess: (user: User, pin: string) => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !pin.trim()) {
      setError('Email dan PIN wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(email.trim(), pin.trim());
      if (res.status === 'success' && res.user) {
        onLoginSuccess(res.user, pin.trim());
      } else {
        setError(res.message || 'Email atau PIN salah.');
      }
    } catch (err: any) {
      setError(err.message || 'Koneksi gagal. Periksa koneksi internet atau server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#1e1e1e] transition-colors duration-200">
      {/* Top Bar with Brand & Theme Switcher */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0b4e8c] dark:bg-[#0e639c] text-white flex items-center justify-center font-bold text-base shadow-sm ring-2 ring-blue-500/10">
            S
          </div>
          <div>
            <span className="font-semibold text-slate-900 dark:text-white text-base tracking-tight block leading-tight">
              MagangHub
            </span>
            <span className="text-[11px] text-slate-500 dark:text-[#858585] font-medium">
              PT. Shelter Indonesia Gemilang
            </span>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-[#2d2d2d] bg-white dark:bg-[#252526] text-slate-700 dark:text-[#cccccc] hover:bg-slate-50 dark:hover:bg-[#2d2d2d] transition-all cursor-pointer shadow-xs"
          title={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap VS Code'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-[#dcdcaa]" />
              <span className="hidden sm:inline">Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-[#0b4e8c]" />
              <span className="hidden sm:inline">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Main Split Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Humanize Corporate Information */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-[#1e2733] text-[#0b4e8c] dark:text-[#9cdcfe] border border-blue-200/60 dark:border-[#264f78]">
              <span className="w-2 h-2 rounded-full bg-[#0b4e8c] dark:bg-[#3794ff] animate-pulse" />
              Sistem Terpadu Peserta &amp; Mentor Magang
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.18]">
              Dokumentasi Belajar &amp; Kinerja{' '}
              <span className="text-[#0b4e8c] dark:text-[#3794ff]">Magang Lebih Terarah</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-[#858585] leading-relaxed max-w-xl mx-auto lg:mx-0">
              Platform internal PT. Shelter Indonesia Gemilang untuk mencatat logbook harian, merancang target mingguan, serta menerima evaluasi berkala dari mentor pembimbing.
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left max-w-xl mx-auto lg:mx-0">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252526] border border-slate-200/80 dark:border-[#2d2d2d] shadow-xs hover:border-[#0b4e8c]/40 dark:hover:border-[#007acc]/40 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-[#1e2733] text-[#0b4e8c] dark:text-[#9cdcfe] flex items-center justify-center mb-2">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Logbook Harian</h4>
                <p className="text-[11px] text-slate-500 dark:text-[#858585] mt-0.5">Catat progres, kendala &amp; bukti output tugas.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252526] border border-slate-200/80 dark:border-[#2d2d2d] shadow-xs hover:border-[#0b4e8c]/40 dark:hover:border-[#007acc]/40 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-[#1e2733] text-[#0b4e8c] dark:text-[#9cdcfe] flex items-center justify-center mb-2">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Feedback Mentor</h4>
                <p className="text-[11px] text-slate-500 dark:text-[#858585] mt-0.5">Dapatkan arahan konstruktif secara berkala.</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#252526] border border-slate-200/80 dark:border-[#2d2d2d] shadow-xs hover:border-[#0b4e8c]/40 dark:hover:border-[#007acc]/40 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-[#1e2733] text-[#0b4e8c] dark:text-[#9cdcfe] flex items-center justify-center mb-2">
                  <Shield className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">Monitoring HR</h4>
                <p className="text-[11px] text-slate-500 dark:text-[#858585] mt-0.5">Rekapitulasi aktivitas magang lintas divisi.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Modern Login Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto animate-fade-in-up">
            <div className="bg-white dark:bg-[#252526] p-7 sm:p-9 rounded-3xl border border-slate-200/90 dark:border-[#383838] shadow-xl shadow-slate-200/40 dark:shadow-black/50 transition-all duration-200">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#0b4e8c] dark:text-[#3794ff]">
                    Portal Masuk
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-[#858585] font-mono">
                    Aman &amp; Terenkripsi
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Masuk ke Akun Anda
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#858585] mt-1">
                  Gunakan email terdaftar dan kode PIN keamanan akun Anda.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-[#341b1d] border border-rose-200 dark:border-[#5c2427] text-xs text-rose-800 dark:text-[#f48771] leading-relaxed animate-fade-in-up">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1.5">
                    Alamat Email Perusahaan
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#858585]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="nama@perusahaan.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] focus:border-transparent bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#666666] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4]">
                      Kode PIN
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotModalOpen(true)}
                      className="text-[11px] font-medium text-[#0b4e8c] dark:text-[#9cdcfe] hover:underline cursor-pointer"
                    >
                      Lupa PIN?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#858585]">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPin ? 'text' : 'password'}
                      required
                      maxLength={20}
                      placeholder="••••••"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] focus:border-transparent bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white tracking-widest font-mono transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-[#858585] hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      title={showPin ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                      aria-label="Toggle PIN Visibility"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] active:scale-[0.99] disabled:opacity-50 transition-all shadow-md shadow-blue-900/10 dark:shadow-none cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Sistem</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#2d2d2d] text-center">
                <p className="text-[11px] text-slate-400 dark:text-[#858585] leading-relaxed">
                  Akses terbatas untuk peserta magang, mentor pembimbing, dan tim HR PT. Shelter Indonesia Gemilang.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 border-t border-slate-200/60 dark:border-[#2d2d2d] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#858585]">
        <p>© {new Date().getFullYear()} PT. Shelter Indonesia Gemilang — MagangHub Logbook.</p>
        <p className="text-[11px] text-slate-400 dark:text-[#666666]">
          Solusi Manajemen Tenaga Kerja &amp; Program Pemagangan Terpercaya
        </p>
      </footer>

      {/* Forgot PIN Helper Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Bantuan Lupa PIN"
        subtitle="Prosedur pemulihan akses akun MagangHub PT. Shelter Indonesia Gemilang"
      >
        <div className="space-y-4 text-xs text-slate-600 dark:text-[#cccccc] leading-relaxed">
          <p>
            Untuk menjaga kerahasiaan evaluasi logbook dan kepatuhan data internal, pemulihan kode PIN dilakukan terpusat oleh <strong>Admin HRD</strong>.
          </p>

          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-[#1e2733] border border-blue-200/60 dark:border-[#264f78] space-y-2">
            <p className="font-semibold text-[#0b4e8c] dark:text-[#9cdcfe]">
              Langkah Pemulihan PIN:
            </p>
            <ol className="list-decimal pl-4 space-y-1 text-slate-700 dark:text-[#cccccc]">
              <li>Hubungi tim HRD PT. Shelter Indonesia Gemilang.</li>
              <li>Sampaikan Nama Lengkap dan Alamat Email yang terdaftar di program magang.</li>
              <li>Admin HR akan mereset PIN akun Anda ke PIN sementara (<strong>1234</strong>).</li>
              <li>Setelah berhasil login kembali, segera ubah PIN Anda melalui menu <strong>Ganti PIN</strong> di navbar.</li>
            </ol>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="px-4 py-2 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
