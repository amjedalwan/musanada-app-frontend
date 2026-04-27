import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Bell, RefreshCw, Calendar, ArrowUpRight, Briefcase,
    Sparkles, Check, User, Target, Award, Zap, AlertCircle,
    ChevronLeft, Star, ShieldCheck, Clock
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Added 'motion' here
const Dashboard = () => {
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const [recentData, setRecentData] = useState([]);

    const navigate = useNavigate();
    const notifRef = useRef(null);
    const isStudent = user?.role === 'student';

    // إغلاق قائمة الإشعارات عند النقر خارجها
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifPanel(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const fetchDashboardData = useCallback(async (signal) => {
        setLoading(true);
        setError(null);
        try {
            const statsUrl = isStudent ? '/profile/stats' : '/org/dashboard-stats';

            // إرسال الـ signal مع كل طلب لإلغائه عند الضرورة
            const [statsRes, notifyCountRes, latestNotifyRes] = await Promise.all([
                api.get(statsUrl, { signal }),
                api.get('/notifications/unread-count', { signal }),
                api.get('/notifications', { signal }),
            ]);

            setUnreadCount(notifyCountRes.data.unread_count || 0);
            setNotifications(Array.isArray(latestNotifyRes.data) ? latestNotifyRes.data.slice(0, 5) : []);

            const d = statsRes.data;
            if (isStudent) {
                setStats([
                    { label: 'ساعات التطوع', value: d.total_hours || 0, color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: Clock, trend: '+5%' },
                    { label: 'المهارات', value: d.skills_count || 0, color: 'text-purple-400', bg: 'bg-purple-400/10', icon: Zap, trend: 'نشط' },
                    { label: 'الطلبات', value: d.active_applications || 0, color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Target, trend: 'مستقر' },
                    { label: 'الشهادات', value: d.certificates_count || 0, color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Award, trend: 'موثق' },
                ]);
                setRecentData(d.recent_opportunities || []);
            } else {
                const s = d.stats || {};
                setStats([
                    { label: 'الفرص المنشورة', value: s.total_opportunities || 0, color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Briefcase, trend: 'نشط' },
                    { label: 'المتقدمين', value: s.total_applicants || 0, color: 'text-purple-400', bg: 'bg-purple-400/10', icon: User, trend: '+12%' },
                    { label: 'المقبولين', value: s.accepted_students || 0, color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: Check, trend: 'ممتاز' },
                    { label: 'معلق', value: s.pending_applications || 0, color: 'text-amber-400', bg: 'bg-amber-400/10', icon: AlertCircle, trend: 'تنبيه' },
                ]);
                setRecentData(d.latest_applicants || []);
            }
        } catch (err) {
            if (axios.isCancel(err)) return; // تجاهل أخطاء الإلغاء المتعمدة
            setError("عذراً، حدث خطأ في الاتصال بالخادم.");
            console.error("Dashboard Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [isStudent]);

    useEffect(() => {
        const controller = new AbortController();
        fetchDashboardData(controller.signal);

        return () => controller.abort(); // أهم سطر لمنع "Request aborted"
    }, [fetchDashboardData]);

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;
        try {
            await api.post('/notifications/mark-all-read');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date() })));
        } catch (err) { console.error("Mark read error"); }
    };

    return (
        <div className="flex min-h-screen bg-[#070710] text-white font-sans overflow-hidden" dir="rtl">
            <Sidebar role={user?.role} />

            <main className="flex-1 h-screen overflow-y-auto p-4 md:p-8 lg:p-10 custom-scrollbar">

                {/* --- Header Section --- */}
                <header className="flex flex-row justify-between items-center gap-4 mb-10 w-full">
                    {/* القسم الأيمن: العنوان والترحيب */}
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 md:gap-3 flex-nowrap">
                            {/* استخدام clamp لجعل الخط مرناً: الحد الأدنى 18px والحد الأعلى 30px */}
                            <h1
                                className="font-black tracking-tight bg-gradient-to-l from-white to-gray-500 bg-clip-text text-transparent whitespace-nowrap"
                                style={{ fontSize: 'clamp(1.1rem, 4vw, 1.875rem)' }}
                            >
                                {isStudent ? 'لوحة المتطوع' : 'إدارة المؤسسة'}
                            </h1>

                            {/* شارة AI Optimized - تصغر في الجوال لتوفير مساحة */}
                            <span className="shrink-0 bg-indigo-500/10 text-indigo-400 text-[7px] md:text-[9px] px-1.5 md:px-2 py-0.5 md:py-1 rounded-md border border-indigo-500/20 font-black uppercase tracking-tighter">
                                AI Optimized
                            </span>
                        </div>

                        {/* نص الترحيب مع خاصية truncate لمنع تجاوز السطر */}
                        <p className="text-gray-500 text-[10px] md:text-sm font-medium truncate mt-1">
                            مرحباً بك مجدداً، <span className="text-white">{user?.full_name}</span> ✨
                        </p>
                    </div>

                    {/* القسم الأيسر: شريط الأدوات (التحديث والإشعارات) */}
                    <div className="flex items-center shrink-0 gap-1.5 md:gap-3 bg-[#111122]/50 p-1.5 md:p-2 rounded-2xl border border-white/5 backdrop-blur-xl z-[9995]">

                        {/* زر التحديث */}
                        <button
                            onClick={() => fetchDashboardData(new AbortController().signal)}
                            className="p-2 md:p-3 hover:bg-white/5 rounded-xl transition-all text-gray-400 group"
                        >
                            <RefreshCw size={18} className={`${loading ? 'animate-spin text-indigo-400' : ''}`} />
                        </button>

                        {/* حاوية الإشعارات */}
                        <div className="relative" ref={notifRef}>
                            <button
                                onClick={() => {
                                    setShowNotifPanel(!showNotifPanel);
                                    if (!showNotifPanel) handleMarkAllRead();
                                }}
                                className={`p-2 md:p-3 rounded-xl transition-all relative group ${showNotifPanel ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-white/5 text-gray-400'
                                    }`}
                            >
                                <Bell size={18} className={unreadCount > 0 ? 'animate-pulse' : ''} />

                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border-2 border-[#070710]"></span>
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown مع أنيميشن Framer Motion */}
                            <AnimatePresence>
                                {showNotifPanel && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute left-0 mt-4 w-72 md:w-80 bg-[#121225]/95 border border-white/10 rounded-[2rem] shadow-2xl z-50 overflow-hidden backdrop-blur-2xl ring-1 ring-white/10"
                                    >
                                        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                            <span className="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-400">الإشعارات الأخيرة</span>
                                            {unreadCount > 0 && (
                                                <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                                    {unreadCount} جديدة
                                                </span>
                                            )}
                                        </div>

                                        <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
                                            {notifications.length > 0 ? (
                                                notifications.map((n, index) => (
                                                    <motion.div
                                                        key={n.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        className={`p-4 border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-all ${!n.read_at ? 'bg-indigo-500/[0.03] border-r-2 border-r-indigo-500' : 'opacity-70'
                                                            }`}
                                                    >
                                                        <div className="flex gap-3 text-right" dir="rtl">
                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!n.read_at ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-gray-500'
                                                                }`}>
                                                                <Zap size={15} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-[11px] font-bold truncate ${!n.read_at ? 'text-white' : 'text-gray-400'}`}>
                                                                    {n.data?.title}
                                                                </p>
                                                                <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                                                                    {n.data?.message}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="py-12 flex flex-col items-center gap-3 opacity-20">
                                                    <Bell size={30} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">صندوق الوارد فارغ</span>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => { setShowNotifPanel(false); navigate('/notifications'); }}
                                            className="w-full p-4 text-[10px] font-black text-center text-gray-400 hover:text-white hover:bg-white/[0.02] border-t border-white/5 transition-colors uppercase tracking-widest"
                                        >
                                            فتح مركز التنبيهات
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* --- Profile Strength Card --- */}
                <div className="mb-8 p-6 bg-gradient-to-r from-indigo-900/40 to-[#111122] border border-white/5 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] -z-10 group-hover:bg-indigo-500/20 transition-all"></div>
                    <div className="flex items-center gap-6">
                        <div className="relative w-16 h-16">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="5" fill="transparent" strokeDasharray={176} strokeDashoffset={176 * (1 - 0.75)} className="text-indigo-500" strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center font-black text-sm">75%</div>
                        </div>
                        <div>
                            <h4 className="text-lg font-black flex items-center gap-2">قوة الحساب <ShieldCheck size={18} className="text-emerald-400" /></h4>
                            <p className="text-gray-500 text-xs mt-1">أكمل بياناتك المهنية لتظهر في مقدمة نتائج البحث الذكي.</p>
                        </div>
                    </div>
                    <button onClick={() => navigate('/profile')} className="px-6 py-3 bg-white text-black font-black text-xs rounded-xl hover:bg-indigo-50 transition-all">تعديل البروفايل</button>
                </div>

                {/* --- Stats Grid --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {stats.map((item, index) => (
                        <div key={index} className="bg-[#111122] border border-white/5 p-6 rounded-[2rem] hover:border-indigo-500/40 transition-all group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-2xl ${item.bg} ${item.color}`}>
                                    <item.icon size={22} />
                                </div>
                                <span className="text-[10px] font-black bg-white/5 px-2 py-1 rounded-md text-gray-400">{item.trend}</span>
                            </div>
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">{item.label}</p>
                            <h3 className={`text-3xl font-black ${item.color}`}>
                                {loading ? <div className="w-12 h-8 bg-white/5 animate-pulse rounded-lg" /> : item.value}
                            </h3>
                            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                <item.icon size={100} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- Main Content --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Activity Table */}
                    <div className="lg:col-span-8 bg-[#111122] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
                                    {isStudent ? 'فرص مقترحة لك' : 'آخر الطلبات الواردة'}
                                </h2>
                            </div>
                            <button onClick={() => navigate(isStudent ? '/opportunities' : '/applications')} className="text-[10px] font-black text-indigo-400 hover:text-white transition-colors">عرض السجل الكامل</button>
                        </div>

                        <div className="p-6 space-y-4">
                            {recentData.length > 0 ? recentData.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.01] rounded-2xl border border-white/5 hover:bg-white/[0.03] transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-[#070710] flex items-center justify-center border border-white/5 text-indigo-400 font-bold">
                                            {isStudent ? <Briefcase size={20} /> : (item.user?.full_name?.charAt(0) || 'U')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black">{isStudent ? item.title : item.user?.full_name}</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">
                                                {isStudent ? item.user?.organization?.org_name : item.opportunity?.title}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="hidden md:block text-[9px] font-black px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">متوافق 95%</span>
                                        <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10"><ChevronLeft size={16} /></button>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-20 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <Star size={24} className="text-gray-800" />
                                    </div>
                                    <p className="text-xs text-gray-600 font-black tracking-widest uppercase">لا توجد بيانات جديدة حالياً</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions Side */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Action Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl shadow-indigo-500/20">
                            <div className="relative z-10">
                                <Award className="text-white/80 mb-4" size={32} />
                                <h3 className="text-xl font-black mb-2">الشهادات الموثقة</h3>
                                <p className="text-white/60 text-[10px] font-bold mb-6 uppercase tracking-wider leading-relaxed">
                                    {isStudent ? 'حمل شهاداتك المعتمدة وشاركها على لينكد إن مباشرة.' : 'أصدر شهادات تقديرية للمتطوعين المتميزين بنقرة واحدة.'}
                                </p>
                                <button className="w-full bg-white text-indigo-600 py-3 rounded-xl font-black text-[11px] flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
                                    انتقل للمركز <ArrowUpRight size={14} />
                                </button>
                            </div>
                            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000"></div>
                        </div>

                        {/* Quick Menu */}
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { icon: Calendar, label: 'الجدول الزمني', path: '/calendar' },
                                { icon: Sparkles, label: 'توصيات الذكاء الاصطناعي', path: '/recommendations' },
                                { icon: User, label: 'إعدادات الخصوصية', path: '/settings' }
                            ].map((btn, i) => (
                                <button key={i} onClick={() => navigate(btn.path)} className="flex items-center justify-between p-4 bg-[#111122] border border-white/5 rounded-2xl hover:bg-white/5 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <btn.icon size={18} className="text-gray-400 group-hover:text-indigo-400" />
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">{btn.label}</span>
                                    </div>
                                    <ChevronLeft size={14} className="text-gray-600 group-hover:translate-x-[-4px] transition-transform" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.3); }
            `}</style>
        </div>
    );
};

export default Dashboard;