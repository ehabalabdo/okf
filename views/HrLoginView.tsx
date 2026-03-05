import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { hrAuthService } from '../services/hrApiServices';
import { useClient } from '../context/ClientContext';
import { useLanguage } from '../context/LanguageContext';

const HrLoginView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { client } = useClient();
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');

    try {
      const result = await hrAuthService.login(username, password, client?.id || 0);
      // Store token & HR employee data
      localStorage.setItem('token', result.token);
      localStorage.setItem('hrEmployee', JSON.stringify(result.employee));
      // Clear any existing staff session
      localStorage.removeItem('user');
      localStorage.removeItem('patientUser');
      navigate(`/${slug}/hr/me`, { replace: true });
    } catch (err: any) {
      setError(err.message || (isAr ? 'فشل تسجيل الدخول' : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 flex items-center justify-center p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <i className="fa-solid fa-id-badge text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">
            {isAr ? 'بوابة الموظفين' : 'Employee Portal'}
          </h1>
          {client && <p className="text-sm text-slate-400 mt-1">{client.name}</p>}
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                {isAr ? 'اسم المستخدم' : 'Username'}
              </label>
              <input
                type="text"
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm"
                placeholder={isAr ? 'أدخل اسم المستخدم' : 'Enter username'}
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                {isAr ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-sm"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm font-bold px-4 py-2.5 rounded-xl border border-red-200">
                <i className="fa-solid fa-triangle-exclamation me-1"></i> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-extrabold text-sm hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              {loading ? <i className="fa-solid fa-circle-notch fa-spin me-2"></i> : <i className="fa-solid fa-right-to-bracket me-2"></i>}
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Back to staff login */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate(`/${slug}/login`)}
            className="text-sm text-slate-400 hover:text-indigo-500 transition-colors"
          >
            <i className="fa-solid fa-arrow-left me-1"></i> {isAr ? 'تسجيل دخول الموظفين (نظام)' : 'Staff Login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HrLoginView;
