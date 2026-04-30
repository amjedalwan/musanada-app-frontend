import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Building2, ChevronRight, Send, Briefcase,
    CheckCircle, FileText, Loader2, AlertCircle,
    Clock, Info, ShieldCheck, Calendar,
    Target, Award, Globe, Phone, Sparkles, UserX
} from 'lucide-react';
import Swal from 'sweetalert2';
import Sidebar from '../components/Sidebar';
import InteractiveMap from '../components/InteractiveMap';
import api from '../api/axios';

const OpportunityDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

const API_URL = import.meta.env.VITE_API_URL;

    const [opportunity, setOpportunity] = useState(null);
    const [user, setUserData] = useState(null);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchOpportunityData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/opportunities/${id}`);
            
            try {
                const userRes = await api.get(`/student/`);
                setUserData(userRes.data);
            } catch (err) {
                setUserData({ data: { role: 'guest' } });
            }

            setOpportunity(res.data);
            setStatus(res.data.my_application_status || null);

            // تحسين الـ SEO ديناميكياً
            document.title = `${res.data.title} | منصة مساندة`;
            let metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', res.data.description.substring(0, 150) + '...');
            } else {
                metaDescription = document.createElement('meta');
                metaDescription.name = 'description';
                metaDescription.content = res.data.description.substring(0, 150) + '...';
                document.head.appendChild(metaDescription);
            }
        } catch (err) {
            setError("عذراً، هذه الفرصة غير متاحة حالياً أو تم نقلها.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchOpportunityData();
    }, [fetchOpportunityData]);

    // حسابات المقاعد والمنطق المتقدم
    const stats = useMemo(() => {
        if (!opportunity) return null;

        const acceptedCount = opportunity.accepted_count || 0;
        const maxCapacity = opportunity.required_volunteers || 0;
        const remainingSeats = Math.max(0, maxCapacity - acceptedCount);

        const isFull = maxCapacity > 0 && acceptedCount >= maxCapacity;
        const isExpired = opportunity.deadline && new Date(opportunity.deadline) < new Date();

        // التحقق من تطابق الجنس
        const genderMismatch =
            opportunity.gender !== 'both' &&
            user?.gender &&
            opportunity.gender !== user.gender;

        const progress = maxCapacity > 0 ? (acceptedCount / maxCapacity) * 100 : 0;

        return {
            acceptedCount,
            maxCapacity,
            remainingSeats,
            isFull,
            isExpired,
            genderMismatch,
            progress
        };
    }, [opportunity, user]);

    const handleApply = async () => {
        if (!user || user.data.role !== 'student') return;
        if (stats.isFull || stats.isExpired || stats.genderMismatch) return;

        const result = await Swal.fire({
            title: 'تأكيد الرغبة بالانضمام',
            text: "هل تريد إرسال ملفك الشخصي لهذه المنظمة للمراجعة؟",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'إرسال الطلب',
            cancelButtonText: 'تراجع',
            background: '#ffffff', color: '#0f172a', confirmButtonColor: '#059669',
        });

        if (result.isConfirmed) {
            setActionLoading(true);
            try {
                await api.post('/applications', { opportunity_id: id });
                setStatus('pending');
                Swal.fire({ icon: 'success', title: 'تم التقديم!', background: '#ffffff', color: '#0f172a', timer: 2000 });
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'خطأ', text: err.response?.data?.message || 'فشل التقديم', background: '#ffffff', color: '#0f172a' });
            } finally {
                setActionLoading(false);
            }
        }
    };

    const handleCancel = async () => {
        const confirm = await Swal.fire({
            title: 'سحب الطلب؟',
            text: "لن يتمكن المسؤول من رؤية ملفك في قائمة المتقدمين.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'نعم، اسحب الطلب',
            cancelButtonText: 'إلغاء',
            background: '#ffffff', color: '#0f172a'
        });

        if (confirm.isConfirmed) {
            setActionLoading(true);
            try {
                await api.delete(`/applications/${id}`);
                setStatus(null);
                Swal.fire({ icon: 'success', title: 'تم السحب', background: '#ffffff', color: '#0f172a', timer: 1500 });
            } catch (err) {
                Swal.fire({ icon: 'error', title: 'عذراً', text: 'لا يمكن السحب الآن', background: '#ffffff', color: '#0f172a' });
            } finally {
                setActionLoading(false);
            }
        }
    };
  
    const ActionButton = () => {
        if (!opportunity || !stats) return null;

        // للزوار
        if (user.data?.role === 'guest') return (
            <button
                onClick={() => {
                    Swal.fire({
                        title: 'يرجى تسجيل الدخول',
                        text: 'يجب أن تسجل الدخول كمتطوع لتتمكن من التقديم على هذه الفرصة',
                        icon: 'info',
                        showCancelButton: true,
                        confirmButtonText: 'تسجيل الدخول',
                        cancelButtonText: 'إنشاء حساب جديد',
                        background: '#ffffff', color: '#0f172a', confirmButtonColor: '#059669',
                    }).then((result) => {
                        if (result.isConfirmed) {
                            navigate('/login');
                        } else if (result.dismiss === Swal.DismissReason.cancel) {
                            navigate('/register');
                        }
                    });
                }}
                className="w-full py-4 rounded-2xl font-black text-lg bg-slate-100 hover:bg-slate-200 shadow-sm transition-all transform active:scale-95 flex items-center justify-center gap-3 text-slate-700"
            >
                <UserX size={20} /> تسجيل الدخول للتقديم
            </button>
        );

        // منع التقديم لغير الطلاب
        if (user.data?.role !== 'student') return (

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-700 text-[11px] flex gap-2">
                <Info size={16} /> الحسابات الطلابية فقط يمكنها التقديم على الفرص.
            </div>
        );

        // تنبيه عدم تطابق الجنس
        if (stats.genderMismatch) return (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-[11px] flex gap-2 mb-4">
                <UserX size={16} /> عذراً، هذه الفرصة مخصصة لـ {opportunity.gender === 'male' ? 'الذكور' : 'الإناث'} فقط.
            </div>
        );

        if (actionLoading) return (
            <button disabled className="w-full py-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-center">
                <Loader2 className="animate-spin text-emerald-600" />
            </button>
        );

        if (status === 'accepted') return (
            <div className="w-full py-6 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex flex-col items-center">
                <CheckCircle size={32} className="mb-2" />
                <span className="font-black">تم قبولك في هذه الفرصة</span>
                <p className="text-[10px] mt-1 opacity-70">سيتم التواصل معك عبر هاتفك المسجل</p>
            </div>
        );

        if (stats.isExpired) return <div className="w-full py-4 rounded-2xl bg-slate-100 text-slate-400 text-center font-bold">التقديم منتهي</div>;

        if (stats.isFull) return (
            <div className="w-full py-4 rounded-2xl bg-red-50 text-red-600 text-center font-bold border border-red-100">
                عذراً، اكتمل عدد المتطوعين
            </div>
        );

        switch (status) {
            case 'pending':
                return (
                    <div className="space-y-3">
                        <div className="w-full py-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 text-center font-bold animate-pulse">
                            طلبك قيد المراجعة...
                        </div>
                        <button onClick={handleCancel} className="w-full text-[11px] text-slate-400 hover:text-red-500 font-bold transition-colors">
                            إلغاء التقديم
                        </button>
                    </div>
                );
            case 'rejected':
                return <div className="w-full py-4 rounded-2xl bg-red-50 text-red-600 text-center font-bold border border-red-100">نعتذر، لم يتم قبول طلبك</div>;
            default:
                return (
                    <button
                        onClick={handleApply}
                        className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95 flex items-center justify-center gap-3 text-slate-900"
                    >
                        <Send size={20} /> قدم الآن
                    </button>
                );
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
                <Loader2 size={50} className="animate-spin text-emerald-600 mx-auto mb-4" />
                <p className="text-slate-400 font-bold animate-pulse">جاري جلب تفاصيل الفرصة...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-red-50 border border-red-100 p-10 rounded-[3rem] text-center max-w-md">
                <AlertCircle size={60} className="text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-slate-900 mb-2">خطأ في التحميل</h2>
                <p className="text-slate-500 mb-6">{error}</p>
                <button onClick={() => navigate('/opportunities')} className="bg-white px-8 py-3 rounded-2xl text-slate-700 font-bold border border-slate-200">العودة للرئيسية</button>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500/30" dir="rtl">
            <Sidebar role={user.data?.role} />

            <main className="flex-1 relative overflow-y-auto custom-scrollbar pb-20">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/5 blur-[150px] pointer-events-none"></div>

                <div className="max-w-6xl mx-auto p-4 lg:p-10 relative z-10">

                    {/* Header Action */}
                    <div className="flex justify-between items-center mb-8">
                        <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-all bg-white pr-4 pl-6 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            <span className="font-bold text-sm">رجوع</span>
                        </button>
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                            <Sparkles size={16} className="text-amber-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: #{opportunity?.id}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* Hero Card */}
                            <div className="bg-white border border-slate-100 rounded-[2.5rem]  relative overflow-hidden group shadow-lg">
                                <div className="relative h-[400px] sm:h-[400px] w-full overflow-hidden bg-white ">
                                    {opportunity.cover_image ? (
                                        <img src={opportunity.cover_image} alt={opportunity.title} className="absolute inset-0 w-full h-full  object-cover opacity-50 group-hover:opacity-80 transition-all duration-500 scale-105 group-hover:scale-100" onError={() => setImageError(true)} />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/10 to-transparent">
                                            <Briefcase size={32} className="text-slate-900/10" />
                                        </div>
                                    )}

                                </div>
                                <div className=" p-5 flex flex-col flex-1 bottom-0 left-0 w-full backdrop-blur-[4px] bg-white/10 dark:bg-black/20 border-t border-slate-100 shadow-2xl">
                                    <div className="mb-4 px-2">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase">
                                                {opportunity?.type === 'voluntary' ? 'فرصة تطوعية' : 'برنامج تدريبي'}
                                            </div>
                                            <div className="px-4 py-1.5 rounded-full bg-teal-50 border border-teal-100 text-teal-600 text-[10px] font-black uppercase">
                                                {opportunity?.duration}
                                            </div>
                                        </div>

                                        <h1 className="text-3xl lg:text-5xl font-black mb-8 leading-tight text-slate-900">
                                            {opportunity?.title}
                                        </h1>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                                            <div className="flex items-center gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                    <Building2 size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold mb-1">الجهة المنظمة</p>
                                                    <p className="font-black text-slate-700 text-sm">{opportunity?.user?.organization?.org_name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100">
                                                <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                                                    <MapPin size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-bold mb-1">الموقع الميداني</p>
                                                    <p className="font-black text-slate-700 text-sm">{opportunity?.location}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
                                    <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-emerald-600">
                                        <FileText size={20} /> الوصف والمهام
                                    </h3>
                                    <p className="text-slate-500 leading-relaxed text-sm font-medium whitespace-pre-wrap">
                                        {opportunity?.description}
                                    </p>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
                                    <h3 className="text-lg font-black mb-6 flex items-center gap-3 text-teal-600">
                                        <Award size={20} /> المتطلبات والمهارات
                                    </h3>
                                    <p className="text-slate-500 leading-relaxed text-sm font-medium whitespace-pre-wrap mb-6">
                                        # {opportunity?.requirements}
                                    </p>
                                   
                                    <div className="flex flex-wrap gap-2">
                                      
                                        {opportunity?.skills?.map(skill => (
                                            <span key={skill.id} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-500 shadow-sm">
                                                {skill.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Map */}
                            <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                                <div className="p-6 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                                    <MapPin size={18} className="text-red-500" />
                                    <h3 className="font-black text-sm text-slate-900">موقع التنفيذ على الخريطة</h3>
                                </div>
                                <div className="h-[350px] w-full">
                                    <InteractiveMap
                                        lat={opportunity?.lat}
                                        lng={opportunity?.lng}
                                        isEditing={false}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div className="lg:col-span-4 space-y-6">

                            {/* Action Card (Progress & Seats) */}
                            <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] sticky top-10 shadow-xl">

                                <div className="mb-8">
                                    <div className="flex justify-between items-end mb-3">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المقاعد المتبقية</span>
                                            <span className="text-xl font-black text-slate-900">{stats.remainingSeats} مقعد</span>
                                        </div>
                                        <span className={`text-xs font-black px-2 py-1 rounded-lg ${stats.progress >= 90 ? 'bg-red-500 text-slate-900 animate-pulse' : 'text-slate-400'}`}>
                                            {stats.acceptedCount} / {stats.maxCapacity}
                                        </span>
                                    </div>

                                    <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${stats.progress >= 90
                                                ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                                                : 'bg-gradient-to-r from-emerald-600 to-teal-500'
                                                }`}
                                            style={{ width: `${Math.min(stats.progress, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <ActionButton />

                                <div className="mt-8 pt-8 border-t border-slate-50 space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Calendar size={18} />
                                            <span className="text-[11px] font-bold">آخر موعد</span>
                                        </div>
                                        <span className="text-[11px] font-black text-slate-700">{opportunity?.deadline}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Target size={18} />
                                            <span className="text-[11px] font-bold">الفئة</span>
                                        </div>
                                        <span className="text-[11px] font-black text-slate-700">
                                            {opportunity?.gender === 'male' ? 'ذكور فقط' : opportunity?.gender === 'female' ? 'إناث فقط' : 'للجنسين'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-slate-400">
                                            <Clock size={18} />
                                            <span className="text-[11px] font-bold">المدة المتوقعة</span>
                                        </div>
                                        <span className="text-[11px] font-black text-slate-700">{opportunity?.duration}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Organization Details */}
                            <div className="bg-gradient-to-br from-emerald-50 to-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
                                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-6">عن المنظمة</h4>
                                <div className="flex items-center gap-4 mb-6">
                                    <img
                                        src={opportunity?.user?.profile_image ? `${API_URL}/storage/${opportunity.user.profile_image}` : '/default-avatar.png'}
                                        className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-sm"
                                        alt="organization logo"
                                    />
                                    <div>
                                        <h5 className="font-black text-sm text-slate-900">{opportunity?.user?.organization?.org_name}</h5>
                                        <p className="text-[10px] text-slate-400 font-bold">{opportunity?.user?.organization?.org_type}</p>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed mb-6">
                                    {opportunity?.user?.organization?.description}
                                </p>
                                <div className="space-y-3 border-t border-slate-50 pt-4">
                                    {opportunity?.user?.organization?.website && (
                                        <a href={opportunity.user.organization.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[10px] text-slate-400 hover:text-emerald-600 transition-colors">
                                            <Globe size={14} /> {opportunity.user.organization.website}
                                        </a>
                                    )}
                                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                        <Phone size={14} /> {opportunity?.user?.phone}
                                    </div>
                                </div>
                            </div>

                            {/* Verification */}
                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] text-center">
                                <ShieldCheck size={30} className="mx-auto mb-3 text-emerald-600" />
                                <h6 className="text-[10px] font-black text-emerald-900 uppercase mb-1">فرصة موثوقة</h6>
                                <p className="text-[9px] text-emerald-600/70">تم التحقق من بيانات المنظمة من قبل إدارة المنصة.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OpportunityDetails;
