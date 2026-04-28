import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Save, ArrowRight, Loader2, MapPin, Users,
    AlignLeft, Image as ImageIcon, Camera,
    Calendar, FileText, Target, Info, Globe,
    Clock
} from 'lucide-react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import InteractiveMap from '../components/InteractiveMap'; // المكون الذي أنشأته أنت
import Swal from 'sweetalert2';
import toast, { Toaster } from 'react-hot-toast';

const EditOpportunity = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [skillsList, setSkillsList] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        lat: 15.3694,
        duration:'',
        lng: 44.1910,
        required_volunteers: '',
        start_date: '',
        deadline: '',
        status: 'open',
        type: 'voluntary',
        gender: 'both',
        skill_ids: [],
        cover_image: null,
    });
    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            return toast.error("متصفحك لا يدعم خاصية تحديد الموقع");
        }

        const toastId = toast.loading("جاري تحديد موقعك...");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({
                    ...prev,
                    lat: latitude,
                    lng: longitude
                }));
                toast.success("تم تحديد موقعك بنجاح", { id: toastId });
            },
            (error) => {
                console.error(error);
                toast.error("فشل الوصول إلى موقعك، تأكد من تفعيل الـ GPS وصلاحيات المتصفح", { id: toastId });
            },
            { enableHighAccuracy: true }
        );
    };
    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };
  
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [oppRes, skillsRes] = await Promise.all([
                    api.get(`/opportunities/${id}`),
                    api.get('/skills')
                ]);

                const data = oppRes.data;
              
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    location: data.location || '',
                    duration:data.duration  || '',
                    lat: parseFloat(data.lat) || 15.3694,
                    lng: parseFloat(data.lng) || 44.1910,
                    required_volunteers: data.required_volunteers || '',
                    start_date: data.start_date || '',
                    deadline: data.deadline || '',
                    status: data.status || 'open',
                    type: data.type || 'voluntary',
                    gender: data.gender || 'both',
                    skill_ids: data.skills ? data.skills.map(s => s.id) : [],
                    cover_image: null // يبقى نل إلا إذا اختار المستخدم صورة جديدة
                });

                // تعديل عرض الصورة: تأكد من إضافة رابط السيرفر إذا كان المسار مخزن كـ relative path
                if (data.cover_image) {
                    setImagePreview(data.cover_image); // سيعطي الرابط الكامل مباشرة
                }
                setSkillsList(skillsRes.data.data || []);
            } catch (err) {
                toast.error("فشل في تحميل بيانات الفرصة");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);
    // 2. معالجة تغيير الصورة
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


    // 3. تحديث الإحداثيات من الخريطة
    const handleLocationSelect = (lat, lng) => {
        setFormData(prev => ({ ...prev, lat, lng }));
    };

    // 4. معالجة اختيار المهارات
    const toggleSkill = (skillId) => {
        setFormData(prev => ({
            ...prev,
            skill_ids: prev.skill_ids.includes(skillId)
                ? prev.skill_ids.filter(i => i !== skillId)
                : [...prev.skill_ids, skillId]
        }));
    };

    // 5. إرسال البيانات (Handle Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        // أ- التحقق من التاريخ (يجب أن يكون من غدٍ فصاعداً)
        const startDate = new Date(formData.start_date);
        const selectedDate = new Date(formData.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // ضبط الوقت للصفر للمقارنة بين التواريخ فقط

        if (!formData.start_date) {
            return toast.error("يرجى تحديد تاريخ بداية الفرصة");
        }



        if (selectedDate <= startDate) {
            return toast.error("يجب أن يكون الموعد النهائي بعد تاريخ البداية");
        }
        if (!formData.deadline) {
            return toast.error("يرجى تحديد الموعد النهائي للفرصة");
        }


  // ب- التحقق من عدد المتطوعين
        if (!formData.duration || formData.duration <= 0) {
            return toast.error("يرجى إدخال الوقت المتوقع)");
        }
      
        // ب- التحقق من عدد المتطوعين
        if (!formData.required_volunteers || formData.required_volunteers <= 0) {
            return toast.error("يرجى إدخال عدد متطوعين صحيح (أكبر من 0)");
        }

        // ج- التحقق من اختيار مهارات
        if (formData.skill_ids.length === 0) {
            return toast.error("يرجى اختيار مهارة واحدة على الأقل");
        }

        // د- التحقق من العنوان والوصف
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
        // --- 2. تجهيز البيانات للإرسال ---
        setSaving(true);

        const data = new FormData();

        // إضافة الحقول بشكل آمن
        Object.keys(formData).forEach(key => {
            if (key === 'skill_ids') {
                formData.skill_ids.forEach(sid => data.append('skill_ids[]', sid));
            } else if (key === 'cover_image') {
                // نرسل الصورة فقط إذا قام المستخدم بتغييرها (اختيار ملف جديد)
                if (formData.cover_image instanceof File) {
                    data.append('cover_image', formData.cover_image);
                }
            } else {
                // تجنب إرسال القيم الفارغة كـ "null" نصية
                data.append(key, formData[key] !== null ? formData[key] : '');
            }
        });

        // الحل الجوهري لـ Laravel لاستقبال FormData مع طريقة UPDATE (نستخدم POST ونمرر _method)
        data.append('_method', 'POST');

        try {

            await api.post(`/org/opportunities/${id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Swal.fire({
                icon: 'success',
                title: 'تم التحديث بنجاح!',
                text: 'تم حفظ كافة التغييرات وتحديث بيانات الفرصة',
                background: '#0a0a0c',
                color: '#fff',
                confirmButtonColor: '#7c3aed',
                customClass: {
                    popup: 'rounded-[2rem] border border-white/10'
                }
            });

            navigate('/manage-opportunities');
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || "حدث خطأ أثناء محاولة التحديث";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex min-h-screen bg-[#020205] items-center justify-center">
            <Loader2 className="animate-spin text-purple-500" size={40} />
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#020205] text-white font-['Cairo']" dir="rtl">
            <Toaster position="top-left" />
            <Sidebar role="organization" />

            <main className="flex-1 p-6 lg:p-12 overflow-y-auto">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

                    {/* Header */}
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h1 className="text-4xl font-black bg-gradient-to-l from-white to-gray-500 bg-clip-text text-transparent">
                                تعديل الفرصة
                            </h1>
                            <p className="text-gray-500 mt-2 text-sm">قم بتحديث معلومات الفرصة والموقع الجغرافي</p>
                        </div>
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl">
                            <ArrowRight size={20} /> العودة
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* العمود الأيسر: البيانات الأساسية */}
                        <div className="lg:col-span-8 space-y-6">

                           

                            {/* Content Section */}
                            <div className="bg-white/[0.02] border border-white/10 p-8 rounded-[2.5rem] space-y-6">
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-400"><AlignLeft size={16} /> عنوان الفرصة</label>
                                    <input
                                        type="text" required
                                        className="w-full bg-white/[0.05] border border-white/10 rounded-2xl py-4 px-6 focus:border-purple-500 outline-none transition-all text-xl font-bold"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-400"><FileText size={16} /> وصف التفاصيل والمتطلبات</label>
                                    <textarea
                                        rows="8" required
                                        className="w-full bg-white/[0.05] border border-white/10 rounded-2xl py-4 px-6 focus:border-purple-500 outline-none transition-all resize-none leading-relaxed"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Map Card */}
                            <div className="bg-white/[0.02] border border-white/10 p-6 rounded-[2.5rem] space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-wider">
                                        <Globe size={14} /> الموقع الجغرافي الدقيق
                                    </label>

                                    {/* زر الـ GPS الجديد */}
                                    <button
                                        type="button"
                                        onClick={handleGetCurrentLocation}
                                        className="flex items-center gap-1 text-[10px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-full border border-purple-500/20 transition-all group"
                                    >
                                        <MapPin size={12} className="group-hover:animate-bounce" />
                                        تحديد موقعي الآن
                                    </button>
                                </div>

                                <div className="h-64 rounded-3xl overflow-hidden border border-white/10 relative z-0 shadow-2xl">
                                    <InteractiveMap
                                        lat={formData.lat}
                                        lng={formData.lng}
                                        onLocationSelect={handleLocationSelect}
                                        isEditing={true}
                                    />
                                </div>

                                <input
                                    type="text"
                                    placeholder="وصف الموقع (مثال:  الرياض - الدرعية)"
                                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 px-4 outline-none text-sm focus:border-purple-500/50 transition-all"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* العمود الأيمن: الإعدادات والخرائط */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Configuration Card */}
                             {/* Image Section */}
                            <div className="bg-white/[0.02] border border-white/10 p-6 rounded-[2.5rem]">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-4">
                                    <ImageIcon size={18} /> صورة الغلاف المطورة
                                </label>
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
                                            <p>اضغط لتغيير الصورة (Max 2MB)</p>
                                        </div>
                                    )}
                                    <input type="file" ref={fileInputRef} hidden onChange={handleImageChange} accept="image/*" />
                                </div>
                            </div>
                            <div className="bg-white/[0.02] border border-white/10 p-6 rounded-[2.5rem] space-y-5">

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase">النوع</label>
                                        <select
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-purple-400 outline-none"
                                        >
                                            <option className="bg-gray-900 text-white" value="voluntary">تطوعي</option>
                                            <option className="bg-gray-900 text-white" value="training">تدريب</option>
                                            <option className="bg-gray-900 text-white" value="course">دورة</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase">الجنس</label>
                                        <select
                                            value={formData.gender}
                                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none"
                                        >
                                            <option className="bg-gray-900 text-white" value="both">للجنسين</option>
                                            <option className="bg-gray-900 text-white" value="male">ذكور</option>
                                            <option className="bg-gray-900 text-white" value="female">إناث</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase"><Clock size={14} /> الوقت المتوقع</label>
                                    <input
                                        type="text"
                                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 px-4 outline-none"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase"><Users size={14} /> العدد المطلوب</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 px-4 outline-none"
                                        value={formData.required_volunteers}
                                        onChange={(e) => setFormData({ ...formData, required_volunteers: e.target.value })}
                                    />
                                </div>
                                {/* قسم التواريخ داخل الكارد الأيمن */}
                                <div className="grid grid-cols-1 gap-4">
                                    {/* تاريخ البداية */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase">
                                            <Calendar size={14} /> تاريخ البداية
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-purple-500 transition-all"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        />
                                    </div>

                                    {/* الموعد النهائي (موجود مسبقاً) */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase">
                                            <Calendar size={14} />تاريخ الانتهاء
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full bg-white/[0.05] border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-purple-500 transition-all"
                                            value={formData.deadline}
                                           
                                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <label className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase"><Target size={14} /> المهارات المطلوبة</label>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                                        {skillsList.map(skill => (
                                            <button
                                                key={skill.id} type="button"
                                                onClick={() => toggleSkill(skill.id)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${formData.skill_ids.includes(skill.id)
                                                    ? 'bg-purple-600 border-purple-400 text-white'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                                    }`}
                                            >
                                                {skill.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Save Button */}
                                <button
                                    disabled={saving}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    حفظ كافة التغييرات
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </main>
        </div>
    );
};

export default EditOpportunity;