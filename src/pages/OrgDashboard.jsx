import React, { useEffect, useState, useCallback } from 'react';
import {
    Bell, Users, Briefcase, CheckCircle, Clock, TrendingUp, Search,
    MoreHorizontal, ArrowUpRight, Plus, Zap, AlertCircle, ChevronLeft,
    Star, Award, ShieldCheck, LayoutGrid, List, MessageSquare, Activity, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'; // استيراد مكونات الرسم البياني
import api from '../api/axios';
import Sidebar from '../components/Sidebar';

const OrgDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        stats: {
            total_opportunities: 0,
            pending_applications: 0,
            total_hours: 0,
            average_rating: 0
        },
        chartData: [], // بيانات الرسم البياني
        applicants: [],
        activeOpps: [],
    });

    const fetchData = useCallback(async (signal) => {

        setLoading(true);
        try {
            const [dashboardRes, applicantsRes] = await Promise.all([
                api.get('/org/dashboard-stats', { signal }),
                api.get('/org/latest-applicants', { signal })
            ]);

            setData({
                stats: {
                    total_opportunities: dashboardRes.data.stats.total_opportunities || 0,
                    pending_applications: dashboardRes.data.stats.pending_applications || 0,
                    total_hours: dashboardRes.data.stats.total_hours || 0,
                    average_rating: dashboardRes.data.stats.average_rating || 0 // قيمة افتراضية أو من الـ API
                },
                // تحويل بيانات المتطوعين الشهرية للرسم البياني
                chartData: dashboardRes.data.monthly_volunteers || [
                    { name: 'يناير', count: 40 },
                    { name: 'فبراير', count: 70 },
                    { name: 'مارس', count: 45 },
                    { name: 'أبريل', count: 90 },
                ],
                activeOpps: dashboardRes.data.active_opportunities || [],
                applicants: applicantsRes.data.applicants || [],
            });
        } catch (err) {
            if (err.name === 'CanceledError') {
                console.log('Request canceled safely');
            } else {
                console.error("Error fetching dashboard data", err);
            }
        } finally {
            setLoading(false);
        }

    }, []);
    useEffect(() => {
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => controller.abort(); // التنظيف الصحيح هنا
    }, [fetchData]);


    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
            <Sidebar role="organization" />
            {/* Grid Container */}
            {loading ? (
                <LoadingSpinner />
            ) : (

                <main className="flex-1 h-screen relative overflow-y-auto custom-scrollbar px-4 lg:px-8 py-6">
                    {/* Background Blurs */}
                    <div className=" absolute top-[-10%] left-[10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[120px] rounded-full" />

                    <div className="max-w-[1500px] mx-auto space-y-8 relative z-10">

                        {/* Header */}
                        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                                    لوحة <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">الإحصائيات</span>
                                </h1>
                            </div>
                        </header>

                        {/* 1. الإحصائيات العامة (Dashboard Stats) */}        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatWidget
                                label="إجمالي الفرص"
                                value={data?.stats?.total_opportunities || 0}
                                icon={Briefcase}
                                trend="نشطة/مغلقة"
                                color="#10b981"
                            />
                            <StatWidget
                                label="طلبات معلقة"
                                value={data?.stats?.pending_applications || 0}
                                icon={Activity}
                                trend="تحتاج رد"
                                color="#0d9488"
                            />
                            <StatWidget
                                label="الساعات المنجزة"
                                value={data?.stats?.total_hours || 0}
                                icon={Clock}
                                trend="إجمالي الوقت"
                                color="#059669"
                            />

                            <StatWidget
                                label="التقييم العام"
                                value={data?.stats?.average_rating || 0}
                                icon={Star}
                                trend="ثقة المتطوعين"
                                color="#059669"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* 2. الرسم البياني (Chart) */}
                            <div className="lg:col-span-12 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm shadow-emerald-500/5 min-w-0">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-xl font-black flex items-center gap-3 text-slate-900">
                                        <div className="w-2 h-6 bg-emerald-600 rounded-full" />
                                        نمو قاعدة المتطوعين
                                    </h2>
                                    <select className="bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold px-4 py-2 
                   text-slate-600 outline-none cursor-pointer
                   transition-all duration-300
                   focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50
                   appearance-none shadow-sm">
                                        <option className="bg-white text-slate-900">آخر 6 أشهر</option>
                                        <option className="bg-white text-slate-900">هذا العام</option>
                                    </select>
                                </div>

                                <div className="w-full h-[350px] min-h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                        <AreaChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                                            <defs>
                                                {/* تدرج لوني احترافي: أخضر */}
                                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                              <defs>
                                                {/* تدرج لوني احترافي: بنفسجي يميل للزرقة */}
                                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>

                                            {/* شبكة خلفية هادئة جداً */}
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: '500' }}
                                                dy={15}
                                                // لضمان ترتيب المحور من اليمين لليسار إذا لزم الأمر
                                                reversed={false}
                                            />

                                            {/* إضافة YAxis لإظهار الأرقام بوضوح */}
                                            <YAxis
                                                hide={true}
                                                domain={[0, 'auto']}
                                            />

                                            <Tooltip
                                                cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 5' }}
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                                    direction: 'rtl', // لدعم النصوص العربية
                                                    textAlign: 'right'
                                                }}
                                                // تخصيص النص الظاهر داخل التلميح
                                                labelStyle={{ color: '#1e293b', marginBottom: '4px', fontFamily: 'inherit' }}
                                                itemStyle={{ color: '#059669', fontSize: '12px' }}
                                                formatter={(value) => [`${value} متطوع`, "العدد"]} // ترجمة كلمة Count للعربية
                                                labelFormatter={(label) => `شهر ${label}`} // إضافة كلمة شهر قبل الاسم
                                            />

                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#10b981"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorCount)"
                                                activeDot={{
                                                    r: 6,
                                                    fill: '#10b981',
                                                    stroke: '#fff',
                                                    strokeWidth: 2
                                                }}
                                                // تأثير الأنيميشن عند التحميل
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                            </div>
                            {/* قسم الفرص النشطة مع نسبة الإنجاز */}
                            <div className="lg:col-span-6 bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm shadow-emerald-500/5">
                                <h2 className="text-xl font-black mb-6 flex items-center gap-3 text-slate-900">
                                    <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                                    متابعة الفرص النشطة
                                </h2>

                                <div className="space-y-6">
                                    {data.activeOpps.map((opp) => (
                                        <div key={opp.id} className="space-y-2">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-bold text-slate-900">{opp.title}</span>
                                                <span className="text-emerald-600">{opp.completion_rate}%</span>
                                            </div>

                                            {/* شريط التقدم المحسن */}
                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${opp.completion_rate}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                                />
                                            </div>

                                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                                                <span>المطلوب: {opp.required_volunteers} متطوع</span>
                                                <span>المقبولين: {opp.accepted_count}</span>
                                            </div>
                                        </div>
                                    ))}

                                    {data.activeOpps.length === 0 && (
                                        <div className="text-center py-10 text-slate-400 italic">
                                            لا توجد فرص نشطة حالياً..
                                        </div>
                                    )}
                                </div>
                            </div>
                             {/* العمود الأيسر: قائمة آخر الفرص المنشورة */}
                            <div className="lg:col-span-6 space-y-6">
                                <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm shadow-emerald-500/5 h-full">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-black flex items-center gap-3 text-slate-900">
                                            <div className="w-2 h-6 bg-emerald-600 rounded-full" />
                                            آخر الفرص المنشورة
                                        </h2>
                                        <button
                                            onClick={() => navigate('/manage-opportunities')}
                                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                                        >
                                            عرض الكل
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {data.activeOpps.slice(0, 5).map((opp) => (
                                            <div
                                                key={opp.id}
                                                onClick={() => navigate(`/opportunity-applicants/${opp.id}`)}
                                                className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:border-emerald-500/30 hover:bg-white transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                                        <Briefcase size={22} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                                                            {opp.title}
                                                        </h4>
                                                   
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                                                <Users size={12} />
                                                                {opp.accepted_count} متطوع
                                                            </span>
                                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                            <span className="text-[10px] text-emerald-600 font-bold contents">
                                                                <p className="text-[10px] text-slate-400 font-bold">المتقدمين</p>
                                                                <p className="text-xs font-black text-slate-900">{opp.applicants_count || 0}</p>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <ChevronLeft size={18} className="text-slate-600 group-hover:text-emerald-600 group-hover:translate-x-[-4px] transition-all" />
                                                </div>
                                            </div>
                                        ))}

                                        {data.activeOpps.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                    <AlertCircle className="text-slate-900" size={32} />
                                                </div>
                                                <p className="text-slate-400 text-sm font-bold">لا يوجد فرص منشورة بعد</p>
                                                <button
                                                    onClick={() => navigate('/opportunities/create')}
                                                    className="mt-4 text-emerald-600 text-xs font-black underline"
                                                >
                                                    انشر أول فرصة الآن
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div >
                </main >)}
        </div >
    );
};


const StatWidget = ({ label, value, icon: Icon, trend, color }) => (
    <motion.div whileHover={{ y: -5 }} className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm shadow-emerald-500/5 relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 rounded-2xl bg-slate-50">
                <Icon size={24} style={{ color }} />
            </div>
            <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-slate-50 text-slate-400 uppercase italic border border-slate-100">
                {trend}
            </span>
        </div>
        <div className="relative z-10">
            <h4 className="text-3xl font-black text-slate-900 mb-1">{value}</h4>
            <p className="text-slate-400 text-xs font-bold">{label}</p>
        </div>
        <Icon size={80} className="absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity" />
    </motion.div>
);
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-40 w-full">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-teal-500 rounded-full animate-spin animate-pulse" />
        </div>
        <h2 className="mt-8 text-xl font-black text-slate-900 tracking-widest animate-pulse uppercase">Syncing Database...</h2>
        <p className="text-slate-500 mt-2 font-bold">يرجى الانتظار، جاري تحضير البيانات</p>
    </div>
);
export default OrgDashboard;