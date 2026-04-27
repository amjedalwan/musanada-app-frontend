import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    PlusCircle, FileText, MapPin, Calendar, Layout, Loader2,
    Send, Users, Target, ShieldCheck, ChevronLeft, Clock,
    Activity, Filter, Navigation, Sparkles, Check, ChevronDown,
    Globe, Smartphone, Briefcase, Hash, AlignRight, Award,
    Map as MapIcon, Crosshair, Search, Info, Image as ImageIcon, X, Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import InteractiveMap from '../components/InteractiveMap';
import api from '../api/axios';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';



const CreateOpportunity = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [fetchingSkills, setFetchingSkills] = useState(true);
    const [skillsList, setSkillsList] = useState([]);
    const [skillSearch, setSkillSearch] = useState("");
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const user = useMemo(() => JSON.parse(localStorage.getItem('user') || '{}'), []);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'voluntary',
        location: '',
        lat: 15.3694,
        lng: 44.1910,
        duration: '',
        requirements: '',
        required_volunteers: 1,
        start_date: '',
        deadline: '',
        gender: 'both',
        skill_ids: [],
        cover_image: null
    });

    useEffect(() => {
        const fetchSkills = async () => {
            setLoading(true);
            try {
                const response = await api.get('/skills');
                setSkillsList(response.data.data || response.data || []);
            } catch (error) {
                console.log(error);
                toast.error("فشل في تحميل قائمة المهارات");
            } finally {
                setLoading(false)
                setFetchingSkills(false);
            }
        };
        fetchSkills();
    }, []);

    const filteredSkills = useMemo(() => {
        return skillsList.filter(skill =>
            skill.name.toLowerCase().includes(skillSearch.toLowerCase())
        );
    }, [skillsList, skillSearch]);


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) return toast.error("الحد الأقصى للصورة 2MB");
            setFormData(prev => ({ ...prev, cover_image: file }));
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) return toast.error("متصفحك لا يدعم تحديد الموقع");
        const loadingToast = toast.loading("جاري تحديد إحداثياتك...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
                toast.success("تم تحديث الموقع بنجاح", { id: loadingToast });
            },
            () => toast.error("فشل الوصول للموقع", { id: loadingToast })
        );
    };

    const handleLocationSelect = useCallback((lat, lng) => {
        if (lat !== null && lng !== null) {
            setFormData(prev => ({ ...prev, lat: parseFloat(lat), lng: parseFloat(lng) }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'required_volunteers' ? parseInt(value) || 1 : value
        }));
    };

    const toggleSkill = (skillId) => {
        setFormData(prev => {
            const exists = prev.skill_ids.includes(skillId);
            return {
                ...prev,
                skill_ids: exists
                    ? prev.skill_ids.filter(id => id !== skillId)
                    : [...prev.skill_ids, skillId]
            };
        });
    };


    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };
    const handleSubmit = async (e) => {
        e.preventDefault();


        const startDate = new Date(formData.start_date);
        const selectedDate = new Date(formData.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        if (!formData.start_date) {
            return toast.error("يرجى تحديد تاريخ بداية الفرصة");
        }


        if (startDate.toDateString() == today.toDateString()) {
            return toast.error("يجب أن يكون الموعد البداية في في هذا اليوم");
        }
        if (startDate < today) {
            return toast.error(" يجب أن يكون الموعد البداية في الماضي");
        }

        if (selectedDate <= startDate) {
            return toast.error("يجب أن يكون الموعد النهائي بعد تاريخ البداية");
        }
        if (!formData.deadline) {
            return toast.error("يرجى تحديد الموعد النهائي للفرصة");
        }
        if (!formData.cover_image) {
            return toast.error("يرجى اختيار صورة للغلاف");
        }


        if (!formData.required_volunteers || formData.required_volunteers <= 0) {
            return toast.error("يرجى إدخال عدد متطوعين صحيح (أكبر من 0)");
        }

        if (formData.skill_ids.length === 0) {
            return toast.error("يرجى اختيار مهارة واحدة على الأقل");
        }


        if (formData.title.trim().length < 5) {
            return toast.error("عنوان الفرصة قصير جداً");
        }
        if (formData.start_date && formData.deadline) {
            const start = new Date(formData.start_date);
            const end = new Date(formData.deadline);

            if (start > end) {
                return toast.error("منطقياً: يجب أن ينتهي التقديم قبل تاريخ بداية الفرصة");
            }
        }

        setSaving(true);

        const data = new FormData();

        // إضافة الحقول بشكل آمن
        Object.keys(formData).forEach(key => {
            if (key === 'skill_ids') {
                formData.skill_ids.forEach(sid => data.append('skill_ids[]', sid));
            } else if (key === 'cover_image') {
                if (formData.cover_image) {
                    data.append('cover_image', formData.cover_image);
                } else {
                    return toast.error("يرجى اختيار صورة للغلاف");
                }
            } else {

                data.append(key, formData[key] !== null ? formData[key] : '');
            }
        });

        data.append('_method', 'POST');

        try {

            await api.post(`/org/opportunities`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Swal.fire({
                icon: 'success',
                title: 'نجحت العملية !',
                text: '"تم انشاء و نشر الفرصة بنجاح!',
                background: '#0a0a0c',
                color: '#fff',
                confirmButtonColor: '#7c3aed',
                customClass: {
                    popup: 'rounded-[2rem] border border-white/10'
                }
            });

            navigate(-1);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "حدث خطأ أثناء محاولة النشر";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#050508] text-slate-200 font-sans" dir="rtl">
            <Toaster position="top-center" />
            <Sidebar role={user?.role} />
            {/* Grid Container */}
            {loading ? (
                <LoadingSpinner />
            ) : (
                <main className="flex-1 p-4 lg:p-10 overflow-y-auto relative custom-scrollbar">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full" />
                    </div>

                    <div className="max-w-6xl mx-auto">
                        {/* الرأس */}
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-10">
                            <div>
                                <h1 className="text-3xl font-black text-white flex items-center gap-4">
                                    <div className="p-2 bg-indigo-500/20 rounded-2xl">
                                        <PlusCircle className="text-indigo-400" size={32} />
                                    </div>
                                    إنشاء فرصة <span className="text-indigo-400">جديدة</span>
                                </h1>
                            </div>
                            <button onClick={() => navigate(-1)} className="px-5 py-2 bg-white/5 rounded-xl flex items-center gap-2 text-sm border border-white/10 hover:bg-white/10 transition-all">
                                <ChevronLeft size={18} /> تراجع
                            </button>
                        </motion.div>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">

                            {/* الجانب الأيمن */}
                            <div className="lg:col-span-8 space-y-8">

                                {/* قسم رفع الغلاف */}
                                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#0c0c14] border border-white/5 rounded-[2rem] p-6 shadow-2xl overflow-hidden group">
                                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                                        <ImageIcon className="text-indigo-400" size={20} />
                                        <h3 className="text-lg font-bold text-white">غلاف الفرصة</h3>
                                    </div>

                                    <div
                                        onClick={() => fileInputRef.current.click()}
                                        className="relative h-64 bg-white/[0.03] border-2 border-dashed border-white/10 rounded-3xl overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all group"
                                    >
                                        {imagePreview ? (
                                            <>
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20">
                                                        <Camera size={32} />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                                <Camera size={40} className="mb-2" />
                                                <p>اضغط لاختيار غلاف للفرصة (Max 2MB)</p>
                                            </div>
                                        )}
                                        <input type="file" ref={fileInputRef} hidden onChange={handleImageChange} accept="cover_image/*" />
                                    </div>
                                </motion.section>

                                {/* معلومات أساسية */}
                                <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#0c0c14] border border-white/5 rounded-[2rem] p-6 md:p-8 shadow-2xl">
                                    <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-5">
                                        <FileText className="text-indigo-400" size={22} />
                                        <h3 className="text-lg font-bold text-white">المعلومات الأساسية</h3>
                                    </div>

                                    <div className="space-y-6">

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-3 block">عنوان الفرصة</label>
                                                <input
                                                    name="title" required value={formData.title} onChange={handleChange}
                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 focus:border-indigo-500 outline-none transition-all text-white"
                                                    placeholder="عنوان جذاب للفرصة..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-3 block">موقع الفرصة </label>
                                                <input
                                                    name="location" required value={formData.location} onChange={handleChange}
                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 focus:border-indigo-500 outline-none transition-all text-white"
                                                    placeholder=" مثلا : المجاردة - جامعة الملك خالد .."
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-3 block">مدة العمل</label>
                                                <input name="duration" value={formData.duration} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 outline-none text-white focus:border-indigo-500" placeholder="مثلاً: 3 أيام" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-3 block">المتطلبات</label>
                                                <input name="requirements" value={formData.requirements} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 outline-none text-white focus:border-indigo-500" placeholder="مثلاً: لابتوب" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-gray-500 mb-3 block">الوصف التفصيلي</label>
                                            <textarea
                                                name="description" required rows="5" value={formData.description} onChange={handleChange}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 focus:border-indigo-500 outline-none text-gray-300 resize-none"
                                                placeholder="اشرح المهام والهدف من الفرصة..."
                                            />
                                        </div>
                                    </div>
                                </motion.section>

                                {/* الخريطة */}
                                <motion.section className="bg-[#0c0c14] border border-white/5 rounded-[2rem] p-6 shadow-2xl">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3"><MapIcon className="text-emerald-400" size={22} /><h3 className="text-lg font-bold text-white">موقع التنفيذ</h3></div>
                                        <button type="button" onClick={getCurrentLocation} className="text-xs font-black text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20">تحديد موقعي</button>
                                    </div>
                                    <div className="h-[350px] rounded-[1.5rem] overflow-hidden border border-white/10 relative">
                                        <InteractiveMap lat={formData.lat} lng={formData.lng} onLocationSelect={handleLocationSelect} isEditing={true} />
                                    </div>
                                </motion.section>
                            </div>


                            {/* الجانب الأيسر (الإعدادات) */}
                            <div className="lg:col-span-4 space-y-8">
                                <motion.section className="bg-[#0c0c14] border border-white/5 rounded-[2rem] p-6 shadow-2xl sticky top-8">
                                    <div className="space-y-8">
                                        {/* التصنيف */}

                                        <div>
                                            <label className="text-[10px] text-gray-500 font-black mb-3 block uppercase">تصنيف الفرصة</label>
                                            <div className="relative">
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />

                                                <select
                                                    name="type"
                                                    value={formData.type}
                                                    onChange={handleChange}
                                                    className="filter-select"
                                                >
                                                    <option className="bg-gray-900 text-white" value="voluntary">تطوعي</option>
                                                    <option className="bg-gray-900 text-white" value="training">تدريب تعاوني</option>
                                                    <option className="bg-gray-900 text-white" value="course">دورة تدريبية</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* المهارات داخل الصندوق الجانبي لسرعة الوصول */}
                                        <div>
                                            <label className="text-[10px] text-gray-500 font-black mb-3 block uppercase">المهارات ({formData.skill_ids.length})</label>
                                            <div className="relative mb-3">
                                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                                                <input type="text" placeholder="بحث..." value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pr-9 pl-3 text-xs outline-none focus:border-indigo-500" />
                                            </div>
                                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                                                {filteredSkills.map(skill => (
                                                    <button
                                                        key={skill.id} type="button" onClick={() => toggleSkill(skill.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${formData.skill_ids.includes(skill.id) ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
                                                    >
                                                        {skill.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* عدد المتطوعين */}
                                        <div>
                                            <label className="text-[10px] text-gray-500 font-black mb-3 block uppercase">العدد المطلوب</label>
                                            <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-2xl p-3">
                                                <Users size={20} className="text-indigo-400" />
                                                <input type="number" name="required_volunteers" min="1" value={formData.required_volunteers} onChange={handleChange} className="bg-transparent w-full outline-none font-bold text-white" />
                                            </div>
                                        </div>
                                        {/* اختيار الجنس */}
                                        <div>
                                            <label className="text-[10px] text-gray-500 font-black mb-3 block uppercase">الجنس المطلوب</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['both', 'male', 'female'].map((g) => (
                                                    <button
                                                        key={g}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                                                        className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${formData.gender === g
                                                            ? 'bg-indigo-600 border-indigo-400 text-white'
                                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {g === 'both' ? 'الكل' : g === 'male' ? 'ذكور' : 'إناث'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 flex w-full flex-row">
                                            {/* تاريخ البداية */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase">
                                                    <Calendar size={14} /> تاريخ البداية
                                                </label>
                                                <input
                                                    type="date"
                                                    className="text-sm w-full md:text-md bg-white/[0.05] border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-purple-500 transition-all"
                                                    value={formData.start_date}
                                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                />
                                            </div>

                                            {/* الموعد النهائي (موجود مسبقاً) */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase">
                                                    <Calendar size={14} /> تاريخ الانتهاء
                                                </label>
                                                <input
                                                    type="date"
                                                    className="w-full text-sm md:text-md bg-white/[0.05] border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-purple-500 transition-all"
                                                    value={formData.deadline}
                                                    min={formData.start_date || getTomorrowDate()} // التقديم ينتهي بعد البداية أو غداً
                                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                                />
                                            </div>
                                        </div>



                                        {/* زر النشر */}
                                        <button
                                            type="submit" disabled={saving}
                                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 text-white rounded-2xl py-4 font-black flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                                        >
                                            {saving ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> نشر الفرصة</>}
                                        </button>
                                    </div>
                                </motion.section>
                            </div>
                        </form>
                    </div>
                </main>
            )}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar:: -webkit-scrollbar { width: 4px; }
                    .custom-scrollbar:: -webkit-scrollbar-thumb { background: #1e1e2e; border- radius: 10px;
        }
                input[type = "date"]:: -webkit-calendar-picker-indicator { filter: invert(0.8); cursor: pointer; }
        `}} />
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

export default CreateOpportunity;