import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const PatientLoginView: React.FC = () => {
  const navigate = useNavigate();
  const { patientLogin } = useAuth();
  const { t, dir } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await patientLogin(username, password);
      navigate('/patient/dashboard');
    } catch (err: any) {
      const key = err.message as any;
      const authKeys = ['account_inactive', 'account_wrong_center', 'invalid_credentials', 'invalid_phone_password'];
      setError(authKeys.includes(key) ? t(key) : (err.message || t('login_failed')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 flex items-center justify-center p-4" dir={dir}>
      <div className="max-w-md w-full">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="TKC" className="w-20 h-20 object-contain mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('patient_portal')}</h1>
          <p className="text-slate-500 text-sm">{t('patient_portal_subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                <i className="fa-solid fa-phone ml-1"></i> {t('phone_number')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                placeholder={t('phone_example')}
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">{t('phone_hint')}</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                <i className="fa-solid fa-lock ml-1"></i> {t('password_label_patient')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                placeholder={t('enter_password')}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  {t('logging_in')}
                </>
              ) : (
                <>
                  <i className="fa-solid fa-right-to-bracket"></i>
                  {t('login_btn')}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center justify-center gap-2 mx-auto"
            >
              <i className="fa-solid fa-arrow-left"></i>
              {t('staff_login')}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>{t('help_contact')}</p>
        </div>
      </div>
    </div>
  );
};

export default PatientLoginView;
