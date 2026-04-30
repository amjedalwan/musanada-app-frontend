import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Award, Search, Eye, Trash2, Edit3, ShieldCheck,
    Filter, Clock, CheckCircle2, X, Save, User, Hash,
    Calendar, ChevronDown, MoreHorizontal, ExternalLink,
    FileText, Zap, Users, BarChart3
} from 'lucide-react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import Swal from 'sweetalert2';
import { toast, Toaster } from 'react-hot-toast';
import { WEB_APP_URL } from '../config/constants';
// إعدادات التنبيهات العصرية
const confirmAction = async (title, text, icon = 'warning') => {
    return await Swal.fire({
        title,
        text,
        icon,
        background: '#0d0d12',
        color: '#f3f4f6',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#1f2937',
        confirmButtonText: 'نعم، استمر',
        cancelButtonText: 'إلغاء',
        customClass: {
            popup: 'rounded-[2rem] border border-slate-200 shadow-2xl font-["Cairo"]',
            confirmButton: 'px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20',
            cancelButton: 'px-6 py-3 rounded-xl text-sm font-bold'
        },
    });
};

const ManageCertificates = () => {
    const [eligible, setEligible] = useState([]);
    const [issued, setIssued] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [tab, setTab] = useState("all"); // تم التغيير من issued إلى all // issued, eligible, all
    const [selectedOpportunity, setSelectedOpportunity] = useState("all");


    // جلب البيانات من السيرفر
    // داخل ManageCertificates
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            // طلب البيانات مباشرة دون الحاجة لعمل حلقات (loops) إضافية
            const [resEligible, resIssued] = await Promise.all([
                api.get('/org/certificates/eligible'),
                api.get('/org/certificates/issued')
            ]);

            // البيانات الآن تحتوي على حقل approved_hours تلقائياً
            setEligible(resEligible.data);
            setIssued(resIssued.data);
        } catch (err) {
            toast.error('فشل في مزامنة البيانات');
            console.log(err);
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => { fetchData(); }, [fetchData]);

    // استخراج قائمة الفرص للفلترة
    const opportunitiesList = useMemo(() => {
        const all = [...eligible, ...issued];
        const uniqueOpps = Array.from(new Set(all.map(item => item.opportunity?.id)))
            .map(id => all.find(a => a.opportunity?.id === id)?.opportunity);
        return uniqueOpps.filter(Boolean);
    }, [eligible, issued]);

    const handleDelete = async (certificateId) => {
        // عرض رسالة تأكيد احترافية باستخدام Swal الذي تستخدمه في مشروعك
        const result = await confirmAction(
            'حذف الشهادة',
            'هل أنت متأكد من حذف هذه الشهادة؟ سيعود المتطوع لقائمة المؤهلين.',
            'warning'
        );

        if (result.isConfirmed) {
            try {
                toast.loading('جاري حذف الشهادة...', { id: 'delete' });

                // إرسال طلب الحذف للسيرفر
                await api.delete(`/org/certificates/${certificateId}`);

                toast.success('تم حذف الشهادة بنجاح 🛡️', { id: 'delete' });

                // تحديث البيانات لجلب القوائم المحدثة (المصدرة والمؤهلين)
                fetchData();
            } catch (err) {
                toast.error('فشل في عملية الحذف', { id: 'delete' });
                console.log(err);
            }
        }
    };

    const handleIssue = async (item) => {
        // التأكد من استخراج المعرفات بشكل صحيح سواء كان الكائن شهادة أو طلب تقديم
        const uId = item.user_id;
        const oId = item.opportunity_id;

        if (!uId || !oId) {
            toast.error('بيانات المعرفات غير موجودة');
            return;
        }

        const result = await confirmAction('إصدار شهادة رسمية', `سيتم إصدار شهادة لـ ${item.user?.full_name}. هل أنت متأكد؟`, 'question');

        if (result.isConfirmed) {
            try {
                toast.loading('جاري توليد الشهادة الرقمية...', { id: 'issue' });
                // إرسال المعرفات الصافية للسيرفر
                await api.post('/org/certificates/issue', {
                    user_id: uId,
                    opportunity_id: oId
                });
                toast.success('تم إصدار الشهادة وإرسالها للمتطوع 🎓', { id: 'issue' });
                fetchData();
            } catch (err) {
                const msg = err.response?.data?.message || 'فشل الإصدار';
                toast.error(msg, { id: 'issue' });
            }
        }
    };

    // الفلترة المتقدمة
    const filteredData = useMemo(() => {
        let base = tab === "issued" ? issued : tab === "eligible" ? eligible : [...issued, ...eligible];

        return base.filter(item => {
            const fullName = item.user?.full_name || "";
            const oppTitle = item.opportunity?.title || "";

            const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                oppTitle.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesOpp = selectedOpportunity === "all" ||
                item.opportunity?.id === parseInt(selectedOpportunity);

            return matchesSearch && matchesOpp;
        });
    }, [tab, issued, eligible, searchTerm, selectedOpportunity]);
    return (
        <div className="flex min-h-screen bg-slate-50 text-gray-100 font-['Cairo'] selection:bg-emerald-500/30" dir="rtl">
            <Toaster position="top-center" reverseOrder={false} />
            <Sidebar role="organization" />
            {loading ? (
                <LoadingSpinner />
            ) : (
                <main className="flex-1 p-4 lg:p-12 max-w-[1600px] mx-auto w-full transition-all duration-500">

                    {/* Header Section */}
                    <header className="relative mb-12">
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-600/10 blur-[120px] rounded-full" />
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

                                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">
                                    إدارة <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-fuchsia-300 to-indigo-400">الشهادات المعتمدة</span>
                                </h1>
                                <p className="text-slate-500 max-w-xl text-lg leading-relaxed">
                                    لوحة تحكم متقدمة لإدارة وثائق المتطوعين، تتيح لك المراجعة، التعديل، والإصدار الفوري للشهادات الرقمية الموثقة.
                                </p>
                            </motion.div>

                            <div className="flex gap-4">
                                <StatCard icon={<Award />} label="إجمالي المصدرة" count={issued.length} color="text-emerald-600" />
                                <StatCard icon={<Clock />} label="بانتظار المراجعة" count={eligible.length} color="text-amber-400" />
                            </div>
                        </div>
                    </header>

                    {/* Filters & Tools Bar */}
                    <section className="sticky top-4 z-40 mb-10 p-2 sm:p-3 bg-slate-50 backdrop-blur-xl border border-slate-100 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl">
                        {/* الحاوية الرئيسية: عمودية في الجوال، أفقية في الشاشات الكبيرة */}
                        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">

                            {/* مجموعة البحث والفلترة - تتوسع لتملأ المساحة */}
                            <div className="grid grid-cols-1 sm:flex md:flex-row gap-3 w-full flex-grow">

                                {/* حقل البحث */}
                                <div className="relative group w-full ">
                                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="ابحث بالاسم..."
                                        className="w-full bg-white border border-slate-100 rounded-2xl py-3 pr-11 pl-4 focus:border-purple-500/50 outline-none transition-all placeholder:text-slate-400 text-sm text-slate-900"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                {/* فلتر الفرص */}
                                <div className="relative group w-full ">
                                    <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={16} />
                                    <select
                                        className="w-full bg-white border border-slate-100 rounded-2xl py-3 pr-11 pl-10 
               focus:border-purple-500/50 outline-none transition-all text-sm 
               appearance-none cursor-pointer text-slate-600
               [&::-ms-expand]:hidden" // لإخفاء السهم في متصفح Edge القديم
                                        value={selectedOpportunity}
                                        onChange={(e) => setSelectedOpportunity(e.target.value)}
                                    >
                                        <option className="bg-white text-slate-900" value="all">كل الفرص</option>
                                        {opportunitiesList.map(opp => (
                                            <option className="bg-white text-slate-900" key={opp.id} value={opp.id}>{opp.title}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                </div>
                            </div>

                            {/* التبويبات - تصطف في المنتصف في الجوال وعلى اليسار في الكاشات الكبيرة */}
                            <div className=" w-auto flex justify-center lg:justify-end overflow-x-auto no-scrollbar min-w-[340px]">
                                <div className="flex p-1 bg-white rounded-2xl border border-slate-100 min-w-max">
                                    {[
                                        { id: 'all', label: 'الكل', icon: <BarChart3 size={14} /> },
                                        { id: 'issued', label: 'المصدرة', icon: <CheckCircle2 size={14} /> },
                                        { id: 'eligible', label: 'المؤهلون', icon: <Zap size={14} /> }
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setTab(t.id)}
                                            className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${tab === t.id
                                                ? 'bg-gradient-to-r from-emerald-600 to-slate-500 text-slate-900 shadow-lg shadow-purple-600/20'
                                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            {t.icon} <span>{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </section>

                    {/* Cards Grid */}
                    {loading ? (
                        <LoadingGrid />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                            <AnimatePresence mode='popLayout'>
                                {filteredData.map((item, index) => (
                                    // البحث عن السطر الذي يستدعي CertificateCard وتعديله كالتالي:
                                    <CertificateCard
                                        key={item.id || `${item.user_id}-${item.opportunity_id}`}
                                        data={item}
                                        isIssued={!!item.certificate_code}
                                        index={index}
                                        onDelete={handleDelete} // مررنا دالة الحذف هنا
                                        onIssue={() => handleIssue(item)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredData.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="bg-slate-50 p-8 rounded-full mb-6">
                                <Search size={48} className="text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-500">لا توجد نتائج تطابق بحثك</h3>
                            <p className="text-slate-400 mt-2">جرب تغيير الفلتر أو البحث عن اسم آخر</p>
                        </motion.div>
                    )}
                </main>)}


        </div>
    );
};

// --- المكونات الفرعية (Sub-components) ---

const StatCard = ({ icon, label, count, color }) => (
    <div className="bg-slate-50 border border-slate-100 px-6 py-4 rounded-3xl flex items-center gap-4 min-w-[180px]">
        <div className={`p-3 rounded-2xl bg-slate-50 ${color}`}>{icon}</div>
        <div>
            <p className="text-xs text-slate-400 font-bold mb-1">{label}</p>
            <p className="text-2xl font-black text-slate-900">{count}</p>
        </div>
    </div>
);
const WEB_URL = WEB_APP_URL;
const CertificateCard = ({ data, isIssued, index, onDelete, onIssue }) => {
    const API_URL = import.meta.env.VITE_API_URL;
    const handleView = () => {
        if (data.certificate_code) {
            // خيار 1: الذهاب لصفحة عرض الشهادة العامة (باستخدام الكود)
            // window.location.href = `/verify/${data.certificate_code}`;

            // خيار 2: فتح رابط الـ PDF المباشر من السيرفر
            const pdfUrl = `${WEB_URL}/global-certificate-manager/${data.certificate_code}`;

            window.open(pdfUrl, '_blank');
        } else {
            toast.error('رابط الشهادة غير متاح حالياً');
        }
    };
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_URL}/storage/${path}`; // استبدل المنفذ بمنفذ السيرفر الخاص بك
    };
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05 }}
            className={`group relative p-6 rounded-[2.5rem] border transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${isIssued ? 'bg-[#fff] shadow-xl border-slate-100 hover:border-emerald-200' : 'bg-[#12110c] border-amber-500/10 hover:border-amber-500/30'}`}
        >

            <div className="flex justify-between items-start mb-8">
                <div className="relative w-20 h-20"> {/* تحديد حجم ثابت للحاوية */}
                    <div className={`w-full h-full rounded-2xl overflow-hidden border-2 ${isIssued ? 'border-emerald-200' : 'border-amber-500/20'}`}>
                        {data.user?.profile_image ? (
                            <img
                                src={getImageUrl(data.user.profile_image)}
                                className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                                alt={data.user.full_name}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white">
                                <User size={30} className="text-slate-400" />
                            </div>
                        )}
                    </div>
                    {/* شارة الحالة الصغيرة */}
                    <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-lg border shadow-lg ${isIssued ? 'bg-emerald-600 border-purple-400 text-slate-900' : 'bg-amber-600 border-amber-400 text-slate-900'}`}>
                        {isIssued ? <ShieldCheck size={12} /> : <Clock size={12} />}
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* استبدال زر التعديل بزر الحذف */}
                    {isIssued && (
                        <button
                            onClick={() => onDelete(data.id)}
                            className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all"
                            title="حذف الشهادة"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>
            <div className="mb-8">
                <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{data.user?.full_name || "متطوع مسند"}</h3>
                <div className="space-y-2">
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                        <Award size={14} className="text-emerald-600" /> {data.opportunity?.title}
                    </p>

                    <p className="text-slate-400 text-xs flex items-center gap-2">
                        <Clock size={14} className="text-amber-500" />
                        {data.approved_hours || 0} ساعة تطوعية معتمدة
                    </p>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                {isIssued ? (
                    <>
                        <button
                            onClick={handleView}
                            className="w-full bg-slate-500 cursor-pointer hover:scale-102  bg-emerald-600 py-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 group-hover:bg-emerald-600 group-hover:text-slate-900"
                        >
                            <Eye size={16} /> معاينة الوثيقة (PDF)
                        </button>

                        {/* رابط "عرض التفاصيل" إذا كنت تفضل الانتقال لصفحة أخرى */}
                        <a
                            href={`/certificate/view/${data.certificate_code}`}
                            className="text-[10px] text-center text-slate-400 hover:text-emerald-600 font-mono tracking-tighter uppercase transition-colors"
                        >
                            CODE: {data.certificate_code}
                        </a>
                    </>
                ) : (
                    <button
                        onClick={onIssue}
                        className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 py-4 rounded-2xl text-xs font-black transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 size={16} /> اعتماد وإصدار الآن
                    </button>
                )}
            </div>
        </motion.div>);
}



const EditModal = ({ isOpen, onClose, data, setData, onSave }) => {
    if (!isOpen || !data) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md font-['Cairo']">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-[#0d0d12] border border-slate-200 w-full max-w-xl rounded-[3rem] overflow-hidden shadow-3xl"
            >
                <div className="p-10">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
                                <Edit3 size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">تعديل بيانات السجل</h2>
                                <p className="text-slate-400 text-xs mt-1">سيتم تحديث البيانات في قاعدة البيانات والشهادة</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {/* Name Field */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-500 mr-2 flex items-center gap-2">
                                <User size={16} className="text-emerald-600" /> الاسم بالكامل (في الشهادة)
                            </label>
                            <input
                                type="text"
                                value={data.tempName}
                                onChange={(e) => setData({ ...data, tempName: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] py-5 px-6 focus:border-purple-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                                placeholder="أدخل اسم المتطوع الثلاثي..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Hours Field */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-500 mr-2 flex items-center gap-2">
                                    <Hash size={16} className="text-amber-400" /> عدد الساعات
                                </label>
                                <input
                                    type="number"
                                    value={data.tempHours}
                                    onChange={(e) => setData({ ...data, tempHours: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] py-5 px-6 focus:border-purple-500 outline-none transition-all text-slate-900"
                                />
                            </div>

                            {/* Date Field */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-slate-500 mr-2 flex items-center gap-2">
                                    <Calendar size={16} className="text-emerald-600" /> تاريخ الإصدار
                                </label>
                                <input
                                    type="date"
                                    value={data.tempDate}
                                    onChange={(e) => setData({ ...data, tempDate: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] py-5 px-6 focus:border-purple-500 outline-none transition-all text-slate-900"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-12">
                        <button
                            onClick={onSave}
                            className="flex-[2] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-5 rounded-[1.8rem] font-black flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/10 text-slate-900 transition-all active:scale-95"
                        >
                            <Save size={20} /> حفظ التغييرات النهائية
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 bg-slate-50 hover:bg-slate-50 py-5 rounded-[1.8rem] font-bold text-slate-600 transition-all"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const LoadingGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-slate-50 border border-slate-100 rounded-[2.5rem] animate-pulse" />
        ))}
    </div>
);
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
export default ManageCertificates;