import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Users, MapPin, User, ExternalLink,
    Briefcase, ShieldCheck, Mail, Phone, ChevronLeft,
    Info, Award, Clock, Star, Zap, GraduationCap
} from 'lucide-react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import { toast, Toaster } from 'react-hot-toast';

/**
 * مكون إدارة المتطوعين - تصميم زجاجي عصري
 */
const ManageVolunteers = () => {
    const navigate = useNavigate();
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // جلب البيانات من API
    const fetchAcceptedVolunteers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.get('/org/get-accepted-volunteers');
            setVolunteers(res.data);

        } catch (err) {
            console.error(err);
            toast.error('فشل في تحميل قائمة الكوادر');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAcceptedVolunteers();
    }, [fetchAcceptedVolunteers]);

    // معالجة البيانات: الفلترة ومنع التكرار
    const filteredVolunteers = useMemo(() => {
        // منع التكرار بناءً على id المستخدم الموجود داخل كائن user
        const uniqueMap = new Map();
        volunteers.forEach(v => uniqueMap.set(v.user.id, v));
        const uniqueVolunteers = Array.from(uniqueMap.values());

        return uniqueVolunteers.filter(v => {
            const u = v.user; // اختصار للوصول
            const searchLower = searchTerm.toLowerCase();

            const nameMatch = u.full_name?.toLowerCase().includes(searchLower);
            // المهارات الآن مصفوفة نصوص مباشرة وليست كائنات
            const skillMatch = u.skills.name?.some(skillName => skillName.toLowerCase().includes(searchLower));
            const majorMatch = u.major?.toLowerCase().includes(searchLower);

            return nameMatch || skillMatch || majorMatch;
        });
    }, [volunteers, searchTerm]);
    // حساب إحصائيات سريعة
    const stats = useMemo(() => {
        const totalHours = filteredVolunteers.reduce((acc, curr) => acc + (curr.total_volunteer_hours || 0), 0);
        return { totalHours, count: filteredVolunteers.length };
    }, [filteredVolunteers]);

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-['Cairo'] selection:bg-emerald-500/40" dir="rtl">
            <Toaster position="top-center" reverseOrder={false} />
            <Sidebar role="organization" />

                {loading ? (
                    <LoadingSpinner />
                ) : (
            <main className="flex-1 p-4 sm:p-8 lg:p-12 max-w-[1700px] mx-auto w-full overflow-x-hidden relative">
                {/* خلفية جمالية (Glow Effects) */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[120px] rounded-full -z-10" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-teal-600/5 blur-[100px] rounded-full -z-10" />

                {/* Header Section */}
                <header className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-50 rounded-lg shadow-inner">
                                <Users className="text-emerald-600" size={24} />
                            </div>
                            <span className="text-emerald-600 font-bold tracking-tighter text-sm uppercase">HR Management System</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-l from-slate-900 via-slate-800 to-slate-500 bg-clip-text text-transparent">
                            إدارة الكوادر المعتمدة
                        </h1>
                        <p className="text-slate-400 mt-3 text-sm md:text-base max-w-xl leading-relaxed font-medium">
                            استعراض وإدارة المتطوعين المعتمدين رسمياً ضمن فريق مؤسستك. يمكنك متابعة الأداء والمهارات التراكمية.
                        </p>
                    </motion.div>

                    {/* Quick Stats Cards */}
                    <div className="flex flex-wrap gap-4 w-full xl:w-auto">
                        <StatHeaderCard
                            icon={<ShieldCheck className="text-emerald-600" />}
                            label="الفريق النشط"
                            value={stats.count}
                            color="emerald"
                        />
                        <StatHeaderCard
                            icon={<Award className="text-emerald-600" />}
                            label="إجمالي الساعات"
                            value={stats.totalHours}
                            color="emerald"
                        />
                    </div>
                </header>

                {/* Glass Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative mb-12 z-10 group"
                >
                    <div className="absolute inset-0 bg-emerald-500/5 blur-xl group-focus-within:bg-emerald-500/10 transition-all duration-500 -z-10" />
                    <div className="relative flex flex-col md:flex-row gap-4 items-center bg-white border border-slate-100 p-2 rounded-[2.5rem] focus-within:border-emerald-500/30 transition-all shadow-sm">
                        <div className="relative w-full">
                            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="ابحث باسم المتطوع، التخصص، أو المهارة..."
                                className="w-full bg-transparent border-none py-4 pr-14 pl-6 focus:ring-0 text-slate-900 placeholder:text-slate-600 text-lg font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </motion.div>

              
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8 relative z-10">
                        <AnimatePresence mode='popLayout'>
                            {filteredVolunteers.length > 0 ? (
                                filteredVolunteers.map((volunteer, index) => (
                                    <VolunteerCard
                                        key={volunteer.user.id}
                                        volunteer={volunteer}
                                        index={index}
                                        onDetails={(id) => navigate(`/volunteer-portfolio/${id}`)}
                                    />
                                ))
                            ) : (
                                <EmptyState />
                            )}
                        </AnimatePresence>
                    </div>
               
            </main> )}
        </div>
    );
};

/* --- المكونات الفرعية المصممة بالنمط الزجاجي --- */

const StatHeaderCard = ({ icon, label, value, color }) => (
    <div className="flex items-center gap-5 bg-white border border-slate-100 px-8 py-5 rounded-[2rem] flex-1 xl:flex-none min-w-[220px] transition-all hover:bg-slate-50 hover:border-emerald-100 shadow-sm shadow-emerald-500/5">
        <div className={`p-3 rounded-2xl bg-emerald-50 border border-emerald-100`}>
            {icon}
        </div>
        <div>
            <p className="text-slate-400 text-xs font-bold mb-1 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-black text-slate-900">{value}</p>
        </div>
    </div>
);

const VolunteerCard = ({ volunteer, index, onDetails }) => {
const API_URL = import.meta.env.VITE_API_URL;
    const user = volunteer.user;
    const skills = user.skills
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="group relative"
        >
            {/* تأثير الإضاءة الزجاجية الخلفية */}
            <div className="absolute inset-0 bg-emerald-600/5 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative h-full bg-white border border-slate-100 rounded-[2.5rem] p-5 overflow-hidden flex flex-col items-center shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all">

                {/* شارة الساعات - صغيرة وأنيقة */}
                <div className="absolute top-4 left-4 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Clock size={10} className="text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-700">{user.total_volunteer_hours} ساعة</span>
                </div>

                {/* الصورة الشخصية - حجم أصغر قليلاً */}
                <div className="mt-4 mb-4 relative">
                    <div className="w-20 h-20 rounded-[1.8rem] bg-gradient-to-br from-emerald-100 to-transparent p-[1px]">
                        <div className="w-full h-full rounded-[1.8rem] bg-slate-50 overflow-hidden">
                            {user.profile_image ? (
                                <img src={`${API_URL}/storage/${user.profile_image}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-600"><User size={30} /></div>
                            )}
                        </div>
                    </div>
                    {/* نقطة الحالة النشطة */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-white shadow-lg shadow-emerald-500/20" />
                </div>

                {/* الاسم والتخصص */}
                <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{user.full_name}</h3>
                <div className="flex items-center gap-1 mt-1 mb-4 text-slate-400">
                    <GraduationCap size={12} />
                    <span className="text-[11px] font-bold truncate max-w-[150px]">{user.major || 'متطوع معتمد'}</span>
                </div>

                {/* المهارات - الحل الذكي للاختفاء */}
                <div className="flex flex-wrap justify-center gap-1.5 mb-6 h-[26px]">
                    {skills?.slice(0, 2).map((sk) => (
                        <span
                            key={sk.id} // نستخدم id المهارة الحقيقي هنا
                            className="text-[9px] bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg text-slate-500 font-bold"
                        >
                            {sk.name}
                        </span>
                    ))}

                    {skills?.length > 2 && (
                        <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-lg font-black border border-emerald-100">
                            +{skills.length - 2}
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-2 w-full mb-4">
                    <DetailItem icon={<MapPin size={14} />} text={user.location} />
                    <DetailItem icon={<Phone size={14} />} text={user.phone} />
                </div>
                {/* زر العرض - شفاف زجاجي */}
                <button
                    onClick={() => onDetails(user.id)}
                    className="w-full bg-slate-50 hover:bg-emerald-600 border border-slate-100 hover:border-emerald-400 py-3 rounded-2xl transition-all duration-300 group/btn overflow-hidden relative shadow-sm"
                >
                    <span className="relative z-10 text-[11px] font-black text-slate-500 group-hover/btn:text-slate-900 uppercase tracking-wider">استعراض الملف</span>
                </button>
            </div>
        </motion.div>
    );
};

const DetailItem = ({ icon, text }) => (
    <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 group-hover:border-emerald-50 transition-all">
        <div className="bg-white p-1.5 rounded-lg border border-slate-100 text-emerald-600">
            {icon}
        </div>
        <span className="text-[11px] text-slate-400 font-bold truncate group-hover:text-slate-600">{text}</span>
    </div>
);

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center w-full py-40">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-teal-500 rounded-full animate-spin animate-pulse" />
        </div>
        <h2 className="mt-8 text-xl font-black text-slate-900 tracking-widest animate-pulse uppercase">Syncing Database...</h2>
        <p className="text-slate-500 mt-2 font-bold">يرجى الانتظار، جاري تحضير البيانات</p>
    </div>
);

const EmptyState = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="col-span-full text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-slate-100"
    >
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 group transition-all">
            <Users size={48} className="text-slate-900 group-hover:text-emerald-500 transition-colors" />
        </div>
        <h3 className="text-2xl font-black text-slate-600">لا توجد نتائج مطابقة</h3>
        <p className="text-slate-400 mt-2 max-w-xs mx-auto font-medium">جرّب البحث بكلمات أخرى أو تأكد من وجود متطوعين مقبولين.</p>
    </motion.div>
);

export default ManageVolunteers;