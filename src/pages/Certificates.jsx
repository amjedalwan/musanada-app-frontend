import React, { useState, useEffect } from 'react';
import {
    Award, Download, Search, Filter, Calendar,
    ShieldCheck, Eye, Star, Loader2, Info,
    Clock, Building2, Share2, Printer,
    QrCode, Hexagon, Sparkles, Trophy,
    CheckCircle2, Globe, ArrowUpRight
} from 'lucide-react';
import api from '../api/axios';
import { toast, Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { WEB_APP_URL } from '../config/constants';
const MySwal = withReactContent(Swal);

const Certificates = () => {
    const [rawResponse, setRawResponse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [selectedCertificate, setSelectedCertificate] = useState(null);

    useEffect(() => {
        const fetchMyCertificates = async () => {
            try {
                const response = await api.get('/student/certificates');
                setRawResponse(response.data);
            } catch (error) {
                console.error('خطأ في جلب الشهادات:', error);
                toast.error('فشل في تحميل سجل الشهادات');
            } finally {
                setLoading(false);
            }
        };
        fetchMyCertificates();
    }, []);

    const logs = rawResponse?.data || [];

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.opportunity?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.certificate_code.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterType === 'all' || log.opportunity?.type === filterType;
        return matchesSearch && matchesFilter;
    });

    const stats = [
        { label: 'الشهادات المكتسبة', value: logs.length, icon: Trophy, color: 'from-amber-400 to-orange-600', shadow: 'shadow-amber-500/20' },
        { label: 'ساعات التطوع المعتمدة', value: rawResponse?.total_logged_hours || 0, icon: Clock, color: 'from-blue-400 to-indigo-600', shadow: 'shadow-blue-500/20' },
        { label: 'رصيد الموثوقية', value: `${(logs.length * 15).toLocaleString()}`, icon: ShieldCheck, color: 'from-emerald-400 to-teal-600', shadow: 'shadow-emerald-500/20' },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-['Cairo'] overflow-hidden selection:bg-emerald-500/40" dir="rtl">
            <Toaster position="top-center" reverseOrder={false} />
            <Sidebar role="student" />
  {/* Grid Container */}
                {loading ? (
                    <LoadingSpinner />
                ) : (
            <main className="flex-1 h-screen overflow-y-auto custom-scrollbar relative">
                {/* خلفية فنية متطورة */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px]"></div>
                    <div className="absolute top-[20%] left-[10%] w-[2px] h-[60%] bg-gradient-to-b from-transparent via-purple-500/10 to-transparent"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 relative z-10">
                    {/* رأس الصفحة */}
                    <header className="mb-12">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-200 rounded-full text-emerald-600 text-xs font-bold tracking-widest uppercase">
                                        المحفظة الرقمية
                                    </span>
                                    <div className="h-[1px] w-12 bg-emerald-500/30"></div>
                                </div>
                                <h1 className="text-5xl font-black tracking-tight mb-4">
                                    سجل <span className="bg-gradient-to-r from-emerald-600 via-blue-400 to-indigo-400 bg-clip-text text-transparent">الشهادات الموثقة</span>
                                </h1>
                                <p className="text-slate-500 max-w-xl leading-relaxed">
                                    استعرض وحمل شهاداتك المعتمدة الصادرة عن المؤسسات الشريكة. كل شهادة مزودة برمز استجابة سريع (QR) للتحقق من صحتها عالمياً.
                                </p>
                            </div>

                           
                        </motion.div>

                        {/* بطاقات الإحصائيات */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                            {stats.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`relative group bg-slate-50 border border-slate-200 p-8 rounded-[2.5rem] overflow-hidden backdrop-blur-2xl hover:bg-slate-50 transition-all duration-500 ${stat.shadow}`}
                                >
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-[0.03] rounded-bl-[5rem] group-hover:opacity-[0.08] transition-opacity`}></div>
                                    <div className="flex items-center justify-between relative z-10">
                                        <div>
                                            <p className="text-slate-500 text-sm font-medium mb-2">{stat.label}</p>
                                            <div className="flex items-baseline gap-2">
                                                <h3 className="text-4xl font-black tracking-tighter">{stat.value}</h3>
                                                {i === 0 && <span className="text-xs text-emerald-600 font-bold">وثيقة</span>}
                                            </div>
                                        </div>
                                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                                            <stat.icon size={26} className="text-slate-900" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </header>

                    {/* قسم التحكم والفلترة */}
                    <div className="sticky top-4 z-40 mb-10">
                        <div className="bg-slate-50 border border-slate-200 backdrop-blur-3xl p-3 rounded-[2rem] shadow-2xl flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1 group">
                                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="ابحث برقم الشهادة، اسم المؤسسة أو عنوان الفرصة..."
                                    className="w-full bg-white border border-slate-100 pr-14 pl-6 py-4 rounded-2xl outline-none focus:border-purple-500/40 focus:ring-4 focus:ring-purple-500/5 transition-all text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                                    <select
                                        className="bg-white border border-slate-100 pr-12 pl-8 py-4 rounded-2xl outline-none focus:border-purple-500/40 appearance-none text-sm cursor-pointer hover:bg-black/60 transition-colors min-w-[180px]"
                                        onChange={(e) => setFilterType(e.target.value)}
                                    >
                                        <option className="bg-white text-slate-900" value="all">جميع الأنواع</option>
                                        <option className="bg-white text-slate-900" value="voluntary">تطوعي</option>
                                        <option className="bg-white text-slate-900" value="training">تدريبي</option>
                                    </select>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* عرض الشهادات */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40">
                            <div className="relative">
                                <Loader2 className="animate-spin text-emerald-600 relative z-10" size={60} />
                                <div className="absolute inset-0 blur-2xl bg-emerald-500/20 animate-pulse"></div>
                            </div>
                            <p className="mt-6 text-slate-500 font-medium animate-pulse tracking-widest">جاري استرجاع الوثائق الرسمية...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-32 bg-white border-2 border-dashed border-slate-100 rounded-[4rem]"
                        >
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-200">
                                <Info className="text-slate-400" size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-600 mb-2">لا يوجد سجلات متوفرة</h3>
                            <p className="text-slate-400">لم يتم العثور على أي شهادات تطابق معايير البحث الحالية.</p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <AnimatePresence>
                                {filteredLogs.map((log, index) => (
                                    <CertificateGlassCard
                                        key={log.id}
                                        log={log}
                                        index={index}
                                        onClick={() => setSelectedCertificate(log)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* تذييل الصفحة */}
                <footer className="max-w-7xl mx-auto px-12 py-10 border-t border-slate-100 mt-20 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-sm">
                    <p>© 2026 منصة مساندة - جميع الشهادات الصادرة موثقة رقمياً عبر سجلاتنا المركزية.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-emerald-600 transition-colors">سياسة التوثيق</a>
                        <a href="#" className="hover:text-emerald-600 transition-colors">التحقق من شهادة</a>
                    </div>
                </footer>
            </main>)}
        </div>
    );
};
const WEB_URL = WEB_APP_URL;

/**
 * مكون كرت الشهادة بتصميم زجاجي (Glassmorphism)
 */
const CertificateGlassCard = ({ log, index, onClick }) => {
    const shareUrl = `${window.location.origin}/global-certificate-manager/${log.certificate_code}`;
    const handleView = (code) => {
        if (code) {

            const pdfUrl = `${WEB_URL}/global-certificate-manager/${code}`;
            window.open(pdfUrl, '_blank');
        } else {
            toast.error('رابط الشهادة غير متاح حالياً');
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `شهادة إنجاز: ${log.opportunity?.title}`,
                    text: `تحقق من شهادتي المعتمدة من ${log.organization_name}`,
                    url: shareUrl,
                });
            } catch (error) {
                console.log('Error sharing', error);
            }
        } else {
            // في حال كان المتصفح لا يدعم خاصية مشاركة النظام
            try {
                await navigator.clipboard.writeText(shareUrl);
                toast.success('تم نسخ الرابط! يمكنك مشاركته الآن', {
                    icon: '🔗',
                    style: {
                        borderRadius: '15px',
                        background: '#18181b',
                        color: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }
                });
            } catch (err) {
                toast.error('فشل في نسخ الرابط');
                console.log(err);
            }
        }
    };
    const showQrAlert = () => {
        MySwal.fire({
            html: (
                <div className="flex flex-col items-center p-4">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <QrCode size={40} className="text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900">التحقق السريع</h3>
                    <p className="text-slate-500 text-sm mt-2">وجه كاميرا الهاتف لمسح الرمز</p>

                    <div className="bg-white p-6 rounded-[2.5rem] mt-6 shadow-2xl">
                        <QRCodeSVG value={shareUrl} size={200} level="H" />
                    </div>

                    <div className="mt-8 w-full">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">كود التحقق</p>
                        <div className="bg-white border border-slate-100 py-3 px-6 rounded-2xl font-mono text-emerald-600 text-sm">
                            {log.certificate_code}
                        </div>
                    </div>
                </div>
            ),
            background: '#18181b', // نفس لون zic-900
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                popup: 'rounded-[3rem] border border-slate-200',
                closeButton: 'text-slate-400'
            }
        });
    };
    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative"
                onClick={onClick}
            >
                {/* توهج خلفي عند التحويم */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>

                <div className="relative bg-gradient-to-br from-white/[0.07] to-white/[0.01] border border-slate-200 backdrop-blur-xl rounded-[3rem] p-1 overflow-hidden transition-all duration-500 group-hover:border-slate-300 group-hover:-translate-y-3 shadow-2xl">

                    {/* زخرفة الشهادة داخل الكرت */}
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Hexagon size={180} strokeWidth={0.5} className="rotate-12 text-emerald-600" />
                    </div>

                    <div className="relative p-8 flex flex-col h-full min-h-[380px]">
                        {/* جزء الرأس في الشهادة */}
                        <div className="flex justify-between items-start mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-600/20 group-hover:rotate-6 transition-transform">
                                    <Award className="text-slate-900" size={32} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-emerald-600 tracking-widest uppercase mb-1">شهادة إنجاز</h4>
                                    <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{log.certificate_code}</p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    showQrAlert();
                                }}
                                className="bg-slate-50 border border-slate-200 p-3 rounded-2xl hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all active:scale-95"
                            >
                                <QrCode size={30} className="text-slate-500 group-hover:text-purple-300 transition-colors" />
                            </button>
                        </div>

                        {/* المحتوى الرئيسي */}
                        <div className="mb-8">
                            <h3 className="text-2xl font-black leading-tight mb-4 group-hover:text-purple-300 transition-colors">
                                {log.opportunity?.title}
                            </h3>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <Building2 size={16} className="text-blue-500" />
                                    <span className="text-sm font-bold">{log.organization_name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-400">
                                    <Calendar size={16} />
                                    <span className="text-xs">تاريخ الإصدار: {new Date(log.issue_date).toLocaleDateString('ar-YE', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>

                        {/* شبكة البيانات المصغرة */}
                        <div className="grid grid-cols-2 gap-4 mt-auto">
                            <div className="bg-black/30 border border-slate-100 rounded-[1.5rem] p-4 group-hover:bg-black/50 transition-colors">
                                <p className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-tighter">الساعات الموثقة</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-black text-blue-400">{log.approved_hours || 0}</span>
                                    <span className="text-[10px] text-slate-500">ساعة عمل</span>
                                </div>
                            </div>
                            <div className="bg-black/30 border border-slate-100 rounded-[1.5rem] p-4 group-hover:bg-black/50 transition-colors">
                                <p className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-tighter">التحقق الرقمي</p>
                                <div className="flex items-center gap-2 text-emerald-500">
                                    <CheckCircle2 size={14} />
                                    <span className="text-[10px] font-bold">صالح ومعتمد</span>
                                </div>
                            </div>
                        </div>

                        {/* أزرار الإجراءات السريعة */}
                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex gap-2 ">
                                <button onClick={
                                    (e) => {
                                        e.stopPropagation();
                                        handleView(log.certificate_code)
                                    }} className=" cursor-pointer  p-3 bg-slate-50 hover:bg-slate-50 rounded-xl transition-colors text-slate-500 hover:text-slate-900" title="عرض الشهادة">
                                    <Eye size={18} />

                                </button>

                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleShare();
                                }}
                                className="cursor-pointer p-3 bg-slate-50 hover:bg-slate-50 rounded-xl transition-colors text-slate-500 hover:text-slate-900"
                                title="مشاركة"
                            >
                                <Share2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* تأثير "اللمعان" عند التحويم */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none"></div>
                </div>
            </motion.div>

        </>

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
export default Certificates;