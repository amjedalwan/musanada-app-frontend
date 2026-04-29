import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, MapPin, Calendar, Briefcase,
    Award, Clock, CheckCircle2, Timer, History,
    ExternalLink, ChevronRight, Globe, Shield, Star,
    LayoutDashboard, Activity, Map as MapIcon,
    FileText, Zap, Download, Quote, Heart
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../api/axios';
import { toast, Toaster } from 'react-hot-toast';

import Sidebar from '../components/Sidebar';
// إعدادات أيقونة الخريطة التفاعلية
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

/**
 * صفحة الملف الشخصي الشامل للمتطوع (Portfolio)
 * تم بناؤها لتناسب معمارية Laravel + React الخاصة بمنصة مساندة
 */
const VolunteerProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('skills');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    // جلب البيانات الشاملة من الباك اند (StudentController@getFullPortfolio)
    const fetchPortfolioData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get(`/students/${id}/portfolio`);
            const res = response.data;
            setData(res);

        } catch (err) {
            const msg = err.response?.data?.message || "فشل في مزامنة بيانات الكادر";
            toast.error(msg);
            console.error("Portfolio Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchPortfolioData();
    }, [id, fetchPortfolioData]);

    // حساب الإحصائيات الحية
    const statsSummary = useMemo(() => {
        if (!data) return null;
        return {
            totalHours: data.total_hours || 0,
            skillsCount: data.skills?.length || 0
        };
    }, [data]);
    if (loading) return <EnhancedLoader />;
    if (!data) return <EmptyResponse navigate={navigate} />;

    // const { user, profile, skills, applications, reviews, attachments } = data;
    const user = data.personal_info;
    const profile = data.academic_info;
    const skills = data.skills;


    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">

            <Toaster position="top-center" />
            <Sidebar role={user?.role} />
            <main className="flex-1 h-screen overflow-y-auto custom-scrollbar relative">
                
                <div className=" bg-slate-50 text-slate-900 font-['Cairo']selection:bg-emerald-500/30" dir="rtl">

                    {/* الخلفية الديناميكية الزجاجية */}
                    <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none w-full">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
                            transition={{ duration: 10, repeat: Infinity }}
                            className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-600 blur-[180px] rounded-full"
                        />
                        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/10 blur-[150px] rounded-full" />
                    </div>

                    {/* الهيدر العلوي بنمط البارالاكس الخفيف */}
                    <div className="relative h-[40px] w-full group">
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/10 via-purple-900/10 to-[#020205] transition-all duration-700 group-hover:opacity-80" />
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

                        <button
                            onClick={() => navigate(-1)}
                            className="absolute top-10 right-10 z-20 flex items-center gap-3 bg-slate-50 backdrop-blur-xl border border-slate-200 px-6 py-3 rounded-2xl hover:bg-slate-50 hover:border-purple-500/40 transition-all active:scale-95 group/back"
                        >
                            <ChevronRight size={20} className="group-hover/back:translate-x-1 transition-transform" />
                            <span className="font-bold">العودة للوحة الإدارة</span>
                        </button>
                    </div>

                    {/* الحاوية الرئيسية للبيانات */}
                    <div className="w-full mx-auto px-6 sm:px-10 lg:px-16 mt-20 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                            {/* الجانب الأيمن: بطاقة الهوية الشخصية */}
                            <div className="lg:col-span-5 space-y-8">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-slate-50 backdrop-blur-2xl border border-slate-200 rounded-[3rem] p-10 text-center relative overflow-hidden group shadow-2xl"
                                >
                                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-emerald-500" />

                                    {/* الصورة الشخصية مع Glow */}
                                    <div className="relative inline-block mb-8">
                                        <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                        <div className="relative w-40 h-40 rounded-[3rem] bg-white border-2 border-slate-200 p-1 overflow-hidden mx-auto">
                                            <div className="w-full h-full rounded-[2.8rem] overflow-hidden">
                                                {user.image ? (
                                                    <img src={user.image} className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700" alt={user.name} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-white"><User size={60} className="text-slate-400" /></div>
                                                )}
                                            </div>
                                        </div>
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="absolute bottom-2 right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#020205] shadow-lg shadow-emerald-500/20"
                                        />
                                    </div>

                                    <h1 className="text-3xl font-black mb-2 tracking-tight bg-gradient-to-l from-white to-gray-400 bg-clip-text text-transparent">{user.name}</h1>
                                    <p className="text-emerald-600 font-bold text-sm mb-2  uppercase tracking-[0.2em]">{profile?.major || 'كادر معتمد'}</p>

                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8"> {profile?.bio || ''} </h4>
                                    <div className="grid grid-cols-2 gap-2 mb-10">
                                        <QuickAction icon={<Mail size={20} />} label="إيميل" link={`mailto:${user.email}`} />
                                        <QuickAction icon={<Phone size={20} />} label="اتصال" link={`tel:${user.phone}`} />

                                    </div>

                                    <div className="space-y-4 text-right bg-white p-6 rounded-3xl border border-slate-100">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">معلومات التواصل والموقع</h4>
                                        <ProfileDetailItem icon={<MapPin size={16} className="text-red-400" />} label="السكن" value={user.location || 'غير محدد'} />
                                        <ProfileDetailItem icon={<Calendar size={16} className="text-blue-400" />} label="الميلاد" value={profile?.birth_date || '---'} />
                                        <ProfileDetailItem icon={<Shield size={16} className="text-emerald-600" />} label="الحالة" value={user.is_active ? 'حساب موثق' : 'غير نشط'} />
                                    </div>
                                </motion.div>

                            </div>

                            {/* الجانب الأيسر: الإحصائيات والتبويبات التفاعلية */}
                            <div className="lg:col-span-7 space-y-8 justify-center align-center flex flex-col items-center">

                                {/* لوحة التحكم السريعة (Stats Grid) */}
                                <div className="grid grid-cols-2 md:grid-cols-2 gap-10  justify-center w-full">
                                    <StatBox icon={<Clock />} label="ساعات التطوع" value={statsSummary.totalHours} color="purple" />
                                    <StatBox icon={<Award />} label="المهارات" value={statsSummary.skillsCount} color="emerald" />

                                </div>
                                {/* شريط التنقل الزجاجي */}
                                <div className="flex flex-wrap gap-2 p-2 bg-slate-50 backdrop-blur-xl border border-slate-200 rounded-3xl w-fit">
                                    <TabTrigger active={activeTab === 'skills'} onClick={() => setActiveTab('skills')} icon={<Star />} label="الجدارة والمهارات" />
                                    <TabTrigger active={activeTab === 'map'} onClick={() => setActiveTab('map')} icon={<MapIcon />} label="الموقع" />
                                </div>

                                {/* محتوى التبويبات مع حركات AnimatePresence */}
                                <div className="min-h-[600px] w-full">
                                    <AnimatePresence mode="wait">


                                        {activeTab === 'skills' && (
                                            <motion.div key="skills" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-10">
                                                    <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                                                        <Award className="text-yellow-500" /> مهارات الكادر
                                                    </h3>
                                                    <div className="flex flex-wrap gap-3">
                                                        {skills.map(skill => (
                                                            <SkillBadge key={skill.id} name={skill.name} />
                                                        )
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-10">
                                                    <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                                                        <FileText className="text-yellow-500" /> التعريف الشخصي
                                                    </h3>
                                                    <p className="text-slate-500 leading-relaxed text-sm">
                                                        {profile?.bio || "لا يوجد وصف مسجل حالياً للمتطوع."}
                                                    </p>
                                                    <div className="mt-10 pt-10 border-t border-slate-100 space-y-4">

                                                        <div className="flex items-center justify-between">
                                                            <span className="text-slate-400 text-xs font-bold">  المؤسسة التعليمية</span>
                                                            <span className="text-slate-900 text-sm font-black">{profile?.university || 'غير محدد'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === 'map' && (
                                            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[550px] bg-slate-50 rounded-[3rem] border border-slate-200 overflow-hidden p-2">
                                                {user.lat && user.lng ? (
                                                    <MapContainer center={[parseFloat(user.lat), parseFloat(user.lng)]} zoom={14} style={{ height: '100%', width: '100%', borderRadius: '2.5rem' }}>
                                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                        <Marker position={[parseFloat(user.lat), parseFloat(user.lng)]}>
                                                            <Popup className="font-['Cairo'] text-right">موقع المتطوع: {user.full_name}</Popup>
                                                        </Marker>
                                                    </MapContainer>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                                                        <MapIcon size={60} className="opacity-10" />
                                                        <p className="font-bold">إحداثيات الموقع غير متوفرة لهذا الحساب</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

/* --- المكونات الفرعية (Sub-Components) المستقلة --- */

const StatBox = ({ icon, label, value, color }) => (
    <div className="bg-slate-50 backdrop-blur-xl border border-slate-200 p-6 rounded-[2.5rem] relative group hover:bg-slate-50 transition-all overflow-hidden">
        <div className={`absolute top-0 right-0 w-16 h-16 bg-${color}-500/10 blur-2xl -mr-8 -mt-8`} />
        <div className={`w-12 h-12 rounded-2xl bg-${color}-500/10 flex items-center justify-center mb-5 border border-${color}-500/20 group-hover:scale-110 transition-transform`}>
            {React.cloneElement(icon, { size: 22, className: `text-${color}-400` })}
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
);




const SkillBadge = ({ name }) => (
    <span className="bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-2xl text-[11px] font-black text-slate-500 hover:border-purple-500/40 hover:text-purple-300 transition-all cursor-default">
        {name}

    </span>
);



const ProfileDetailItem = ({ icon, label, value }) => (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.02]">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">{icon}</div>
            <span className="text-[10px] font-bold text-slate-400">{label}</span>
        </div>
        <span className="text-[11px] font-black text-slate-600">{value}</span>
    </div>
);

const QuickAction = ({ icon, label, link }) => (
    <a href={link} className="flex flex-col items-center gap-2 group">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-slate-900 group-hover:border-purple-400 transition-all active:scale-90">
            {icon}
        </div>
        <span className="text-[9px] font-black text-slate-400 group-hover:text-slate-500 uppercase tracking-tighter">{label}</span>
    </a>
);

const TabTrigger = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black transition-all ${active ? 'bg-emerald-600 text-slate-900 shadow-lg shadow-purple-600/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
        {React.cloneElement(icon, { size: 16 })}
        {label}
    </button>
);


const EmptyResponse = ({ navigate }) => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20"><Shield size={40} className="text-red-500" /></div>
        <h2 className="text-2xl font-black text-slate-900 mb-2 text-center">عذراً، لم يتم العثور على المتطوع</h2>
        <p className="text-slate-400 text-center mb-10 max-w-sm">ربما تم حذف الحساب أو أن الرابط الذي تتبعه غير صحيح، يرجى التحقق من لوحة التحكم.</p>
        <button onClick={() => navigate(-1)} className="bg-white text-black px-10 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all">الرجوع للوحة التحكم</button>
    </div>
);

const EnhancedLoader = () => (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-600/20 blur-[100px] rounded-full animate-pulse" />
        <div className="relative">
            <div className="w-24 h-24 border-4 border-emerald-100 border-t-purple-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center"><Heart className="text-emerald-600 animate-bounce" size={30} /></div>
        </div>
        <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-[0.3em] uppercase animate-pulse">Syncing Portfolio</h2>
            <p className="text-slate-400 text-xs font-bold">يرجى الانتظار، جاري تحضير ملف الكادر الشامل...</p>
        </div>
    </div>
);

export default VolunteerProfile;