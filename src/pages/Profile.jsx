import React, { useState, useEffect } from 'react';
import {
    User, Mail, Award, Clock, Star, Edit3,
    Settings, ShieldCheck, Code, Globe, Loader2
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import toast, { Toaster } from 'react-hot-toast';

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // جلب بيانات الملف الشخصي من Laravel (مشروع مساندة)
                const res = await api.get('/user/profile');
                setUser(res.data);
            } catch (err) {
                toast.error("فشل في تحميل بيانات الملف الشخصي");
                console.error("Profile Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="animate-spin text-emerald-600" size={40} />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
            <Toaster position="top-left" />
            <Sidebar role={user?.role} />

            <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-4xl font-black shadow-2xl group-hover:rotate-6 transition-transform overflow-hidden border border-slate-200">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="uppercase">{user?.full_name?.charAt(0) || <User size={40} />}</span>
                                )}
                            </div>
                            <button className="absolute -bottom-2 -right-2 p-2 bg-white text-slate-900 rounded-xl shadow-xl hover:scale-110 transition-transform border border-slate-100">
                                <Edit3 size={16} />
                            </button>
                        </div>
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-black mb-2 flex items-center gap-3 tracking-tighter text-slate-900">
                                {user?.full_name || 'مستخدم مساندة'}
                                <ShieldCheck className="text-emerald-500" size={24} />
                            </h1>
                            <p className="text-slate-400 font-medium flex items-center gap-2">
                                <Mail size={16} /> {user?.email}
                            </p>
                            <div className="flex gap-2 mt-4">
                                <span className="text-[10px] font-black px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg uppercase italic tracking-widest">
                                    {user?.job_title || 'Software Developer'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button className="p-4 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
                            <Settings size={20} className="text-slate-400" />
                        </button>
                        <button className="px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-slate-900 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
                            تعديل البيانات
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 delay-150">
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <p className="text-slate-900/70 text-sm font-bold mb-1 uppercase tracking-wider">النقاط المكتسبة</p>
                                <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tighter">
                                    {user?.points?.toLocaleString() || 0}
                                </h2>
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md w-fit px-4 py-2 rounded-xl border border-slate-200">
                                    <Award size={18} className="text-yellow-400" />
                                    <span className="text-xs font-bold text-slate-900">المستوى: {user?.rank || 'مبتدئ'}</span>
                                </div>
                            </div>
                            <Star className="absolute -bottom-10 -left-10 w-40 h-40 text-slate-900/10 -rotate-12 group-hover:rotate-0 transition-all duration-700" />
                        </div>

                        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
                            <h3 className="text-lg font-black mb-6 flex items-center gap-2 text-slate-900">
                                <Code size={20} className="text-emerald-500" /> المهارات التقنية
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {user?.skills?.length > 0 ? (
                                    user.skills.map((skill, i) => (
                                        <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-600 hover:border-emerald-500 transition-colors cursor-default">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-slate-400 text-sm italic">لم يتم إضافة مهارات بعد</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700 delay-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] flex items-center gap-6 hover:bg-slate-50 transition-all shadow-sm">
                                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <Clock size={32} />
                                </div>
                                <div>
                                    <p className="text-3xl font-black tracking-tighter text-slate-900">{user?.volunteer_hours || 0}</p>
                                    <p className="text-slate-400 text-xs font-bold uppercase">ساعة تطوع موثقة</p>
                                </div>
                            </div>
                            <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] flex items-center gap-6 hover:bg-slate-50 transition-all shadow-sm">
                                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-teal-600">
                                    <Award size={32} />
                                </div>
                                <div>
                                    <p className="text-3xl font-black tracking-tighter text-slate-900">{user?.completed_tasks || 0}</p>
                                    <p className="text-slate-400 text-xs font-bold uppercase">فرصة مكتملة</p>
                                </div>
                            </div>
                        </div>

                        {/* تم إزالة قسم الروابط المهنية (GitHub) بالكامل من هنا */}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;