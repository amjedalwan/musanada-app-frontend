import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, CheckCircle, XCircle, Clock, Mail, Calendar,
    Phone, ChevronRight, MessageSquare, Info, Star, ShieldCheck, MapPin
} from 'lucide-react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import { toast, Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

// --- Skeleton Loading Components ---
const SkeletonStats = () => (
    <div className="flex gap-4 overflow-hidden mb-8">
        {[1, 2, 3].map(i => (
            <div key={i} className="h-24 w-full bg-slate-50 rounded-3xl animate-pulse border border-slate-100" />
        ))}
    </div>
);

const FullPageSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        <div className="h-10 w-48 bg-slate-50 rounded-lg" />
        <div className="space-y-3">
            <div className="h-12 w-3/4 bg-slate-50 rounded-2xl" />
            <div className="h-6 w-1/2 bg-slate-50 rounded-lg" />
        </div>
        <SkeletonStats />
        <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-slate-50 rounded-[2.5rem] border border-slate-100" />
            ))}
        </div>
    </div>
);

const OpportunityApplicants = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // States
    const [applicants, setApplicants] = useState([]);
    const [opportunity, setOpportunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [totalOppHours, setTotalOppHours] = useState(0);
    const handleCompleteTask = async (applicationId, applicantName) => {
        const result = await Swal.fire({
            title: 'تأكيد إتمام المهمة 🏆',
            text: `هل أنت متأكد أن المتطوع ${applicantName} قد أتم كافة المهام المطلوبة؟ سيتمكن بعدها من الحصول على الشهادة.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'نعم، أتم المهمة',
            cancelButtonText: 'تراجع',
            confirmButtonColor: '#10b981', // لون أخضر (Emerald)
            background: '#ffffff',
            color: '#1e293b',
            borderRadius: '1.5rem'
        });

        if (result.isConfirmed) {
            try {
                // إرسال طلب للمسار الذي أنشأناه في Laravel
                await api.patch(`/org/applications/${applicationId}/complete`);

                // تحديث الحالة في الواجهة الأمامية فوراً
                setApplicants(prev => prev.map(app =>
                    app.id === applicationId ? { ...app, status: 'completed' } : app
                ));

                toast.success('تم إتمام المهمة بنجاح! يمكن للمتطوع الآن رؤية شهادته 🎓');
            } catch (error) {
                toast.error('حدث خطأ أثناء تحديث الحالة');
            }
        }
    };
    // Optimized Data Fetching
    const loadAllData = useCallback(async (signal) => {
        try {
               setLoading(true);
            const [appRes, hoursRes] = await Promise.all([
                api.get(`/org/opportunities/${id}/applicants`, { signal }),
                api.get(`/org/opportunities/${id}/total-hours`, { signal }) 
             
            ]);

            const rawApplicants = appRes.data.applicants || [];
            setOpportunity(appRes.data.opportunity || null);
            setTotalOppHours(hoursRes.data.total_hours || 0);

            // Fetch missing hours only for accepted users in parallel
            const detailed = await Promise.all(rawApplicants.map(async (app) => {
                if (app.status === 'accepted' && !app.user.hour_logs_sum_hours) {
                    try {
                        const h = await api.get(`/org/opportunities/${id}/volunteers/${app.user.id}/hours`, { signal });
                        return { ...app, user: { ...app.user, hour_logs_sum_hours: h.data.total_hours || 0 } };
                    } catch { return app; }
                }
                return app;
            }));

            setApplicants(detailed);
        } catch (err) {
            if (err.name !== 'CanceledError') toast.error('خطأ في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
      
        const controller = new AbortController();
        loadAllData(controller.signal);
        
        return () => controller.abort();
    }, [loadAllData]);
    const handleDeleteOpportunity = async (opportunityId) => {
        // 1. إظهار رسالة تأكيد للمستخدم
        const result = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "لن تتمكن من استعادة هذه الفرصة بعد الحذف!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444', // لون أحمر للتحذير
            confirmButtonText: 'نعم، احذفها',
            cancelButtonText: 'إلغاء'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/opportunities/${opportunityId}`);
                // 3. إظهار رسالة نجاح
                toast.success('تم حذف الفرصة بنجاح 🗑️');
                navigate(-1);
            } catch (error) {
                console.error("Delete error:", error);
                Swal.fire({
                    title: 'خطأ!',
                    text: 'لا يمكن حذف الفرصة لوجود بيانات مرتبطة بها أو لخلل فني.',
                    icon: 'error',
                    background: '#ffffff',
                    color: '#1e293b',
                });
            }
        }
    };
    const handleCompleteOpportunity = async () => {
        const result = await Swal.fire({
            title: 'تأكيد إغلاق الفرصة نهائياً؟ 🏁',
            text: "عند تأكيد الاكتمال، سيتم إغلاق الفرصة ولن تتمكن من قبول متطوعين جدد، وسيتم اعتبار كافة المهام قد انتهت.",
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'نعم، اكتملت الفرصة',
            cancelButtonText: 'تراجع',
            confirmButtonColor: '#10b981',
            background: '#ffffff',
            color: '#1e293b',
            borderRadius: '1.5rem'
        });

        if (result.isConfirmed) {
            try {
                // إرسال طلب تحديث الحالة للفرصة نفسها
                await api.patch(`/opportunities/${id}/status`, {
                    status: 'completed'
                });
                // تحديث حالة الفرصة في الواجهة الأمامية
                setOpportunity(prev => ({ ...prev, status: 'completed' }));

                toast.success('تم إعلان اكتمال الفرصة بنجاح! 🎉');
            } catch (error) {
                console.log(error);
                toast.error('حدث خطأ أثناء محاولة إغلاق الفرصة');
            }
        }
    };
    // Helpers
    const filteredApplicants = useMemo(() =>
        applicants.filter(app => filter === 'all' ? true : app.status === filter),
        [applicants, filter]);

    const stats = useMemo(() => ({
        total: applicants.length,
        pending: applicants.filter(a => a.status === 'pending').length,
        accepted: applicants.filter(a => a.status === 'accepted').length,
        rejected: applicants.filter(a => a.status === 'rejected').length,
    }), [applicants]);

    const handleStatusUpdate = async (applicationId, applicantName, newStatus) => {
        const isAccept = newStatus === 'accepted';
        const result = await Swal.fire({
            title: `تحديث حالة الطلب`,
            text: `هل أنت متأكد من ${isAccept ? 'قبول' : 'رفض'} ${applicantName}؟`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'تأكيد الخطوة',
            cancelButtonText: 'تراجع',
            confirmButtonColor: isAccept ? '#8b5cf6' : '#ef4444',
            background: '#ffffff',
            color: '#1e293b',
            borderRadius: '1.5rem'
        });

        if (result.isConfirmed) {
            try {
                await api.patch(`/org/applications/${applicationId}/status`, { status: newStatus });
                setApplicants(prev => prev.map(app => app.id === applicationId ? { ...app, status: newStatus } : app));
                toast.success('تم تحديث الحالة بنجاح ⚡');
            } catch {
                toast.error('عذراً، فشل التحديث');
            }
        }
    };

    const openContactDialog = (user) => {
        Swal.fire({
            title: `<span class="text-xl font-black">${user.full_name}</span>`,
            html: `
                <div class="space-y-4 text-right font-['Cairo'] p-2">
                    <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-sm">
                        <p class="text-slate-500 mb-1">البريد الإلكتروني</p>
                        <p class="font-bold text-emerald-600">${user.email}</p>
                    </div>
                    <div class="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-sm">
                        <p class="text-slate-500 mb-1">رقم التواصل</p>
                        <p class="font-bold">${user.phone || 'غير مدرج'}</p>
                    </div>
                </div>
            `,
            showDenyButton: !!user.phone,
            confirmButtonText: 'إرسال Email',
            denyButtonText: 'واتساب مباشر',
            confirmButtonColor: '#059669',
            background: '#ffffff',
            color: '#1e293b',
            padding: '2rem'
        }).then((result) => {
            if (result.isConfirmed) window.location.href = `mailto:${user.email}`;
            else if (result.isDenied) window.open(`https://wa.me/${user.phone}`, '_blank');
        });
    };
    const API_URL = import.meta.env.VITE_API_URL;
    const isExpired = opportunity?.deadline ? new Date(opportunity.deadline) < new Date() : false;
    // نضع هذه الحسابات قبل الـ return
    const hasNoApplicants = applicants.length === 0;
    const hasNoHours = totalOppHours === 0;
    const canBeDeleted = isExpired && (hasNoApplicants || hasNoHours);
    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-['Cairo'] selection:bg-emerald-500/30 overflow-x-hidden" dir="rtl">
            <Toaster position="top-center" toastOptions={{ style: { background: '#18181b', color: '#1e293b', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' } }} />
            <Sidebar role="organization" />

            <main className="flex-1 h-screen overflow-y-auto custom-scrollbar relative px-4 lg:px-8 py-6">
                <div className="max-w-6xl mx-auto">

                    {/* Top Navigation */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-xs md:text-sm text-slate-400 hover:text-emerald-600 transition-all mb-8 group font-bold bg-slate-50 px-4 py-2 rounded-full w-fit"
                    >
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        العودة للوحة القيادة
                    </button>
                    <div className="absolute top-5 left-5">

                        {opportunity?.status !== 'completed' && isExpired && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleCompleteOpportunity}
                                className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-slate-900 px-8 py-4 rounded-2xl border border-emerald-500/20 font-black text-sm transition-all flex items-center gap-3 shadow-xl shadow-emerald-500/5"
                            >
                                <CheckCircle size={20} />
                                تأكيد اكتمال الفرصة
                            </motion.button>
                        )}
                    </div>
                    {loading ? <FullPageSkeleton /> : (
                        <>
                            {/* Hero Header */}
                            <header className="mb-12 relative">
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>

                                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight leading-tight">
                                        {opportunity?.title}
                                    </h1>
                                    <p className="text-slate-400 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
                                        إدارة المتقدمين، متابعة ساعات التطوع، والتواصل المباشر مع الكفاءات المنضمة للفرصة.
                                    </p>
                                </motion.div>

                                {/* Stats Bar */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-10">
                                    {[
                                        { label: 'إجمالي الساعات', value: totalOppHours, color: 'text-emerald-600', icon: Clock },
                                        { label: 'المتقدمين', value: stats.total, color: 'text-blue-500', icon: User },
                                        { label: 'المقبولين', value: stats.accepted, color: 'text-emerald-500', icon: ShieldCheck },
                                        { label: 'في الانتظار', value: stats.pending, color: 'text-amber-500', icon: Calendar },
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="bg-slate-50 border border-slate-100 p-4 rounded-3xl backdrop-blur-sm"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <stat.icon size={18} className="text-slate-400" />
                                                <span className={`${stat.color} text-xl md:text-2xl font-black italic`}>{stat.value}</span>
                                            </div>
                                            <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">{stat.label}</div>
                                        </motion.div>
                                    ))}
                                </div>
                            </header>

                            {/* Filter System */}
                            <nav className="sticky top-4 z-40 mb-8 bg-white/80 backdrop-blur-xl border border-slate-200 p-1.5 rounded-[2rem] flex flex-wrap justify-center gap-1 shadow-2xl shadow-black/50">
                                {[
                                    { id: 'all', label: 'الكل', color: 'bg-white/10' },
                                    { id: 'pending', label: 'قيد المراجعة', color: 'bg-amber-500' },
                                    { id: 'accepted', label: 'المعتمدين', color: 'bg-emerald-600' },
                                    { id: 'rejected', label: 'المرفوضين', color: 'bg-red-500' },
                                    { id: 'completed', label: 'المكتمل', color: 'bg-red-500' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setFilter(tab.id)}
                                        className={`px-4 py-2.5 md:px-8 rounded-2xl text-[11px] md:text-xs font-black transition-all duration-300 flex items-center gap-2 ${filter === tab.id ? `${tab.color} text-slate-900 shadow-lg` : 'text-slate-400 hover:text-slate-900'
                                            }`}
                                    >
                                        {tab.label}
                                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${filter === tab.id ? 'bg-black/20' : 'bg-slate-50'}`}>
                                            {applicants.filter(a => tab.id === 'all' ? true : a.status === tab.id).length}
                                        </span>
                                    </button>
                                ))}
                            </nav>

                            {/* Applicants List */}
                            <div className="space-y-4 min-h-[400px]">
                                <AnimatePresence mode="popLayout">
                                    {filteredApplicants.map((app, idx) => (
                                        <motion.div
                                            key={app.id}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group relative bg-white border border-slate-100 p-5 md:p-8 rounded-[2.5rem] hover:border-emerald-200 transition-all duration-500"
                                        >
                                            <div className="flex flex-col lg:flex-row items-center gap-8">

                                                {/* Profile Avatar Section */}
                                                <div className="relative">
                                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] overflow-hidden ring-4 ring-purple-500/10 group-hover:ring-purple-500/30 transition-all">
                                                        <img
                                                            src={app.user.profile_image?.startsWith('http') ? app.user.profile_image : `${API_URL}/storage/${app.user.profile_image}`}
                                                            alt={app.user.full_name}
                                                            className="w-full h-full object-cover"
                                                               />
                                                    </div>
                                                    <div className={`absolute -bottom-2 -left-2 p-1.5 rounded-xl border-4 border-[#0a0a0c] ${app.status === 'accepted' ? 'bg-emerald-500' : app.status === 'rejected' ? 'bg-red-500' : 'bg-amber-500'
                                                        }`}>
                                                        {app.status === 'accepted' ? <ShieldCheck size={14} /> : app.status === 'rejected' ? <XCircle size={14} /> : <Clock size={14} />}
                                                    </div>
                                                </div>

                                                {/* Info Section */}
                                                <div className="flex-1 text-center lg:text-right space-y-3">
                                                    <div className="flex flex-col lg:flex-row items-center gap-3">
                                                        <h3 className="text-lg md:text-xl font-black group-hover:text-emerald-600 transition-colors">{app.user.full_name}</h3>
                                                        <div className="flex gap-2">
                                                            {app.status === 'accepted' && (
                                                                <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-200">
                                                                    <Star size={12} fill="currentColor" />
                                                                    {app.user.hour_logs_sum_hours || 0} ساعة منجزة
                                                                </span>
                                                            )}
                                                            <span className="flex items-center gap-1 bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold">
                                                                <MapPin size={12} />
                                                                {app.user.profile?.university || 'متطوع مستقل'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-xs font-bold text-slate-400">
                                                        <span className="flex items-center gap-1.5 hover:text-slate-900 transition-colors cursor-pointer">
                                                            <Mail size={14} className="text-purple-600" /> {app.user.email}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar size={14} className="text-purple-600" /> تقديم: {new Date(app.created_at).toLocaleDateString('ar-EG')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions Section */}
                                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full lg:w-auto">
                                                    {(opportunity.status === 'expired' && (opportunity.applications_count === 0 || opportunity.total_logged_hours === 0)) && (
                                                        <button
                                                            onClick={() => handleDeleteOpportunity(opportunity.id)}
                                                            className="w-full sm:w-auto bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-slate-900 px-6 py-3 rounded-2xl text-xs font-black transition-all border border-red-500/20 flex items-center justify-center gap-2"
                                                        >
                                                            <Trash2 size={16} /> حذف الفرصة لعدم وجود متفاعلين
                                                        </button>
                                                    )}
                                                    {/* 1. قسم إدارة الطلبات الجديدة (تظهر فقط إذا كانت الفرصة لا تزال نشطة) */}
                                                    {app.status === 'pending' && opportunity.status !== 'completed' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleStatusUpdate(app.id, app.user.full_name, 'accepted')}
                                                                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-lg shadow-emerald-900/20"
                                                            >
                                                                قبول المتطوع
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusUpdate(app.id, app.user.full_name, 'rejected')}
                                                                className="w-full sm:w-auto bg-slate-50 hover:bg-red-500 hover:text-slate-900 text-red-500 px-6 py-3 rounded-2xl text-xs font-black transition-all"
                                                            >
                                                                رفض
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* 2. قسم المتطوعين المقبولين */}
                                                    {app.status === 'accepted' && (
                                                        <>
                                                            {/* زر توثيق الساعات: متاح دائماً للمقبولين لضبط السجل */}

                                                            {/* زر إتمام المهمة: يظهر فقط إذا اكتملت الساعات واكتملت حالة الفرصة أيضاً */}
                                                            {opportunity.status === 'completed' ? (
                                                                <motion.button
                                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    onClick={() => handleCompleteTask(app.id, app.user.full_name)}
                                                                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-900 px-6 py-3 rounded-2xl text-xs font-black shadow-xl flex items-center gap-2"
                                                                >
                                                                    <CheckCircle size={16} /> إتمام المهمة وإصدار الشهادة
                                                                </motion.button>
                                                            ) : (

                                                                <button
                                                                    onClick={() => navigate(`/org/log-hours/${id}/${app.user.id}`)}
                                                                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-slate-900 px-8 py-3 rounded-2xl text-xs font-black transition-all shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2"
                                                                >
                                                                    <Clock size={16} /> توثيق ساعات
                                                                </button>

                                                            )}
                                                        </>
                                                    )}

                                                    {/* زر التواصل متاح دائماً */}
                                                    <button
                                                        onClick={() => openContactDialog(app.user)}
                                                        className="p-3.5 bg-slate-50 hover:bg-slate-50 rounded-2xl text-slate-500 hover:text-slate-900 transition-all border border-slate-100"
                                                    >
                                                        <MessageSquare size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* Empty State */}
                                {filteredApplicants.length === 0 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-[3rem] bg-white">
                                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                            <Info size={40} className="text-slate-400" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-400 mb-2">لا توجد طلبات هنا</h3>
                                        <p className="text-slate-400 font-bold text-sm text-center px-6">حاول تغيير الفلتر أو انتظر تقديم متطوعين جدد لهذه الفرصة.</p>
                                    </motion.div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default OpportunityApplicants;