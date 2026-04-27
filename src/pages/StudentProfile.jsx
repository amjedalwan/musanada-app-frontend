import React, { useState, useEffect, useCallback } from 'react';
import {
    User, Mail, Phone, MapPin, Edit3, Save, X, Camera,
    Loader2, Lock, GraduationCap, BookOpen, Award, Clock,
    Briefcase, ChevronLeft, Plus, Calendar, Users,
    ShieldCheck, CheckCircle2, Star, Eye, EyeOff, Check, AlertCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import Swal from 'sweetalert2';

const StudentProfile = () => {
    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [showPassModal, setShowPassModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [passData, setPassData] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

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
    const [passLoading, setPassLoading] = useState(false);
    // المهارات المتاحة في النظام
    const [allSkills, setAllSkills] = useState([]);
    const [logs, setLogs] = useState([]);
    const [formData, setFormData] = useState({
        full_name: '', email: '', phone: '', location: '',
        university: '', major: '', bio: '',
        gender: 'male',
        birth_date: '',
        skills: [],
        profile_image: null
    });

    // حساب التواريخ المسموحة
    const getMaxDate = () => {
        const today = new Date();
        return new Date(today.getFullYear() - 15, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    };

    const getMinDate = () => {
        const today = new Date();
        return new Date(today.getFullYear() - 50, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    };

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        try {
            const [profileRes, skillsRes, logsRes] = await Promise.all([
                api.get('/profile'),
                api.get('/skills'),
                api.get('/student/my-logs')
            ]);

            const data = profileRes.data;
            setAllSkills(skillsRes.data.data || []);

            setLogs(logsRes.data || []);

            setProfile(data);
            setFormData({
                full_name: data.full_name || '',
                email: data.email || '',
                phone: data.phone || '',
                location: data.location || '',
                gender: data.profile?.gender || 'male',
                birth_date: data.profile?.birth_date || '',
                university: data.profile?.university || '',
                major: data.profile?.major || '',
                bio: data.profile?.bio || '',
                skills: data.skills || [], // تحميل المهارات الحالية للمستخدم
                profile_image: null
            });
            setImagePreview(data.profile_image_url);
        } catch (err) {
            console.log(err)
            Swal.fire({ icon: 'error', title: 'خطأ', text: 'فشل في تحميل البيانات' });
        }
        finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);
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
    const handleSave = async () => {
        setSaving(true);
        try {
            const data = new FormData();

            // 1. البيانات الأساسية
            data.append('full_name', formData.full_name);
            data.append('phone', formData.phone || '');
            data.append('location', formData.location || '');
            data.append('university', formData.university || '');
            data.append('major', formData.major || '');
            data.append('bio', formData.bio || '');
            data.append('gender', formData.gender);
            data.append('birth_date', formData.birth_date || '');

            // 2. معالجة المهارات (إرسال المصفوفة كـ IDs)
            if (formData.skills && formData.skills.length > 0) {
                formData.skills.forEach((skill) => {
                    data.append('skill_ids[]', skill.id);
                });
            } else {
                // لإخبار الـ Backend بمسح المهارات إذا أصبحت القائمة فارغة
                data.append('skill_ids', '');
            }

            // 3. الصورة الشخصية
            if (formData.profile_image instanceof File) {
                data.append('profile_image', formData.profile_image);
            }

            // ملاحظة: Laravel لا يدعم PUT مع FormData بسهولة، لذا نستخدم POST
            await api.post('/profile/update', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setIsEditing(false);
            Swal.fire({ icon: 'success', title: 'تم التحديث بنجاح', timer: 1500, showConfirmButton: false });
            fetchProfile();
            //     const updatedUser = {
            //         ...formData,
            //         profile_image: imagePreview // الرابط الجديد للصورة
            //     };
            //   //localStorage.setItem('user', JSON.stringify(updatedUser));

        } catch (err) {
            const errorMessages = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join('<br>')
                : err.response?.data?.message || 'فشل التحديث';

            Swal.fire({
                icon: 'error',
                title: 'خطأ في التحقق',
                html: `<div style="text-align: right; direction: rtl;">${errorMessages}</div>`
            });
        } finally { setSaving(false); }
    };


    return (
        <div className="flex min-h-screen bg-[#050508] text-right font-['Tajawal'] overflow-hidden" dir="rtl">
            {/* الخلفية المشوشة (Blur Background) */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full"></div>
            </div>
            <Sidebar role="student" />
            {/* Grid Container */}
            {loading ? (
                <LoadingSpinner />
            ) : (
               <main className="flex-1 p-4 md:p-6 lg:p-10 relative z-10 overflow-y-auto max-h-screen custom-scrollbar overflow-x-hidden">
    <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/[0.03] p-5 rounded-[2rem] md:rounded-[2.5rem] border border-white/10 backdrop-blur-xl sticky top-4 z-[100]">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
                    <User className="text-emerald-400" size={24} md:size={28} />
                </div>
                <div className="min-w-0">
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter truncate">حساب المتطوع</h2>
                    <span className="text-xs text-emerald-500 font-bold block truncate">{formData.full_name}</span>
                </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="group flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-6 md:px-8 py-3 rounded-2xl transition-all font-bold text-sm md:text-base">
                        <Edit3 size={18} /> تعديل البيانات
                    </button>
                ) : (
                    <div className="flex gap-3 w-full">
                        <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm">
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} حفظ
                        </button>
                        <button onClick={() => { setIsEditing(false); fetchProfile(); }} className="bg-red-500/10 text-red-400 px-4 py-3 rounded-2xl border border-red-500/20 transition-colors text-sm">إلغاء</button>
                    </div>
                )}
            </div>
        </header>

        <div className="grid grid-cols-12 gap-6 md:gap-8">
            {/* Profile Hero */}
            <section className="col-span-12 lg:col-span-8 bg-gradient-to-br from-emerald-500/[0.07] via-transparent to-transparent border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-12 relative overflow-hidden group">
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-10 relative z-10">
                    <div className="relative flex-shrink-0">
                        <div className="w-32 h-32 md:w-48 md:h-48 bg-black rounded-[2.5rem] md:rounded-[3.5rem] border-4 border-white/5 overflow-hidden shadow-2xl">
                            <img src={imagePreview} className="w-full h-full object-cover" alt="Avatar" />
                            {isEditing && (
                                <label className="absolute inset-0 bg-emerald-900/60 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-all">
                                    <Camera className="text-white mb-2" size={32} />
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
                    </div>

                    <div className="text-center md:text-right flex-1 w-full space-y-4">
                        {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    className="col-span-1 md:col-span-2 text-xl md:text-2xl font-black bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-white outline-none focus:ring-2 ring-emerald-500/50 w-full"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="الاسم الكامل"
                                />
                                <input
                                    className="bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 ring-emerald-500/50 w-full"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="المدينة / العنوان"
                                />
                                <select
                                    className="bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white outline-none w-full"
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                >
                                    <option className="bg-gray-900 text-white" value="male">ذكر</option>
                                    <option className="bg-gray-900 text-white" value="female">أنثى</option>
                                </select>
                                <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 pointer-events-none z-20">
                                        <Calendar size={16} strokeWidth={2.5} />
                                    </div>
                                    <input
                                        type="date"
                                        max={getMaxDate()}
                                        min={getMinDate()}
                                        className="bg-[#1a1a24] border border-white/10 rounded-xl w-full pr-10 pl-4 py-3 text-white outline-none"
                                        value={formData.birth_date}
                                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h1 className="text-3xl md:text-5xl font-black text-white mb-4 break-words">{formData.full_name}</h1>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    <Badge icon={<MapPin size={14} />} text={formData.location || 'غير محدد'} color="emerald" />
                                    <Badge icon={<Users size={14} />} text={formData.gender === 'male' ? 'ذكر' : 'أنثى'} color="slate" />
                                    <Badge icon={<Calendar size={14} />} text={formData.birth_date || 'تاريخ الميلاد'} color="indigo" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                <StatCard
                    label="ساعات التطوع"
                    value={profile?.profile?.total_volunteer_hours || '0'}
                    icon={<Clock size={22} />}
                    color="emerald"
                    description="إجمالي الساعات المعتمدة"
                />

                <div className="flex-1 bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-6 flex flex-col items-center justify-center border-dashed min-h-[140px]">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">المستوى القادم</div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                        <div
                            className="bg-emerald-500 h-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000"
                            style={{ width: `${Math.min((profile?.profile?.total_volunteer_hours % 50) * 2, 100)}%` }}
                        ></div>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-3 font-bold">
                        {50 - (profile?.profile?.total_volunteer_hours % 50)} ساعة متبقية للمستوى التالي
                    </div>
                </div>
            </div>

            {/* Bio */}
            <section className="col-span-12 bg-[#0a0a0f] border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400"><Briefcase size={20} /></div>
                    <h3 className="font-black text-white text-lg">التعريف الشخصي</h3>
                </div>
                {isEditing ? (
                    <textarea
                        className="w-full h-44 bg-white/[0.03] border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-6 text-white outline-none focus:ring-1 ring-emerald-500/30 resize-none"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="اكتب نبذة عنك..."
                    />
                ) : (
                    <p className="text-slate-400 leading-relaxed text-base md:text-lg">{formData.bio || 'لا يوجد وصف.'}</p>
                )}
            </section>

            {/* سجل النشاطات */}
            <section className="col-span-12 bg-[#0a0a0f] border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400"><Clock size={20} /></div>
                        <h3 className="font-black text-white text-lg">آخر سجلات الساعات</h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold hidden sm:inline">تحديث تلقائي</span>
                </div>

                <div className="space-y-4">
                    {logs.logs?.length > 0 ? (
                        logs.logs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl gap-4">
                                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex-shrink-0 flex items-center justify-center text-emerald-500 text-xs font-black">
                                        +{log.hours}
                                    </div>
                                    <div className='min-w-0'>
                                        <div className="text-sm font-bold text-white truncate">{log.opportunity?.title}</div>
                                        <div className="text-[10px] text-slate-500">{new Date(log.date_logged).toLocaleDateString('en-EG')}</div>
                                    </div>
                                </div>
                                <div className="text-[10px] md:text-xs font-black text-orange-400 flex-shrink-0">+{log.hours * 10} ن</div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 text-slate-600 text-xs">لا توجد سجلات ساعات معتمدة بعد.</div>
                    )}
                </div>
            </section>

            {/* Skills Selection */}
            <section className="col-span-12  bg-[#0a0a0f] border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full"></div>
                <h3 className="font-black text-white flex items-center gap-3 mb-8 relative z-10">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Award className="text-indigo-400" size={20} />
                    </div>
                    <span className="tracking-tight">المهارات والخبرات</span>
                </h3>

                {isEditing ? (
                    <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">المهارات المتاحة</label>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                                {allSkills
                                    .filter(skill => !formData.skills.find(s => s.id === skill.id))
                                    .map(skill => (
                                        <button
                                            key={skill.id}
                                            onClick={() => setFormData({ ...formData, skills: [...formData.skills, skill] })}
                                            className="bg-white/5 hover:bg-indigo-500/20 border border-white/10 px-3 py-2 rounded-xl text-[11px] font-bold text-slate-400 transition-all active:scale-95"
                                        >
                                            + {skill.name}
                                        </button>
                                    ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-2 flex justify-between">
                                مهاراتي المختارة <span>{formData.skills.length}</span>
                            </label>
                            <div className="flex flex-wrap gap-2 min-h-[50px] p-3 bg-white/[0.02] rounded-2xl border border-white/5">
                                {formData.skills.map(skill => (
                                    <div key={skill.id} className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                                        <span className="text-[11px] font-black text-emerald-400">{skill.name}</span>
                                        <button onClick={() => setFormData({ ...formData, skills: formData.skills.filter(s => s.id !== skill.id) })} className="text-emerald-500 hover:text-red-400">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2 relative z-10">
                        {formData.skills.length > 0 ? (
                            formData.skills.map((skill, index) => (
                                <div key={index} className="bg-[#11111a] border border-white/10 px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                    <span className="text-[11px] font-bold text-slate-300">{skill.name}</span>
                                </div>
                            ))
                        ) : (
                            <div className="w-full py-8 text-center border border-dashed border-white/10 rounded-2xl">
                                <span className="text-slate-600 text-[10px] uppercase">لم تضف أي مهارات</span>
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Contact & Academic Info */}
            <section className="col-span-12 bg-white/[0.01] border border-white/5 rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                    <InfoGroup label="معلومات التواصل" icon={<Phone size={18} className="text-emerald-400" />}>
                        <ContactRow label="البريد" value={formData.email} />
                        <ContactRow label="الهاتف" value={formData.phone} isEditing={isEditing} onChange={(v) => setFormData({ ...formData, phone: v })} />
                    </InfoGroup>

                    <InfoGroup label="المسار الأكاديمي" icon={<GraduationCap size={18} className="text-indigo-400" />}>
                        <ContactRow label="الجامعة" value={formData.university} isEditing={isEditing} onChange={(v) => setFormData({ ...formData, university: v })} />
                        <ContactRow label="التخصص" value={formData.major} isEditing={isEditing} onChange={(v) => setFormData({ ...formData, major: v })} />
                    </InfoGroup>

                    <div className="flex items-end">
                        <button onClick={() => setShowPassModal(true)} className="w-full bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 p-5 rounded-2xl flex items-center justify-between hover:scale-[1.01] transition-all group">
                            <div className="flex items-center gap-4">
                                <Lock size={18} className="text-orange-400" />
                                <span className="text-sm font-black text-white">تغيير كلمة المرور</span>
                            </div>
                            <ChevronLeft size={16} className="text-orange-400 group-hover:-translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    </div>
</main>
            )}
            {/* Password Modal - الآن بداخل الـ JSX الصحيح */}
            {showPassModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop مع تقليل الـ z-index قليلاً لكي يظهر Swal فوقه (Swal عادة z-index: 100000) */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => !passLoading && setShowPassModal(false)}
                    ></div>

                    <div className="relative bg-[#0f0f1a]/90 border border-white/10 w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in fade-in zoom-in duration-300 backdrop-saturate-150">

                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg shadow-orange-500/20 text-white">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">تحديث الأمان</h3>
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Security Settings</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPassModal(false)}
                                className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-colors"
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
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 ring-orange-500/30 transition-all placeholder:text-slate-700"
                                        placeholder="كلمة المرور الحالية"
                                        value={passData.current_password}
                                        onChange={(e) => setPassData({ ...passData, current_password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(prev => ({ ...prev, current: !prev.current }))}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
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
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:ring-2 ring-emerald-500/30 transition-all placeholder:text-slate-700"
                                        placeholder="الجديدة (8 أحرف على الأقل)"
                                        value={passData.new_password}
                                        onChange={(e) => setPassData({ ...passData, new_password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(prev => ({ ...prev, new: !prev.new }))}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
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
                                                    : 'bg-white/5'
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
                                        className={`w-full bg-white/[0.03] border rounded-2xl px-5 py-4 text-white outline-none transition-all placeholder:text-slate-700 ${passData.new_password_confirmation && passData.new_password !== passData.new_password_confirmation
                                            ? 'border-red-500/50 focus:ring-red-500/20'
                                            : 'border-white/10 focus:ring-emerald-500/30'
                                            }`}
                                        placeholder="أعد كتابة كلمة المرور"
                                        value={passData.new_password_confirmation}
                                        onChange={(e) => setPassData({ ...passData, new_password_confirmation: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(prev => ({ ...prev, confirm: !prev.confirm }))}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
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
                                    <li className={`text-[9px] flex items-center gap-1 ${passData.new_password.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        <div className={`w-1 h-1 rounded-full ${passData.new_password.length >= 8 ? 'bg-emerald-400' : 'bg-slate-600'}`} /> 8 أحرف على الأقل
                                    </li>
                                    <li className={`text-[9px] flex items-center gap-1 ${/[A-Z]/.test(passData.new_password) ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        <div className={`w-1 h-1 rounded-full ${/[A-Z]/.test(passData.new_password) ? 'bg-emerald-400' : 'bg-slate-600'}`} /> حرف كبير واحد
                                    </li>
                                </ul>
                            </div>

                            <button
                                disabled={passLoading}
                                className="w-full relative overflow-hidden group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-4 rounded-[1.5rem] font-black text-white transition-all shadow-xl shadow-emerald-900/20 active:scale-[0.98]"
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
        </div>

    );
};

// --- المكونات الفرعية (Sub-components) ---

const StatCard = ({ label, value, icon, color, description }) => {
    const themes = {
        emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
        orange: "from-orange-500/20 to-orange-500/5 border-orange-500/20 text-orange-400",
    };
    return (
        <div className={`relative overflow-hidden bg-gradient-to-br ${themes[color]} border p-6 rounded-[2.5rem] group hover:scale-[1.02] transition-all duration-500`}>
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {React.cloneElement(icon, { size: 80 })}
            </div>
            <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 bg-black/40 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors">
                    {icon}
                </div>
                <div>
                    <div className="text-3xl font-black text-white tabular-nums leading-none mb-1">{value}</div>
                    <div className="text-[10px] font-black uppercase tracking-wider opacity-70 mb-1">{label}</div>
                    <div className="text-[9px] font-medium text-slate-500">{description}</div>
                </div>
            </div>
        </div>
    );
};

const Badge = ({ icon, text, color }) => {
    const colors = {
        emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        slate: "bg-white/5 text-slate-400 border-white/10",
        indigo: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
    };
    return (
        <span className={`${colors[color]} border px-4 py-2 rounded-2xl text-[11px] font-black flex items-center gap-2`}>
            {icon} {text}
        </span>
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
const InfoGroup = ({ label, icon, children }) => (
    <div className="space-y-6">
        <h4 className="text-xs font-black text-slate-500 uppercase flex items-center gap-3">
            {icon} {label}
        </h4>
        <div className="space-y-4">{children}</div>
    </div>
);

const ContactRow = ({ label, value, isEditing, onChange }) => (
    <div>
        <div className="text-[10px] text-slate-600 font-bold mb-1">{label}</div>
        {isEditing ? (
            <input className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white w-full outline-none focus:border-emerald-500/50" value={value} onChange={(e) => onChange(e.target.value)} />
        ) : (
            <div className="text-sm font-bold text-slate-200">{value || '---'}</div>
        )}
    </div>
);

export default StudentProfile;