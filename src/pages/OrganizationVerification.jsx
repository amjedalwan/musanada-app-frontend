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
        background: '#ffffff',
        color: '#1e293b',
        customClass: { popup: 'rounded-2xl border border-slate-100 shadow-2xl' }
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
            background: '#ffffff',
            color: '#1e293b',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#f1f5f9',
            customClass: {
                popup: 'rounded-[2.5rem] border border-slate-100 shadow-2xl',
                confirmButton: 'rounded-xl px-6 py-3 font-black text-xs',
                cancelButton: 'rounded-xl px-6 py-3 font-black text-xs text-slate-400'
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
                    <p class="text-sm text-slate-500 leading-relaxed">
                        انتبه! هذا الإجراء سيؤدي إلى <span class="text-red-500 font-black">حذف كافة بيانات المؤسسة</span> نهائياً من قاعدة البيانات.
                    </p>
                </div>
            `,
            icon: 'warning',
            iconColor: '#ef4444',
            showCancelButton: true,
            confirmButtonText: 'نعم، حذف نهائي',
            cancelButtonText: 'تراجع',
            background: '#ffffff',
            color: '#1e293b',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#f1f5f9',
            customClass: {
                popup: 'rounded-[2.5rem] border border-red-100 shadow-2xl',
                confirmButton: 'rounded-xl px-6 py-3 font-black text-xs',
                cancelButton: 'rounded-xl px-6 py-3 font-black text-xs text-slate-400'
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-slate-900/40 backdrop-blur-md"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 50, opacity: 0 }}
                className="bg-white border border-slate-100 w-full max-w-4xl max-h-[95vh] rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-y-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Section */}
                <div className="relative h-40 md:h-52 bg-slate-50 p-6 md:p-10 border-b border-slate-100">
                    <button 
                        onClick={onClose}
                        className="absolute top-6 left-6 z-10 p-2 bg-slate-500 hover:bg-white text-slate-400 hover:text-emerald-600 rounded-full transition-all border border-slate-100 shadow-sm"
                    >
                        <XCircle size={24} />
                    </button>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-center md:items-end absolute -bottom-12 md:-bottom-16 right-0 left-0 md:left-auto md:right-10 px-6">
                        <div className="relative">
                            <img
                                src={org.user.profile_image && org.user.profile_image !== 'profiles/default.jpg' 
                                    ? `${API_STORAGE_URL}${org.user.profile_image}` 
                                    : `https://ui-avatars.com/api/?name=${org.org_name}&background=10b981&color=fff`}
                                className="w-28 h-28 md:w-36 md:h-36 rounded-[2rem] md:rounded-[2.5rem] border-[6px] md:border-[10px] border-white bg-slate-50 object-cover shadow-xl"
                                alt={org.org_name}
                            />
                            <div className="absolute -bottom-2 -right-2 p-2 bg-amber-500 rounded-xl border-4 border-white text-slate-900">
                                <Clock size={16} className="animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center md:text-right pb-0 md:pb-6">
                            <h2 className="text-2xl md:text-4xl font-black text-slate-900">{org.org_name}</h2>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-emerald-100">
                                    {org.org_type}
                                </span>
                                <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black rounded-lg border border-slate-100 flex items-center gap-1">
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
                                <div className="flex items-center gap-3 mb-4 text-emerald-600">
                                    <div className="p-2 bg-emerald-50 rounded-lg"><Info size={18} /></div>
                                    <h3 className="text-sm font-black uppercase tracking-widest">نبذة عن المؤسسة</h3>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem]">
                                    <p className="text-slate-500 leading-relaxed text-sm md:text-base">
                                        {org.description || 'لا يوجد وصف متاح لهذه المؤسسة حالياً.'}
                                    </p>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white border border-slate-100 p-5 rounded-2xl group hover:border-emerald-500/30 transition-all shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2"><User size={12} className="text-emerald-500" /> مسؤول التواصل</p>
                                    <p className="text-sm text-slate-900 font-bold">{org.contact_person || 'غير محدد'}</p>
                                </div>
                                <div className="bg-white border border-slate-100 p-5 rounded-2xl group hover:border-emerald-500/30 transition-all shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2"><Phone size={12} className="text-emerald-500" /> رقم الهاتف</p>
                                    <p className="text-sm text-slate-900 font-bold" dir="ltr">{org.user.phone || 'غير متاح'}</p>
                                </div>
                                <div className="bg-white border border-slate-100 p-5 rounded-2xl group hover:border-emerald-500/30 transition-all shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2"><Mail size={12} className="text-emerald-500" /> البريد الإلكتروني</p>
                                    <p className="text-sm text-slate-900 font-bold truncate">{org.user.email}</p>
                                </div>
                                <div className="bg-white border border-slate-100 p-5 rounded-2xl group hover:border-emerald-500/30 transition-all shadow-sm">
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-2"><MapPin size={12} className="text-emerald-500" /> العنوان المعتمد</p>
                                    <p className="text-sm text-slate-900 font-bold">{org.user.location || 'غير محدد'}</p>
                                </div>
                            </section>
                        </div>

                        {/* Column 2: Status & Documents */}
                        <div className="space-y-6">
                            <div className="bg-emerald-50/30 border border-emerald-100 p-6 rounded-[2rem]">
                                <h4 className="text-xs font-black text-slate-900 mb-4 flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-emerald-600" /> حالة التدقيق
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-slate-400">تاريخ الطلب</span>
                                        <span className="text-slate-600">{new Date(org.created_at).toLocaleDateString('ar-YE')}</span>
                                    </div>
                                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                        <p className="text-[10px] text-amber-600 font-black mb-1">بانتظار المراجعة</p>
                                        <p className="text-[9px] text-amber-700/60 leading-tight">يرجى فحص الوثائق بعناية قبل اتخاذ قرار الاعتماد.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem]">
                                <h4 className="text-xs font-black text-slate-900 mb-4 flex items-center gap-2">
                                    <FileText size={16} className="text-emerald-600" /> وثائق الترخيص
                                </h4>
                                {org.license_file ? (
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => viewLicense(org.license_file)}
                                            className="w-full py-3 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-200 shadow-sm"
                                        >
                                            <Eye size={14} /> عرض الملف
                                        </button>
                                        <a 
                                            href={`${API_STORAGE_URL}${org.license_file}`} 
                                            download 
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-black text-slate-900 flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
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
                    <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex gap-3 w-full md:w-auto">
                            <button 
                                onClick={() => handleVerifyAction(org.id, 'approve')}
                                className="flex-1 md:flex-none px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-slate-900 rounded-2xl text-xs font-black shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={18} /> قبول الاعتماد
                            </button>
                            <button 
                                onClick={() => handleVerifyAction(org.id, 'reject')}
                                className="flex-1 md:flex-none px-8 py-4 bg-red-50 hover:bg-red-600 text-red-600 hover:text-slate-900 rounded-2xl text-xs font-black border border-red-100 transition-all flex items-center justify-center gap-2"
                            >
                                <XCircle size={18} /> رفض الطلب
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
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
            className="group bg-white border border-slate-100 rounded-[2.5rem] p-6 hover:border-emerald-500/40 transition-all duration-500 relative overflow-hidden shadow-sm hover:shadow-md"
        >
            <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/5 blur-3xl -ml-12 -mt-12 group-hover:bg-emerald-500/10 transition-all"></div>

            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                        {req.user.profile_image && req.user.profile_image !== 'profiles/default.jpg' ? (
                            <img src={`${API_STORAGE_URL}${req.user.profile_image}`} className="w-full h-full object-cover" />
                        ) : (
                            <Building2 className="text-emerald-600/50" size={28} />
                        )}
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-lg tracking-tight truncate max-w-[150px]">{req.org_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-bold uppercase border border-emerald-100">{req.org_type}</span>
                            <span className="text-[9px] text-slate-400 flex items-center gap-1 font-bold"><MapPin size={10} /> {req.user.location || 'غير محدد'}</span>
                        </div>
                    </div>
                </div>
                <button onClick={() => setSelectedOrg(req)} className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                    <Info size={20} />
                </button>
            </div>

            <div className="bg-slate-50 rounded-3xl p-4 mb-6 border border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${req.license_file ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                            <FileText size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-black">وثيقة الترخيص</p>
                            <p className="text-xs font-bold text-slate-600">{req.license_file ? 'جاهزة للمراجعة' : 'غير مرفقة'}</p>
                        </div>
                    </div>
                    {req.license_file && (
                        <div className="flex gap-1">
                            <button onClick={() => viewLicense(req.license_file)} className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 rounded-lg transition-all shadow-sm"><Eye size={14} /></button>
                            <a href={`${API_STORAGE_URL}${req.license_file}`} download className="p-2 bg-emerald-600 text-slate-900 hover:bg-emerald-500 rounded-lg transition-all shadow-sm"><Download size={14} /></a>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    disabled={!req.license_file}
                    onClick={() => handleVerifyAction(req.id, 'approve')}
                    className="py-3.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-slate-900 disabled:opacity-20 disabled:grayscale rounded-2xl text-[11px] font-black transition-all border border-emerald-100"
                >
                    قبول التوثيق
                </button>
                <button
                    onClick={() => handleVerifyAction(req.id, 'reject')}
                    className="py-3.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-slate-900 rounded-2xl text-[11px] font-black transition-all border border-red-100"
                >
                    رفض الطلب
                </button>
            </div>
        </motion.div>
    );

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-['Tajawal']" dir="rtl">
            <AdminSidebar />

            <main className="flex-1 p-6 lg:p-12 relative overflow-hidden max-h-screen overflow-y-auto custom-scrollbar">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -mr-32 -mt-32"></div>

                <div className="relative z-10">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100 shadow-sm">
                                <ShieldCheck className="text-amber-500" size={28} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black tracking-tight text-slate-900">توثيق المؤسسات</h1>
                                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">إدارة وتدقيق هوية المؤسسات الشريكة</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="px-4 py-2 border-l border-slate-100 text-center">
                                <p className="text-[10px] text-slate-400 font-black">إجمالي الطلبات</p>
                                <p className="text-lg font-black text-emerald-600">{meta.total || 0}</p>
                            </div>
                            <button onClick={fetchRequests} className={`p-3 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all ${loading ? 'animate-spin' : ''}`}>
                                <RefreshCcw size={20} />
                            </button>
                        </div>
                    </header>

                    {/* Search & Filters */}
                    <div className="relative mb-10 group max-w-2xl">
                        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="ابحث باسم المؤسسة، نوع النشاط، أو الموقع..."
                            className="w-full bg-white border border-slate-100 pr-14 pl-6 py-4 rounded-2xl focus:outline-none focus:border-emerald-500/50 transition-all text-sm font-bold text-slate-900 shadow-sm"
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
                                        className="py-32 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-white shadow-sm"
                                    >
                                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle size={40} className="text-emerald-200" />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-400 italic">كل شيء هادئ هنا!</h3>
                                        <p className="text-sm text-slate-400 mt-2 font-bold uppercase tracking-widest">لا توجد طلبات توثيق بانتظار المراجعة حالياً</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    {/* Pagination */}
                    {meta.last_page > 1 && (
                        <footer className="mt-16 flex justify-center items-center gap-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm max-w-fit mx-auto">
                            <button
                                disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-600 hover:text-slate-900 disabled:opacity-20 transition-all border border-slate-100"
                            >
                                <ChevronRight />
                            </button>
                            <div className="flex items-center gap-2 px-4">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">الصفحة</span>
                                <span className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-slate-900 rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20">{page}</span>
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">من {meta.last_page}</span>
                            </div>
                            <button
                                disabled={page === meta.last_page} onClick={() => setPage(p => p + 1)}
                                className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-600 hover:text-slate-900 disabled:opacity-20 transition-all border border-slate-100"
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

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 20px; }
            `}</style>
        </div>
    );
};

const LoadingScreen = () => (
    <div className="h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] rounded-full" />
        <div className="relative">
            <div className="w-32 h-32 border-4 border-emerald-500/10 border-t-emerald-600 rounded-full animate-spin" />
            <div className="absolute inset-4 border-4 border-slate-200 border-b-slate-400 rounded-full animate-spin-slow " />
        </div>
        <div className="mt-12 text-center relative z-10">
            <h2 className="text-2xl font-black text-slate-900 tracking-[0.3em] uppercase">MUSANADA ADMIN</h2>
            <p className="text-xs text-emerald-600 mt-4 font-bold animate-pulse tracking-widest">جاري تحميل لوحة التحكم الذكية...</p>
        </div>
    </div>
);

export default OrganizationVerification;
