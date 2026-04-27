import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Clock, Zap, Target, Award, Briefcase, ChevronLeft, Search,
    ShieldCheck, Star, ArrowUpRight, Sparkles, Calendar, User,
    TrendingUp, Bell, Heart, BookOpen, MapPin, Filter, Activity,
    Trophy, GraduationCap, Flame, Layers, Layout, MousePointer2,
    Compass, CheckCircle2, AlertCircle, LogOut, Settings, HelpCircle,
    FileText, MessageSquare, Plus, Users, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';

const StatWidget = React.memo(({ label, value, icon: Icon, trend, color, delay, description }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
        whileHover={{ y: -8, transition: { duration: 0.2 } }}
        className="bg-[#0f0f1a]/60 backdrop-blur-xl border border-white/5 p-7 rounded-[2.5rem] relative overflow-hidden group shadow-2xl"
    >
        {/* تأثير الإضاءة الخلفية (Glow effect) */}
        <div
            className="absolute -right-10 -top-10 w-32 h-32 blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-500"
            style={{ backgroundColor: color }}
        />

        <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                <Icon size={26} style={{ color: color }} />
            </div>
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-white/5 text-gray-400 uppercase italic tracking-widest border border-white/5">
                    {trend || 'Active'}
                </span>
            </div>
        </div>

        <div className="relative z-10">
            <h4 className="text-4xl font-black text-white mb-2 tracking-tight">
                {typeof value === 'number' ? value.toLocaleString() : value}
            </h4>
            <p className="text-gray-500 text-xs font-bold tracking-wide uppercase">{label}</p>
            {description && (
                <p className="text-[10px] text-gray-600 mt-4 font-medium leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {description}
                </p>
            )}
        </div>

        {/* أيقونة خلفية كبيرة وشفافة */}
        <Icon
            size={100}
            className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] group-hover:-rotate-12 transition-all duration-700"
            style={{ color: color }}
        />
    </motion.div>
));


const OpportunityCard = ({ item, delay }) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    return (
        <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay }}
            whileHover={{ x: -10 }}
            className="group relative flex items-center gap-5 p-5 bg-[#0f0f1a]/40 hover:bg-[#161625]/60 border border-white/5 rounded-[2rem] transition-all cursor-pointer shadow-lg"
            onClick={() => navigate(`/opportunities/${item.id}`)}
        >
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 flex-shrink-0 flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform">
                {item.org_name ? (
                    <span className="text-white font-black text-2xl uppercase">
                        {item.cover_image ? <img src={`${API_URL}/storage/${item.cover_image}`} alt={item.title} /> : item.user.organization.org_name.charAt(0)}
                    </span>
                ) : (
                    <Zap className="text-white" size={28} />
                )}
            </div>


            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-tighter">
                        فرصة مقترحة
                    </span>
                </div>
                <h4 className="text-white font-black text-sm truncate group-hover:text-indigo-400 transition-colors">
                    {item.title}
                </h4>
                <div className="flex items-center gap-4 mt-2 text-gray-500 text-[11px] font-bold">
                    <span className="flex items-center gap-1.5"><MapPin size={12} /> {item.location || 'الرياض - الدرعية'}</span>
                    <span className="flex items-center gap-1.5 text-emerald-500/80"><Clock size={12} /> {item.duration || 0 + 'ساعة'} </span>
                </div>
            </div>

            <div className="p-3 bg-white/5 rounded-2xl border border-white/5 opacity-0 group-hover:opacity-100 transition-all shadow-inner">
                <ArrowUpRight size={18} className="text-indigo-400" />
            </div>
        </motion.div>
    );
};

