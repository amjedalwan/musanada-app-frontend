import React, { useState, useEffect } from 'react';
import { Save, Camera, X, Plus, Loader2, User, Phone, BookOpen, MessageSquare } from 'lucide-react';
import api from '../api/axios';

const UpdateVolunteerProfile = ({ user, onSafeClose }) => {
    const [loading, setLoading] = useState(false);
    const [allSkills, setAllSkills] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState(user.profile?.skills || []);
    const [imagePreview, setImagePreview] = useState(user.profile_image_url);

    // البيانات التي سيتم إرسالها للباك إند
    const [formData, setFormData] = useState({
        full_name: user.full_name || '',
        phone: user.phone || '',
        university: user.profile?.university || '',
        major: user.profile?.major || '',
        bio: user.profile?.bio || '',
        profile_image: null
    });

    useEffect(() => {
        // جلب كل المهارات المتاحة في النظام لكي يختار منها
        api.get('/skills').then(res => setAllSkills(res.data.data));
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, profile_image: file });
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. تحديث البيانات الأساسية (نستخدم FormData بسبب الصورة)
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key]) data.append(key, formData[key]);
            });

            await api.post('/profile/update', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 2. تحديث المهارات (باستخدام دالة updateSkills في ProfileController)
            await api.post('/profile/skills', {
                skill_ids: selectedSkills.map(s => s.id)
            });

            alert("تم تحديث كافة البيانات بنجاح!");
            window.location.reload(); // لإعادة تحميل البيانات الجديدة
        } catch (err) {
            console.error(err);
            alert("حدث خطأ أثناء التحديث");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#0a0a16] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl transition-all font-['Tajawal']" dir="rtl">
            <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                <Settings className="text-indigo-500" /> تحديث بيانات الملف الشخصي
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* قسم الصورة الشخصية */}
                <div className="flex justify-center mb-8">
                    <div className="relative group">
                        <img src={imagePreview} className="w-32 h-32 rounded-3xl object-cover border-4 border-indigo-600/20" alt="Preview" />
                        <label className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                            <Camera className="text-white" />
                            <input type="file" hidden onChange={handleImageChange} accept="image/*" />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* الاسم الكامل */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 mr-2">الاسم الكامل</label>
                        <div className="relative">
                            <User className="absolute right-4 top-3 text-gray-500" size={18} />
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pr-12 pl-4 outline-none focus:border-indigo-500 text-white"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* الهاتف */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 mr-2">رقم الهاتف</label>
                        <div className="relative">
                            <Phone className="absolute right-4 top-3 text-gray-500" size={18} />
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pr-12 pl-4 outline-none focus:border-indigo-500 text-white text-left"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* الجامعة */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 mr-2">الجامعة</label>
                        <div className="relative">
                            <BookOpen className="absolute right-4 top-3 text-gray-500" size={18} />
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pr-12 pl-4 outline-none focus:border-indigo-500 text-white"
                                value={formData.university}
                                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* التخصص */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-400 mr-2">التخصص الدراسي</label>
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500 text-white"
                            value={formData.major}
                            onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                        />
                    </div>
                </div>

                {/* النبذة التعريفية */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-400 mr-2">نبذة تعريفية (Bio)</label>
                    <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-indigo-500 text-white h-32"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                </div>

                {/* قسم المهارات - Multi Select */}
                <div className="space-y-4">
                    <label className="text-sm text-gray-400 mr-2 font-bold">مهاراتي</label>
                    <div className="flex flex-wrap gap-2 mb-4 bg-black/20 p-4 rounded-3xl min-h-[60px]">
                        {selectedSkills.map(skill => (
                            <span key={skill.id} className="bg-indigo-600 text-white px-3 py-1 rounded-xl text-sm flex items-center gap-2">
                                {skill.name}
                                <X size={14} className="cursor-pointer" onClick={() => setSelectedSkills(selectedSkills.filter(s => s.id !== skill.id))} />
                            </span>
                        ))}
                    </div>
                    <select
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500 text-white"
                        onChange={(e) => {
                            const skill = allSkills.find(s => s.id === parseInt(e.target.value));
                            if (skill && !selectedSkills.find(s => s.id === skill.id)) {
                                setSelectedSkills([...selectedSkills, skill]);
                            }
                        }}
                    >
                        <option className="bg-gray-900 text-white" value="">اختر مهارة لإضافتها...</option>
                        {allSkills.map(s => <option className="bg-gray-900 text-white" key={s.id} value={s.id} className="bg-[#0a0a16]">{s.name}</option>)}
                    </select>
                </div>

                <button
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save />}
                    حفظ كافة التغييرات
                </button>
            </form>
        </div>
    );
};