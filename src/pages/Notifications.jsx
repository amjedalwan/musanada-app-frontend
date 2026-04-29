import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Bell, CheckCheck, Trash2, MailOpen,
    ArrowLeft, Loader2, CheckCircle2, AlertCircle,
    Inbox, ExternalLink, Clock, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2'; // للعرض الجميل
import toast, { Toaster } from 'react-hot-toast'; // للإشعارات السريعة

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const navigate = useNavigate();

    const user = useMemo(() => JSON.parse(localStorage.getItem('user')), []);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications');
            const data = res.data.data || res.data;
            setNotifications(Array.isArray(data) ? data : []);
        } catch (err) {
            console.log(err);
            toast.error("فشل في تحديث الإشعارات");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // عرض التفاصيل باستخدام SweetAlert2
    const showDetails = (n) => {
        Swal.fire({
            title: n.data?.title,
            html: `
                <div class="text-right font-sans" dir="rtl">
                    <p class="text-slate-400 mb-4 leading-relaxed">${n.data?.message}</p>
                    ${n.data?.opportunity_title ? `
                        <div class="bg-purple-50 p-3 rounded-lg border border-purple-100 mb-3">
                            <small class="text-purple-600 font-bold">الفرصة المرتبطة:</small>
                            <p class="text-sm text-slate-400">${n.data?.opportunity_title}</p>
                        </div>
                    ` : ''}
                    <div class="flex items-center gap-2 text-xs text-slate-500 mt-4">
                        <i class="lucide-clock w-3"></i>
                        <span>تم الإرسال في: ${new Date(n.created_at).toLocaleString('ar-YE')}</span>
                    </div>
                </div>
            `,
            icon: n.data?.status === 'accepted' ? 'success' : 'info',
            confirmButtonText: 'إغلاق',
            confirmButtonColor: '#9333ea',
            background: '#ffffff',
            customClass: {
                title: 'text-xl font-black text-gray-800',
                popup: 'rounded-[2rem]'
            }
        }).then((result) => {
            if (result.dismiss === Swal.DismissReason.cancel && n.data?.action_url) {
                navigate(n.data.action_url);
            }
        });

        // إذا كان غير مقروء، نميزه كمقروء تلقائياً عند الفتح
        if (!n.read_at) markAsRead(n.id, true);
    };

    const markAsRead = async (id, silent = false) => {
        setActionId(id);
        const original = [...notifications];
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date() } : n));

        try {
            await api.patch(`/notifications/${id}/read`);
            if (!silent) toast.success("تم التمييز كمقروء");
        } catch (err) {
            console.log(err);
            setNotifications(original);
        } finally {
            setActionId(null);
        }
    };

    const deleteNotification = async (id) => {
        const confirm = await Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "سيتم حذف هذا الإشعار نهائياً",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'تراجع'
        });

        if (confirm.isConfirmed) {
            try {
                await api.delete(`/notifications/${id}`);
                setNotifications(prev => prev.filter(n => n.id !== id));
                toast.success("تم الحذف بنجاح", {
                    icon: '🗑️',
                    style: { borderRadius: '15px', background: '#333', color: '#1e293b' }
                });
            } catch (err) {
                console.log(err);
                toast.error("حدث خطأ أثناء الحذف");
            }
        }
    };

    const getIcon = (type, status) => {
        if (status === 'accepted') return <CheckCircle2 className="text-emerald-600" />;
        if (status === 'rejected') return <AlertCircle className="text-red-400" />;
        return <Bell className="text-emerald-600" />;
    };

    const unreadCount = notifications.filter(n => !n.read_at).length;

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
            <Toaster position="bottom-center" />
            <Sidebar role={user?.role} />
  {/* Grid Container */}
                {loading ? (
                    <LoadingSpinner />
                ) : (
            <main className="flex-1 p-5 lg:p-10 overflow-y-auto relative">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/5 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                        <div className="flex items-center gap-5">
                          
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                                    الإشعارات
                                    {unreadCount > 0 && <span className="text-[10px] bg-emerald-600 px-2 py-1 rounded-md tracking-tighter">{unreadCount} جديد</span>}
                                </h1>
                                <p className="text-slate-500 text-sm mt-1">إدارة التنبيهات والنشاطات الأخيرة</p>
                            </div>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-slate-50 rounded-[2rem] animate-pulse"></div>
                                ))}
                            </div>
                        ) : notifications.length > 0 ? (
                            <AnimatePresence mode="popLayout">
                                {notifications.map((n, index) => (
                                    <motion.div
                                        key={n.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: 50 }}
                                        className={`group relative p-6 rounded-[2rem] border transition-all duration-300 ${!n.read_at ? 'bg-white border-emerald-200 shadow-[0_0_20px_-5px_rgba(147,51,234,0.1)]' : 'bg-slate-50 border-slate-100 opacity-70 hover:opacity-100'}`}
                                    >
                                        <div className="flex items-start gap-5">
                                            <div className={`p-4 rounded-2xl ${!n.read_at ? 'bg-emerald-500/10' : 'bg-slate-50'}`}>
                                                {getIcon(n.data?.type, n.data?.status)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className={`font-bold text-lg truncate ${!n.read_at ? 'text-slate-900' : 'text-slate-400'}`}>
                                                        {n.data?.title}
                                                    </h3>
                                                    <span className="text-[10px] text-slate-500 flex items-center gap-1 shrink-0">
                                                        <Clock size={12} /> {new Date(n.created_at).toLocaleDateString('ar-YE')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-400 line-clamp-1 mb-4">{n.data?.message}</p>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => showDetails(n)}
                                                            className="text-[11px] font-bold bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-slate-900 px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                                                        >
                                                            <Info size={14} /> التفاصيل
                                                        </button>
                                                        {!n.read_at && (
                                                            <button
                                                                onClick={() => markAsRead(n.id)}
                                                                className="text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-colors"
                                                            >
                                                                تمييز كمقروء
                                                            </button>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => deleteNotification(n.id)}
                                                        className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        ) : (
                            <div className="text-center py-20 border border-dashed border-slate-200 rounded-[3rem]">
                                <Inbox size={48} className="mx-auto text-slate-700 mb-4" />
                                <p className="text-slate-500">لا توجد إشعارات حالياً</p>
                            </div>
                        )}
                    </div>
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
export default Notifications;