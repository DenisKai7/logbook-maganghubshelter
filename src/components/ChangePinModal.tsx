import React, { useState } from 'react';
import { Modal } from './Modal';
import { api } from '../api';
import { User } from '../types';
import { KeyRound, Check, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  pin: string;
  onPinChanged: (newPin: string) => void;
}

export const ChangePinModal: React.FC<Props> = ({
  isOpen,
  onClose,
  user,
  pin,
  onPinChanged,
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPin.trim() || !newPin.trim() || !confirmPin.trim()) {
      setError('Semua kolom PIN wajib diisi.');
      return;
    }

    if (!/^\d{4,8}$/.test(newPin.trim())) {
      setError('PIN baru harus berupa 4 sampai 8 digit angka.');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setError('Konfirmasi PIN baru tidak cocok.');
      return;
    }

    if (currentPin.trim() === newPin.trim()) {
      setError('PIN baru tidak boleh sama dengan PIN lama.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.changePin(user.email, pin, {
        currentPin: currentPin.trim(),
        newPin: newPin.trim(),
      });

      if (res.status === 'success') {
        setSuccess('PIN berhasil diperbarui!');
        onPinChanged(newPin.trim());
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(res.message || 'Gagal mengubah PIN.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Ganti Kode PIN"
      subtitle="Perbarui PIN akun untuk menjaga keamanan akses logbook Anda"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-[#341b1d] border border-rose-200 dark:border-[#5c2427] text-xs text-rose-800 dark:text-[#f48771] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-[#f48771] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-[#1b3424] border border-emerald-200 dark:border-[#2e6040] text-xs text-emerald-800 dark:text-[#4ec9b0] flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-[#4ec9b0] shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
            PIN Lama Saat Ini
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#858585]">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              maxLength={8}
              placeholder="••••••"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/60 dark:bg-[#1e1e1e] text-slate-900 dark:text-white tracking-widest font-mono transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4]">
              PIN Baru
            </label>
            <span className="text-[11px] text-slate-400 dark:text-[#858585]">4-8 digit angka</span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#858585]">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              maxLength={8}
              placeholder="••••••"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/60 dark:bg-[#1e1e1e] text-slate-900 dark:text-white tracking-widest font-mono transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
            Ulangi PIN Baru
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-[#858585]">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              maxLength={8}
              placeholder="••••••"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/60 dark:bg-[#1e1e1e] text-slate-900 dark:text-white tracking-widest font-mono transition-colors"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-[#858585] hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {loading ? 'Menyimpan...' : 'Simpan PIN Baru'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
