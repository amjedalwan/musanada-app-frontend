import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, CheckCircle, XCircle, Clock, Mail, Calendar, Search,
    Phone, ChevronRight, MessageSquare, Info, MapPin, Filter, Briefcase,
    Hash, UserPlus, ExternalLink, ShieldAlert, GraduationCap
} from 'lucide-react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import { toast, Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
const MySwal = withReactContent(Swal);

/**
 * @component AllPendingApplicants
 * هذه الصفحة مخصصة لإدارة المتقدمين "قيد الانتظار" عبر جميع الفرص غير المكتملة
 * تم تصميمها بأسلوب عصري (Light Mode) متوافق مع هوية "مساندة"
 */

const SkeletonCard = () => (
    <div className="h-64 bg-slate-100 rounded-[2.5rem] border border-slate-200 animate-pulse" />
);

const AllPendingApplicants = () => {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL;
    // States
    const [pendingData, setPendingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUniversity, setSelectedUniversity] = useState('all');

    // 1. جلب البيانات من مسار مخصص (يفترض وجود مسار في Laravel يجمع الطلبات المعلقة)
    const fetchAllPending = useCallback(async (signal) => {
        try {
            setLoading(true);
            const response = await api.get('/org/all-pending-applications', { signal });
            
            setPendingData(response.data || []);
        } catch (err) {
            if (err.name !== 'CanceledError') {
                toast.error('فشل في جلب قائمة الطلبات المركزية');
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchAllPending(controller.signal);
        return () => controller.abort();
    }, [fetchAllPending]);

    // 2. معالجة تحديث الحالة (قبول/رفض)
    const handleAction = async (applicationId, userName, opportunityTitle, action) => {
        const isAccept = action === 'accepted';

        const result = await Swal.fire({
            title: isAccept ? 'تأكيد القبول' : 'تأكيد الرفض',
            html: `أنت على وشك ${isAccept ? 'قبول' : 'رفض'} المتطوع <b>${userName}</b> في فرصة <br/> <span className="text-emerald-600">"${opportunityTitle}"</span>`,
            icon: isAccept ? 'success' : 'warning',
            showCancelButton: true,
            confirmButtonText: isAccept ? 'نعم، اقبله الآن' : 'نعم، ارفض الطلب',
            cancelButtonText: 'تراجع',
            confirmButtonColor: isAccept ? '#059669' : '#ef4444',
            background: '#ffffff',
            color: '#1e293b',
            borderRadius: '1.5rem',
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                try {
                    return await api.patch(`/org/applications/${applicationId}/status`, { status: action });
                } catch (error) {
                    Swal.showValidationMessage(`فشل الطلب: ${error.response?.data?.message || error.message}`);
                }
            }
        });

        if (result.isConfirmed) {
            setPendingData(prev => prev.filter(app => app.id !== applicationId));
            toast.success(`تم تحديث حالة الطلب بنجاح ✨`);
        }
    };

    // 3. عرض نافذة تفاصيل المتقدم (Quick View)
    const showApplicantDetails = (app) => {
        const user = app.user;
        const profile = user.profile || {};
        const opportunity = app.opportunity || {};

        MySwal.fire({
            title: null, // سنقوم ببناء الهيدر داخل قسم الـ html للتحكم الكامل
            html: (
                <div className="text-right font-['Tajawal'] overflow-hidden" dir="rtl">
                    {/* 1. الهيدر الخلفي والصورة */}
                    <div className="relative h-24 bg-gradient-to-l from-emerald-600/10 to-slate-600/10 rounded-t-[2rem] -mx-6 -mt-6 mb-12">
                        <div className="absolute -bottom-8 right-6 flex items-end gap-4">
                            <img
                                src={user.profile_image?.startsWith('http') ? user.profile_image : `${API_URL}/storage/${user.profile_image}`}
                                className="w-24 h-24 rounded-[2rem] object-cover border-4 border-white bg-slate-50 shadow-xl"
                            />
                            <div className="mb-2">
                                <h3 className="text-xl font-black text-slate-900 m-0">{user.full_name}</h3>
                                <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                                    {profile.major || 'متطوع'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="px-2 space-y-5">
                        {/* 2. بطاقات المعلومات السريعة */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 group hover:border-emerald-500/30 transition-colors">
                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <GraduationCap size={14} className="text-emerald-500" />
                                    <span className="text-[10px] font-bold">الجامعة</span>
                                </div>
                                <p className="text-xs font-black text-slate-900">{profile.university || 'غير محدد'}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 group hover:border-slate-400 transition-colors">
                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <Clock size={14} className="text-slate-500" />
                                    <span className="text-[10px] font-bold">ساعات التطوع</span>
                                </div>
                                <p className="text-xs font-black text-slate-900">{profile.total_volunteer_hours || 0} ساعة</p>
                            </div>
                        </div>

                        {/* 3. تفاصيل التقديم على الفرصة */}
                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                            <p className="text-[10px] text-emerald-600 font-black mb-2 uppercase tracking-wider">متقدم لفرصة:</p>
                            <div className="flex items-center gap-3">
                                <img src={opportunity.cover_image} className="w-10 h-10 rounded-lg object-cover" />
                                <div>
                                    <p className="text-sm font-bold text-slate-900 m-0">{opportunity.title}</p>
                                    <p className="text-[10px] text-slate-400 m-0">{opportunity.location}</p>
                                </div>
                            </div>
                        </div>

                        {/* 4. النبذة التعريفية */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <Briefcase size={14} />
                                <span className="text-[10px] font-bold">عن المتطوع</span>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-600 italic">
                                "{profile.bio || 'لا يوجد وصف مضاف.'}"
                            </p>
                        </div>

                        {/* 5. أزرار التواصل */}
                        <div className="flex gap-2 pt-2">
                            <a
                                href={`mailto:${user.email}`}
                                className="flex-1 bg-white hover:bg-slate-50 text-slate-600 py-3.5 rounded-xl text-[11px] font-black transition-all border border-slate-200 text-center no-underline flex items-center justify-center gap-2"
                            >
                                <Mail size={14} /> البريد
                            </a>
                            <button
                                onClick={() => window.open(`https://wa.me/${user.phone}`)}
                                className="flex-[2] bg-emerald-600 text-slate-900 hover:bg-emerald-700 py-3.5 rounded-xl text-[11px] font-black transition-all border border-emerald-600 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                            >
                                <Phone size={14} /> تواصل عبر واتساب
                            </button>
                        </div>
                    </div>
                </div>
            ),
            showConfirmButton: false,
            background: '#ffffff',
            width: '30rem',
            padding: '1.5rem',
            borderRadius: '2.5rem',
            customClass: {
                popup: 'border border-slate-100 shadow-2xl'
            }
        });
    };

    // 4. الفلترة المتقدمة
    const filteredList = useMemo(() => {
        return pendingData.filter(app => {
            const matchesSearch = app.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                app.opportunity.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesUni = selectedUniversity === 'all' || app.user.profile?.university === selectedUniversity;
            return matchesSearch && matchesUni;
        });
    }, [pendingData, searchQuery, selectedUniversity]);

    const universities = useMemo(() => {
        const unis = pendingData.map(a => a.user.profile?.university).filter(Boolean);
        return ['all', ...new Set(unis)];
    }, [pendingData]);
    const Tooltip = ({ text }) => (
        <div className="absolute right-0 -top-5 opacity-0 group-hover/input:opacity-100 group-focus-within/input:opacity-100 transition-all pointer-events-none z-[50] min-w-50">
            <span className="text-[10px] text-emerald-600 font-bold bg-white px-3 py-1.5 rounded-xl border border-emerald-100 shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-1">
                <Info size={12} className="text-emerald-500" /> {text}
            </span>
        </div>);
    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-['Tajawal'] selection:bg-emerald-500/30 overflow-x-hidden" dir="rtl">
            <Toaster position="top-left" />
            <Sidebar role="organization" />

            {loading ? (
                <LoadingSpinner />
            ) : (
                <main className="flex-1 h-screen overflow-y-auto custom-scrollbar px-4 lg:px-12 py-10">
                    <div className="max-w-7xl mx-auto">

                        {/* Header Section */}
                        <header className="mb-12">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                    <div className="flex items-center gap-3 text-emerald-600 mb-4 bg-emerald-50 w-fit px-4 py-1.5 rounded-full border border-emerald-100">
                                        <ShieldAlert size={16} />
                                        <span className="text-xs font-black tracking-widest uppercase italic">الطلبات الواردة</span>
                                    </div>
                                    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight leading-tight text-slate-900">
                                        إدارة <span className="text-emerald-600">المتقدمين</span>
                                    </h1>
                                    <p className="text-slate-400 text-sm md:text-base max-w-xl font-bold">
                                        هنا تجد كافة الطلبات المعلقة عبر جميع مبادراتك النشطة. يمكنك اتخاذ قرار القبول أو الرفض بشكل مركزي.
                                    </p>
                                </motion.div>

                                <div className="flex items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                    <div className="text-left md:text-right">
                                        <p className="text-3xl font-black text-slate-900 italic">{pendingData.length}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">إجمالي الطلبات المعلقة</p>
                                    </div>
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                                        <UserPlus className="text-emerald-600" />
                                    </div>
                                </div>
                            </div>

                            {/* Search & Filter Bar */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4"
                            >
                                <div className="md:col-span-2 relative group">
                                    <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        placeholder="ابحث باسم المتطوع أو عنوان الفرصة..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white border border-slate-100 rounded-[1.5rem] py-4 pr-14 pl-6 text-sm focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-900 shadow-sm"
                                    />
                                </div>
                                <div className="relative">
                                    <Filter className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                                    <select
                                        value={selectedUniversity}
                                        onChange={(e) => setSelectedUniversity(e.target.value)}
                                        className="w-full bg-white border border-slate-100 rounded-[1.5rem] py-4 pr-14 pl-6 text-sm appearance-none focus:border-emerald-500/50 outline-none transition-all cursor-pointer shadow-sm text-slate-600 font-bold"
                                    >
                                        <option value="all">كل الجامعات</option>
                                        {universities.filter(u => u !== 'all').map(uni => (
                                            <option key={uni} value={uni}>{uni}</option>
                                        ))}
                                    </select>
                                </div>
                            </motion.div>
                        </header>


                        <AnimatePresence mode="popLayout">
                            {filteredList.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredList.map((app, idx) => (
                                        <motion.div
                                            key={app.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group relative bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden hover:border-emerald-500/30 transition-all duration-500 shadow-sm hover:shadow-xl"
                                        >
                                            {/* Opportunity Badge */}
                                            <div className="absolute top-4 left-8 z-10 ">
                                                <div className="bg-emerald-50 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-2">
                                                    <div className="w-2 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">
                                                        {app.opportunity.title}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Card Body */}
                                            <div className="p-8">
                                                <div className="flex items-center gap-5 mb-6">
                                                    <div className="relative group/input">
                                                        <Tooltip text="المزيد من تفاصيل المتطوع" />
                                                        <img
                                                            src={app.user.profile_image?.startsWith('http') ? app.user.profile_image : `${API_URL}/storage/${app.user.profile_image}`}
                                                            className="w-16 h-16 rounded-[1.5rem] object-cover ring-4 ring-emerald-500/5 group-hover:ring-emerald-500/20 transition-all"
                                                            alt=""
                                                        />
                                                        <button
                                                            onClick={() => showApplicantDetails(app)}
                                                            className="absolute -bottom-2 -right-2 bg-emerald-600 text-slate-900 p-2  rounded-lg shadow-xl hover:bg-slate-900 transition-colors"
                                                        >
                                                            <ExternalLink size={14} />
                                                        </button>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-black text-lg text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight mb-1">
                                                            {app.user.full_name}
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                                                            <MapPin size={10} className="text-emerald-600" />
                                                            {app.user.profile?.university || 'متطوع مستقل'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 mb-8">
                                                    <div className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                        <span className="text-slate-400 font-bold">تاريخ التقديم</span>
                                                        <span className="font-black italic text-slate-900">{new Date(app.created_at).toLocaleDateString('ar-YE')}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                        <span className="text-slate-400 font-bold">الحالة الحالية</span>
                                                        <span className="flex items-center gap-1.5 text-amber-500 font-black italic">
                                                            <Clock size={12} /> قيد المراجعة
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => handleAction(app.id, app.user.full_name, app.opportunity.title, 'accepted')}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-slate-900 py-3.5 rounded-2xl text-[11px] font-black transition-all shadow-lg shadow-emerald-900/10 flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle size={14} /> قبول
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(app.id, app.user.full_name, app.opportunity.title, 'rejected')}
                                                        className="bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 py-3.5 rounded-2xl text-[11px] font-black transition-all border border-slate-100 flex items-center justify-center gap-2"
                                                    >
                                                        <XCircle size={14} /> رفض الطلب
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Bottom Decorative Line */}
                                            <div className="h-1 w-full bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-slate-100 rounded-[4rem] bg-white shadow-sm"
                                >
                                    <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-8 relative">
                                        <Info size={50} className="text-slate-900" />
                                        <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full animate-ping" />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-600 mb-3">لا توجد طلبات معلقة</h3>
                                    <p className="text-slate-400 font-bold text-base text-center px-10 max-w-md">
                                        يبدو أنك قمت بمعالجة جميع الطلبات الواردة، أو لم يقم أحد بالتقديم على الفرص النشطة بعد.
                                    </p>
                                    <button
                                        onClick={() => navigate('/org/create-opportunity')}
                                        className="mt-8 bg-emerald-600 text-slate-900 px-8 py-3 rounded-2xl text-xs font-black transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                                    >
                                        نشر فرصة جديدة
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </main>
            )}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 20px; }
            `}</style>
        </div>
    );
};

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-40 w-full bg-slate-50">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-600 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-slate-300 rounded-full animate-spin animate-pulse" />
        </div>
        <h2 className="mt-8 text-xl font-black text-slate-900 tracking-widest animate-pulse uppercase">Syncing Database...</h2>
        <p className="text-slate-400 mt-2 font-bold">يرجى الانتظار، جاري تحضير البيانات</p>
    </div>
);
export default AllPendingApplicants;
