import React, { useState, useEffect, useCallback } from 'react';
import InteractiveMap from '../components/InteractiveMap';
import {
    Building2, Globe, ShieldCheck, MapPin, Edit3, Save, X, Camera,
    Loader2, Lock, EyeOff, Star, Eye, UserCheck, Mail, Navigation, FileText, Phone,
    LocateFixed, ExternalLink, Award, Calendar, Info, CheckCircle2, User, AlertCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import Swal from 'sweetalert2';

const OrgProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [showPassModal, setShowPassModal] = useState(false);
    const [passData, setPassData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
    const [passLoading, setPassLoading] = useState(false);
    // دالة لفحص قوة كلمة المرور (Helper)
    const getPasswordStrength = (pass) => {
        if (!pass) return 0;
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return score;
    };


    // دالة تحديث النص داخل الحقول

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (passData.new_password !== passData.new_password_confirmation) {
            return Swal.fire({ icon: 'error', title: 'خطأ', text: 'كلمة المرور الجديدة غير متطابقة' });
        }

        setPassLoading(true);
        try {
            // يجب أن نرسل الحقول بالأسماء التي يتوقعها الـ Validation في Laravel
            await api.post('/profile/update-password', {
                current_password: passData.current_password,
                new_password: passData.new_password, // تأكد أن الاسم هنا new_password
                new_password_confirmation: passData.new_password_confirmation // وهذا الحقل ضروري لعمل الـ confirmed في لارافيل
            });

            Swal.fire({ icon: 'success', title: 'تم التحديث', text: 'تم تغيير كلمة المرور بنجاح', timer: 2000 });
            setShowPassModal(false);
            setPassData({ current_password: '', new_password: '', new_password_confirmation: '' });
        } catch (err) {
            // إذا كان الخطأ 422، سنعرض رسائل الخطأ القادمة من Laravel
            const errors = err.response?.data?.errors;
            let msg = err.response?.data?.message || 'فشل تحديث كلمة المرور';

            if (errors) {
                msg = Object.values(errors).flat().join('<br>');
            }

            Swal.fire({ icon: 'error', title: 'فشل التحديث', html: msg });
        } finally {
            setPassLoading(false);
        }
    };
    const [formData, setFormData] = useState({
        full_name: '', email: '', phone: '', location: '', lat: '', lng: '',
        org_name: '', org_type: 'خيرية', website: '', description: '',
        contact_person: '', digital_signature: '', profile_image: null
    });

    const fetchProfile = useCallback(async () => {
        try {
            const res = await api.get('/profile');
            const data = res.data;
            setProfile(data);
            setFormData({
                full_name: data.full_name || '',
                email: data.email || '',
                phone: data.phone || '',
                location: data.location || '',
                lat: data.lat || '',
                lng: data.lng || '',
                org_name: data.organization?.org_name || '',
                org_type: data.organization?.org_type || 'خيرية',
                website: data.organization?.website || '',
                description: data.organization?.description || '',
                contact_person: data.organization?.contact_person || '',
                digital_signature: data.organization?.digital_signature || '',
                profile_image: null
            });
            setImagePreview(data.profile_image_url);
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل في جلب البيانات' });
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            Swal.fire({ icon: 'error', title: 'تنبيه', text: 'متصفحك لا يدعم تحديد الموقع' });
            return;
        }
        navigator.geolocation.getCurrentPosition((pos) => {
            setFormData(prev => ({ ...prev, lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }));
            Swal.fire({ icon: 'success', title: 'تم التحديد', timer: 1000, showConfirmButton: false });
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = new FormData();

            Object.keys(formData).forEach(key => {
                // معالجة الصور (صورة البروفايل والتوقيع الرقمي)
                if (key === 'profile_image' || key === 'digital_signature') {
                    if (formData[key] instanceof File) {
                        data.append(key, formData[key]);
                    }
                } else if (formData[key] !== null && formData[key] !== undefined) {
                    data.append(key, formData[key]);
                }
            });

            // إرسال الطلب
            await api.post('/profile/update', data);

            setIsEditing(false);
            Swal.fire({ icon: 'success', title:'تم تحديث البيانات بنجاح', timer: 1500 });
            fetchProfile();
        } catch (err) {
            // عرض تفاصيل الخطأ 422 بشكل أفضل لنعرف أي حقل فشل
            const errorMsg = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join(' | ')
                : err.response?.data?.message || 'فشل الحفظ';

            Swal.fire({ icon: 'error', title: 'فشل الحفظ', text: errorMsg });
        } finally { setSaving(false); }
    };

    if (loading) return (
        <div className="h-screen bg-slate-50 flex items-center justify-center">
            <Loader2 className="animate-spin text-emerald-600" size={40} />
        </div>
    );

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-['Tajawal']" dir="rtl">
            <Sidebar role="organization" />

            <main className="flex-1  p-6 lg:p-10 relative z-10 overflow-y-auto max-h-screen custom-scrollbar">
                <div className="max-w-7xl mx-auto space-y-8"> 
                    {/* Header Action Bar */}
                    <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50 p-5 rounded-[2.5rem] border border-slate-200 backdrop-blur-xl sticky top-4 z-[100]">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                                <Building2 className="text-emerald-600" size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">إدارة الملف المؤسسي</h2>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    {formData.full_name || 'مسؤول النظام'}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            {!isEditing ? (
                                <button onClick={() => setIsEditing(true)} className="group flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600/40 hover:bg-emerald-500/80 px-8 py-3 rounded-2xl transition-all font-bold shadow-lg shadow-indigo-600/25 active:scale-95">
                                    <Edit3 size={18} className="group-hover:rotate-12 transition-transform" /> تعديل البيانات
                                </button>
                            ) : (
                                <div className="flex gap-3 w-full">
                                    <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95">
                                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} حفظ التغييرات
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="bg-slate-50 hover:bg-red-500/10 text-red-400 px-6 py-3 rounded-2xl border border-slate-200 transition-colors">إلغاء</button>
                                </div>
                            )}
                        </div>
                    </header>
                    <ContactItem
                        icon={<Calendar size={18} className="text-orange-400" />}
                        label="أوقات الدوام"
                        value={formData.work_hours || "8:00 AM - 2:00 PM"}
                        isEditing={isEditing}
                        onChange={(v) => setFormData({ ...formData, work_hours: v })}
                    />
                    <div className="grid grid-cols-12 gap-8">

                        {/* 1. Identity & Brand Section */}
                        <section className="col-span-12 lg:col-span-8 bg-gradient-to-br from-indigo-500/[0.07] via-transparent to-transparent border border-slate-200 rounded-[3rem] p-8 md:p-12 relative overflow-hidden group shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

                            <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
                                <div className="relative group/avatar">
                                    <div className="w-40 h-40 md:w-48 md:h-48 bg-black rounded-[3rem] border-4 border-slate-100 overflow-hidden shadow-2xl transition-all duration-500 group-hover/avatar:rounded-[2rem] group-hover/avatar:border-emerald-500/50">
                                        <img src={imagePreview || 'https://ui-avatars.com/api/?name=' + formData.full_name} className="w-full h-full object-cover" alt="Avatar" />
                                        {isEditing && (
                                            <label className="absolute inset-0 bg-emerald-900/60 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-all">
                                                <Camera className="text-slate-900 mb-2" size={32} />
                                                <input type="file" hidden accept="image/*" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setFormData({ ...formData, profile_image: file });
                                                        setImagePreview(URL.createObjectURL(file));
                                                    }
                                                }} />
                                            </label>
                                        )}
                                    </div>
                                    {profile?.organization?.is_verified && (
                                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2.5 rounded-2xl border-4 border-[#050508] shadow-xl">
                                            <ShieldCheck size={24} className="text-slate-900" />
                                        </div>
                                    )}
                                </div>

                                <div className="text-center md:text-right flex-1 space-y-6">
                                    {isEditing ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                            {/* تعديل اسم المؤسسة */}
                                            <div className="relative group/input">
                                                <Tooltip text="يظهر هذا الاسم في جميع التقارير والمراسلات الرسمية" />
                                                <input
                                                    className="text-3xl font-black bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 w-full text-slate-900 outline-none focus:ring-2 ring-indigo-500/50 transition-all placeholder:text-slate-700"
                                                    value={formData.org_name}
                                                    onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                                                    placeholder="اسم المؤسسة الرسمي"
                                                />
                                            </div>

                                            {/* تعديل اسم المدير */}
                                            <div className="relative group/input">
                                                <Tooltip text="اسم المدير المسؤول عن إدارة هذا الحساب" />
                                                <div className="relative">
                                                    <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                                                    <input
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-12 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500"
                                                        value={formData.full_name}
                                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                        placeholder="اسم المدير المسؤول"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row gap-3">
                                                <div className="flex-1 relative group/input">
                                                    <Tooltip text="العنوان المختصر الذي سيظهر في بطاقة التعريف" />
                                                    <input
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500"
                                                        value={formData.location}
                                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                        placeholder="المدينة - الحي"
                                                    />
                                                </div>
                                                <div className="relative min-w-[140px] group/input">
                                                    <Tooltip text="يساعد في تصنيف مؤسستك ضمن محركات البحث" />
                                                    <select
                                                        className="w-full bg-[#1a1a24] border border-slate-200 rounded-xl px-4 py-2 text-sm text-emerald-600 outline-none appearance-none cursor-pointer"
                                                        value={formData.org_type}
                                                        onChange={(e) => setFormData({ ...formData, org_type: e.target.value })}
                                                    >
                                                        <option className="bg-white text-slate-900" value="خيرية">خيرية</option>
                                                        <option className="bg-white text-slate-900" value="تنموية">تنموية</option>
                                                        <option className="bg-white text-slate-900" value="تعليمية">تعليمية</option>
                                                        <option className="bg-white text-slate-900" value="طبية">طبية</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate-in fade-in slide-in-from-left-4">
                                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">{formData.org_name || 'اسم المؤسسة'}</h1>
                                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                                <Badge icon={<MapPin size={14} />} text={formData.location || 'العنوان غير محدد'} color="indigo" />
                                                <Badge icon={<Award size={14} />} text={formData.org_type} color="slate" />
                                                <Badge icon={<UserCheck size={14} />} text={formData.full_name || 'لا يوجد اسم مدير'} color="emerald" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* 2. Side Panel (Security & Contact) */}
                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-6 space-y-4 shadow-xl">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2 mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> قنوات التواصل
                                </h4>
                                <ContactItem icon={<Mail size={18} className="text-emerald-600" />} label="البريد الرسمي" value={formData.email} />
                                <ContactItem
                                    icon={<Phone size={18} className="text-emerald-600" />}
                                    label="هاتف التواصل"
                                    value={formData.phone}
                                    isEditing={isEditing}
                                    onChange={(v) => setFormData({ ...formData, phone: v })}
                                />
                            </div>

                            <button
                                onClick={() => setShowPassModal(true)}
                                className="w-full group bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 p-6 rounded-[2rem] flex items-center justify-between hover:scale-[1.02] transition-all duration-300"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                                        <Lock size={20} className="text-orange-400" />
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-sm font-black text-slate-900">إعدادات الأمان</span>
                                        <span className="text-[10px] text-orange-500/70 uppercase font-bold">تغيير كلمة المرور</span>
                                    </div>
                                </div>
                                <X size={16} className="rotate-45 text-orange-400 group-hover:translate-x-[-4px] transition-transform" />
                            </button>
                        </div>

                        {/* 3. Detailed Description Section */}
                        <section className="col-span-12 lg:col-span-8 bg-white border border-slate-100 rounded-[3rem] p-8 md:p-10 shadow-inner relative group">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600"><FileText size={20} /></div>
                                <h3 className="font-black text-slate-900 text-lg">رسالة المؤسسة ونبذة عنها</h3>
                            </div>
                            {isEditing ? (
                                <div className="relative group/input">
                                    <Tooltip text="اكتب وصفاً جذاباً لجذب المتطوعين والداعمين" />
                                    <textarea
                                        className="w-full h-56 bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-slate-900 leading-relaxed resize-none focus:ring-2 ring-indigo-500/30 outline-none transition-all"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="اكتب هنا رؤية المؤسسة، أهدافها..."
                                    />
                                    <div className="absolute bottom-4 left-6 text-[10px] text-slate-600 font-mono">{formData.description.length} حرف</div>
                                </div>
                            ) : (
                                <p className="text-slate-400 leading-[1.8] text-lg whitespace-pre-line px-2 italic">
                                    {formData.description || 'لم يتم إضافة وصف للمؤسسة بعد.'}
                                </p>
                            )}
                        </section>

                        {/* 4. Credentials & Web Stats */}
                        <div className="col-span-12 lg:col-span-4 grid gap-6">

                            <MetaInfoCard
                                label="الموقع الإلكتروني"
                                value={formData.website}
                                icon={<Globe size={20} />}
                                isEditing={isEditing}
                                isLink
                                hint="تأكد من كتابة الرابط بشكل صحيح"
                                onChange={(v) => setFormData({ ...formData, website: v })}
                            />
                            <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-6 space-y-4 shadow-xl relative group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <h3 className="font-black text-slate-900 text-sm">التوقيع الرقمي المعتمد</h3>
                                </div>

                                <div className="relative h-32 w-full bg-white rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">
                                    {/* عرض التوقيع الحالي أو المعاينة الجديدة */}
                                    <img
                                        src={
                                            formData.digital_signature instanceof File
                                                ? URL.createObjectURL(formData.digital_signature)
                                                : (formData.digital_signature
                                                    ? `${import.meta.env.VITE_API_URL}/storage/${formData.digital_signature}`
                                                    : 'رابط_صورة_افتراضية')
                                        }
                                        className="h-full object-contain p-2"
                                        alt="Digital Signature"
                                    />

                                    {isEditing && (
                                        <label className="absolute inset-0 bg-indigo-900/40 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-all">
                                            <Camera className="text-slate-900 mb-1" size={24} />
                                            <span className="text-[10px] text-slate-900 font-bold">تحديث التوقيع</span>
                                            <input
                                                type="file"
                                                hidden
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) setFormData({ ...formData, digital_signature: file });
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 text-center">يُستخدم هذا التوقيع في تصديق الشهادات والوثائق الرسمية</p>
                            </div>
                        </div>

                        {/* 5. Geographic Mapping */}
                        <section className="col-span-12 bg-slate-50 border border-slate-200 rounded-[3.5rem] p-8 space-y-8">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <Navigation className="text-emerald-600 animate-bounce-short" />
                                        <h3 className="text-xl font-black text-slate-900">الموقع الجغرافي</h3>
                                    </div>
                                    <p className="text-xs text-slate-500 mr-8">حدد مقر المؤسسة بدقة على الخريطة</p>
                                </div>
                                {isEditing && (
                                    <button onClick={getCurrentLocation} className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-emerald-600/20">
                                        <LocateFixed size={18} /> تحديد موقعي الحالي
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                <div className="lg:col-span-3 h-[450px] rounded-[3rem] overflow-hidden border-4 border-slate-100 relative shadow-2xl">
                                    <InteractiveMap
                                        key={`map-${isEditing}-${formData.lat}-${formData.lng}`}
                                        lat={formData.lat} lng={formData.lng}
                                        isEditing={isEditing}
                                        onLocationSelect={(lat, lng) => setFormData({ ...formData, lat: lat.toFixed(6), lng: lng.toFixed(6) })}
                                    />
                                </div>
                                <div className="flex flex-col gap-4">
                                    <CoordDisplay label="Lat" value={formData.lat} icon="Y" />
                                    <CoordDisplay label="Lng" value={formData.lng} icon="X" />
                                    <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 text-[11px] text-slate-500 leading-relaxed">
                                        <div className="flex items-center gap-2 text-emerald-600 font-bold mb-2"><Info size={14} /> تنبيه</div>
                                        عند التعديل، يمكنك النقر مرتين على الخريطة لتحديث الإحداثيات تلقائياً.
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Password Modal - الآن بداخل الـ JSX الصحيح */}
            {showPassModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop مع تقليل الـ z-index قليلاً لكي يظهر Swal فوقه (Swal عادة z-index: 100000) */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => !passLoading && setShowPassModal(false)}
                    ></div>

                    <div className="relative bg-white/90 border border-slate-200 w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-300 backdrop-saturate-150">

                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg shadow-orange-500/20 text-slate-900">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">تحديث الأمان</h3>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Security Settings</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPassModal(false)}
                                className="p-2 hover:bg-slate-50 rounded-full text-slate-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-6">

                            {/* Current Password */}
                            <div className="group space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 mr-2 flex items-center gap-2">
                                    <Lock size={12} /> كلمة المرور الحالية
                                </label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showPass.current ? "text" : "password"}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:ring-2 ring-orange-500/30 transition-all placeholder:text-slate-700"
                                        placeholder="كلمة المرور الحالية"
                                        value={passData.current_password}
                                        onChange={(e) => setPassData({ ...passData, current_password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(prev => ({ ...prev, current: !prev.current }))}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
                                    >
                                        {showPass.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="group space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 mr-2 flex items-center gap-2">
                                    <Star size={12} className="text-orange-500" /> كلمة المرور الجديدة
                                </label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showPass.new ? "text" : "password"}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 outline-none focus:ring-2 ring-emerald-500/30 transition-all placeholder:text-slate-700"
                                        placeholder="الجديدة (8 أحرف على الأقل)"
                                        value={passData.new_password}
                                        onChange={(e) => setPassData({ ...passData, new_password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(prev => ({ ...prev, new: !prev.new }))}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
                                    >
                                        {showPass.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {/* Password Strength Indicator */}
                                {passData.new_password && (
                                    <div className="px-2 pt-1 flex gap-1">
                                        {[1, 2, 3, 4].map((step) => (
                                            <div
                                                key={step}
                                                className={`h-1 flex-1 rounded-full transition-all duration-500 ${getPasswordStrength(passData.new_password) >= step
                                                    ? (step <= 2 ? 'bg-red-500' : step === 3 ? 'bg-orange-500' : 'bg-emerald-500')
                                                    : 'bg-slate-50'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="group space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 mr-2 flex items-center gap-2">
                                    <CheckCircle2 size={12} /> تأكيد كلمة المرور
                                </label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showPass.confirm ? "text" : "password"}
                                        className={`w-full bg-slate-50 border rounded-2xl px-5 py-4 text-slate-900 outline-none transition-all placeholder:text-slate-700 ${passData.new_password_confirmation && passData.new_password !== passData.new_password_confirmation
                                            ? 'border-red-500/50 focus:ring-red-500/20'
                                            : 'border-slate-200 focus:ring-emerald-500/30'
                                            }`}
                                        placeholder="أعد كتابة كلمة المرور"
                                        value={passData.new_password_confirmation}
                                        onChange={(e) => setPassData({ ...passData, new_password_confirmation: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(prev => ({ ...prev, confirm: !prev.confirm }))}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
                                    >
                                        {showPass.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 space-y-2">
                                <p className="text-[10px] font-bold text-emerald-500 flex items-center gap-2">
                                    <AlertCircle size={14} /> متطلبات الأمان:
                                </p>
                                <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
                                    <li className={`text-[9px] flex items-center gap-1 ${passData.new_password.length >= 8 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                        <div className={`w-1 h-1 rounded-full ${passData.new_password.length >= 8 ? 'bg-emerald-400' : 'bg-slate-600'}`} /> 8 أحرف على الأقل
                                    </li>
                                    <li className={`text-[9px] flex items-center gap-1 ${/[A-Z]/.test(passData.new_password) ? 'text-emerald-600' : 'text-slate-500'}`}>
                                        <div className={`w-1 h-1 rounded-full ${/[A-Z]/.test(passData.new_password) ? 'bg-emerald-400' : 'bg-slate-600'}`} /> حرف كبير واحد
                                    </li>
                                </ul>
                            </div>

                            <button
                                disabled={passLoading}
                                className="w-full relative overflow-hidden group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-4 rounded-[1.5rem] font-black text-slate-900 transition-all shadow-xl shadow-emerald-900/20 active:scale-[0.98]"
                            >
                                <div className="relative z-10 flex items-center justify-center gap-3">
                                    {passLoading ? <Loader2 className="animate-spin" size={20} /> : (
                                        <>
                                            <ShieldCheck size={20} />
                                            <span>حفظ التغييرات الجديدة</span>
                                        </>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <style>{`
                .animate-bounce-short { animation: bounce 3s infinite ease-in-out; }
                @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
                /* إخفاء السكرول بار */
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-thumb { background: #312e81; border-radius: 10px; }
            `}</style>
        </div>
    );
};

/* --- المكونات المساعدة المعدلة --- */

const Tooltip = ({ text }) => (
    <div className="absolute right-0 -top-8 opacity-0 group-hover/input:opacity-100 group-focus-within/input:opacity-100 transition-all pointer-events-none z-[50]">
        <span className="text-[10px] text-emerald-500 font-bold bg-white px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-2xl backdrop-blur-md flex items-center gap-2 animate-in slide-in-from-bottom-1">
            <Info size={12} className="text-emerald-600" /> {text}
        </span>
    </div>
);

const Badge = ({ icon, text, color }) => {
    const colors = {
        indigo: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        slate: "bg-slate-50 text-slate-400 border-slate-200",
        emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
    };
    return (
        <span className={`${colors[color]} border px-4 py-1.5 rounded-2xl text-[11px] font-black flex items-center gap-2 shadow-lg`}>
            {icon} {text}
        </span>
    );
};

const ContactItem = ({ icon, label, value, isEditing, onChange }) => (
    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4 hover:bg-slate-50 transition-all group">
        <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">{icon}</div>
        <div className="flex-1">
            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-0.5">{label}</div>
            {isEditing ? (
                <input className="bg-transparent border-b border-emerald-500/30 text-sm text-slate-900 w-full outline-none focus:border-emerald-500 transition-colors" value={value} onChange={(e) => onChange(e.target.value)} />
            ) : (
                <div className="text-sm font-bold text-slate-900 truncate">{value || '---'}</div>
            )}
        </div>
    </div>
);

const MetaInfoCard = ({ label, value, icon, isEditing, onChange, isLink, hint }) => (
    <div className="bg-white border border-slate-100 p-6 rounded-[2rem] relative group/input hover:border-slate-200 transition-colors shadow-xl">
        <Tooltip text={hint} />
        <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-[10px] text-slate-500 font-black uppercase">{label}</span>
            <div className="text-emerald-600 bg-emerald-500/5 p-2 rounded-xl">{icon}</div>
        </div>
        {isEditing ? (
            <input className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 w-full outline-none focus:border-emerald-500/50" value={value} onChange={(e) => onChange(e.target.value)} />
        ) : isLink ? (
            <a href={value} target="_blank" rel="noreferrer" className="text-emerald-600 font-black text-sm flex items-center gap-2 hover:underline">
                زيارة الموقع <ExternalLink size={14} />
            </a>
        ) : (
            <div className="text-lg font-black text-slate-900">{value || '---'}</div>
        )}
    </div>
);
const QuickStat = ({ label, value, icon, color }) => {
    const theme = {
        indigo: "from-indigo-500/20 to-transparent border-emerald-500/20 text-emerald-600",
        emerald: "from-emerald-500/20 to-transparent border-emerald-500/20 text-emerald-600",
        orange: "from-orange-500/20 to-transparent border-orange-500/20 text-orange-400",
    };
    return (
        <div className={`bg-gradient-to-br ${theme[color]} border p-5 rounded-[2rem] flex flex-col items-center justify-center gap-2 backdrop-blur-sm`}>
            <div className="opacity-80">{icon}</div>
            <span className="text-2xl font-black text-slate-900">{value}</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">{label}</span>
        </div>
    );
};
const CoordDisplay = ({ label, value, icon }) => (
    <div className="bg-slate-50 p-5 rounded-[1.8rem] border border-slate-100 flex flex-col gap-1">
        <div className="flex justify-between items-center text-[9px] text-slate-500 font-black uppercase tracking-widest">
            {label} <span className="text-emerald-600/30">{icon}</span>
        </div>
        <span className="font-mono text-xl font-black text-emerald-600 tabular-nums">{value || '0.0000'}</span>
    </div>
);

export default OrgProfile;