import React, { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck, FileText, CheckCircle, XCircle, Clock,
    Eye, Download, Search, RefreshCcw, Building2,
    MapPin, AlertTriangle, Loader2, ChevronLeft,
    ChevronRight, FileWarning, ExternalLink, Info,
    User, Mail, Phone, Globe, Calendar, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import AdminSidebar from '../components/AdminSidebar';
import Swal from 'sweetalert2';
const API_URL = import.meta.env.VITE_API_URL;
const API_STORAGE_URL = API_URL + '/storage/';

const OrganizationVerification = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({});
    const [selectedOrg, setSelectedOrg] = useState(null); // للنافذة المنبثقة التفصيلية

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        background: '#0a0a12',
        color: '#fff',
        customClass: { popup: 'rounded-2xl border border-white/10 shadow-2xl' }
    });

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/organizations/pending', {
                params: { status: 'pending', search: searchTerm, page: page }
            });
            setRequests(response.data.data || []);
            setMeta(response.data);
        } catch (error) {
            Toast.fire({ icon: 'error', title: 'حدث خطأ أثناء جلب البيانات' });
        } finally {
            setTimeout(() => setLoading(false), 500); // تأخير بسيط لإعطاء سلاسة في الحركة
        }
    }, [searchTerm, page]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleVerifyAction = async (id, action) => {
    if (action === 'approve') {
        const result = await Swal.fire({
            title: 'اعتماد المؤسسة',
            text: "هل أنت متأكد من توثيق هذه المؤسسة؟ ستتمكن من البدء في نشر المبادرات فوراً.",
            icon: 'success',
            iconColor: '#10b981',
            showCancelButton: true,
            confirmButtonText: 'نعم، قم بالتوثيق',
            cancelButtonText: 'إلغاء',
            background: '#0a0a0f',
            color: '#fff',
            confirmButtonColor: '#10b981',
            cancelButtonColor: 'rgba(255,255,255,0.05)',
            customClass: {
                popup: 'rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-md',
                confirmButton: 'rounded-xl px-6 py-3 font-black text-xs',
                cancelButton: 'rounded-xl px-6 py-3 font-black text-xs text-gray-400'
            }
        });

        if (result.isConfirmed) {
            try {
                // إظهار مؤشر تحميل بسيط داخل التنبيه
                Swal.showLoading();
                await api.post(`/admin/organizations/${id}/approve`);
                
                Toast.fire({ icon: 'success', title: 'تم توثيق المؤسسة بنجاح' });
                fetchRequests();
                setSelectedOrg(null);
            } catch (e) { 
                Toast.fire({ icon: 'error', title: 'فشلت عملية التوثيق، حاول مجدداً' }); 
            }
        }
    } else {
        // حالة الرفض (الحذف النهائي)
        const result = await Swal.fire({
            title: 'حذف طلب التوثيق؟',
            html: `
                <div class="text-center p-2">
                    <p className="text-sm text-gray-400 leading-relaxed">
                        انتبه! هذا الإجراء سيؤدي إلى <span class="text-red-500 font-black">حذف كافة بيانات المؤسسة</span> نهائياً من قاعدة البيانات.
                    </p>
                </div>
            `,
            icon: 'warning',
            iconColor: '#ef4444',
            showCancelButton: true,
            confirmButtonText: 'نعم، حذف نهائي',
            cancelButtonText: 'تراجع',
            background: '#0a0a0f',
            color: '#fff',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: 'rgba(255,255,255,0.05)',
            customClass: {
                popup: 'rounded-[2.5rem] border border-red-500/10 shadow-2xl backdrop-blur-md',
                confirmButton: 'rounded-xl px-6 py-3 font-black text-xs',
                cancelButton: 'rounded-xl px-6 py-3 font-black text-xs text-gray-400'
            }
        });

        if (result.isConfirmed) {
            try {
                Swal.showLoading();
                await api.post(`/admin/organizations/${id}/reject`);
                
                Toast.fire({ icon: 'warning', title: 'تم حذف بيانات المؤسسة نهائياً' });
                fetchRequests();
                setSelectedOrg(null);
            } catch (e) { 
                Toast.fire({ icon: 'error', title: 'حدث خطأ أثناء محاولة الحذف' }); 
            }
        }
    }
};

    const viewLicense = (fileUrl) => {
        if (!fileUrl) return;
        window.open(`${API_STORAGE_URL}${fileUrl}`, '_blank');
    };

    // مكون النافذة المنبثقة التفصيلية
    // مكون النافذة المنبثقة التفصيلية المحدث
