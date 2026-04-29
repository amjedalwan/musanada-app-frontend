import React, { useEffect, useState, useCallback } from 'react';
import {
    Clock, CheckCircle, XCircle, ChevronLeft,
    FileBadge, Loader2, AlertCircle,
    Building2, Calendar, MapPin, Sparkles, Award, Search,
    LayoutGrid, History, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

// --- مكون كرت التطبيق المطور ---
const ApplicationCard = ({ app, idx, getStatusDetails, navigate }) => {
    const status = getStatusDetails(app.status);
    const stats = app.opportunity?.stats || { accepted: 0, pending: 0, rejected: 0 };
    const totalRequired = app.opportunity?.required_volunteers ?? 0;
    const progress = totalRequired > 0 ? (stats.accepted / totalRequired) * 100 : 0;

    // استخراج رابط الصورة (صورة الفرصة أو لوغو المؤسسة كبديل)
    const imageUrl = `${app.opportunity.cover_image}`

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className="group relative bg-white/40 border border-slate-100 rounded-[2.5rem] overflow-hidden hover:border-emerald-500/30 transition-all duration-500 shadow-2xl"
        >
            {/* الخلفية المتدرجة عند التحويم */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* صورة الفرصة مع تأثير Zoom */}
            <div className="relative h-70 overflow-hidden ">
                <img
                    src={imageUrl}
                    alt={app.opportunity?.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 shadow-[inset_0_50px_20px_-20px_rgba(0,0,0,0.8)] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-[#0f0f1a]/20 to-transparent" />

                {/* شارة الحالة العائمة فوق الصورة */}
                <div className={`absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black backdrop-blur-xl border ${status.border} ${status.bg} ${status.color}`}>
                    {status.icon}
                    {status.label}
                </div>
            </div>

            <div className="p-8 relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <h5 className="text-xl font-black text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">
                        {app.opportunity?.title}
                    </h5>

                </div>

                <div className="flex flex-wrap gap-4 mb-2">

                    <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Building2 size={12} className="text-emerald-600" />
                        <span className="text-[10px] font-bold">{app.opportunity?.user?.organization?.org_name}</span>
                    </div>   <div className="w-[2px] h-4 bg-white/20 self-center" />
                    <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <MapPin size={12} className="text-rose-400" />
                        <span className="text-[10px] font-bold">{app.opportunity?.location}</span>
                    </div>
                </div>

                {/* شريط التقدم العصري */}
                <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-end">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">اكتمال الفريق</span>
                        <span className="text-[11px] font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded-lg">
                            {stats.accepted} / {totalRequired}
                        </span>
                    </div>
                    <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className={`h-full rounded-full ${progress >= 90 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]'}`}
                        />
                    </div>
                </div>

                {app.status === 'rejected' && (
                    <div className="mb-6 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex gap-3">
                        <AlertCircle size={16} className="text-rose-500 shrink-0" />
                        <p className="text-[11px] text-rose-200/70 leading-relaxed italic">
                            {app.rejection_reason || "لم يتم ذكر سبب محدد للرفض"}
                        </p>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(`/opportunities/${app.opportunity_id}`)}
                        className="flex-1 py-4 bg-slate-50 hover:bg-slate-50 rounded-2xl border border-slate-200 text-[11px] font-black text-slate-900 transition-all flex items-center justify-center gap-2 group/btn"
                    >
                        عرض التفاصيل
                        <ArrowUpRight size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                    </button>

                    {/* زر الشهادة - يظهر فقط إذا كانت الحالة مكتملة والشهادة موجودة فعلياً في السجل */}
                    {app.status === 'completed' && app.is_certified && (
                        <button
                            onClick={() => {
                                // فتح رابط الشهادة مباشرة في نافذة جديدة إذا توفر، أو التوجه لصفحة الشهادات
                                if (app.certificate_url) {
                                    window.open(app.certificate_url, '_blank');
                                } else {
                                    navigate('/certificates');
                                }
                            }}
                            className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-[1.02] active:scale-95 text-slate-900 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
                        >
                            <Award size={14} />
                            استعراض الشهادة الرقمية
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const MyApplications = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/my-applications');
            setApplications(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Error fetching applications", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchApplications(); }, [fetchApplications]);

    const getStatusDetails = (status) => {
        const config = {
            pending: { label: 'تحت المراجعة', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: <Clock size={14} />, border: 'border-amber-400/20' },
            accepted: { label: 'تم القبول', color: 'text-emerald-600', bg: 'bg-emerald-400/10', icon: <CheckCircle size={14} />, border: 'border-emerald-400/20' },
            rejected: { label: 'مرفوض', color: 'text-rose-400', bg: 'bg-rose-400/10', icon: <XCircle size={14} />, border: 'border-rose-400/20' },
            completed: { label: 'مكتمل', color: 'text-green-400', bg: 'bg-indigo-400/10', icon: <FileBadge size={14} />, border: 'border-emerald-500/20' }
        };
        return config[status] || { label: 'غير معروف', color: 'text-slate-400', bg: 'bg-slate-50', icon: <AlertCircle size={14} />, border: 'border-slate-200' };
    };

    const filteredApplications = applications.filter(app => filter === 'all' || app.status === filter);

    return (
        <div className="flex min-h-screen bg-slate-50 text-right font-['Tajawal'] overflow-hidden" dir="rtl">
            {/* الخلفية المشوشة (Blur Background) */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full"></div>
            </div>

            <Sidebar  />
  {/* Grid Container */}
                {loading ? (
                    <LoadingSpinner />
                ) : (
            <main className="flex-1  p-6 lg:p-10 relative z-10 overflow-y-auto max-h-screen custom-scrollbar">

                {/* الإضاءة الخلفية */}
                <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="relative z-10 p-6 md:p-12 max-w-7xl mx-auto">
                    <header className="mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-3 mb-6"
                        >
                            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600">
                                <History size={24} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight">سجل التقديم</h1>
                                <p className="text-slate-500 text-xs font-bold mt-1">تتبع حالة طلباتك في الفرص التطوعية</p>
                            </div>
                        </motion.div>

                        {/* الفلاتر المحدثة */}
                        <div className="flex flex-wrap items-center  justify-center w-full gap-3 p-2 bg-slate-50 border border-slate-100 rounded-[2rem] w-fit backdrop-blur-3xl">
                            {['all', 'pending', 'accepted', 'rejected', 'completed'].map((tabId) => (
                                <button
                                    key={tabId}
                                    onClick={() => setFilter(tabId)}
                                    className={`px-8 py-3 border border-slate-100 rounded-[1.5rem] text-[11px] font-black transition-all duration-500 ${filter === tabId ? 'bg-emerald-600 text-slate-900 shadow-xl shadow-emerald-600/20 scale-105' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-600'}`}
                                >
                                    {tabId === 'all' ? 'كافة الطلبات' : getStatusDetails(tabId).label}
                                </button>

                            ))}
                            {/* مثال للفاصل يوضع بين العناصر */}

                        </div>
                    </header>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 gap-6">
                            <div className="relative">
                                <Loader2 size={48} className="animate-spin text-emerald-600" />
                                <div className="absolute inset-0 blur-xl bg-emerald-500/20 animate-pulse" />
                            </div>
                            <p className="text-slate-500 font-black text-sm tracking-widest animate-pulse">جاري سحب بياناتك من السحابة...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode='wait'>
                            {filteredApplications.length > 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="grid grid-cols-1  md:grid-cols-2 xl:grid-cols-3 gap-8"
                                >
                                    {filteredApplications.map((app, idx) => (
                                        <ApplicationCard
                                            key={app.id}
                                            app={app}
                                            idx={idx}
                                            getStatusDetails={getStatusDetails}
                                            navigate={navigate}
                                        />
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-32 bg-white border border-dashed border-slate-200 rounded-[4rem]"
                                >
                                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                        <Search size={40} className="text-slate-800" />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-600">لا يوجد طلبات بهذا التصنيف</h3>
                                    <button
                                        onClick={() => navigate('/opportunities')}
                                        className="mt-6 text-emerald-600 font-black text-xs hover:text-emerald-500 transition-colors underline underline-offset-8"
                                    >
                                        اكتشف فرصاً جديدة الآن
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </main>)}
        </div>
    );
};
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-40 w-full">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-100 border-t-purple-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-emerald-500 rounded-full animate-spin animate-pulse" />
        </div>
        <h2 className="mt-8 text-xl font-black text-slate-900 tracking-widest animate-pulse uppercase">Syncing Database...</h2>
        <p className="text-slate-400 mt-2 font-bold">يرجى الانتظار، جاري تحضير البيانات</p>
    </div>
);

export default MyApplications;