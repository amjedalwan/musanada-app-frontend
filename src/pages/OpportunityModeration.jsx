import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, Filter, RefreshCcw, Loader2, Trash2, Eye,
    MapPin, Calendar, Building2, AlertCircle, Users,
    CheckCircle2, Clock, ChevronLeft, ChevronRight,
    LayoutGrid, Image as ImageIcon, Info, XCircle, ShieldAlert,
    Briefcase, Target, Map as MapIcon, Lock, Unlock, ExternalLink,
    Mail, Phone, Globe, Award, Percent, BarChart3, TrendingUp, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import AdminSidebar from '../components/AdminSidebar';
import InteractiveMap from '../components/InteractiveMap';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const OpportunityModeration = () => {
    // --- States Management ---
    const [opportunities, setOpportunities] = useState([]);
    const [headerStats, setHeaderStats] = useState({ total: 0, open: 0, closed: 0, expired: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ last_page: 1, total: 0 });
    const [filterStatus, setFilterStatus] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const abortControllerRef = useRef(null);

    // --- Helpers & Alerts ---
    const Toast = MySwal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#0f0f1a',
        color: '#fff',
        customClass: { popup: 'rounded-2xl border border-white/10 shadow-2xl' }
    });

    const calculateProgress = (accepted, required) => {
        if (!required || required === 0) return 0;
        const res = (accepted / required) * 100;
        return res > 100 ? 100 : Math.round(res);
    };

    // --- Data Fetching Logic ---
    const fetchOpportunities = useCallback(async (isManual = false) => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        if (isManual) setIsRefreshing(true);
        setLoading(true);

        try {
            const response = await api.get('/admin/opportunities', {
                params: {
                    search: searchTerm,
                    page: page,
                    status: filterStatus
                },
                signal: abortControllerRef.current.signal
            });

            if (response.data.success) {
                setOpportunities(response.data.data.data);
                setMeta({
                    last_page: response.data.data.last_page,
                    total: response.data.data.total,
                    current_page: response.data.data.current_page
                });
                setHeaderStats(response.data.header_stats || {
                    total: response.data.data.total,
                    open: response.data.data.data.filter(o => o.status === 'open').length,
                    closed: response.data.data.data.filter(o => o.status === 'closed').length,
                    expired: 0
                });
            }
        } catch (error) {
            if (error.name !== 'CanceledError') {
                console.error("Fetch Error:", error);
                Toast.fire({ icon: 'error', title: 'فشل في تحديث قائمة الفرص' });
            }
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [searchTerm, page, filterStatus]);

    useEffect(() => {
        fetchOpportunities();
    }, [fetchOpportunities]);

    // --- Actions Handlers ---
    const handleDelete = async (id) => {
        const { value: reason, isConfirmed } = await MySwal.fire({
            title: <span className="font-black text-white">هل أنت متأكد من الحذف؟</span>,
            html: <p className="text-gray-400 font-bold">سيتم حذف الفرصة نهائياً وإخطار المؤسسة بالسبب</p>,
            icon: 'warning',
            input: 'textarea',
            inputPlaceholder: 'لماذا تريد حذف هذه الفرصة؟ سيتلقى صاحب العمل هذا السبب...',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'نعم، احذف نهائياً',
            cancelButtonText: 'تراجع',
            background: '#0f0f1a',
            customClass: {
                popup: 'rounded-[2.5rem] border border-white/10',
                input: 'bg-black/20 text-white rounded-2xl border-white/10 focus:ring-red-500'
            },
            inputValidator: (value) => {
                if (!value) return 'يجب كتابة سبب الحذف للإجراء القانوني';
            }
        });

        if (isConfirmed) {
            try {
                await api.delete(`/admin/opportunities/${id}`, { data: { reason } });
                Toast.fire({ icon: 'success', title: 'تمت إزالة الفرصة بنجاح' });
                fetchOpportunities();
            } catch (error) {
                Toast.fire({ icon: 'error', title: 'حدث خطأ أثناء محاولة الحذف' });
            }
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        const isClosing = currentStatus === 'open';
        const { value: reason, isConfirmed } = await MySwal.fire({
            title: <span className="font-black text-white">{isClosing ? 'إغلاق الفرصة' : 'إعادة التفعيل'}</span>,
            text: isClosing ? "لن يتمكن المتطوعون من التقديم عليها بعد الآن" : "سيتم فتح باب التقديم مرة أخرى",
            icon: 'info',
            input: 'text',
            inputPlaceholder: 'ملاحظة إدارية...',
            showCancelButton: true,
            confirmButtonText: isClosing ? 'تأكيد الإغلاق' : 'تفعيل الآن',
            cancelButtonText: 'إلغاء',
            background: '#0f0f1a',
            customClass: { popup: 'rounded-[2.5rem] border border-white/10' },
            inputValidator: (value) => {
                if (!value) return 'يرجى كتابة سبب الإجراء';
            }
        });

        if (isConfirmed) {
            try {
                const endpoint = isClosing ? `/admin/opportunities/${id}/close` : `/admin/opportunities/${id}/open`;
                await api.patch(endpoint, { reason });
                Toast.fire({ icon: 'success', title: 'تم تحديث حالة الفرصة' });
                fetchOpportunities();
            } catch (error) {
                Toast.fire({ icon: 'error', title: 'فشل في تغيير الحالة' });
            }
        }
    };

    // --- Modal View With Close Button ---
    const showDetails = (opp) => {
        MySwal.fire({
            html: (
                <div className="text-right font-sans relative overflow-hidden group/modal" dir="rtl">
                    {/* Close Button Override */}
                    <button
                        onClick={() => MySwal.close()}
                        className="absolute top-2 right-2 z-50 p-3 bg-black/40 hover:bg-red-500 text-white rounded-full transition-all duration-300 border border-white/10"
                    >
                        <X size={20} />
                    </button>

                    <div className="relative h-64 w-full rounded-[2.5rem] overflow-hidden mb-8 border border-white/10 shadow-2xl">
                        <img
                            src={opp.cover_image || 'https://via.placeholder.com/800x400'}
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover/modal:scale-110"
                            alt={opp.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-[#0f0f1a]/40 to-transparent"></div>
                        <div className="absolute bottom-6 right-6">
                            <span className="px-5 py-2 bg-indigo-600 text-white rounded-full text-xs font-black shadow-xl">
                                {(opp.type === 'voluntary' ? 'فرصة تطوعية' : opp.type==='training' ? 'فرصة تدريبية' : 'فرصة تعليمية') || 'فرصة تطوعية'}
                            </span>
                        </div>
                    </div>

                    <div className="px-2">
                        <h2 className=" font-black text-white mb-3 tracking-tight">{opp.title}</h2>
                        <div className="flex items-center gap-3 text-indigo-400 mb-8 font-bold bg-indigo-500/5 w-fit px-4 py-2 rounded-2xl border border-indigo-500/10">
                            <Building2 size={20} />
                            <span className='text-sm'>{opp.user?.organization?.org_name || 'جهة غير محددة'}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
                            {[
                                { label: 'المطلوب', val: opp.required_volunteers, icon: Users, color: 'text-indigo-400' },
                                { label: 'المقبولين', val: opp.accepted_count || 0, icon: CheckCircle2, color: 'text-emerald-400' },
                                { label: 'الإنجاز', val: `${calculateProgress(opp.accepted_count, opp.required_volunteers)}%`, icon: Target, color: 'text-purple-400' }
                            ].map((s, i) => (
                                <div key={i} className="bg-white/5 p-5 rounded-[2rem] border border-white/5 text-center hover:bg-white/[0.08] transition-colors">
                                    <s.icon className={`mx-auto mb-3 ${s.color}`} size={24} />
                                    <div className="text-2xl font-black text-white">{s.val}</div>
                                    <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-8">
                            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                                <h4 className="flex items-center gap-3 text-white font-black mb-4 text-lg">
                                    <Info className="text-indigo-500" size={22} />
                                    الوصف والمهام
                                </h4>
                                <p className="text-gray-400 text-sm leading-8 text-justify font-medium">
                                    {opp.description || 'لا يوجد وصف مفصل متاح حالياً.'}
                                </p>
                            </div>

                            <div className="rounded-[2.5rem] overflow-hidden border border-white/10 h-72 relative bg-[#05050a] shadow-inner">
                                <InteractiveMap
                                    latitude={Number(opp.lat) || 15.35}
                                    longitude={Number(opp.lng) || 44.20}
                                    isStatic={true}
                                />
                                <div className="absolute top-4 left-4 bg-[#0f0f1a]/80 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3 shadow-2xl">
                                    <MapPin size={16} className="text-red-500 animate-bounce" />
                                    <span className="text-xs text-white font-black">{opp.location || 'الموقع غير محدد'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            showConfirmButton: false,
            width: '850px',
            background: '#0f0f1a',
            padding: '1.5rem',
            customClass: { popup: 'rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden' }
        });
    };



    return (
        <div className="flex min-h-screen bg-[#05050a] text-white font-['Tajawal']" dir="rtl">
            <AdminSidebar />

            <main className="w-full transition-all duration-500 p-4 md:p-6">

                {/* Background Decoration */}
                <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] -z-10 animate-pulse"></div>
                <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/5 blur-[120px] -z-10"></div>

                {/* Header Section */}
                <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="flex items-center gap-5 mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 rotate-3">
                                <Briefcase className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">رقابة الفرص</h1>
                                <p className="text-gray-500 font-bold mt-1">إدارة المحتوى الميداني • {meta.total} فرصة مسجلة</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap items-center gap-4 bg-[#0f0f1a] p-3 rounded-[2.5rem] border border-white/5 shadow-2xl w-full max-w-2xl"
                    >
                        <div className="relative flex-1 group">
                            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-indigo-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="ابحث عن فرصة، مؤسسة، أو مدينة..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="bg-black/40 border-none rounded-[1.8rem] pr-14 pl-6 py-4 w-full text-sm font-bold focus:ring-2 focus:ring-indigo-500/40 transition-all placeholder:text-gray-700"
                            />
                        </div>
                        <button
                            onClick={() => fetchOpportunities(true)}
                            className="p-4 bg-indigo-600/10 text-indigo-500 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-95 group"
                        >
                            <RefreshCcw size={22} className={`${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        </button>
                    </motion.div>
                </header>

                {/* Statistics Dashboard */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {[
                        { id: 'all', label: 'إجمالي الفرص', count: headerStats.total, icon: LayoutGrid, color: 'indigo' },
                        { id: 'open', label: 'فرص نشطة', count: headerStats.open, icon: CheckCircle2, color: 'emerald' },
                        { id: 'closed', label: 'مغلقة إدارياً', count: headerStats.closed, icon: Lock, color: 'amber' },
                        { id: 'expired', label: 'منتهية', count: headerStats.expired, icon: AlertCircle, color: 'red' }
                    ].map((stat, idx) => (
                        <motion.div
                            key={stat.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => { setFilterStatus(stat.id); setPage(1); }}
                            className={`cursor-pointer p-8 rounded-[3rem] border transition-all duration-500 relative overflow-hidden group ${filterStatus === stat.id
                                ? 'bg-indigo-600 border-indigo-400 shadow-2xl shadow-indigo-900/40 scale-[1.02]'
                                : 'bg-[#0f0f1a] border-white/5 hover:border-indigo-500/30'
                                }`}
                        >
                            <div className="relative z-10">
                                <span className={`text-xs font-black uppercase tracking-widest mb-3 block ${filterStatus === stat.id ? 'text-white/80' : 'text-gray-500'}`}>
                                    {stat.label}
                                </span>
                                <div className="flex items-center gap-4">
                                    <span className="text-5xl font-black tracking-tighter">{stat.count}</span>
                                    {filterStatus === stat.id && <div className="w-3 h-3 rounded-full bg-white animate-ping"></div>}
                                </div>
                            </div>
                            <stat.icon
                                size={120}
                                className={`absolute -left-6 -bottom-6 opacity-[0.03] transition-all duration-700 group-hover:scale-125 group-hover:opacity-10 ${filterStatus === stat.id ? 'text-white' : 'text-indigo-500'
                                    }`}
                            />
                        </motion.div>
                    ))}
                </section>

                {/* Content Grid */}
                {loading && page === 1 ? (
                       <LoadingScreen />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 mb-20">
                        <AnimatePresence mode='popLayout'>
                            {opportunities.length > 0 ? opportunities.map((opp, index) => (
                                <motion.div
                                    key={opp.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4, delay: index * 0.05 }}
                                    className="group bg-[#0f0f1a] rounded-[3rem] border border-white/5 overflow-hidden hover:border-indigo-500/40 transition-all duration-500 shadow-xl hover:shadow-indigo-500/10 flex flex-col"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative h-70 overflow-hidden">
                                        <img
                                            src={opp.cover_image || 'https://via.placeholder.com/600x400'}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                            alt=""
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-transparent to-transparent"></div>

                                        <div className="absolute top-5 right-5 ">
                                            <span className={`px-2 py-2 rounded-2xl text-[10px] font-black uppercase backdrop-blur-md border shadow-2xl ${opp.status === 'open'
                                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                                                : 'bg-amber-500/20 text-amber-400 border-amber-500/20'
                                                }`}>
                                                {opp.status === 'open' ? 'نشطة الآن' : 'مغلقة إدارياً'}
                                            </span>
                                        </div>

                                        <div className="absolute bottom-5 left-5 right-5 flex justify-between items-center">
                                            <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-xl">
                                                <Users size={14} className="text-indigo-400" />
                                                <span className="text-xs font-black text-white">{opp.accepted_count || 0} / {opp.required_volunteers}</span>
                                            </div>
                                            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/50 scale-0 group-hover:scale-100 transition-transform duration-300">
                                                <ImageIcon size={14} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-8 flex-1 flex flex-col">
                                        <div className="flex items-center gap-2 text-indigo-500/60 text-[10px] font-black uppercase mb-4 tracking-tighter">
                                            <Building2 size={14} />
                                            {console.log(opp.user)}
                                            <span className="truncate">{opp.user?.organization?.org_name || 'مساندة'}</span>
                                        </div>

                                        <h3 className=" font-black text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors duration-300">
                                            {opp.title}
                                        </h3>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">معدل المتطوعين</span>
                                                <span className="text-[12px] font-[700] text-indigo-400">{calculateProgress(opp.accepted_count, opp.required_volunteers)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden ">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${calculateProgress(opp.accepted_count, opp.required_volunteers)}%` }}
                                                    className={`h-full rounded-full transition-all duration-1000 ${calculateProgress(opp.accepted_count, opp.required_volunteers) >= 100
                                                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                                                        : 'bg-gradient-to-r from-indigo-600 to-purple-500'
                                                        }`}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-gray-500 bg-white/5 px-3 py-2 rounded-xl">
                                                <MapPin size={14} className="text-indigo-500/40" />
                                                <span className="text-[10px] font-bold truncate">{opp.location || 'الرياض - الدرعية'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500 bg-white/5 px-3 py-2 rounded-xl justify-center">
                                                <Calendar size={14} className="text-indigo-500/40" />
                                                <span className="text-[12px] ">{new Date(opp.deadline).toLocaleDateString('en-SA')}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-auto">
                                            <button
                                                onClick={() => showDetails(opp)}
                                                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-2xl border border-white/5 font-[600] text-xs transition-all flex items-center justify-center gap-3 active:scale-95"
                                            >
                                                <Eye size={16} className="text-indigo-500" /> مراجعة التفاصيل
                                            </button>
                                            <button
                                                onClick={() => handleToggleStatus(opp.id, opp.status)}
                                                className="p-4 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-2xl border border-amber-500/10 transition-all shadow-lg active:rotate-12"
                                            >
                                                {opp.status === 'open' ? <Lock size={16} /> : <Unlock size={16} />}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(opp.id)}
                                                className="p-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl border border-red-500/10 transition-all shadow-lg active:scale-75"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-600 bg-[#0f0f1a] rounded-[3rem] border border-dashed border-white/10">
                                    <ShieldAlert size={48} className="mb-4 opacity-20" />
                                    <p className="font-black text-lg">لا توجد فرص تطابق معايير البحث حالياً</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Intelligent Pagination */}
                {meta.last_page > 1 && (
                    <div className="flex justify-center items-center gap-8 py-10">
                        <button
                            disabled={page === 1}
                            onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="w-12 h-12 bg-[#0f0f1a] rounded-[1.8rem] border border-white/10 disabled:opacity-20 flex items-center justify-center hover:border-indigo-500 hover:text-indigo-500 transition-all shadow-2xl active:scale-90"
                        >
                            <ChevronRight size={28} />
                        </button>

                        <div className="flex gap-3 bg-[#0f0f1a] p-3 rounded-[2.5rem] border border-white/5 shadow-2xl">
                            {[...Array(meta.last_page)].map((_, i) => {
                                const pNum = i + 1;
                                if (pNum === 1 || pNum === meta.last_page || Math.abs(page - pNum) <= 1) {
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => { setPage(pNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            className={`w-8 h-8 rounded-2xl font-black text-sm transition-all duration-500 ${page === pNum
                                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/50 scale-110 rotate-3'
                                                : 'text-gray-600 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            {pNum}
                                        </button>
                                    );
                                }
                                if (pNum === 2 || pNum === meta.last_page - 1) return <span key={i} className="text-gray-800 self-center">••</span>;
                                return null;
                            })}
                        </div>

                        <button
                            disabled={page === meta.last_page}
                            onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                            className="w-12 h-12 bg-[#0f0f1a] rounded-[1.8rem] border border-white/10 disabled:opacity-20 flex items-center justify-center hover:border-indigo-500 hover:text-indigo-500 transition-all shadow-2xl active:scale-90"
                        >
                            <ChevronLeft size={28} />
                        </button>
                    </div>
                )}

                {/* Visual Footer */}
                <footer className="mt-20 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="flex items-center gap-4">
                            <span className="text-[11px] font-black text-gray-600 tracking-[0.3em] uppercase">Masanada System Cloud</span>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[9px] font-black text-emerald-500 italic uppercase">Secure Connection</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-700 font-bold">جميع الحقوق محفوظة © {new Date().getFullYear()} • لمنصة مساندة</p>
                    </div>

                    <div className="flex gap-10">
                        {[
                            { label: 'زمن الاستجابة', val: '45ms', icon: TrendingUp },
                            { label: 'تزامن البيانات', val: '100%', icon: ShieldAlert }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-gray-600">
                                <item.icon size={16} className="text-indigo-500/30" />
                                <div className="text-right">
                                    <div className="text-[8px] font-black uppercase text-gray-700">{item.label}</div>
                                    <div className="text-[11px] font-black text-gray-500 tracking-tighter">{item.val}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </footer>
            </main>
        </div>
    );
};
const LoadingScreen = () => (
    <div className="h-screen bg-[#05050a] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="relative">
            <div className="w-32 h-32 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-4 border-4 border-purple-500/10 border-b-purple-500 rounded-full animate-spin-slow" />
        </div>
        <div className="mt-12 text-center relative z-10">
            <h2 className="text-2xl font-black text-white tracking-[0.3em] uppercase">Musanada Intelligence</h2>
            <p className="text-xs text-blue-400 mt-4 font-bold animate-pulse">جاري تجميع البيانات من بحيرة البيانات المركزية...</p>
        </div>
    </div>
);

export default OpportunityModeration;
