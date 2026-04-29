import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft,
    Loader2, CheckCircle2, AlertTriangle, Fingerprint,
    Info, ExternalLink, ShieldAlert, Sparkles, UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import api from '../api/axios';

/**
 * مكون حقل الإدخال المخصص بتأثيرات بصرية متقدمة
 */
const AdvancedInput = ({
    icon: Icon, label, type, name, placeholder, value, onChange, error,
    showPasswordToggle, isPasswordVisible, onTogglePassword
}) => (
    <div className="space-y-2 group" dir="rtl">
        <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mr-1 group-focus-within:text-emerald-600 transition-colors">
            {label}
        </label>
        <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 group-focus-within:text-emerald-600 transition-all z-20">
                <Icon size={18} strokeWidth={2.5} />
            </div>

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                autoComplete="current-password"
                placeholder={placeholder}
                className={`
                    w-full text-end pr-12 pl-12 py-4 bg-slate-50 border rounded-[1.5rem] 
                    outline-none transition-all duration-300 font-bold text-sm text-slate-900
                    placeholder:text-slate-600
                    ${error ? 'border-red-200 bg-red-50' : 'border-slate-100 focus:border-emerald-500 focus:bg-white'}
                `}
            />

            {showPasswordToggle && (
                <button
                    type="button"
                    onClick={onTogglePassword}
                    className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 hover:text-slate-600 transition-colors z-20"
                >
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            )}

            {/* خط سفلي متحرك */}
            <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-0 h-[2px] bg-emerald-500 group-focus-within:w-[80%] transition-all duration-500 opacity-50" />
        </div>
        <AnimatePresence>
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[10px] text-red-400 font-bold mr-2"
                >
                    * {error}
                </motion.p>
            )}
        </AnimatePresence>
    </div>
);

