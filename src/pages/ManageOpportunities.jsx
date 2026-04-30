import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Calendar, Users, MapPin,
    RefreshCcw, Trash2, Settings2, ExternalLink, Briefcase, Clock, CheckCircle, AlertTriangle, ChevronLeft
} from 'lucide-react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import Swal from 'sweetalert2';
import { toast, Toaster } from 'react-hot-toast';


const lightSwal = Swal.mixin({
    background: '#ffffff',
    color: '#1e293b',
    confirmButtonColor: '#059669',
    cancelButtonColor: '#f1f5f9',
    customClass: {
        popup: 'rounded-[1.5rem] border border-slate-100 shadow-2xl font-["Cairo"]',
        title: 'text-lg md:text-xl font-black pt-4 text-slate-900',
        htmlContainer: 'text-xs md:text-sm text-slate-500',
        confirmButton: 'px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20 text-slate-900',
        cancelButton: 'px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95 text-slate-600'
    },
    buttonsStyling: true,
});

const ManageOpportunities = () => {
    const navigate = useNavigate();
    const [opps, setOpps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchMyOpps = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/org/my-opportunities');
            const dataToSet = res.data.data || res.data;
            setOpps(dataToSet);
        } catch (err) {
            console.error(err);
            toast.error('فشل في تحميل البيانات', { style: { fontSize: '12px' } });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyOpps();
    }, [fetchMyOpps]);

    const handleChangeStatus = async (id, currentStatus, newStatus) => {
        if (currentStatus === newStatus) return;
        const statusNames = { 'open': 'نشطة', 'closed': 'مغلقة', 'completed': 'مكتملة' };

        const result = await lightSwal.fire({
            title: 'تغيير الحالة؟',
            text: `سيتم تحويل الفرصة إلى حالة: ${statusNames[newStatus]}`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'تحديث الآن',
            cancelButtonText: 'تراجع',
            cancelButtonColor: '#3b82f6',
        });

        if (result.isConfirmed) {
            try {
                toast.loading('جاري التحديث...', { id: 'status-load', style: { fontSize: '12px' } });
                await api.patch(`/opportunities/${id}/status`, { status: newStatus });
                setOpps(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
                toast.success('تم التحديث بنجاح', { id: 'status-load' });
            } catch (err) {
                console.log(err)
                toast.error('فشل التحديث', { id: 'status-load' });
            }
        }
    };

    const handleConfirmCompletion = async (id) => {
        const result = await lightSwal.fire({
            title: 'اعتماد الإكمال؟',
            text: "سيتم إرسال إشعارات للمتطوعين وتوثيق الساعات. هذا الإجراء نهائي.",
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'تأكيد الإغلاق والتوثيق',
            cancelButtonText: 'تراجع',
            confirmButtonColor: '#71873a',
             cancelButtonColor: '#3b82f6',
        });

        if (result.isConfirmed) {
            try {
                toast.loading('جاري المعالجة...', { id: 'comp-load', style: { fontSize: '12px' } });
                await api.patch(`/opportunities/${id}/status`, { status: 'completed' });
                setOpps(prev => prev.map(o => o.id === id ? { ...o, status: 'completed' } : o));
                toast.success('تم إكمال الفرصة وتوثيقها', { id: 'comp-load' });
            } catch (err) {
                toast.error('حدث خطأ أثناء المعالجة', { id: 'comp-load' });
            }
        }
    };
    const handleExtendDeadline = async (id, currentDeadline) => {
        const formattedDate = currentDeadline ? currentDeadline.split('T')[0] : '';

        const { value: newDate } = await darkSwal.fire({
            title: 'تمديد المهلة',
            html: `
            <div class="text-right mb-2 text-slate-400 text-xs">التاريخ الحالي: ${formattedDate || 'غير محدد'}</div>
            <input type="date" id="swal-input1" 
                   value="${formattedDate}" 
                   class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none mt-2">
        `,
            showCancelButton: true,
            confirmButtonText: 'تحديث التاريخ',
            cancelButtonText: 'تراجع',
            cancelButtonColor: '#3b82f6',
            preConfirm: () => {
                const date = document.getElementById('swal-input1').value;
                if (!date) Swal.showValidationMessage('يرجى اختيار تاريخ');
                return date;
            }
        });

        if (newDate) {
            try {
                toast.loading('جاري التحديث...', { id: 'ext-load', style: { fontSize: '12px' } });

                await api.post(`/org/opportunities/${id}`, {
                    deadline: newDate,

                }, {
                    headers: {
                        'Accept': 'application/json', // يمنع الـ Redirect ويظهر أخطاء الـ Validation
                        'Content-Type': 'application/json'
                    }
                });

                setOpps(prev => prev.map(o => o.id === id ? { ...o, deadline: newDate } : o));
                toast.success('تم التمديد بنجاح', { id: 'ext-load' });
            } catch (err) {
                console.log(err)
                toast.error('فشل التمديد', { id: 'ext-load' });
            }
        }
    };
    const handleDelete = async (id, title) => {
        const result = await lightSwal.fire({
            title: 'حذف الفرصة؟',
            text: `هل أنت متأكد من حذف "${title}"؟ لا يمكن التراجع.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'حذف نهائي',
            cancelButtonText: 'تراجع',
            cancelButtonColor: '#3b82f6',
            confirmButtonColor: '#770a0a',
        });
        if (result.isConfirmed) {
            try {
                toast.loading('جاري الحذف...', { id: 'del-load', style: { fontSize: '12px' } });
                await api.delete(`/org/opportunities/${id}`);
                setOpps(prev => prev.filter(o => o.id !== id));
                toast.success('تم الحذف بنجاح', { id: 'del-load' });
            } catch (err) {
                console.log(err)
                toast.error('فشل الحذف', { id: 'del-load' });
            }
        }
    };

    const filteredOpps = useMemo(() => {
        return opps.filter(opp => {
            const matchesSearch = (opp.title || "").toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "all" || opp.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [opps, searchTerm, statusFilter]);

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-['Cairo'] selection:bg-emerald-500/30" dir="rtl">
            <Toaster position="bottom-center" />
            <Sidebar role="organization" />

            {loading ? (
                <LoadingSpinner />
            ) : (

                <main className="flex-1 p-4 sm:p-6 lg:p-10 xl:p-16 max-w-[1600px] mx-auto w-full overflow-x-hidden">
                    {/* Header Section */}
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-l from-slate-900 to-slate-500 bg-clip-text text-transparent">
                                إدارة الفرص
                            </h1>
                            <p className="text-slate-400 mt-1 text-xs md:text-sm">تحكم كامل في مبادراتك التطوعية من مكان واحد</p>
                        </motion.div>

                        <button
                            onClick={() => navigate('/create-opportunity')}
                            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-sm shadow-xl shadow-emerald-500/20 text-slate-900 active:scale-95"
                        >
                            <Plus size={18} />
                            إضافة فرصة جديدة
                        </button>
                    </header>

                    {/* Filters Section */}
                    <div className="flex flex-col xl:flex-row gap-4 mb-8">
                        <div className="relative flex-1 group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="ابحث عن عنوان الفرصة..."
                                className="w-full bg-white border border-slate-200 rounded-xl py-3 pr-11 pl-4 focus:outline-none focus:border-emerald-500/30 transition-all placeholder:text-slate-600 text-xs md:text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex overflow-x-auto pb-2 xl:pb-0 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 no-scrollbar">
                            {['all', 'open', 'closed', 'completed'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setStatusFilter(s)}
                                    className={`whitespace-nowrap px-4 md:px-6 py-2 rounded-lg text-[11px] md:text-xs font-bold transition-all ${statusFilter === s ? 'bg-emerald-600 text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-600'
                                        }`}
                                >
                                    {s === 'all' ? 'الكل' : s === 'open' ? 'نشطة' : s === 'closed' ? 'مغلقة' : 'مكتملة'}
                                </button>
                            ))}
                        </div>
                    </div>


                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-6">
                        <AnimatePresence mode='popLayout'>
                            {filteredOpps.length > 0 ? (
                                filteredOpps.map((opp, index) => (
                                    <OpportunityCard
                                        key={opp.id}
                                        opp={opp}
                                        index={index}
                                        onChangeStatus={handleChangeStatus}
                                        onConfirmCompletion={handleConfirmCompletion}
                                        onExtendDeadline={handleExtendDeadline}
                                        onDelete={() => handleDelete(opp.id, opp.title)}
                                        onEdit={(id) => navigate(`/edit-opportunity/${id}`)}
                                        onDetails={(id) => navigate(`/opportunity-applicants/${id}`)}
                                    />
                                ))
                            ) : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                        <Search size={24} className="text-slate-600" />
                                    </div>
                                    <h3 className="text-slate-400 font-bold text-sm">لا توجد أي فرص تطوعية حالياً</h3>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </main>)}
        </div>
    );
};

const OpportunityCard = ({ opp, index, onChangeStatus, onExtendDeadline, onDelete, onEdit, onDetails }) => {
    const [imageError, setImageError] = useState(false);
    const imageUrl = opp.cover_image || null;
    //  const progress = Math.min(((opp.accepted_count || 0) / (opp.required_volunteers || 1)) * 100, 100);

    const daysRemaining = useMemo(() => {
        if (!opp.deadline) return null;
        const diff = new Date(opp.deadline) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [opp.deadline]);

    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0;
    const isExpired = daysRemaining !== null && daysRemaining <= 0;
    const isCompleted = opp.status === 'completed';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            className={`group flex flex-col h-full rounded-[1.5rem] border relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${isCompleted ? 'bg-emerald-50 border-emerald-500/20' :
                isExpired ? 'bg-red-50 border-red-500/20' :
                    'bg-white border-slate-100 hover:border-emerald-500/30'
                }`}
        >
            {/* Image Section */}
            <div className="relative h-[400px] sm:h-[400px] w-full overflow-hidden bg-slate-100 ">
                {imageUrl && !imageError ? (
                    <img src={imageUrl} alt={opp.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 scale-105 group-hover:scale-100" onError={() => setImageError(true)} />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-transparent">
                        <Briefcase size={32} className="text-emerald-600/10" />
                    </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-3 right-3 left-3 flex justify-between items-start pointer-events-none">
                    <div className={`px-3 py-1 rounded-lg text-[9px] font-black backdrop-blur-md border shadow-xl ${opp.status === 'open' ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' :
                        isCompleted ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                            'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>

                        {isCompleted ? 'مكتملة' : opp.status === 'open' ? 'نشطة' : 'مغلقة'}
                    </div>

                    {daysRemaining !== null && !isCompleted && (
                        <div className={`px-2.5 py-1 rounded-lg text-[9px] font-bold backdrop-blur-md border ${isExpired ? 'bg-red-600 text-slate-900 border-slate-300' : 'bg-white/60 text-slate-700 border-slate-200'
                            }`}>
                            {isExpired ? 'منتهي' : `متبقي ${daysRemaining} يوم`}
                        </div>
                    )}
                </div>
                {/* Status Alert - تحسين التباين */}
                {(isExpired || isExpiringSoon) && !isCompleted && (
                    <div className={`mb-4 left-0 z-2 right-0 top-[40%] absolute p-3 rounded-[0] border backdrop-blur-[5px] flex items-center gap-3 transition-all ${isExpired
                        ? 'bg-red-500/20 border-red-500/30 text-red-900'
                        : 'bg-amber-500/20 border-amber-500/30 text-amber-900'
                        }`}>
                        <AlertTriangle className={isExpired ? 'text-red-600' : 'text-amber-600'} size={16} />
                        <span className="text-[10px] font-bold flex-1">
                            {isExpired ? 'انتهى الوقت!' : 'قرب الانتهاء!'}
                        </span>
                        <button on
                            onClick={() => onExtendDeadline(opp.id, opp.deadline)} className="text-[9px] font-black underline hover:text-slate-900 transition-opacity cursor-pointer ">تمديد</button>
                    </div>
                )}

            </div>

            {/* Content Section */}
            <div className="absolute p-5 flex flex-col flex-1 bottom-0 left-0 w-full backdrop-blur-[4px] bg-white/80 border-t border-slate-100 shadow-2xl">
                <div className="mb-4">
                    <h3 className="text-base sm:text-lg font-black mb-2 line-clamp-1 text-slate-900 group-hover:text-emerald-600 transition-colors drop-shadow-sm">
                        {opp.title}
                    </h3>

                    <div className="flex items-center gap-4 text-slate-400 text-[10px] md:text-xs font-medium">
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                            <Clock size={14} className="text-emerald-600" />
                            {opp.total_logged_hours || 0} ساعة موثقة
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                            <MapPin size={14} className="text-red-500" />
                            {opp.location}
                        </span>
                    </div>
                </div>



                {/* Progress Bar & Stats Section */}
                <div className="space-y-3 mb-6 mt-auto">
                    <div className="flex flex-col gap-2">
                        {/* إحصائيات الفريق والمنجزين */}
                        <div className="flex justify-between text-[10px] font-black">
                            <div className="flex gap-3">
                                {/* دمج المقبولين مع المكتملين ليعبر عن إجمالي من تم استقطابهم */}
                                <span className="text-slate-400 uppercase tracking-wider">الفريق:
                                    <span className="text-emerald-600 mr-1">
                                        {(opp.accepted_count || 0) + (opp.completed_count || 0)}
                                    </span>
                                </span>

                                {/* إظهار "أتموا العمل" فقط عندما تكون الحالة مكتملة */}
                                {isCompleted && (
                                    <span className="text-slate-400 uppercase tracking-wider animate-in fade-in duration-500">أتموا العمل:
                                        <span className="text-teal-600 mr-1">{opp.completed_count || 0}</span>
                                    </span>
                                )}
                            </div>
                            <span className={isCompleted ? 'text-teal-600' : 'text-emerald-600'}>
                                الهدف: {opp.required_volunteers}
                            </span>
                        </div>

                        {/* شريط التقدم المحسن */}
                        <div className="h-2 bg-slate-100 rounded-full p-[1px] border border-slate-200 relative overflow-hidden">
                            {/* نسبة المكتملين (تظهر فوق شريط المقبولين) */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(((opp.completed_count || 0) / (opp.required_volunteers || 1)) * 100, 100)}%` }}
                                className="absolute h-full bg-teal-500 z-20 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.4)]"
                            />

                            {/* نسبة إجمالي الفريق (المقبولين + المكتملين) */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${Math.min((((opp.accepted_count || 0) + (opp.completed_count || 0)) / (opp.required_volunteers || 1)) * 100, 100)}%`
                                }}
                                className={`absolute h-full rounded-full z-10 ${isCompleted ? 'bg-emerald-500/40' : 'bg-emerald-500'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <div className="flex gap-1.5">
                        {!isCompleted ? (
                            <>
                                <div className="relative group">
                                    <select
                                        value={opp.status}
                                        onChange={(e) => onChangeStatus(opp.id, opp.status, e.target.value)}
                                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 appearance-none py-1.5 px-3 pr-6 rounded-lg text-[10px] font-bold text-slate-900 cursor-pointer focus:outline-none transition-all"
                                    >
                                        <option className="bg-white text-slate-900" value="open">نشطة</option>
                                        <option className="bg-white text-slate-900" value="closed">مغلقة</option>
                                    </select>
                                </div>
                                <button onClick={() => onEdit(opp.id)} className="p-2 bg-slate-50 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-600 rounded-lg border border-slate-200 transition-all">
                                    <Settings2 size={14} />
                                </button>
                                <button onClick={onDelete} className="p-2 bg-slate-50 hover:bg-red-500/10 text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </>
                        ) : (
                            <div className="text-[10px] font-black text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                <CheckCircle size={14} /> تم التوثيق
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex gap-2">
                        <button
                            onClick={() => onDetails(opp.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black transition-all border shadow-lg ${isCompleted
                                ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                : 'bg-emerald-600 border-emerald-500/50 text-slate-900 hover:bg-emerald-500 shadow-emerald-500/20'
                                }`}
                        >
                            {isCompleted ? 'السجلات' : 'إدارة المتقدمين'}
                            <ExternalLink size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
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
export default ManageOpportunities;