import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock, User, FileText, Calendar, ChevronRight,
    Send, Info, AlertCircle, ShieldCheck
} from 'lucide-react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import { toast, Toaster } from 'react-hot-toast';

const LogHours = () => {
    const dateInputRef = useRef(null);
    const today = new Date().toISOString().split('T')[0];
    const { opportunityId, userId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState(null);
    const [formData, setFormData] = useState({
        opportunity_id: opportunityId || '',
        user_id: userId || '',
        hours: '',
        date_logged: new Date().toISOString().split('T')[0],
        notes: ''
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/students/${userId}/portfolio`);
                const data = res.data;
                setUserData({
                    full_name: data.personal_info.name,
                    email: data.personal_info.email,
                    profile_image: data.personal_info.image,
                    total_hours: data.total_hours,
                    rank: data.academic_info.major
                });
            } catch (err) {
                console.error("Error fetching data:", err);
                toast.error("لم يتم العثور على بيانات المتطوع");
            } finally {
                setLoading(false);
            }
        };
        if (userId) fetchUserData();
    }, [userId]);

    const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '??';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const hoursNum = parseFloat(formData.hours);
        if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 12) {
            return toast.error('يرجى إدخال عدد ساعات منطقي (0.5 - 12)');
        }

        try {
            setLoading(true);
            await api.post('/org/log-hours', formData);
            toast.success('تم توثيق الساعات بنجاح');
            setTimeout(() => navigate(-1), 1500);
        } catch (err) {
            toast.error(err.response?.data?.message || 'فشل تسجيل الساعات');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#020205] text-white font-['Cairo'] selection:bg-purple-500/30" dir="rtl">
            <Toaster position="top-center" />
            <Sidebar role="organization" />
  {/* Grid Container */}
                {loading ? (
                    <LoadingSpinner />
                ) : (
            <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
                <header className="max-w-4xl mx-auto mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-500 hover:text-purple-400 transition-all mb-4 group text-sm font-bold"
                    >
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        العودة للمتقدمين
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                            <ShieldCheck size={24} />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-l from-white to-gray-500 bg-clip-text text-transparent">
                            توثيق الساعات
                        </h1>
                    </div>
                </header>

                <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Volunteer Info Card (Smaller & Cleaner) */}
                    <div className="lg:col-span-4 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-[#0a0a0c] border border-white/5 rounded-2xl p-5 text-center"
                        >
                            <div className="w-20 h-20 mx-auto mb-3 relative">
                                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-white/10 flex items-center justify-center text-xl font-black text-purple-400 overflow-hidden">
                                    {userData?.profile_image ? (
                                        <img src={userData.profile_image} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        getInitials(userData?.full_name || "Volunteer")
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1 rounded-lg border-2 border-[#0a0a0c]">
                                    <User size={12} className="text-white" />
                                </div>
                            </div>
                            <h3 className="text-base font-bold mb-0.5 truncate">{userData?.full_name || "تحميل..."}</h3>
                            <p className="text-gray-500 text-[11px] mb-4 truncate">{userData?.email}</p>

                            <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-4">
                                <div>
                                    <div className="text-[9px] text-gray-500 uppercase font-black">الساعات</div>
                                    <div className="text-sm font-black text-purple-400">{userData?.total_hours || 0}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] text-gray-500 uppercase font-black">المرتبة</div>
                                    <div className="text-sm lg:text-[10px] text-wrap font-black text-amber-500 truncate">{userData?.rank || 'برونزي'}</div>
                                </div>
                            </div>
                        </motion.div>

                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex gap-3 text-amber-500/80">
                            <AlertCircle size={18} className="shrink-0" />
                            <p className="text-[11px] font-bold leading-relaxed">
                                يرجى التأكد من البيانات؛ الاعتماد يضيف النقاط فوراً لسجل المتطوع.
                            </p>
                        </div>
                    </div>

                    {/* Compact Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-8 bg-[#0a0a0c] border border-white/5 rounded-2xl p-6 md:p-8"
                    >
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Hours Input */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                    <Clock size={14} className="text-purple-500" /> عدد الساعات
                                </label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        step="1"
                                        max="12"
                                        min="1"
                                        required
                                        /* منع الرموز العلمية والإشارات */
                                        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                        /* إخفاء أسهم الزيادة والنقصان الافتراضية عبر CSS inline */
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 
                       focus:outline-none focus:border-purple-500/50 transition-all 
                       text-xl font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="0"
                                        value={formData.hours}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // التأكد من أن القيمة المدخلة لا تتجاوز 12 ولا تقل عن 0 (اختياري للتحقق الفوري)
                                            if (val === "" || (parseFloat(val) <= 12 && parseFloat(val) >= 0)) {
                                                setFormData({ ...formData, hours: val });
                                            }
                                        }}
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm font-bold pointer-events-none">
                                        ساعة
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                        <Calendar size={14} className="text-purple-500" /> التاريخ
                                    </label>
                                    <input
                                        ref={dateInputRef} 
                                        type="date"
                                        required
                                        max={today}
                                        /* هذه الدالة تجعل الحقل يفتح التقويم عند النقر في أي مكان */
                                        onClick={() => dateInputRef.current.showPicker()}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 px-4 
                   focus:outline-none focus:border-purple-500/50 transition-all 
                   text-sm font-bold cursor-pointer" // أضفنا cursor-pointer لتحسين التجربة
                                        value={formData.date_logged}
                                        onChange={(e) => setFormData({ ...formData, date_logged: e.target.value })}
                                    />
                                </div>
                                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 flex items-start gap-3">
                                    <Info className="text-blue-400 shrink-0 mt-0.5" size={16} />
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-blue-200 font-bold leading-tight">سياسة التوثيق الزمني</p>
                                        <p className="text-[9px] text-gray-500 leading-relaxed font-medium">
                                            يرجى اختيار تاريخ تنفيذ العمل الفعلي. النظام يمنع تسجيل ساعات مستقبلية لضمان نزاهة السجل الرقمي للمتطوع. كل ساعة يتم توثيقها تمنح المتطوع 10 نقاط خبرة فورية.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 flex items-center gap-2">
                                    <FileText size={14} className="text-purple-500" /> التفاصيل
                                </label>
                                <textarea
                                    rows="3"
                                    placeholder="وصف مختصر لما تم إنجازه..."
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-purple-500/50 transition-all text-sm font-medium resize-none"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                ></textarea>
                            </div>

                            <button
                                type="submit" disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-purple-900/10"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Send size={16} /> اعتماد الساعات
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </main>
        )}
        </div>
    );
};
const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-40 w-full">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/10 border-t-purple-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-emerald-500 rounded-full animate-spin animate-pulse" />
        </div>
        <h2 className="mt-8 text-xl font-black text-white tracking-widest animate-pulse uppercase">Syncing Database...</h2>
        <p className="text-gray-600 mt-2 font-bold">يرجى الانتظار، جاري تحضير البيانات</p>
    </div>
);
export default LogHours;