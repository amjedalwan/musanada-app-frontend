import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Search, MapPin, Calendar, Users, Loader2, Sparkles, Briefcase,
    Target, LayoutGrid, Navigation, AlertCircle, Filter, CheckCircle2,
    ArrowRight, Ban, Clock, XCircle, ChevronRight, Hash, Heart,
    Share2, Bookmark, Info, Globe, ShieldCheck,
    Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';

import { URLS } from '../config/constants';



/**
 * @component Opportunities
 * @description واجهة عرض الفرص التطوعية والتدريبية بتصميم عصري ونظام فلترة متقدم
 */

const Opportunities = () => {
    const navigate = useNavigate();
  
    // --- States Management ---
    const [opportunities, setOpportunities] = useState([]);
    const [studentStateOpp, setStudentStateOpp] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLocating, setIsLocating] = useState(false);
    const [loadingSearch, setloadingSearch] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'near', 'trending'

    const [filters, setFilters] = useState({
        search: '',
        location: '',
        type: '',
        gender: '',
        sortBy: 'newest'
    });

    // --- Dynamic Cities List (إصلاح الفلتر) ---
    // نقوم باستخراج المدن الموجودة فعلياً في البيانات لتكون القائمة ديناميكية
    const availableCities = useMemo(() => {
        const cities = new Set(['المجاردة', 'الرياض', 'مكة', 'نجران', 'جدة', 'الدمام']);
        opportunities.forEach(op => {
            if (op.location) cities.add(op.location);
        });
        return Array.from(cities);
    }, [opportunities]);

    // --- Data Fetching ---
    const fetchOpportunities = useCallback(async () => {
        setloadingSearch(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key === 'sortBy' ? 'sort' : key, value);
            });

            // جلب الفرص
            const res = await api.get(`/opportunities?${params.toString()}`);
            const data = res.data?.data || res.data || [];

            // جلب إحصائيات الطالب (الحالات التي سجل فيها)
            let studentOppData = [];
            try {
                const studentOpp = await api.get(`/student/stats`);
                studentOppData = studentOpp.data?.data || studentOpp.data || [];
            } catch (statsErr) {
                if (statsErr.response?.status !== 401) console.error("Stats Error");
            }

            // تصفية الفرص النشطة فقط
            const activeOps = data.filter(op => {
                const isExpired = op.deadline && new Date(op.deadline) < new Date();
                return !isExpired && op.status !== 'hidden';
            });

            setOpportunities(activeOps);
            setStudentStateOpp(studentOppData);
        } catch (err) {
            console.error("Fetch Error:", err);
            // Swal.fire('خطأ', 'حدث خلل أثناء جلب البيانات', 'error');
        } finally {
            setLoading(false);
            setloadingSearch(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(() => fetchOpportunities(), 500);
        return () => clearTimeout(timer);
    }, [fetchOpportunities]);

    // --- Handlers ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateLocation = () => {
        if (!navigator.geolocation) return Swal.fire('عذراً', 'متصفحك لا يدعم تحديد الموقع', 'error');
        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                await api.post('/user/update-location', { lat: latitude, lng: longitude });
                setFilters(prev => ({ ...prev, sortBy: 'nearest' }));

                Swal.fire({
                    title: 'تم تحديث موقعك',
                    text: 'يتم الآن عرض الفرص الأقرب إليك مكانيًا',
                    icon: 'success',
                    toast: true,
                    position: 'top-end',
                    timer: 4000,
                    showConfirmButton: false,
                    background: '#0f172a',
                    color: '#fff'
                });
            } catch (err) {
                Swal.fire('خطأ', 'فشل في ربط إحداثياتك بالسيرفر', 'error');
            } finally { setIsLocating(false); }
        }, () => {
            setIsLocating(false);
            Swal.fire('صلاحيات الموقع', 'نحتاج للوصول لموقعك لترتيب النتائج', 'warning');
        });
    };

    // --- Filtering Logic (Client-side extra layer) ---
    const filteredOpps = useMemo(() => {
        return opportunities.filter(opp => {
            const matchesSearch = (opp.title || "").toLowerCase().includes(filters.search.toLowerCase());
            const matchesLocation = filters.location === "" || opp.location === filters.location;
            const matchesType = filters.type === "" || opp.type === filters.type;
            const matchesGender = filters.gender === "" || opp.gender === filters.gender || opp.gender === 'both';
            return matchesSearch && matchesLocation && matchesType && matchesGender;
        });
    }, [opportunities, filters]);

    // --- Render Logic ---
    return (
        <div className="flex min-h-screen bg-[#020204] text-right font-['Tajawal'] text-slate-200 overflow-hidden" dir="rtl">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[140px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>

            <Sidebar />

            {loading ? (
                <div className="flex-1 flex items-center justify-center"><LoadingSkeleton /></div>
            ) : (
                <main className="flex-1 px-4 md:px-10 relative z-10 overflow-y-auto max-h-screen custom-scrollbar pb-20">
                    <div className="max-w-[1500px] mx-auto py-8">

                        {/* 1. Header Section */}
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                            <div className="space-y-4">
                                <motion.div
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 text-indigo-400 bg-indigo-500/5 w-fit px-5 py-2 rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.1)]"
                                >
                                    <Sparkles size={18} className="animate-pulse" />
                                    <span className="text-xs font-black uppercase tracking-[2px]">منصة مساندة الرقمية</span>
                                </motion.div>
                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-4xl md:text-5xl font-black text-white"
                                >
                                    استكشف <span className="bg-clip-text text-transparent bg-gradient-to-l from-indigo-400 via-purple-400 to-cyan-400">الفرص المتاحة</span>
                                </motion.h1>
                                <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
                                    هنا تجد بوابتك للمشاركة المجتمعية والتدريب المهني. جميع الفرص موثقة وتمنحك ساعات معتمدة في سيرتك الذاتية.
                                </p>
                            </div>

                            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
                                {['all', 'trending', 'saved'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                    >
                                        {tab === 'all' ? 'الكل' : tab === 'trending' ? 'الأكثر طلباً' : 'المحفوظة'}
                                    </button>
                                ))}
                            </div>
                        </header>

                        {/* 2. Main Filter Console */}
                        <section className="relative mb-16 group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative bg-[#0b0c14]/80 backdrop-blur-3xl border border-white/10 p-4 rounded-[2.2rem] shadow-2xl">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                                    {/* Search Input */}
                                    <div className="lg:col-span-5 relative group">
                                        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                        <input
                                            type="text"
                                            name="search"
                                            value={filters.search}
                                            onChange={handleFilterChange}
                                            placeholder="ابحث عن مسمى وظيفي، مهارة، أو شركة..."
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-4.5 pr-14 pl-6 text-sm outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-600"
                                        />
                                    </div>

                                    {/* Filters Grid */}
                                    <div className="lg:col-span-5 grid grid-cols-3 gap-3">
                                        {/* City Filter - تم إصلاحه */}
                                        <div className="relative">
                                            <MapPin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                                            <select
                                                name="location"
                                                value={filters.location}
                                                onChange={handleFilterChange}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pr-9 pl-3 text-[11px] font-bold outline-none hover:border-white/20 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">جميع المدن</option>
                                                {availableCities.map(city => (
                                                    <option key={city} value={city} className="bg-slate-900 text-white">{city}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="relative">
                                            <Briefcase size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                                            <select
                                                name="type"
                                                value={filters.type}
                                                onChange={handleFilterChange}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pr-9 pl-3 text-[11px] font-bold outline-none hover:border-white/20 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">كل الأنواع</option>
                                                <option value="voluntary">تطوعي</option>
                                                <option value="training">تدريبي</option>
                                                <option value="course">دورة</option>
                                            </select>
                                        </div>

                                        <div className="relative">
                                            <Users size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
                                            <select
                                                name="gender"
                                                value={filters.gender}
                                                onChange={handleFilterChange}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pr-9 pl-3 text-[11px] font-bold outline-none hover:border-white/20 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="">الجنس (الكل)</option>
                                                <option value="male">رجال</option>
                                                <option value="female">نساء</option>
                                                <option value="both">للجنسين</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="lg:col-span-2 flex gap-2">
                                        <button
                                            onClick={handleUpdateLocation}
                                            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl border transition-all duration-500 font-black text-xs ${filters.sortBy === 'nearest' ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                        >
                                            {isLocating ? <Loader2 className="animate-spin" size={18} /> : <Navigation size={18} />}
                                            {filters.sortBy === 'nearest' ? 'الأقرب لك' : 'تحديد الموقع'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. Opportunities Grid */}
                        {loadingSearch ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8"><LoadingSkeleton /></div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                <AnimatePresence mode='popLayout'>
                                    {filteredOpps.length > 0 ? (
                                        filteredOpps.map((opp, index) => (
                                            <OpportunityCard
                                                key={opp.id}
                                                opp={opp}
                                                applicationStatus={studentStateOpp.recent_opportunities?.find(s => s.opportunity_id === opp.id)?.status}
                                                index={index}
                                            />
                                        ))
                                    ) : (
                                        <EmptyState />
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </main>
            )}
        </div>
    );
};

/**
 * @subcomponent OpportunityCard
 * @description بطاقة العرض الفردية للفرصة
 */
const OpportunityCard = React.memo(({ opp, applicationStatus, index }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [imageError, setImageError] = useState(false);

    const progress = Math.min(((opp.accepted_count || 0) / (opp.required_volunteers || 1)) * 100, 100);
    const daysRemaining = useMemo(() => {
        if (!opp.deadline) return null;
        const diff = new Date(opp.deadline) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [opp.deadline]);

    const statusMap = {
        pending: { label: 'قيد المراجعة', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: <Clock size={14} /> },
        accepted: { label: 'تم قبولك', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: <CheckCircle2 size={14} /> },
        rejected: { label: 'نعتذر منك', color: 'text-red-400', bg: 'bg-red-400/10', icon: <XCircle size={14} /> }
    };
    const handleShare = async (e) => {
        e.stopPropagation(); // منع الانتقال لصفحة التفاصيل عند الضغط على الزر

        const shareData = {
            title: opp.title,
            text: `اكتشف فرصة: ${opp.title} في ${opp.location} عبر منصة مساندة`,
            url: `${window.location.origin}/opportunities/${opp.id}`,
        };

        try {
            // التحقق مما إذا كان المتصفح يدعم خاصية المشاركة
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // البديل: نسخ الرابط للملصق (Clipboard)
                await navigator.clipboard.writeText(shareData.url);
                Swal.fire({
                    title: 'تم نسخ الرابط',
                    text: 'يمكنك الآن مشاركته مع أصدقائك',
                    icon: 'success',
                    toast: true,
                    position: 'top-end',
                    timer: 3000,
                    showConfirmButton: false,
                    background: '#0d0e17',
                    color: '#fff'
                });
            }
        } catch (err) {
            console.error("Share Error:", err);
        }
    };
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative flex flex-col h-[520px] bg-[#0d0e17] rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 transition-all duration-500 overflow-hidden shadow-xl"
            onClick={() => navigate(`/opportunities/${opp.id}`)}
        >
            {/* Image Section */}
            <div className="relative h-1/2 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e17] via-transparent to-black/20 z-10" />
                {!imageError ? (
                    <img
                        src={opp.cover_image || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop'}
                        alt={opp.title}
                        className={`w-full h-full object-cover transition-transform duration-700 ${isHovered ? 'scale-110 blur-[2px]' : 'scale-100'}`}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center font-black text-slate-700">NO IMAGE</div>
                )}

                {/* Badges on Image */}
                <div className="absolute top-5 inset-x-5 flex justify-between items-start z-20">
                    <div className="flex gap-2">
                        <span className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1.5 rounded-xl uppercase shadow-lg">
                            {opp.type === 'voluntary' ? 'تطوع' : 'تدريب'}
                        </span>
                        {daysRemaining !== null && daysRemaining <= 3 && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-3 py-1.5 rounded-xl animate-pulse">
                                ينتهي قريباً
                            </span>
                        )}
                    </div>
                    {applicationStatus && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl backdrop-blur-xl border border-white/10 ${statusMap[applicationStatus]?.bg} ${statusMap[applicationStatus]?.color}`}>
                            {statusMap[applicationStatus]?.icon}
                            <span className="text-[10px] font-black">{statusMap[applicationStatus]?.label}</span>
                        </div>
                    )}
                </div>

                {/* Floating Map Pin */}
                <div className="absolute bottom-5 right-5 z-20 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                    <MapPin size={14} className="text-indigo-400" />
                    <span className="text-xs font-bold text-white">{opp.location}</span>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-4">
                    <div className="min-w-[40px] min-h-[40px] max-w-[40px] rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px]">
                        <div className="w-full h-full bg-[#0d0e17] rounded-xl flex items-center justify-center overflow-hidden">
                            <img src={URLS.STORAGE+ "/" + opp.user?.profile_image || '/default-avatar.png'} className="w-full h-full object-cover" alt="org" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-indigo-400 truncate w-40">{opp.user?.organization?.org_name || 'جهة غير معروفة'}</span>
                        <span className="text-[10px] text-slate-500 font-bold">منذ {new Date(opp.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                </div>

                <h3 className="text-xl font-black text-white mb-3 line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
                    {opp.title}
                </h3>

                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={16} className="text-indigo-500/50" />
                        <span className="text-xs font-bold">{opp.total_logged_hours || 0} ساعة</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <Users size={16} className="text-purple-500/50" />
                        <span className="text-xs font-bold">{opp.required_volunteers} مقعد</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-auto space-y-3">
                    <div className="flex justify-between text-[10px] font-black">
                        <span className="text-slate-500 uppercase tracking-widest"> المقاعد المحجوزة </span>
                        <span className="text-indigo-400">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                        />
                    </div>
                </div>

                {/* Card Action */}
                <div className="mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex gap-2">
                        <button className="p-3 bg-white/5 hover:bg-indigo-600/20 rounded-xl transition-colors border border-white/5">
                            <Eye size={18} className="text-slate-400 hover:text-red-500" />
                        </button>
                        <button
                            onClick={handleShare}
                            className="p-3 bg-white/5 hover:bg-indigo-600/20 rounded-xl transition-all duration-300 border border-white/5 active:scale-90 group/share"
                            title="مشاركة الفرصة"
                        >
                            <Share2
                                size={18}
                                className="text-slate-400 group-hover/share:text-indigo-400 transition-colors"
                            />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-400 font-black text-xs cursor-pointer group/btn">
                        <span>التفاصيل</span>
                        <ArrowRight size={16} className="group-hover/btn:translate-x-[-4px] transition-transform rotate-180" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

/**
 * @subcomponent EmptyState
 * @description عند عدم وجود نتائج
 */
const EmptyState = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="col-span-full py-32 flex flex-col items-center justify-center bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-white/5"
    >
        <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <Search size={40} className="text-indigo-400" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2">لم نجد ما تبحث عنه</h3>
        <p className="text-slate-500 font-bold">جرب تغيير كلمات البحث أو الفلاتر المختارة</p>
    </motion.div>
);

/**
 * @subcomponent LoadingSkeleton
 * @description محاكي التحميل لزيادة سرعة الموقع الظاهرية
 */
const LoadingSkeleton = () => (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
            <div key={i} className="h-[500px] bg-white/5 rounded-[2.5rem] animate-pulse relative overflow-hidden">
                <div className="h-1/2 bg-white/5" />
                <div className="p-6 space-y-4">
                    <div className="h-4 w-1/2 bg-white/10 rounded-lg" />
                    <div className="h-8 w-full bg-white/10 rounded-lg" />
                    <div className="h-4 w-3/4 bg-white/10 rounded-lg" />
                </div>
            </div>
        ))}
    </div>
);

export default Opportunities;