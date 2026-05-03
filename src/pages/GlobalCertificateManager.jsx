import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
    Award, Clock, MapPin, Calendar, ShieldCheck, Download,
    ZoomIn, ZoomOut, CheckCircle, Copyright, Globe, Phone,
    Building2, Hash, ArrowLeftRight, UserCheck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react'; // تأكد من تثبيت المكتبة: npm install qrcode.react
import api from '../api/axios';
import { LOGO } from '../config/constants';
import { toast, Toaster } from 'react-hot-toast';

const GlobalCertificateManager = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const { code } = useParams();
    const location = useLocation();

    // استقبال الألوان الديناميكية من الرابط
    const queryParams = new URLSearchParams(location.search);
    const colors = {
        headerBg: queryParams.get('hBg') || "#111929f2",
        bodyBg: queryParams.get('bBg') || "#ffffff",
        footerBg: queryParams.get('fBg') || "#f9fafbe1",
        accentColor: queryParams.get('aColor') || "#b45309"
    };

    const [certData, setCertData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scale, setScale] = useState(0.7);

    // دالة لحساب تباين الألوان للنصوص
    const getContrastYIQ = (hexcolor) => {
        if (!hexcolor || hexcolor === 'transparent') return 'black';
        hexcolor = hexcolor.replace("#", "");
        const r = parseInt(hexcolor.substr(0, 2), 16);
        const g = parseInt(hexcolor.substr(2, 2), 16);
        const b = parseInt(hexcolor.substr(4, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#111827' : '#ffffff';
    };

    const fetchCertificateDetails = useCallback(async () => {
        try {
            setLoading(true);
            // جلب البيانات من API بناءً على الكود
            const response = await api.get(`/certificates/verify/${code || 'MSND-2026-BDE223E4'}`);
            if (response.data.success) {
                setCertData(response.data.data);
            }
        } catch (err) {
            console.log(err)
            toast.error('خطأ في جلب بيانات الشهادة');
        } finally {
            setLoading(false);
        }
    }, [code]);

    useEffect(() => { fetchCertificateDetails(); }, [fetchCertificateDetails]);
    useEffect(() => {
        if (certData) {
            document.title = `شهادة_${certData.volunteerName}_${certData.certificateCode}`.replace(/\s+/g, '_');
        }
    }, [certData]);
    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!certData) return null;

    const textColorHeader = getContrastYIQ(colors.headerBg);
    const textColorBody = getContrastYIQ(colors.bodyBg);
    const textColorFooter = getContrastYIQ(colors.footerBg);

    // معالجة النصوص بناءً على الجنس
    const isFemale = certData.volunteerGender === 'female';

    const pronoun = isFemale ? 'إليها' : 'إليه';

    // ترجمة نوع الفرصة
    const typeMap = {
        'voluntary': 'البرنامج التطوعي ',
        'training': 'البرنامج التدريبي',
        'course': 'البرنامج التعليمي'
    };
    const volunteerTitle = {
        'voluntary': isFemale ? 'المتطوعة' : 'المتطوع',
        'training': isFemale ? 'المدربة' : 'المدرب',
        'course': isFemale ? 'المتدربة' : 'المتدرب',
    };

    return (
        <div className="min-h-screen bg-slate-50 font-['Cairo'] text-right" dir="rtl">
            <Toaster position="top-center" />

            {/* شريط التحكم (لا يظهر عند الطباعة) */}
            <nav className="fixed top-0 left-0 right-0 z-50 p-4 bg-white backdrop-blur-xl border-b border-slate-100 flex justify-between items-center no-print">
                <div className="flex items-center gap-3 text-slate-900">
                    <div className="p-[1px] bg-amber-600 rounded-full shadow-lg w-[50px] max-h-[50px]">
                        <img src={LOGO} alt="logo" className='w-full object-cover rounded-full ' />
                    </div>
                    <span className="font-bold text-sm hidden md:block">منصة مساندة - نظام تصديق الشهادات الرقمي</span>
                </div>
                <div className="flex gap-4">
                    <div className="flex bg-slate-50 rounded-xl border border-slate-200 p-1 items-center text-slate-900">
                        <button onClick={() => setScale(s => Math.max(0.4, s - 0.1))} className="p-2 hover:bg-slate-50 rounded-lg"><ZoomOut size={16} /></button>
                        <span className="text-xs font-mono w-10 text-center">{Math.round(scale * 100)}%</span>
                        <button onClick={() => setScale(s => Math.min(1.5, s + 0.1))} className="p-2 hover:bg-slate-50 rounded-lg"><ZoomIn size={16} /></button>
                    </div>
                    <button
                        onClick={() => {
                            // 1. حفظ العنوان القديم
                            const fileName = `شهادة_${certData.volunteerName}_${certData.certificateCode}`.replace(/\s+/g, '_');
                            const oldTitle = document.title;

                            document.title = fileName;

                            setTimeout(() => {
                                window.print();
                                setTimeout(() => {
                                    document.title = oldTitle;
                                }, 2000);

                            }, 250); // زدنا المهلة قليلاً هنا لضمان التوافق مع المتصفحات الأبطأ
                        }}
                        className="bg-amber-600 text-slate-900 hover:bg-amber-500 transition-all px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2"
                    >
                        <Download size={16} /> طباعة وحفظ
                    </button>
                </div>
            </nav>

            <main className="pt-10 pb-10 flex flex-col items-center min-h-screen bg-slate-50">
                <div style={{
                    transform: `scale(${scale})`,
                    transition: '0.3s',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',

                }}>
                    {/* ورقة الشهادة */}
                    <div className="bg-white w-[794px] h-[1123px] shadow-2xl relative flex flex-col overflow-hidden  certificate-paper ">

                        <header
                            style={{ backgroundColor: colors.headerBg, color: textColorHeader }}
                            className="relative h-[200px]  flex flex-col items-center justify-center overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/10 rounded-full -mr-32 -mt-32"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 rounded-full -ml-16 -mb-16"></div>
                            <div className="flex justify-between w-full px-10 items-center">
                                <div className=" z-10 rounded-full p-2 ">
                                    {
                                        certData.orgLogo ? (
                                            <img src={`${API_BASE_URL}/storage/${certData.orgLogo}`} alt="Logo" className="w-20 h-20  z-10 object-contain bg-white p-1 rounded-sm shadow-xl" />
                                        ) : (
                                            <div className="w-20 h-20 mb-4 z-10 bg-white/10 backdrop-blur-md rounded-sm flex items-center justify-center border border-slate-300">
                                                <Building2 size={40} />
                                            </div>
                                        )
                                    }
                                </div>
                                < div className="z-10 text-center" >
                                    <h1 className="text-3xl font-black mb-1 tracking-tight">{certData.orgName}</h1>

                                </div>
                                <div className=" z-10 rounded-full p-2 ">
                                    <img
                                        src={LOGO}
                                        alt="Signature"
                                        className="w-20 h-20 object-cover rounded-sm "
                                        style={{ filter: textColorFooter === '#ffffff' ? 'brightness(0) invert(1)' : 'none' }}
                                    />
                                </div>

                            </div>
                            <div className="flex items-center justify-center gap-4 mt-2 opacity-80 text-[10px] font-bold">
                                {certData.orgPhone && <span className="flex items-center gap-1"><Phone size={12} /> {certData.orgPhone}</span>}
                                {certData.orgWebsite && <span className="flex items-center gap-1"><Globe size={12} /> {certData.orgWebsite}</span>}
                            </div>
                        </header>

                        {/* 2. جسم الشهادة (Body) */}
                        <section
                            style={{ backgroundColor: colors.bodyBg, color: textColorBody }}
                            className="relative flex-1 px-16 py-6 text-center flex flex-col items-center justify-center relative "
                        >
                            <div className="absolute top-2 bottom-2 inset-0 flex items-center  justify-center pointer-events-none opacity-[0.08] z-0">
                                {certData.orgLogo ? (
                                    <img
                                        src={`${API_BASE_URL}/storage/${certData.orgLogo}`}
                                        alt="Watermark"
                                        className="w-auto grayscale  blur-[2px] w-[fit-content] h-[-webkit-fill-available]"
                                    />
                                ) : (
                                    <Award size={400} />
                                )}
                            </div>
                            {/* زخرفة الإطار */}
                            <div className="absolute inset-6 border-2 border-amber-500/10 pointer-events-none rounded-sm"></div>
                            <div className="absolute inset-8 border border-amber-500/5 pointer-events-none rounded-sm"></div>

                            <div className="mb-4 z-10">
                                <h2 className="text-amber-600 font-black text-3xl mb-2 tracking-[0.2em]">شهادة إنجاز معتمدة</h2>
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Certificate of Achievement</p>
                                <div className="w-24 h-1.5 bg-amber-500 mx-auto mt-4 rounded-full"></div>
                            </div>

                            <p className="text-lg text-slate-500 font-medium mb-4">تشهد إدارة {certData.orgName} بأن {volunteerTitle[certData.opportunityType]}:</p>

                            <div className="relative mb-4">
                                <h3 className="text-5xl font-black text-slate-900/90 leading-tight">
                                    {certData.volunteerName}
                                </h3>
                                <div className="h-1 w-full bg-gradient-to-r from-transparent via-amber-200 to-transparent mt-4"></div>
                            </div>

                            <p className="max-w-2xl text-slate-600 leading-relaxed text-lg mb-4">
                                قد أتم بنجاح كافة المتطلبات والمهام الموكلة {pronoun} في <b>{typeMap[certData.opportunityType] || 'البرنامج'}</b>،
                                وذلك خلال الفترة المحددة، وتقديراً لجهوده المتميزة والمبذولة في:
                            </p>

                            <div className="relative mb-6">

                                <div className="relative bg-slate-50/10 backdrop-blur-[3px] border border-white/40 py-6 px-10 rounded-2xl shadow-xl shadow-amber-950/10 overflow-hidden group">

                                    <span className="relative z-10 text-2xl font-black text-amber-950/80 tracking-tight">
                                        {certData.opportunityTitle}
                                    </span>
                                </div>

                                {/* ظل سفلي ناعم جداً لتعزيز تأثير الارتفاع */}
                                <div className="absolute -bottom-2 left-8 right-8 h-4 bg-amber-900/5 blur-xl rounded-full -z-10"></div>
                            </div>

                            {/* تفاصيل الفرصة الإضافية */}
                            <div className="grid grid-cols-2 gap-4 w-full max-w-lg  mb-6">
                                <div className="flex items-center justify-center gap-3 bg-slate-300/10 shadow-sm backdrop-blur-[2px]  p-3 rounded-xl border border-slate-100">
                                    <div className="p-2 bg-white rounded-lg text-amber-600 shadow-sm"><UserCheck size={18} /></div>
                                    <div className="text-right  space-y-1">
                                        <p className="text-[10px] text-slate-400 font-bold">تاريخ القبول</p>
                                        <p className="text-sm font-black text-slate-800">{certData.joinDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-center gap-3 bg-slate-300/10 shadow-sm backdrop-blur-[2px]  p-3 rounded-xl border border-slate-100">
                                    <div className="p-2 bg-white rounded-lg text-amber-600 shadow-sm"><ArrowLeftRight size={18} /></div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[10px] text-slate-400 font-bold">فترة التنفيذ</p>
                                        <p className="text-sm font-black text-slate-800">{certData.duration}</p>
                                    </div>
                                </div>
                            </div>

                            {/* الإحصائيات والأرقام */}
                            <div className="grid grid-cols-3 gap-8 w-full max-w-2xl pt-4 border-t border-slate-100">
                                <div className="text-center">
                                    <Clock size={22} className="mx-auto mb-2 text-amber-600" />
                                    <span className="block font-black text-xl text-slate-800">{certData.hours} ساعة</span>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">الساعات المنجزة</p>
                                </div>
                                <div className="text-center border-x border-slate-100 px-4">
                                    <MapPin size={22} className="mx-auto mb-2 text-amber-600" />
                                    <span className="block font-black text-lg text-slate-800 truncate">{certData.location}</span>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">مقر العمل</p>
                                </div>
                                <div className="text-center">
                                    <CheckCircle size={22} className="mx-auto mb-2 text-green-600" />
                                    <span className="block font-black text-xl text-slate-800">نشط</span>
                                    <p className="text-[10px] uppercase font-bold text-slate-400">الحالة الرقمية</p>
                                </div>
                            </div>
                        </section>

                        {/* 3. التذييل (Footer) */}
                        <footer
                            style={{ backgroundColor: colors.footerBg, color: textColorFooter }}
                            className="p-6 relative border-t justify-center border-slate-100"
                        >
                            <div className="flex justify-between items-center relative z-10 mb-3">
                                {/* التوقيع */}
                                <div className="flex flex-col items-center">
                                    {certData.digital_signature ? (
                                        <img
                                            src={`${API_BASE_URL}/storage/${certData.digital_signature}`}
                                            alt="Signature"
                                            className="h-20 object-contain mb-2 mix-blend-multiply"
                                            style={{ filter: textColorFooter === '#ffffff' ? 'brightness(0) invert(1)' : 'none' }}
                                        />
                                    ) : (
                                        <div className="h-20 flex items-center justify-center italic text-slate-600 font-serif">Official Stamp</div>
                                    )}
                                    <div className="w-40 h-px bg-slate-300"></div>
                                    <p className="text-[10px] mt-2 font-black text-slate-500 uppercase tracking-widest">التوقيع والختم الرقمي</p>
                                </div>

                                {/* QR Code للتحقق */}
                                <div className="flex flex-col items-center bg-white p-3 rounded-sm shadow-sm border border-slate-100">
                                    <QRCodeSVG
                                        value={`https://musanada.com/verify/${certData.certificateCode}`}
                                        size={85}
                                        level={"H"}
                                        includeMargin={false}
                                    />
                                    <p className="text-[8px] mt-2 font-bold text-slate-400">مسح للتحقق</p>
                                </div>
                            </div>

                            {/* معلومات التوثيق السفلية */}
                            <div className="mt-4 pt-4 border-t border-slate-200/60 flex justify-between  items-center text-[10px]">
                                <div className="flex gap-6 items-center font-bold text-slate-500">
                                    <span className="flex items-center gap-1.5"><Calendar size={14} className="text-amber-600" /> حرر في: {certData.issueDate}</span>
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-slate-700">
                                        <ShieldCheck size={14} className="text-green-600" />
                                        الرقم المرجعي: {certData.certificateCode}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 font-black text-slate-400 tracking-tighter">
                                    <Copyright size={12} />
                                    <span>جميع الحقوق محفوظة - منصة مساندة {new Date().getFullYear()}</span>
                                </div>
                            </div>
                        </footer>

                        {/* شريط جمالي في نهاية الورقة */}
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700"></div>
                    </div>
                </div >
            </main >

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
                
                @media print {
                    /* إخفاء كل شيء عدا الشهادة */
                    .no-print { display: none !important; }
                    
                    /* تصفير شامل للجسم والحاويات */
                    body, html { 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        height: 100%;
                        background: white !important;
                        -webkit-print-color-adjust: exact; /* لضمان ظهور الألوان */
                        print-color-adjust: exact;
                    }

                    /* إزالة أي إزاحة علوية قد يسببها الـ main */
                    main { 
                        padding: 0 !important; 
                        margin: 0 !important; 
                        display: block !important;
                    }

                    /* الشهادة يجب أن تبدأ من أعلى نقطة */
                    .certificate-paper {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        margin: 0 !important;
                        width: 210mm !important; /* مقاس A4 دقيق */
                        height: 297mm !important;
                        border:none
                    }

                    /* إلغاء الـ Scale تماماً عند الطباعة */
                    div[style*="transform"] {
                        transform: none !important;
                    }
                }

                @page {
                    size: A4 portrait;
                    margin: 0; /* إلغاء هوامش الصفحة الافتراضية للمتصفح */
                }
            `}</style>
        </div >
    );
};

export default GlobalCertificateManager;