import React, { useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    User, Mail, Lock, Building2, BookOpen, GraduationCap,
    FileCheck, Phone, Loader2, EyeOff, Eye, ShieldCheck, ArrowRight,
    Camera, Calendar, Fingerprint, Plus, Sparkles,
    CheckCircle2, Info, AlertCircle, UploadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import api from '../api/axios';
const getMaxDate = () => {
    const today = new Date();
    return new Date(today.getFullYear() - 15, today.getMonth(), today.getDate()).toISOString().split('T')[0];
};

const getMinDate = () => {
    const today = new Date();
    return new Date(today.getFullYear() - 50, today.getMonth(), today.getDate()).toISOString().split('T')[0];
};
/**
 * مكون حقل الإدخال المطور (تكرار للهوية البصرية لصفحة اللوجن)
 */
const FormField = ({ icon: Icon, className, label, type, name, placeholder, value, onChange, error, options, showPasswordToggle, isPasswordVisible, onTogglePassword }) => (
    <div className={` space-y-2 group form-field-wrapper ${className || ""}`}  dir="rtl">
        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mr-1 group-focus-within:text-amber-500 transition-colors">
            {label}
        </label>
        <div className="relative">
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500 group-focus-within:text-amber-500 transition-all z-20">
                <Icon size={16} strokeWidth={2.5} />
            </div>

            {type === 'select' ? (
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-full pr-12 pl-4 py-4 bg-white/[0.02] border border-white/5 rounded-2xl outline-none focus:border-amber-500/50 focus:bg-white/[0.05] transition-all text-sm text-white appearance-none backdrop-blur-xl"
                >
                    <option value="" className="bg-[#0f0f1a]"> {label}</option>
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-[#0f0f1a]">{opt.label}</option>
                    ))}
                </select>
            ) : (
                <div className="relative">

                    <input
                        type={type}
                        name={name}
                        value={value}
                        {...(type === 'date' ?
                            {
                                max: getMaxDate(),
                                min: getMinDate()
                            } : {})}
                        onChange={onChange}
                        placeholder={placeholder}
                        autoComplete="current-password"
                        className={`
                    w-full pr-12 pl-12 py-4 bg-white/[0.02] border rounded-[1.5rem] 
                    outline-none transition-all duration-300 font-bold text-sm text-white
                    placeholder:text-gray-700 backdrop-blur-xl
                    ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/5 focus:border-amber-500/50 focus:bg-white/[0.05]'}
                `}
                    />

                    {showPasswordToggle && (
                        <button
                            type="button"
                            onClick={onTogglePassword}
                            className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-600 hover:text-white transition-colors z-20"
                        >
                            {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}

                    {/* خط سفلي متحرك */}
                    <div className="absolute bottom-0 right-1/2 translate-x-1/2 w-0 h-[2px] bg-amber-500 group-focus-within:w-[80%] transition-all duration-500 opacity-50" />
                </div>

            )}
        </div>
        {error && <p className="text-[9px] text-red-400 font-bold mr-2 animate-pulse">{error}</p>}
    </div>
);

const Register = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const profileInputRef = useRef(null);

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [profilePreview, setProfilePreview] = useState(null);

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'student',
        gender: '',
        birth_date: '',
        // حقول الطالب
        university: '',
        major: '',
        // حقول المؤسسة
        org_name: '',
        org_type: '',
        contact_person: '',
        license_file: null,
        profile_image: null,
        phone: '',
        website: ''
    });

    const [errors, setErrors] = useState({});

    // معالجة تغيير النصوص
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    // معالجة رفع الملفات والصور
    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files[0];

        if (file) {
            if (name === 'profile_image') {
                setProfilePreview(URL.createObjectURL(file));
                setFormData(prev => ({ ...prev, profile_image: file }));
            } else {
                setFormData(prev => ({ ...prev, license_file: file }));
            }
        }
    };

    const validateStep = () => {
        let newErrors = {};
        if (step === 1) {
            if (!formData.full_name) newErrors.full_name = "الاسم مطلوب";
            if (!formData.email) newErrors.email = "الإيميل مطلوب";
            if (formData.password.length < 8) newErrors.password = "يجب أن تكون 8 رموز على الأقل";
            if (formData.password !== formData.password_confirmation) newErrors.password_confirmation = "كلمات المرور غير متطابقة";
        } else {
            if (formData.role === 'student') {
                if (!formData.gender) newErrors.gender = "الجنس مطلوب";
                if (!formData.birth_date) newErrors.birth_date = "تاريخ الميلاد مطلوب";
                if (!formData.university) newErrors.university = "الجامعة مطلوبة";
                if (!formData.major) newErrors.major = "التخصص مطلوب";
            } else if (formData.role === 'organization') {
                if (!formData.org_name) newErrors.org_name = "اسم المؤسسة مطلوب";
                if (!formData.org_type) newErrors.org_type = "نوع المؤسسة مطلوب";
                if (!formData.contact_person) newErrors.contact_person = "مسؤول التواصل مطلوب";
                if (!formData.license_file) {
                    toast.error("يرجى إرفاق ملف الترخيص الرسمي");
                    return false;
                }
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    // حساب التواريخ المسموحة
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep()) return;

        setLoading(true);
        const loadToast = toast.loading('جاري إنشاء ملفك الآمن...');

        const data = new FormData();

        // 1. إضافة الحقول النصية والملفات بشكل منظم
        Object.keys(formData).forEach(key => {
            // نتحقق أولاً إذا كانت القيمة موجودة
            if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
                // تصفية الحقول غير المطلوبة بناءً على الدور
                if (formData.role === 'student' && ['org_name', 'org_type', 'contact_person', 'license_file', 'website'].includes(key)) return;
                if (formData.role === 'organization' && ['gender', 'birth_date', 'university', 'major'].includes(key)) return;

                // إذا كان الملف هو صورة شخصية أو ملف ترخيص، أضفه كـ File
                if (key === 'profile_image' || key === 'license_file') {
                    if (formData[key] instanceof File) {
                        data.append(key, formData[key]);
                    }
                } else {
                    // إضافة النصوص العادية
                    data.append(key, formData[key]);
                }
            }
        });

        try {
            // 2. إرسال الطلب مع التأكد من الـ Headers
            const response = await api.post('/register', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (response.data.status) {
                toast.success('تم إرسال طلبك بنجاح!', { id: loadToast });

                if (formData.role === 'organization') {
                    setStep(3);
                } else {
                    toast.success("تم إنشاء الحساب، يمكنك الدخول الآن");
                    setTimeout(() => navigate('/login'), 2000);
                }
            }
        } catch (err) {
            // معالجة الأخطاء كما هي في كودك
            const msg = err.response?.data?.message || "فشل التسجيل، حاول مرة أخرى";
            toast.error(msg, { id: loadToast });
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setLoading(false);
        }
    };
    return (

        <div className="min-h-screen bg-[#05050a] flex items-center justify-center p-4 py-12 relative overflow-hidden font-['Tajawal']" dir="rtl">
            <Toaster position="top-center" />

            {/* عناصر خلفية جمالية */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[600px] relative z-10"
            >
                {/* 1. شعار النظام وهويته */}
                <div className="text-center mb-10">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        className="inline-flex relative p-5 rounded-[2.5rem] bg-gradient-to-tr from-amber-500 to-amber-600 shadow-2xl shadow-amber-600/20 mb-6 group cursor-pointer"
                    >
                        <ShieldCheck size={48} className="text-black stroke-[2.5]" />
                        <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 bg-white rounded-[2.5rem]"
                        />
                    </motion.div>

                    <h1 className="text-4xl font-black text-white tracking-tighter mb-2">انضم إلى مساندة</h1>
                    <div className="flex items-center justify-center gap-2 text-gray-500 font-bold text-xs uppercase tracking-[0.3em]">
                        <Sparkles size={14} className="text-amber-500" />
                        ابدأ رحلتك في العطاء الرقمي
                    </div>
                </div>
                {/* Header */}


                <div className="bg-[#0f0f1a]/60 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] shadow-2xl p-8 md:p-12">

                    {step < 3 && (
                        <>
                            {/* Role Selection */}
                            <div className="flex p-1.5 bg-black/40 rounded-[2rem] border border-white/5 mb-10">
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
                                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.6rem] text-xs font-black transition-all ${formData.role === 'student' ? 'bg-amber-500 text-black shadow-xl shadow-amber-500/20' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <User size={18} /> متطوع / طالب
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, role: 'organization' }))}
                                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.6rem] text-xs font-black transition-all ${formData.role === 'organization' ? 'bg-amber-500 text-black shadow-xl shadow-amber-500/20' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <Building2 size={18} /> مؤسسة / جهة
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <AnimatePresence mode="wait">
                                    {step === 1 ? (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                                        >
                                            <FormField icon={User} label="الاسم الرباعي" name="full_name" value={formData.full_name} onChange={handleChange} error={errors.full_name} placeholder="أحمد محمد علي..." />
                                            <FormField icon={Mail} label="البريد الإلكتروني" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="example@mail.com" />
                                            <FormField
                                                icon={Lock}
                                                label="كلمة المرور"
                                                name="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                error={errors.password}
                                                placeholder="••••••••"
                                                type={showPassword ? "text" : "password"}
                                                showPasswordToggle
                                                isPasswordVisible={showPassword}
                                                onTogglePassword={() => setShowPassword(!showPassword)}
                                            />

                                            <FormField
                                                icon={ShieldCheck}
                                                label="تأكيد كلمة المرور"
                                                name="password_confirmation"
                                                type={showPassword ? "text" : "password"}
                                                showPasswordToggle
                                                isPasswordVisible={showPassword}
                                                onTogglePassword={() => setShowPassword(!showPassword)}
                                                onChange={handleChange}
                                                error={errors.password_confirmation}
                                                placeholder="••••••••" />

                                            <div className="md:col-span-2 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => validateStep() && setStep(2)}
                                                    className="flex items-center gap-2 bg-white/5 font-bold hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-black text-xs border border-white/5 transition-all"
                                                >
                                                    التالي: البيانات الشخصية
                                                    <ArrowRight size={16} className="rotate-180" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                            className="space-y-8"
                                        >
                                            {console.log(profilePreview)}
                                            {/* Profile Image & Personal Data */}
                                            <div className="flex flex-col md:flex-row gap-8 items-center border-b border-white/5 pb-8">
                                                <div className="relative group">
                                                    <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden">
                                                        {profilePreview ? (
                                                            <img src={profilePreview} className="w-full h-full object-cover" alt="Profile" />
                                                        ) : (
                                                            <Camera size={32} className="text-gray-700" />
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => profileInputRef.current.click()}
                                                        className="absolute -bottom-2 -right-2 bg-amber-500 text-black p-2 rounded-xl shadow-lg hover:scale-110 transition-all"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                    <input type="file" name="profile_image" ref={profileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                                </div>
                                                <div className="flex-1 grid grid-cols-1 gap-4 w-full">
                                                    {formData.role === 'student' ? (
                                                        <>
                                                         <FormField className="col-span-12  " icon={Calendar} label="تاريخ الميلاد" name="birth_date" type="date" value={formData.birth_date} onChange={handleChange} error={errors.birth_date} />
                                                        <div className="grid grid-cols-1 col-span-12  md:grid-cols-12  gap-4">
                                                                  
                                                            <FormField className="col-span-7"  icon={Phone} label="رقم الهاتف (اختياري)" name="phone" type="text" value={formData.phone} onChange={handleChange} error={errors.phone} placeholder="05xxxxxxxx" />
                                                       
                                                                <FormField className="col-span-5" 
                                                                icon={User} label="الجنس" name="gender" type="select" value={formData.gender} onChange={handleChange} error={errors.gender}
                                                                options={[{ label: 'ذكر', value: 'male' }, { label: 'أنثى', value: 'female' }]}
                                                            />
                                                       
                                                        </div>
                                                         </>
                                                    ) : (
                                                        <>
                                                            <FormField icon={Phone} label="رقم الهاتف (اختياري)" name="phone" type="text" value={formData.phone} onChange={handleChange} error={errors.phone} placeholder="05xxxxxxxx" />
                                                            <FormField icon={Building2} label="الموقع الإلكتروني (اختياري)" name="website" type="text" value={formData.website} onChange={handleChange} error={errors.website} placeholder="www.example.com" />
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Conditional Fields */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                                                {formData.role === 'student' ? (
                                                    <>
                                                        <FormField icon={BookOpen} label="الجامعة" name="university" value={formData.university} onChange={handleChange} placeholder="جامعة الملك سعود..." error={errors.university} />
                                                        <FormField icon={GraduationCap} label="التخصص الدراسي" name="major" value={formData.major} onChange={handleChange} placeholder="هندسة برمجيات..." error={errors.major} />
                                                    </>
                                                ) : (
                                                    <>
                                                        <FormField icon={Building2} label="اسم المؤسسة" name="org_name" value={formData.org_name} onChange={handleChange} placeholder="جمعية..." error={errors.org_name} />
                                                        <FormField icon={Info} label="نوع المؤسسة" name="org_type" value={formData.org_type} onChange={handleChange} placeholder="خيرية، حكومية..." error={errors.org_type} />
                                                        <div className="md:col-span-2">
                                                            <FormField
                                                                icon={User}
                                                                label="اسم مسؤول التواصل"
                                                                name="contact_person"
                                                                value={formData.contact_person}
                                                                onChange={handleChange}
                                                                error={errors.contact_person}
                                                                placeholder="الاسم الكامل للشخص المسؤول عن الحساب..."
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <div
                                                                onClick={() => fileInputRef.current.click()}
                                                                className={`
                                                                    relative p-8 border-2 border-dashed rounded-[2rem] text-center cursor-pointer transition-all
                                                                    ${formData.license_file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10 hover:border-amber-500/30 bg-black/20'}
                                                                `}
                                                            >
                                                                <input type="file" name="license_file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
                                                                <UploadCloud size={32} className={`mx-auto mb-4 ${formData.license_file ? 'text-emerald-500' : 'text-gray-600'}`} />
                                                                <p className="text-xs font-black text-white mb-1">
                                                                    {formData.license_file ? formData.license_file.name : "رفع ملف ترخيص المؤسسة (PDF)"}
                                                                </p>
                                                                <p className="text-[10px] text-gray-500 italic">يتم مراجعة الملف يدوياً من قبل الإدارة لتوثيق الحساب</p>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex justify-between gap-4 pt-6">
                                                <button type="button" onClick={() => setStep(1)} className="text-[11px] font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest">تراجع</button>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="flex-1 bg-amber-500 text-black py-4 rounded-2xl font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                                                >
                                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <><Fingerprint size={20} /> إكمال التسجيل</>}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </form>
                        </>
                    )}

                    {/* Step 3: Success & Review (For Organizations) */}
                    {step === 3 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-10"
                        >
                            <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                <CheckCircle2 size={48} />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-4">طلبك قيد المراجعة الأمنية</h2>
                            <p className="text-gray-500 text-sm leading-relaxed mb-10 max-w-md mx-auto">
                                شكراً لانضمامك لـ "مساندة". يتم الآن التحقق من وثائق مؤسستك من قبل إدارة النظام. ستتلقى إشعاراً عبر البريد الإلكتروني فور تفعيل حسابك.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="bg-white/5 border border-white/10 text-white px-10 py-4 rounded-2xl font-black text-xs hover:bg-white/10 transition-all"
                            >
                                العودة للرئيسية
                            </button>
                        </motion.div>
                    )}

                </div>

                {/* Footer Links */}
                <div className="mt-12 text-center">
                    <p className="text-gray-600 text-[11px] font-bold">
                        لديك حساب بالفعل؟
                        <Link to="/login" className="text-amber-500 mr-2 hover:underline">سجل دخولك الآن</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;