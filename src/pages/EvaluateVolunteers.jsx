import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Star, Send, UserCheck, MessageSquare, ArrowRight, 
    Loader2, CheckCircle2, Award, ShieldCheck, Zap, 
    Search, Users, TrendingUp, Filter, Trash2
} from 'lucide-react';
import api from '../api/axios';
import { toast, Toaster } from 'react-hot-toast';

// مهارات افتراضية للتقييم السريع
const SKILL_TAGS = ["الالتزام بالوقت", "العمل الجماعي", "القيادة", "حل المشكلات", "التواصل الفعال"];

const EvaluateVolunteers = () => {
    const { opportunityId } = useParams();
    const navigate = useNavigate();
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [form, setForm] = useState({});

    // 1. جلب البيانات وتجهيز الحالة
    useEffect(() => {
        const fetchAcceptedVolunteers = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/org/opportunities/${opportunityId}/applicants?status=accepted`);
                const data = res.data.applicants || res.data || [];
                setVolunteers(data);

                const initialForm = {};
                data.forEach(v => {
                    initialForm[v.user_id] = { 
                        rating: 5, 
                        comment: "", 
                        selectedSkills: [] 
                    };
                });
                setForm(initialForm);
            } catch (err) {
                toast.error("فشل في تحديث قائمة المتطوعين");
            } finally {
                setLoading(false);
            }
        };
        fetchAcceptedVolunteers();
    }, [opportunityId]);

    // 2. دوال التحكم بالمدخلات
    const handleRating = (userId, value) => {
        setForm(prev => ({
            ...prev,
            [userId]: { ...prev[userId], rating: value }
        }));
    };

    const handleComment = (userId, text) => {
        setForm(prev => ({
            ...prev,
            [userId]: { ...prev[userId], comment: text }
        }));
    };

    const toggleSkill = (userId, skill) => {
        setForm(prev => {
            const currentSkills = prev[userId].selectedSkills;
            const newSkills = currentSkills.includes(skill)
                ? currentSkills.filter(s => s !== skill)
                : [...currentSkills, skill];
            return {
                ...prev,
                [userId]: { ...prev[userId], selectedSkills: newSkills }
            };
        });
    };

    // 3. الفلترة والبحث
    const filteredVolunteers = useMemo(() => {
        return volunteers.filter(v => 
            v.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [volunteers, searchTerm]);

    // 4. إرسال التقييم
    const handleSubmit = async (userId) => {
        if (submitting) return;
        try {
            setSubmitting(userId);
            const currentForm = form[userId];
            
            // دمج المهارات مع التعليق لإرسالها للباك إند
            const finalComment = `${currentForm.comment} [المهارات المميزة: ${currentForm.selectedSkills.join(', ')}]`;

            const payload = {
                user_id: userId,
                opportunity_id: parseInt(opportunityId),
                rating: currentForm.rating,
                comment: finalComment
            };

            await api.post('/org/reviews', payload);
            toast.success(`تم توثيق تقييم ${filteredVolunteers.find(v => v.user_id === userId)?.user?.name}`);

            setVolunteers(prev => prev.filter(v => v.user_id !== userId));
        } catch (err) {
            if (err.response?.status === 400) {
                toast.error("هذا المتطوع مقيم بالفعل");
                setVolunteers(prev => prev.filter(v => v.user_id !== userId));
            } else {
                toast.error("تعذر إرسال التقييم");
            }
        } finally {
            setSubmitting(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                    <Loader2 className="text-emerald-600" size={48} />
                </motion.div>
                <p className="text-slate-500 font-['Cairo'] animate-pulse">جاري جلب سجلات الفريق...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-['Cairo'] p-4 md:p-12" dir="rtl">
            <Toaster position="top-center" />

            {/* Header Section */}
            <header className="max-w-7xl mx-auto mb-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <motion.button
                            whileHover={{ x: 5 }}
                            onClick={() => navigate(-1)}
                            className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all"
                        >
                            <ArrowRight size={24} />
                        </motion.button>
                        <div>
                            <h1 className="text-4xl font-black bg-gradient-to-l from-white to-purple-400 bg-clip-text text-transparent">
                                منصة التقييم الرقمي
                            </h1>
                            <p className="text-slate-400 mt-2">إدارة وتوثيق أداء فريق مبادرة "مساندة"</p>
                        </div>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-4">
                            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-600"><Users size={20}/></div>
                            <div>
                                <p className="text-xs text-slate-400">إجمالي الفريق</p>
                                <p className="text-lg font-bold">{volunteers.length}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-4">
                            <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500"><TrendingUp size={20}/></div>
                            <div>
                                <p className="text-xs text-slate-400">التقييم المتوقع</p>
                                <p className="text-lg font-bold">4.9</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                {/* Search & Filter Bar */}
                <div className="mb-8 relative group">
                    <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="ابحث عن اسم متطوع محدد..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pr-14 pl-6 focus:outline-none focus:border-purple-500/50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Volunteers Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <AnimatePresence mode='popLayout'>
                        {filteredVolunteers.length > 0 ? (
                            filteredVolunteers.map((vol) => (
                                <motion.div
                                    key={vol.user_id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className="bg-gradient-to-b from-[#0f0f12] to-[#0a0a0c] border border-slate-100 p-8 rounded-[2.5rem] flex flex-col gap-8 hover:border-emerald-200 transition-all relative group"
                                >
                                    {/* Volunteer Identity */}
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-5">
                                            <div className="relative">
                                                <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 flex items-center justify-center border border-emerald-200">
                                                    <UserCheck className="text-emerald-600" size={36} />
                                                </div>
                                                <div className="absolute -top-2 -right-2 bg-green-500 p-1.5 rounded-lg">
                                                    <ShieldCheck size={14} className="text-black" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-2xl group-hover:text-emerald-600 transition-colors">
                                                    {vol.user?.name || "متطوع مساندة"}
                                                </h3>
                                                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                                                    <Award size={14} className="text-yellow-600" />
                                                    <span>عضو فعال في المنصة</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dynamic Star Rating */}
                                        <div className="flex gap-2 bg-black/60 p-3 rounded-2xl border border-slate-100 shadow-2xl">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => handleRating(vol.user_id, star)}
                                                    className="transition-transform hover:scale-125 active:scale-90"
                                                >
                                                    <Star
                                                        size={24}
                                                        fill={star <= (form[vol.user_id]?.rating || 0) ? "#a855f7" : "none"}
                                                        className={star <= (form[vol.user_id]?.rating || 0) ? "text-emerald-600" : "text-slate-400"}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Skills Feedback (New Feature) */}
                                    <div className="space-y-3">
                                        <p className="text-sm text-slate-400 flex items-center gap-2">
                                            <Zap size={14} className="text-yellow-500" />
                                            أبرز المهارات التي أظهرها المتطوع:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {SKILL_TAGS.map(skill => (
                                                <button
                                                    key={skill}
                                                    onClick={() => toggleSkill(vol.user_id, skill)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                        form[vol.user_id]?.selectedSkills?.includes(skill)
                                                            ? "bg-emerald-600 border-purple-400 text-slate-900 shadow-lg shadow-purple-500/20"
                                                            : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-50"
                                                    }`}
                                                >
                                                    {skill}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Comment Section */}
                                    <div className="relative">
                                        <textarea
                                            placeholder="أضف تعليقاً مخصصاً عن رحلته معك..."
                                            className="w-full bg-white border border-slate-100 rounded-3xl py-6 px-8 focus:outline-none focus:border-purple-500/50 text-sm h-36 resize-none transition-all placeholder:text-gray-800"
                                            value={form[vol.user_id]?.comment || ""}
                                            onChange={(e) => handleComment(vol.user_id, e.target.value)}
                                        />
                                        <MessageSquare className="absolute left-8 bottom-6 text-slate-900/5" size={28} />
                                    </div>

                                    {/* Submit Action */}
                                    <motion.button
                                        whileHover={{ y: -4, boxShadow: "0 20px 40px -15px rgba(139, 92, 246, 0.3)" }}
                                        whileTap={{ scale: 0.98 }}
                                        disabled={submitting === vol.user_id}
                                        onClick={() => handleSubmit(vol.user_id)}
                                        className="w-full bg-gradient-to-r from-purple-600 to-blue-700 py-6 rounded-3xl flex items-center justify-center gap-4 transition-all font-black text-xl disabled:grayscale"
                                    >
                                        {submitting === vol.user_id ? (
                                            <Loader2 className="animate-spin" size={28} />
                                        ) : (
                                            <>
                                                <Send size={22} className="rotate-[-20deg]" />
                                                اعتماد وتوثيق التقييم
                                            </>
                                        )}
                                    </motion.button>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full py-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[4rem] bg-white">
                                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-8 border border-green-500/20">
                                    <CheckCircle2 className="text-green-500" size={50} />
                                </div>
                                <h2 className="text-3xl font-bold mb-4">كافة التقارير جاهزة!</h2>
                                <p className="text-slate-400 text-center max-w-md px-6 leading-relaxed">
                                    تم الانتهاء من تقييم أداء جميع المتطوعين في هذه المبادرة بنجاح. يمكنك الآن العودة للوحة التحكم.
                                </p>
                                <button
                                    onClick={() => navigate('/org/dashboard')}
                                    className="mt-10 px-12 py-5 bg-white text-black font-black rounded-2xl hover:bg-emerald-500 hover:text-slate-900 transition-all"
                                >
                                    العودة للرئيسية
                                </button>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default EvaluateVolunteers;