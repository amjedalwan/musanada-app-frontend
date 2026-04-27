import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, MapPin, Users, Clock, AlignRight } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const AddOpportunityModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location: '',
        duration: '',
        required_volunteers: 1,
        deadline: '',
        type: 'voluntary',
        gender: 'both',
        skill_ids: [] // يمكنك لاحقاً إضافة اختيار المهارات هنا
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();

        Object.keys(formData).forEach(key => {
            if (key === 'skill_ids') {
                formData[key].forEach(id => data.append('skill_ids[]', id));
            } else {
                data.append(key, formData[key]);
            }
        });

        if (image) data.append('cover_image', image);

        try {
            await api.post('/opportunities', data);
            toast.success("تم نشر الفرصة بنجاح!");
            onSuccess();
        } catch (err) {
            toast.error("تأكد من إكمال كافة الحقول المطلوبة");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Side Panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full max-w-2xl bg-[#0b0b14] h-full shadow-2xl overflow-y-auto border-r border-white/10 custom-scrollbar"
            >
                <div className="p-8">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-white">نشر فرصة جديدة</h2>
                            <p className="text-gray-500 text-sm mt-1">أدخل تفاصيل الفرصة لجذب المتطوعين المناسبين</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors text-gray-400">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 pb-20">

                        {/* Title */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-400">
                                <AlignRight size={16} className="text-purple-500" /> عنوان الفرصة
                            </label>
                            <input
                                required type="text"
                                placeholder="مثال: تنظيم مهرجان التقنية الأول"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-2 ring-purple-500/50 outline-none transition-all placeholder:text-gray-700"
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400">وصف الفرصة</label>
                            <textarea
                                required rows="4"
                                placeholder="اكتب تفاصيل الفرصة، المهام المطلوبة، والمزايا..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-2 ring-purple-500/50 outline-none transition-all placeholder:text-gray-700"
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* Grid Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-400">
                                    <MapPin size={16} /> الموقع
                                </label>
                                <input
                                    required type="text" placeholder="مثال: الرياض - حي العليا"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-2 ring-purple-500/50 outline-none"
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-400">
                                    <Users size={16} /> العدد المطلوب
                                </label>
                                <input
                                    required type="number" min="1"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 focus:ring-2 ring-purple-500/50 outline-none"
                                    onChange={(e) => setFormData({ ...formData, required_volunteers: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400">نوع الفرصة</label>
                                <select
                                    className="w-full bg-[#161625] border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 ring-purple-500/50"
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option className="bg-gray-900 text-white" value="voluntary">تطوعية</option>
                                    <option className="bg-gray-900 text-white" value="training">تدريب تعاوني</option>
                                    <option className="bg-gray-900 text-white" value="course">دورة تدريبية</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-400">
                                    <Clock size={16} /> آخر موعد للتقديم
                                </label>
                                <input
                                    required type="date"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:ring-2 ring-purple-500/50"
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* مكان رفع الصورة الغلاف */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400 text-right block">صورة الغلاف (اختياري)</label>
                            <div className="relative group cursor-pointer">
                                <input
                                    type="file" accept="image/*"
                                    className="absolute inset-0 opacity-0 z-20 cursor-pointer"
                                    onChange={handleImageChange}
                                />
                                <div className={`w-full h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all ${preview ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/10 bg-white/5 group-hover:bg-white/10'}`}>
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-[1.9rem]" />
                                    ) : (
                                        <>
                                            <Upload className="text-gray-500 mb-2" />
                                            <span className="text-sm text-gray-500">اسحب الصورة أو انقر هنا</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-5 rounded-[2rem] font-black text-xl transition-all mt-10 shadow-xl shadow-purple-500/10 active:scale-95">
                            تأكيد ونشر الفرصة الآن
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default AddOpportunityModal;