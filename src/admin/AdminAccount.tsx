import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, Mail, Lock, CheckCircle2, AlertCircle, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminAccount: React.FC = () => {
  const { fetchWithAuth, admin, login, token } = useAuth();
  
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load current admin account details
  useEffect(() => {
    const fetchAccount = async () => {
      try {
        setLoading(true);
        const res = await fetchWithAuth('/api/admin/account');
        if (res.ok) {
          const data = await res.json();
          setEmail(data.email || '');
        } else if (admin?.email) {
          setEmail(admin.email);
        }
      } catch (err) {
        console.error('Failed to fetch admin account:', err);
        if (admin?.email) setEmail(admin.email);
      } finally {
        setLoading(false);
      }
    };
    fetchAccount();
  }, [fetchWithAuth, admin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setError('Current password is required to save changes.');
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword.length < 8) {
        setError('New password must be at least 8 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirmation do not match.');
        return;
      }
    }

    try {
      setSaving(true);
      const payload: any = {
        currentPassword,
        email: email.trim(),
      };

      if (newPassword) {
        payload.newPassword = newPassword;
        payload.confirmPassword = confirmPassword;
      }

      const res = await fetchWithAuth('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update admin account credentials');
      }

      // Update state
      setSuccess('Admin credentials successfully updated! Your new settings are active.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Keep AuthContext updated
      if (token && admin) {
        login(token, {
          ...admin,
          email: data.email || email,
        });
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while updating account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
          <Shield className="w-6 h-6 text-amber-500" />
          <span>Admin Account & Security</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your administrator email and update your password securely. Changes take effect immediately.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Update Administrator Credentials
            </h2>
            <p className="text-xs text-slate-400">
              Provide your current password to authorize changes to your email or password.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading account details...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Email / Username */}
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">
                Email / Username
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@emojiworld.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Used for signing into the EmojiLion Admin Control Panel.
              </p>
            </div>

            {/* Current Password (Required) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-slate-300">
                  Current Password <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-slate-500">Required for verification</span>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5" />
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">
                  New Password <span className="text-slate-500 font-normal">(Leave blank to keep unchanged)</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5" />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-800">
              <span className="text-[11px] text-slate-500">
                All passwords hashed with PBKDF2 SHA-512 & individual salts
              </span>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                {saving ? (
                  <span>Saving Changes...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Security Architecture Reference */}
      <div className="p-6 bg-slate-900/50 border border-slate-800/80 rounded-3xl space-y-3 text-xs">
        <h3 className="font-bold text-slate-300 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Password & Credential Security Architecture</span>
        </h3>
        <ul className="space-y-1.5 text-slate-400 text-[11px] list-disc pl-5 leading-relaxed">
          <li><strong>Zero Plain-text Storage:</strong> Passwords are never saved in clear-text. Only cryptographic PBKDF2 hashes and random 128-bit salts are persisted.</li>
          <li><strong>Constant-Time Verification:</strong> Passwords are authenticated using <code className="text-amber-400">crypto.timingSafeEqual</code> to prevent side-channel timing attacks.</li>
          <li><strong>Persistent Independence:</strong> Your customized credentials remain permanent across server restarts and data synchronizations.</li>
          <li><strong>Complete Isolation:</strong> No password hash, salt, or sensitive session data is ever exposed to public visitors or public APIs.</li>
        </ul>
      </div>
    </div>
  );
};