const Login = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loginStatus, setLoginStatus] = useState('idle'); // idle, success, error

    // 1. التحقق من وجود جلسة نشطة وتوجيه المستخدم فوراً
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if (token && role) {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    // 2. التحقق من صحة المدخلات (Client-side Validation)
    const validateForm = useCallback(() => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!credentials.email) newErrors.email = "يرجى إدخال البريد الإلكتروني";
        else if (!emailRegex.test(credentials.email)) newErrors.email = "صيغة البريد غير صحيحة";

        if (!credentials.password) newErrors.password = "يرجى إدخال كلمة المرور";
        else if (credentials.password.length < 6) newErrors.password = "كلمة المرور قصيرة جداً";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [credentials]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const onLoginSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm() || isLoading) return;

        setIsLoading(true);
        setLoginStatus('idle');
        const mainToast = toast.loading('جاري التحقق من الهوية...');

        try {
            const response = await api.post('/login', credentials);
            const { token, user, role } = response.data;
           

            // التحقق من حالة المؤسسة
            if (role === 'organization' && user.status === 'pending') {
               
                toast.error("حسابك قيد المراجعة من قبل الإدارة، ستصلك رسالة عند التفعيل.");
                return;
            }
            // التأكد من استلام البيانات المطلوبة
            if (!token || !user?.role) throw new Error("بيانات الخادم غير مكتملة");

            localStorage.clear();
            localStorage.setItem('token', token);
            localStorage.setItem('role', user.role);
            localStorage.setItem('user', JSON.stringify(user));
            setLoginStatus('success');
            toast.success(`مرحباً بك مجدداً، ${user.full_name || 'مستخدم مساندة'}`, { id: mainToast });

           
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } catch (error) {
            setLoginStatus('error');
            console.error("Login Security Audit Error:", error);

            let friendlyMessage = "عذراً، البريد الإلكتروني أو كلمة المرور غير صحيحة";
            if (error.response?.status === 429) friendlyMessage = "محاولات كثيرة خاطئة، يرجى الانتظار قليلاً";
            if (error.code === "ERR_NETWORK") friendlyMessage = "تعذر الاتصال بالخادم، يرجى المحقق من الإنترنت";

            toast.error(friendlyMessage, { id: mainToast });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-['Tajawal']" dir="rtl">
            <Toaster position="top-center" toastOptions={{
                style: { background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '20px', fontWeight: 'bold' }
            }} />

            <div className="absolute inset-0 z-0">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-emerald-600/5 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.15, 0.05] }}
                    transition={{ duration: 15, repeat: Infinity, delay: 2 }}
                    className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-slate-400/5 rounded-full blur-[120px]"
                />
            </div>

            {/* --- بطاقة تسجيل الدخول (The Core Card) --- */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[480px] relative z-10"
            >
                {/* 1. شعار النظام وهويته */}
                <div className="text-center mb-10">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        className="inline-flex relative p-5 rounded-[2.5rem] bg-gradient-to-tr from-emerald-500 to-emerald-600 shadow-2xl shadow-emerald-600/20 mb-6 group cursor-pointer"
                    >
                        <ShieldCheck size={48} className="text-slate-900 stroke-[2.5]" />
                        <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-white rounded-[2.5rem]"
                        />
                    </motion.div>

                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">مـسـانـدة</h1>
                    <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">
                        <Sparkles size={14} className="text-emerald-500" />
                        بوابة الدخول الموحدة
                    </div>
                </div>

                {/* 2. جسم البطاقة (Glassmorphism Effect) */}
                <div className="bg-white/80 backdrop-blur-3xl border border-slate-200 p-8 md:p-12 rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.05)]">

                    <form onSubmit={onLoginSubmit} className="space-y-7">
                        {/* حقل البريد */}
                        <AdvancedInput
                            icon={Mail}
                            label="عنوان البريد الإلكتروني"
                            type="email"
                            name="email"
                            placeholder="email@musanada.com"
                            value={credentials.email}
                            onChange={handleInputChange}
                            error={errors.email}
                        />

                        {/* حقل كلمة المرور */}
                        <div className="space-y-2">
                            <AdvancedInput
                                icon={Lock}
                                label="كلمة السر الخاصة بك"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="••••••••••••"
                                value={credentials.password}
                                onChange={handleInputChange}
                                error={errors.password}
                                showPasswordToggle
                                isPasswordVisible={showPassword}
                                onTogglePassword={() => setShowPassword(!showPassword)}
                            />
                            <div className="flex justify-between items-center px-1">
                                <Link to="/forgot-password" size="sm" className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-widest">
                                    نسيت كلمة السر؟
                                </Link>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold">
                                    <ShieldAlert size={12} />
                                    اتصال مشفر SSL
                                </div>
                            </div>
                        </div>

                        {/* زر تسجيل الدخول الذكي */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`
                                w-full py-5 rounded-[1.8rem] font-black text-sm uppercase tracking-[0.2em]
                                transition-all duration-500 relative overflow-hidden group active:scale-95
                                ${loginStatus === 'success' ? 'bg-emerald-500 text-slate-900' : 'bg-slate-900 text-slate-900 hover:bg-emerald-600'}
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                        >
                            <AnimatePresence mode="wait">
                                {isLoading ? (
                                    <motion.div
                                        key="loader"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="flex items-center justify-center gap-3"
                                    >
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>جاري المصادقة</span>
                                    </motion.div>
                                ) : loginStatus === 'success' ? (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center justify-center gap-3"
                                    >
                                        <CheckCircle2 size={20} />
                                        <span>تم الدخول</span>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="idle"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="flex items-center justify-center gap-3"
                                    >
                                        <span className='group-hover:text-black text-white'>تسجيل الدخول</span>
                                        <Fingerprint size={20} className="group-hover:scale-110 group-hover:text-black text-white transition-transform" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </button>
                    </form>

                    {/* 3. الروابط التبادلية */}
                    <div className="mt-12 pt-8 border-t border-slate-100">
                        <div className="grid grid-cols-1 gap-4">
                            <p className="text-center text-slate-400 text-[11px] font-bold mb-2">ليس لديك حساب في المنصة؟</p>
                            <Link
                                to="/register"
                                className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 text-xs font-black hover:bg-slate-100 transition-all group"
                            >
                                <UserCircle size={18} className="text-emerald-500" />
                                أنشئ حسابك كمتطوع أو مؤسسة
                                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-all mr-2" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* --- تذييل الصفحة (Footer Information) --- */}
                <div className="mt-10 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        <a href="#" className="hover:text-emerald-600 transition-colors">سياسة الخصوصية</a>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <a href="#" className="hover:text-emerald-600 transition-colors">مركز المساعدة</a>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <a href="#" className="hover:text-emerald-600 transition-colors">اتصل بنا</a>
                    </div>
                    <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">
                        &copy; 2026 Musanada Deployment • System v4.2.0-Stable
                    </p>
                </div>
            </motion.div>

            {/* عناصر ديكورية جانبية */}
            <div className="hidden xl:block absolute left-12 bottom-12 p-6 bg-white/80 border border-slate-100 backdrop-blur-xl rounded-3xl shadow-sm max-w-[200px]">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <Info size={16} />
                    <span className="text-[10px] font-black uppercase">نصيحة أمنية</span>
                </div>
                <p className="text-[9px] text-slate-500 font-bold leading-relaxed">
                    لا تشارك كلمة المرور الخاصة بك مع أي شخص، فريق مساندة لن يطلبها منك أبداً عبر الإيميل.
                </p>
            </div>

            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
                .custom-float { animation: float 4s ease-in-out infinite; }
            `}</style>
        </div>
    );
};

export default Login;