// --- المكون الرئيسي ---

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [user] = useState(JSON.parse(localStorage.getItem('user')) || {});

    // States الموحدة لتطابق هيكلية OrgDashboard
    const [dashboardData, setDashboardData] = useState({
        stats: {
            total_hours: 0,
            skills_count: 0,
            active_applications: 0,
            certificates_count: 0
        },
        chartData: [],
        userSkills: [], // أضف هذا الحقل هنا لضمان وجوده عند أول ريندر
        recommendations: [],
        recentActivity: [],
        notifications: []
    });

    const [activeTab, setActiveTab] = useState('overview');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const Res = await api.get('/student/dashboard');
            const notificationsRes = await api.get('/notifications');
            const recom = await api.get('/student/recommendations');

            if (Res.data) {


                setDashboardData({
                    stats: Res.data.stats,
                    chartData: Res.data.chart_data,
                    userSkills: Res.data.user_skills || [],
                    recommendations: recom.data || [],
                    recentActivity: Res.data.recent_activity || [],
                    notifications: notificationsRes.data || []
                });
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            if (error.response?.status === 401) navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    const API_URL = import.meta.env.VITE_API_URL;
    const chartData = useMemo(() => {
        if (!dashboardData.chartData || dashboardData.chartData.length === 0) return [];

        const currentMonthIndex = new Date().getMonth();
        return dashboardData.chartData.slice(0, currentMonthIndex + 1);
    }, [dashboardData.chartData]);

    return (


        <div className="flex min-h-screen bg-[#050508] text-right font-['Tajawal'] overflow-hidden" dir="rtl">

            <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full"></div>
            </div>

            <Sidebar active="dashboard" />
            {/* Grid Container */}
            {loading ? (
                <LoadingSpinner />
            ) : (
                <main className="flex-1  p-6 lg:p-10 relative z-10 overflow-y-auto max-h-screen custom-scrollbar">
                    <header className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-6"
                        >

                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                <div className="relative w-20 h-20 rounded-[1.8rem] border-2 border-white/10 p-1 bg-[#0c0c14] overflow-hidden">
                                    <img
                                        src={`${API_URL}/storage/${user.profile_image}`}
                                        alt="User"
                                        className="w-full h-full object-cover rounded-[1.4rem]"
                                    />
                                </div>
                                <div className="absolute -bottom-1 -left-1 w-7 h-7 bg-emerald-500 border-4 border-[#050508] rounded-full shadow-lg"></div>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                                        أهلاً بك، {user.full_name?.split(' ')[0] || 'أمجـد'}
                                    </h1>
                                    <Sparkles className="text-amber-400" size={24} />
                                </div>
                                <p className="text-gray-500 font-bold text-sm">
                                    لديك <span className="text-indigo-400">{dashboardData.stats.active_applications} فرصة</span> نشطة حالياً. استمر في التألق! 🚀
                                </p>
                            </div>
                        </motion.div>

                        <div className="flex items-center gap-4 bg-[#0f0f1a]/60 backdrop-blur-md border border-white/5 p-2 rounded-3xl z-9999">
                            <div className="relative group">
                                <button className="p-4 hover:bg-white/5 rounded-2xl text-gray-400 transition-all relative">
                                    <Bell size={22} />
                                    {/* إظهار النقطة الحمراء إذا وجد إشعار واحد على الأقل غير مقروء */}
                                    {dashboardData.notifications.some(n => n.read_at === null) && (
                                        <span className="absolute top-4 left-4 w-2.5 h-2.5 bg-rose-500 border-2 border-[#0f0f1a] rounded-full animate-pulse"></span>
                                    )}
                                </button>
                                <div className="absolute left-0 mt-3 w-80 bg-[#0c0c14]/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden">
                                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                        <h3 className="text-white font-black text-sm tracking-tight">الإشعارات</h3>
                                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                                            {dashboardData.notifications.filter(n => n.read_at === null).length} جديدة
                                        </span>
                                    </div>

                                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                        {dashboardData.notifications.length > 0 ? (
                                            dashboardData.notifications.map((note) => (
                                                <div
                                                    key={note.id}
                                                    className={`p-5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-all cursor-pointer group/item ${!note.read_at ? 'bg-indigo-500/[0.02]' : ''}`}
                                                >
                                                    <div className="flex gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${note.data.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                                                            note.data.type === 'error' ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-500/10 text-indigo-400'
                                                            }`}>
                                                            {note.data.type === 'success' ? <CheckCircle2 size={18} /> : <Bell size={18} />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-white font-black text-[12px] mb-1 group-hover/item:text-indigo-400 transition-colors">
                                                                {note.data.title}
                                                            </h4>
                                                            <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2 font-medium">
                                                                {note.data.message}
                                                            </p>
                                                            <div className="flex items-center justify-between mt-3">
                                                                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                                                                    {new Date(note.created_at).toLocaleDateString('ar-YE')}
                                                                </span>
                                                                {!note.read_at && (
                                                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-12 text-center">
                                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Bell size={24} className="text-gray-700" />
                                                </div>
                                                <p className="text-gray-600 text-xs font-bold">لا توجد إشعارات حالياً</p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => navigate('/notifications')}
                                        className="w-full py-4 bg-white/[0.02] hover:bg-white/[0.05] text-[11px] font-black text-gray-400 hover:text-white transition-all border-t border-white/5"
                                    >
                                        عرض كافة الإشعارات
                                    </button>
                                </div>
                            </div>

                            <div className="h-10 w-[1px] bg-white/5 mx-1"></div>
                            <button
                                onClick={() => navigate('/profile')}
                                className="flex items-center gap-3 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-indigo-600/20"
                            >
                                <User size={18} />
                                الملف الشخصي
                            </button>
                        </div>
                    </header>

                    {/* 2. الإحصائيات (Stats Grid) */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        <StatWidget
                            label="ساعات التطوع"
                            value={dashboardData.stats.total_hours}
                            icon={Clock}
                            color="#6366f1"
                            delay={0.1}
                            trend="+15%"
                            description="مجموع الساعات المعتمدة في السجل الرقمي الموثق"
                        />
                        <StatWidget
                            label="المهارات المكتسبة"
                            value={dashboardData.stats.skills_count}
                            icon={Zap}
                            color="#10b981"
                            delay={0.2}
                            trend="New"
                            description="المهارات التقنية والناعمة التي تم إثباتها ميدانياً"
                        />
                        <StatWidget
                            label="الطلبات النشطة"
                            value={dashboardData.stats.active_applications}
                            icon={Target}
                            color="#f59e0b"
                            delay={0.3}
                            trend="Live"
                            description="فرص تطوعية قيد التنفيذ أو بانتظار الموافقة"
                        />
                        <StatWidget
                            label="الشهادات الموثقة"
                            value={dashboardData.stats.certificates_count}
                            icon={Award}
                            color="#ec4899"
                            delay={0.4}
                            trend="Gold"
                            description="شهادات رسمية صادرة من مؤسسات معتمدة"
                        />
                    </section>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="xl:col-span-2 bg-[#0f0f1a]/60 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden"
                        >
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 relative z-10">
                                <div>
                                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                        <Activity className="text-indigo-400" size={26} />
                                        تحليلات الأداء التطوعي
                                    </h2>
                                    <p className="text-gray-500 text-xs font-bold mt-2 uppercase tracking-widest">تتبع نمو الساعات والمشاركات خلال 2026</p>
                                </div>
                                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                                    <button
                                        onClick={() => setActiveTab('overview')}
                                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        نظرة عامة
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('details')}
                                        className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'details' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        التفاصيل
                                    </button>
                                </div>
                            </div>

                            <div className="h-[350px] w-full relative z-10">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            stroke="rgba(255,255,255,0.2)"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={15}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-[#0c0c14] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
                                                            <p className="text-white font-black mb-2">{label}</p>
                                                            <div className="space-y-1">
                                                                <p className="text-indigo-400 text-xs font-bold">
                                                                    الساعات المنجزة: {payload[0].value} ساعة
                                                                </p>
                                                                <p className="text-pink-400 text-xs font-bold">
                                                                    الأنشطة: {payload[1]?.value || 0}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="hours"
                                            name="الساعات"
                                            stroke="#6366f1"
                                            strokeWidth={5}
                                            fillOpacity={1}
                                            fill="url(#colorHours)"
                                            animationDuration={2500}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="apps"
                                            name="الفرص"
                                            stroke="#ec4899"
                                            strokeWidth={3}
                                            strokeDasharray="10 10"
                                            fillOpacity={1}
                                            fill="url(#colorApps)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* مؤشرات الأداء السفلية - بيانات حقيقية */}
                            <div className="grid grid-cols-3 gap-8 pt-10 mt-8 border-t border-white/5 relative z-10">

                                {/* أعلى نشاط: استخراج الشهر الذي سجل أعلى ساعات */}
                                <div className="text-center group cursor-pointer">
                                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">
                                        أعلى نشاط
                                    </p>
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                        <p className="text-white font-black text-lg">
                                            {/* استخراج اسم الشهر من بيانات الرسم البياني إذا وجدت */}
                                            {chartData.length > 0
                                                ? [...chartData].sort((a, b) => b.hours - a.hours)[0]?.name
                                                : '---'}
                                            {` (${Math.max(...(chartData.map(d => d.hours) || [0]))} س)`}
                                        </p>
                                    </div>
                                </div>

                                {/* معدل الإنجاز: عرض النسبة من الـ API */}
                                <div className="text-center group cursor-pointer">
                                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-violet-400 transition-colors">
                                        معدل الإنجاز
                                    </p>
                                    <p className="text-white font-black text-lg">
                                        {dashboardData.stats.completion_rate || '0'}%
                                    </p>
                                </div>

                                {/* التصنيف الحالي: بناءً على ساعات التطوع */}
                                <div className="text-center group cursor-pointer">
                                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-2 group-hover:text-emerald-400 transition-colors">
                                        التصنيف الحالي
                                    </p>
                                    <p className="text-emerald-400 font-black text-lg flex items-center justify-center gap-1">
                                        <Trophy size={18} />
                                        {/* دالة بسيطة لتحديد اللقب بناءً على الساعات */}
                                        {dashboardData.stats.total_hours > 100 ? 'بلاتيني' :
                                            dashboardData.stats.total_hours > 50 ? 'ذهبي' : 'فضي'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>


                        {dashboardData.recommendations.length > 0 ? <>
                            {/* قائمة التوصيات الذكية */}
                            <div className="space-y-8">
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                                        <Compass className="text-amber-400" size={22} />
                                        فرص تطابق مهاراتك
                                    </h2>
                                    <button onClick={() => navigate('/opportunities')} className="text-[11px] font-black text-indigo-400 hover:text-white uppercase tracking-tighter transition-colors">استكشاف الكل</button>
                                </div>

                                <div className="space-y-5 max-h-[480px] overflow-y-auto custom-scrollbar px-4">
                                    {(() => {
                                        const appliedOpportunityIds = dashboardData.recentActivity.map(
                                            activity => activity.opportunity_id
                                        );

                                        const filteredRecommendations = (dashboardData.recommendations || []).filter(
                                            item => !appliedOpportunityIds.includes(item.id)
                                        );



                                        if (filteredRecommendations.length > 0) {
                                            return filteredRecommendations.map((item, idx) => (
                                                <div key={item.id}>

                                                    {(item.gender === user.gender || item.gender === 'both') ? <OpportunityCard key={item.id} item={item} delay={idx * 0.1} /> : <div></div>}

                                                </div>));
                                        } else if (dashboardData.recommendations.length > 0) {
                                            // حالة خاصة: إذا كانت التوصيات موجودة ولكنك سجلت فيها جميعاً
                                            return (
                                                <div className="text-center py-10 px-6 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/5">
                                                    <CheckCircle2 className="mx-auto mb-3 text-emerald-500/50" size={32} />
                                                    <p className="text-gray-500 text-[11px] font-bold">لقد قمت بالتقديم على جميع الفرص المقترحة حالياً!</p>
                                                </div>
                                            );
                                        } else {
                                            // حالة التحميل (Loading / Pulse)
                                            return [1, 2, 3].map(i => (
                                                <div key={i} className="animate-pulse flex gap-5 p-5 bg-white/[0.02] rounded-[2rem] border border-white/5">
                                                    <div className="w-16 h-16 bg-white/5 rounded-2xl" />
                                                    <div className="flex-1 space-y-3 py-2">
                                                        <div className="h-4 bg-white/10 rounded-lg w-3/4" />
                                                        <div className="h-3 bg-white/5 rounded-md w-1/2" />
                                                    </div>
                                                </div>
                                            ));
                                        }
                                    })()}
                                </div>

                                {/* بطاقة دعائية (Call to action) */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="p-8 bg-gradient-to-br from-indigo-600 to-violet-800 rounded-[2.5rem] relative overflow-hidden group shadow-xl shadow-indigo-600/10"
                                >
                                    <Sparkles className="absolute -bottom-2 -right-2 text-white/10 group-hover:rotate-12 transition-transform duration-1000" size={120} />
                                    <h4 className="text-white font-black text-lg mb-2 relative z-10">وثّق مهاراتك اليوم!</h4>
                                    <p className="text-indigo-100/70 text-xs font-medium leading-relaxed mb-6 relative z-10">
                                        هل تعلم أن المتطوعين الحاصلين على 5 شهادات أو أكثر يحصلون على فرص عمل أسرع بنسبة 60%؟
                                    </p>

                                </motion.div>
                            </div>
                        </> : <div></div>}

                    </div>

                    {/* 4. النشاطات الأخيرة والمهارات */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 pb-20">

                        {/* سجل النشاط (Activity Feed) */}
                        <div className="xl:col-span-2 bg-[#0f0f1a]/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10">
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                                        <Activity className="text-rose-500" size={24} />
                                        الخط الزمني للنشاط
                                    </h2>
                                    <p className="text-gray-600 text-[10px] font-bold mt-1 uppercase tracking-widest">تحديثات حية لطلباتك ومشاركاتك</p>
                                </div>

                            </div>

                            <div className="space-y-4">
                                {dashboardData.recentActivity.length > 0 ? (
                                    dashboardData.recentActivity.map((activity, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: 20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="flex border border-white/10 items-center gap-6 p-5 hover:bg-white/[0.02] rounded-3xl border border-transparent hover:border-white/5 transition-all group"
                                        >
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110 ${activity.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500' :
                                                activity.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                                    'bg-indigo-500/10 text-indigo-500'
                                                }`}>

                                                {activity.status === 'accepted' ? <CheckCircle2 size={20} /> : <Activity size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="text-white font-black text-sm">
                                                        {activity.status === 'accepted' ? 'تم قبول مشاركتك في ' : 'تم تقديم طلب انضمام لـ '}
                                                        <span className="text-indigo-400 group-hover:underline underline-offset-4">{activity.opportunity?.title}</span>
                                                    </p>
                                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">
                                                        {new Date(activity.created_at).toLocaleDateString('ar-YE')}
                                                    </span>
                                                </div>
                                                <p className="text-gray-500 text-xs font-medium">بواسطة: {activity.opportunity?.user?.organization?.org_name || 'جهة غير معروفة'}</p>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-20 bg-white/[0.01] rounded-[2rem] border border-dashed border-white/5">
                                        <Layout size={40} className="mx-auto mb-4 text-gray-800" />
                                        <p className="text-gray-600 font-bold text-sm">لا يوجد نشاط مسجل مؤخراً</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* تطوير المهارات (Skills Progress) */}
                        <div className="bg-[#0f0f1a]/60 backdrop-blur-xl border border-white/5 rounded-[3rem] p-10 flex flex-col shadow-2xl">
                            <h2 className="text-xl font-black text-white flex items-center gap-3 mb-10">
                                <Trophy className="text-violet-400" size={24} />
                                مؤشر الكفاءة
                            </h2>

                            <div className="space-y-9 flex-1">

                                {dashboardData.userSkills && dashboardData.userSkills.length > 0 ? (
                                    dashboardData.userSkills.map((skill, i) => (
                                        <div key={i} className="space-y-4 group">
                                            <div className="flex justify-between items-center">
                                                <span className="text-white font-black text-xs group-hover:text-indigo-400 transition-colors tracking-tight">
                                                    {skill.name}
                                                </span>
                                                <span className="text-gray-500 font-black text-[10px] bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                                    {skill.level}%
                                                </span>
                                            </div>
                                            <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5 shadow-inner">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${skill.level}%` }}
                                                    viewport={{ once: true }}
                                                    transition={{ duration: 2, ease: "circOut", delay: i * 0.1 }}
                                                    style={{ backgroundColor: skill.color || '#6366f1' }}
                                                    className="h-full rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)] relative"
                                                >
                                                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                                                </motion.div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    /* حالة عدم وجود مهارات أو أثناء التحميل */
                                    <p className="text-gray-500 text-xs font-bold text-center py-10">
                                        لم يتم إضافة مهارات بعد.. ابدأ بتطوير ملفك الشخصي!
                                    </p>
                                )}
                            </div>

                            {/* تحدي الالتزام (كما هو) */}
                            <div className="mt-12 pt-8 border-t border-white/5">
                                <div className="bg-[#050508] p-6 rounded-[2rem] border border-white/5 flex items-center gap-5 group hover:border-indigo-500/30 transition-all">
                                    <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-2xl group-hover:rotate-12 transition-transform">
                                        <Flame size={24} />
                                    </div>
                                    <div>
                                        <p className="text-white font-black text-sm mb-1">تحدي الالتزام</p>
                                        <p className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">
                                            أكملت 14 يوماً من النشاط المستمر
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                </main>
            )}

        </div>
    );
};
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-40 w-full">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/10 border-t-purple-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-emerald-500 rounded-full animate-spin animate-pulse" />
        </div>
        <h2 className="mt-8 text-xl font-black text-white tracking-widest animate-pulse uppercase">Syncing Database...</h2>
        <p className="text-gray-600 mt-2 font-bold">يرجى الانتظار، جاري تحضير البيانات</p>
    </div>
);
export default StudentDashboard;