const DetailModal = ({ org, onClose }) => {
    if (!org) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                className="bg-[#0a0a0f] border border-white/10 w-full max-w-4xl max-h-[95vh] rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-y-auto [scrollbar-width:_none] [-ms-overflow-style:_none] [&::-webkit-scrollbar]:hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="relative h-40 md:h-52 bg-gradient-to-br from-indigo-600/30 via-purple-600/10 to-transparent p-6 md:p-10">
                    <button 
                        onClick={onClose}
                        className="absolute top-6 left-6 z-10 p-2 bg-black/20 hover:bg-white/10 text-white/70 hover:text-white rounded-full transition-all backdrop-blur-md"
                    >
                        <XCircle size={24} />
                    </button>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-end absolute -bottom-12 md:-bottom-16 right-0 left-0 md:left-auto md:right-10 px-6">
                        <div className="relative">
                            <img
                                src={org.user.profile_image && org.user.profile_image !== 'profiles/default.jpg' 
                                    ? `${API_STORAGE_URL}${org.user.profile_image}` 
                                    : `https://ui-avatars.com/api/?name=${org.org_name}&background=4f46e5&color=fff`}
                                className="w-28 h-28 md:w-36 md:h-36 rounded-[2rem] md:rounded-[2.5rem] border-[6px] md:border-[10px] border-[#0a0a0f] bg-[#151520] object-cover shadow-2xl"
                                alt={org.org_name}
                            />
                            <div className="absolute -bottom-2 -right-2 p-2 bg-amber-500 rounded-xl border-4 border-[#0a0a0f] text-black">
                                <Clock size={16} className="animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center md:text-right pb-0 md:pb-6">
                            <h2 className="text-2xl md:text-4xl font-black text-white drop-shadow-md">{org.org_name}</h2>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-lg border border-indigo-500/20">
                                    {org.org_type}
                                </span>
                                <span className="px-3 py-1 bg-white/5 text-gray-400 text-[10px] font-black rounded-lg border border-white/5 flex items-center gap-1">
                                    <Hash size={10} /> ID: {org.id}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Body */}
                <div className="p-6 md:p-12 pt-20 md:pt-24">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                        
                        {/* Column 1: Primary Info */}
                        <div className="lg:col-span-2 space-y-8">
                            <section>
                                <div className="flex items-center gap-3 mb-4 text-indigo-400">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg"><Info size={18} /></div>
                                    <h3 className="text-sm font-black uppercase tracking-widest">نبذة عن المؤسسة</h3>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[2rem]">
                                    <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                                        {org.description || 'لا يوجد وصف متاح لهذه المؤسسة حالياً.'}
                                    </p>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl group hover:border-indigo-500/30 transition-all">
                                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2 flex items-center gap-2"><User size={12} className="text-indigo-500" /> مسؤول التواصل</p>
                                    <p className="text-sm text-white font-bold">{org.contact_person || 'غير محدد'}</p>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl group hover:border-indigo-500/30 transition-all">
                                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2 flex items-center gap-2"><Phone size={12} className="text-indigo-500" /> رقم الهاتف</p>
                                    <p className="text-sm text-white font-bold" dir="ltr">{org.user.phone || 'غير متاح'}</p>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl group hover:border-indigo-500/30 transition-all">
                                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2 flex items-center gap-2"><Mail size={12} className="text-indigo-500" /> البريد الإلكتروني</p>
                                    <p className="text-sm text-white font-bold truncate">{org.user.email}</p>
                                </div>
                                <div className="bg-white/[0.03] border border-white/5 p-5 rounded-2xl group hover:border-indigo-500/30 transition-all">
                                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2 flex items-center gap-2"><MapPin size={12} className="text-indigo-500" /> العنوان المعتمد</p>
                                    <p className="text-sm text-white font-bold">{org.user.location || 'غير محدد'}</p>
                                </div>
                            </section>
                        </div>

                        {/* Column 2: Status & Documents */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-b from-indigo-600/10 to-transparent border border-indigo-500/20 p-6 rounded-[2rem]">
                                <h4 className="text-xs font-black text-white mb-4 flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-indigo-400" /> حالة التدقيق
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-gray-500">تاريخ الطلب</span>
                                        <span className="text-gray-300">{new Date(org.created_at).toLocaleDateString('ar-YE')}</span>
                                    </div>
                                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                        <p className="text-[10px] text-amber-500 font-black mb-1">بانتظار المراجعة</p>
                                        <p className="text-[9px] text-amber-200/60 leading-tight">يرجى فحص الوثائق بعناية قبل اتخاذ قرار الاعتماد.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[2rem]">
                                <h4 className="text-xs font-black text-white mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-indigo-400" /> وثائق الترخيص
                                </h4>
                                {org.license_file ? (
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => viewLicense(org.license_file)}
                                            className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-white/5"
                                        >
                                            <Eye size={14} /> عرض الملف
                                        </button>
                                        <a 
                                            href={`${API_STORAGE_URL}${org.license_file}`} 
                                            download 
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                                        >
                                            <Download size={14} /> تحميل النسخة
                                        </a>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-red-400/50">
                                        <FileWarning size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-[10px] font-bold">لم يتم إرفاق ملفات</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Footer Inside Modal */}
                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex gap-3 w-full md:w-auto">
                            <button 
                                onClick={() => handleVerifyAction(org.id, 'approve')}
                                className="flex-1 md:flex-none px-8 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-xs font-black shadow-xl shadow-emerald-900/20 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} /> قبول الاعتماد
                            </button>
                            <button 
                                onClick={() => handleVerifyAction(org.id, 'reject')}
                                className="flex-1 md:flex-none px-8 py-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl text-xs font-black border border-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <XCircle size={18} /> رفض الطلب
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
                            نظام مساندة للتحقق الذكي • 2026
                        </p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

    const RequestCard = ({ req }) => (
        <motion.div
            layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="group bg-[#0f0f1a]/60 border border-white/5 rounded-[2.5rem] p-6 hover:bg-[#0f0f1a] hover:border-indigo-500/40 transition-all duration-500 relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-600/5 blur-3xl -ml-12 -mt-12 group-hover:bg-indigo-600/20 transition-all"></div>

            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                        {req.user.profile_image && req.user.profile_image !== 'profiles/default.jpg' ? (
                            <img src={`${API_STORAGE_URL}${req.user.profile_image}`} className="w-full h-full object-cover" />
                        ) : (
                            <Building2 className="text-indigo-400/50" size={28} />
                        )}
                    </div>
                    <div>
                        <h3 className="font-black text-white text-lg tracking-tight truncate max-w-[150px]">{req.org_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full font-bold uppercase">{req.org_type}</span>
                            <span className="text-[9px] text-gray-500 flex items-center gap-1 font-bold"><MapPin size={10} /> {req.user.location || 'غير محدد'}</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => setSelectedOrg(req)} className="p-2 text-white/20 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-xl transition-all">
                    <Info size={20} />
                </button>
            </div>

            <div className="bg-black/20 rounded-3xl p-4 mb-6 border border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${req.license_file ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                            <FileText size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-black">وثيقة الترخيص</p>
                            <p className="text-xs font-bold text-gray-300">{req.license_file ? 'جاهزة للمراجعة' : 'غير مرفقة'}</p>
                        </div>
                    </div>
                    {req.license_file && (
                        <div className="flex gap-1">
                            <button onClick={() => viewLicense(req.license_file)} className="p-2 bg-white/5 text-gray-400 hover:text-white rounded-lg transition-all"><Eye size={14} /></button>
                            <a href={`${API_STORAGE_URL}${req.license_file}`} download className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all"><Download size={14} /></a>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    disabled={!req.license_file}
                    onClick={() => handleVerifyAction(req.id, 'approve')}
                    className="py-3.5 bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white disabled:opacity-20 disabled:grayscale rounded-2xl text-[11px] font-black transition-all border border-emerald-500/20"
                >
                    قبول التوثيق
                </button>
                <button
                    onClick={() => handleVerifyAction(req.id, 'reject')}
                    className="py-3.5 bg-red-600/5 text-red-500 hover:bg-red-600 hover:text-white rounded-2xl text-[11px] font-black transition-all border border-red-500/10"
                >
                    رفض الطلب
                </button>
            </div>
        </motion.div>
    );



    return (
        <div className="flex min-h-screen bg-[#050508] text-white" dir="rtl">
            <AdminSidebar />

            <main className="flex-1 p-6 lg:p-12 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none -mr-32 -mt-32"></div>

                <div className="relative z-10">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                                <ShieldCheck className="text-amber-500" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-white"> <span className="text-amber-500 text-2xl font-bold"> توثيق المؤسسات</span></h1>
                                <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-widest">إدارة وتدقيق هوية المؤسسات الشريكة</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
                            <div className="px-4 py-2 border-l border-white/10 text-center">
                                <p className="text-[10px] text-gray-500 font-black">إجمالي الطلبات</p>
                                <p className="text-lg font-black text-indigo-400">{meta.total || 0}</p>
                            </div>
                            <button onClick={fetchRequests} className={`p-3 hover:bg-indigo-600 rounded-xl transition-all ${loading ? 'animate-spin' : ''}`}>
                                <RefreshCcw size={20} />
                            </button>
                        </div>
                    </header>

                    {/* Search & Filters */}
                    <div className="relative mb-10 group max-w-2xl">
                        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-indigo-400 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="ابحث باسم المؤسسة، نوع النشاط، أو الموقع..."
                            className="w-full bg-[#0f0f1a]/80 border border-white/5 pr-14 pl-6 py-4 rounded-2xl focus:outline-none focus:border-indigo-500/50 focus:bg-[#0f0f1a] transition-all text-sm font-medium shadow-xl"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {(loading && page === 1) ? <LoadingScreen />
                        : (
                            <AnimatePresence mode="wait">
                                {requests.length > 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                                    >
                                        {requests.map(req => <RequestCard key={req.id} req={req} />)}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                        className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.02]"
                                    >
                                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle size={40} className="text-emerald-500/40" />
                                        </div>
                                        <h3 className="text-xl font-black text-gray-400 italic">كل شيء هادئ هنا!</h3>
                                        <p className="text-sm text-gray-600 mt-2 font-bold uppercase tracking-widest">لا توجد طلبات توثيق بانتظار المراجعة حالياً</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    {/* Pagination */}
                    {meta.last_page > 1 && (
                        <footer className="mt-16 flex justify-center items-center gap-6">
                            <button
                                disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 disabled:opacity-10 transition-all border border-white/5"
                            >
                                <ChevronRight />
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">الصفحة</span>
                                <span className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30">{page}</span>
                                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">من {meta.last_page}</span>
                            </div>
                            <button
                                disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)}
                                className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 disabled:opacity-10 transition-all border border-white/5"
                            >
                                <ChevronLeft />
                            </button>
                        </footer>
                    )}
                </div>
            </main>

            {/* Modal Detail Overlay */}
            <AnimatePresence>
                {selectedOrg && (
                    <DetailModal org={selectedOrg} onClose={() => setSelectedOrg(null)} />
                )}
            </AnimatePresence>
        </div>
    );
};


const LoadingScreen = () => (
    <div className="h-screen bg-transparent flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 bg-transparent left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="relative bg-transparent">
            <div className="w-32 h-32 border-4 border-blue-500/10 bg-transparent border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-4 border-4 border-purple-500/10 border-b-purple-500 rounded-full animate-spin-slow " />
        </div>
        <div className="mt-12 text-center relative z-10 bg-transparent">
            <h2 className="text-2xl font-black text-white tracking-[0.3em] uppercase">Musanada Intelligence</h2>
            <p className="text-xs text-blue-400 mt-4 font-bold animate-pulse">جاري تجميع البيانات من بحيرة البيانات المركزية...</p>
        </div>
    </div>
);

export default OrganizationVerification;
