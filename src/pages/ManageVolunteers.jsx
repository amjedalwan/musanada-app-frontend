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
        <div className="flex min-h-screen bg-[#050508] text-white font-['Cairo'] selection:bg-purple-500/40" dir="rtl">
            <Toaster position="top-center" reverseOrder={false} />
            <Sidebar role="organization" />

                {loading ? (
                    <LoadingSpinner />
                ) : (
            <main className="flex-1 p-4 sm:p-8 lg:p-12 max-w-[1700px] mx-auto w-full overflow-x-hidden relative">
                {/* خلفية جمالية (Glow Effects) */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full -z-10" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-emerald-600/5 blur-[100px] rounded-full -z-10" />

                {/* Header Section */}
                <header className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/20 rounded-lg shadow-inner shadow-purple-500/10">
                                <Users className="text-purple-400" size={24} />
                            </div>
                            <span className="text-purple-400 font-bold tracking-tighter text-sm uppercase">HR Management System</span>
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black bg-gradient-to-l from-white via-white to-gray-500 bg-clip-text text-transparent">
                            إدارة الكوادر المعتمدة
                        </h1>
                        <p className="text-gray-500 mt-3 text-sm md:text-base max-w-xl leading-relaxed font-medium">
                            استعراض وإدارة المتطوعين المعتمدين رسمياً ضمن فريق مؤسستك. يمكنك متابعة الأداء والمهارات التراكمية.
                        </p>
                    </motion.div>

                    {/* Quick Stats Cards */}
                    <div className="flex flex-wrap gap-4 w-full xl:w-auto">
                        <StatHeaderCard
                            icon={<ShieldCheck className="text-emerald-400" />}
                            label="الفريق النشط"
                            value={stats.count}
                            color="emerald"
                        />
                        <StatHeaderCard
                            icon={<Award className="text-purple-400" />}
                            label="إجمالي الساعات"
                            value={stats.totalHours}
                            color="purple"
                        />
                    </div>
                </header>

                {/* Glass Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative mb-12 z-10 group"
                >
                    <div className="absolute inset-0 bg-purple-500/5 blur-xl group-focus-within:bg-purple-500/10 transition-all duration-500 -z-10" />
                    <div className="relative flex flex-col md:flex-row gap-4 items-center bg-white/[0.02] backdrop-blur-md border border-white/10 p-2 rounded-[2.5rem] focus-within:border-purple-500/30 transition-all">
                        <div className="relative w-full">
                            <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="ابحث باسم المتطوع، التخصص، أو المهارة..."
                                className="w-full bg-transparent border-none py-4 pr-14 pl-6 focus:ring-0 text-gray-200 placeholder:text-gray-600 text-lg font-medium"
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
    <div className="flex items-center gap-5 bg-white/[0.03] backdrop-blur-md border border-white/10 px-8 py-5 rounded-[2rem] flex-1 xl:flex-none min-w-[220px] transition-all hover:bg-white/[0.05] hover:border-white/20">
        <div className={`p-3 rounded-2xl bg-${color}-500/10 border border-${color}-500/20`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-black text-white">{value}</p>
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
            <div className="absolute inset-0 bg-purple-600/10 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="relative h-full bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-[2.5rem] p-5 overflow-hidden flex flex-col items-center">

                {/* شارة الساعات - صغيرة وأنيقة */}
                <div className="absolute top-4 left-4 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Clock size={10} className="text-purple-400" />
                    <span className="text-[10px] font-bold text-purple-300">{user.total_volunteer_hours} ساعة</span>
                </div>

                {/* الصورة الشخصية - حجم أصغر قليلاً */}
                <div className="mt-4 mb-4 relative">
                    <div className="w-20 h-20 rounded-[1.8rem] bg-gradient-to-br from-white/10 to-transparent p-[1px]">
                        <div className="w-full h-full rounded-[1.8rem] bg-[#0b0b0e] overflow-hidden">
                            {user.profile_image ? (
                                <img src={`${API_URL}/storage/${user.profile_image}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-700"><User size={30} /></div>
                            )}
                        </div>
                    </div>
                    {/* نقطة الحالة النشطة */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-[#050508] shadow-lg shadow-emerald-500/20" />
                </div>

                {/* الاسم والتخصص */}
                <h3 className="text-lg font-black text-white group-hover:text-purple-400 transition-colors">{user.full_name}</h3>
                <div className="flex items-center gap-1 mt-1 mb-4 text-gray-500">
                    <GraduationCap size={12} />
                    <span className="text-[11px] font-bold truncate max-w-[150px]">{user.major || 'متطوع معتمد'}</span>
                </div>

                {/* المهارات - الحل الذكي للاختفاء */}
                <div className="flex flex-wrap justify-center gap-1.5 mb-6 h-[26px]">
                    {skills?.slice(0, 2).map((sk) => (
                        <span
                            key={sk.id} // نستخدم id المهارة الحقيقي هنا
                            className="text-[9px] bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-gray-400 font-bold"
                        >
                            {sk.name}
                        </span>
                    ))}

                    {skills?.length > 2 && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded-lg font-black">
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
                    className="w-full bg-white/5 hover:bg-purple-600 border border-white/10 hover:border-purple-400 py-3 rounded-2xl transition-all duration-300 group/btn overflow-hidden relative"
                >
                    <span className="relative z-10 text-[11px] font-black text-gray-400 group-hover/btn:text-white uppercase tracking-wider">استعراض الملف</span>
                </button>
            </div>
        </motion.div>
    );
};

const DetailItem = ({ icon, text }) => (
    <div className="flex items-center gap-3 bg-white/[0.01] p-3 rounded-2xl border border-white/[0.03] group-hover:border-white/5 transition-all">
        <div className="bg-black/20 p-1.5 rounded-lg border border-white/5">
            {icon}
        </div>
        <span className="text-[11px] text-gray-400 font-bold truncate group-hover:text-gray-200">{text}</span>
    </div>
);

const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center w-full py-40">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/10 border-t-purple-500 rounded-full animate-spin" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-emerald-500 rounded-full animate-spin animate-pulse" />
        </div>
        <h2 className="mt-8 text-xl font-black text-white tracking-widest animate-pulse uppercase">Syncing Database...</h2>
        <p className="text-gray-600 mt-2 font-bold">يرجى الانتظار، جاري تحضير البيانات</p>
    </div>
);

const EmptyState = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="col-span-full text-center py-32 bg-white/[0.01] rounded-[4rem] border-2 border-dashed border-white/5"
    >
        <div className="w-24 h-24 bg-gray-900/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 group transition-all">
            <Users size={48} className="text-gray-800 group-hover:text-purple-500 transition-colors" />
        </div>
        <h3 className="text-2xl font-black text-gray-500">لا توجد نتائج مطابقة</h3>
        <p className="text-gray-700 mt-2 max-w-xs mx-auto font-medium">جرّب البحث بكلمات أخرى أو تأكد من وجود متطوعين مقبولين.</p>
    </motion.div>
);

export default ManageVolunteers;