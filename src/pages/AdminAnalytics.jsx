import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Activity, Download, FileSpreadsheet, Layers,
    Users, Building2, Briefcase, RefreshCw,
    PieChart as PieIcon, BarChart3, Database, ShieldCheck,
    Cpu, HardDrive, Clock, Star, MapPin, Award,
    CheckCircle2, AlertTriangle, FileText, Globe, Phone, Mail, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import api from '../api/axios';
import AdminSidebar from '../components/AdminSidebar';
import * as XLSX from 'xlsx';

// نظام الألوان المتطور
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#7c3aed', '#ef4444', '#06b6d4', '#ec4899'];

const AdminAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState({
        opportunityStats: [],
        monthlyHours: [],
        topSkills: [],
        organizations: [],
        volunteers: [],
        opportunities: [],
     
    });

    const loadData = useCallback(async () => {
        setRefreshing(true);
        try {
            // جلب البيانات من Endpoint الإدارة الشامل
            const res = await api.get('/admin/advanced-analytics');
            setData(res.data);
        } catch (error) {
            console.error("Critical Error: Failed to fetch analytic data lake", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ==========================================
    // محرك تصدير البيانات الشامل (Excel Engine)
    // ==========================================
    const handleExport = (type) => {
        const wb = XLSX.utils.book_new();
        let sheetData = [];
        let sheetName = "";

        switch (type) {
            case 'organizations':
                sheetName = "سجل المؤسسات المعتمدة";
                sheetData = data.organizations.map(org => ({
                    "ID": org.id,
                    "اسم المؤسسة": org.org_name,
                    "نوع الكيان": org.org_type,
                    "المسؤول المباشر": org.contact_person,
                    "البريد الرسمي": org.user?.email,
                    "رقم الهاتف": org.user?.phone,
                    "الموقع الجغرافي": org.user?.location || 'غير محدد',
                    "الإحداثيات (Lat)": org.user?.lat,
                    "الإحداثيات (Lng)": org.user?.lng,
                    "الموقع الإلكتروني": org.website || 'لا يوجد',
                    "وصف النشاط": org.description,
                    "حالة التوثيق": org.is_verified ? 'موثقة رسميًا' : 'قيد المراجعة',
                    "رابط الترخيص": org.license_file,
                    "تاريخ الانضمام": new Date(org.created_at).toLocaleDateString('ar-YE')
                }));
                break;

            case 'volunteers':
                sheetName = "قاعدة بيانات المتطوعين";
                sheetData = data.volunteers.map(v => ({
                    "ID": v.id,
                    "الاسم الكامل": v.full_name,
                    "البريد الإلكتروني": v.email,
                    "رقم الهاتف": v.phone || 'غير متوفر',
                    "الجامعة": v.profile?.university,
                    "التخصص الأكاديمي": v.profile?.major,
                    "الجنس": v.profile?.gender === 'male' ? 'ذكر' : 'أنثى',
                    "ساعات التطوع": v.profile?.total_volunteer_hours || 0,
                    "ساعات التدريب": v.profile?.total_training_hours || 0,
                    "المهارات": v.profile?.skills?.map(s => s.name).join(', ') || 'لا يوجد',
                    "تاريخ الميلاد": v.profile?.birth_date,
                    "الحالة": v.is_active ? 'نشط' : 'محظور',
                    "العنوان السكني": v.location
                }));
                break;

            case 'opportunities':
                sheetName = "سجل الفرص والأنشطة";
                sheetData = data.opportunities.map(opp => ({
                    "معرف الفرصة": opp.id,
                    "العنوان": opp.title,
                    "المؤسسة المنظمة": opp.user?.organization?.org_name,
                    "النوع": opp.type === 'voluntary' ? 'تطوع' : (opp.type === 'course' ? 'دورة' : 'تدريب تعاوني'),
                    "الحالة": opp.status,
                    "العدد المطلوب": opp.required_volunteers,
                    "الموقع": opp.location,
                    "المدة": opp.duration,
                    "الجنس المطلوب": opp.gender === 'both' ? 'للجميع' : (opp.gender === 'male' ? 'ذكور' : 'إناث'),
                    "الموعد النهائي": opp.deadline,
                    "المهارات المطلوبة": opp.skills?.map(s => s.name).join(' | '),
                    "وصف الفرصة": opp.description,
                    "المتطلبات": opp.requirements
                }));
                break;

            case 'skills_analytics':
                sheetName = "تحليل فجوة المهارات";
                sheetData = data.topSkills.map(skill => ({
                    "اسم المهارة": skill.name,
                    "عدد الفرص الطالبة": skill.opportunities_count || 0,
                    "عدد المتطوعين المالكين": skill.users_count || 0,
                    "مؤشر الفجوة": (skill.opportunities_count || 0) - (skill.users_count || 0),
                    "نسبة التغطية": skill.opportunities_count > 0
                        ? `${((skill.users_count / skill.opportunities_count) * 100).toFixed(1)}%`
                        : '100%'
                }));
                break;

            case 'annual_report':
                generateComprehensiveReport(wb);
                return;

            default: return;
        }

        const ws = XLSX.utils.json_to_sheet(sheetData);
        // ضبط اتجاه الورقة لتكون من اليمين لليسار (اللغة العربية)
        ws['!dir'] = 'rtl';
        // ضبط عرض الأعمدة تلقائياً
        const wscols = Object.keys(sheetData[0] || {}).map(() => ({ wch: 25 }));
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `مساندة_${sheetName}_${new Date().getFullYear()}.xlsx`);
    };

    // توليد تقرير سنوي شامل (يحتوي على كافة أوراق العمل)
    const generateComprehensiveReport = (wb) => {
        const totalHours = data.monthlyHours.reduce((sum, item) => sum + parseFloat(item.total_hours || 0), 0);

        // 1. الملخص التنفيذي
        const summaryLine = [{
            "سنة التقرير": new Date().getFullYear(),
            "إجمالي المسجلين": data.volunteers.length + data.organizations.length,
            "عدد المتطوعين": data.volunteers.length,
            "المؤسسات المعتمدة": data.organizations.filter(o => o.is_verified).length,
            "إجمالي الساعات": totalHours,
            "الفرص المنفذة": data.opportunities.filter(o => o.status === 'completed').length,
            "المهارة الذهبية": data.topSkills[0]?.name || 'N/A',
            "نطاق التغطية": "المملكة العربية السعودية",
            "حالة النظام": "مستقر ونشط"
        }];

        const addSheet = (sheetData, name) => {
            if (sheetData.length === 0) return;
            const ws = XLSX.utils.json_to_sheet(sheetData);
            ws['!dir'] = 'rtl';
            ws['!cols'] = Object.keys(sheetData[0]).map(() => ({ wch: 25 }));
            XLSX.utils.book_append_sheet(wb, ws, name);
        };

        addSheet(summaryLine, "الملخص التنفيذي");

        // 2. بيانات المؤسسات
        const orgsData = data.organizations.map(org => ({
            "ID": org.id,
            "اسم المؤسسة": org.org_name,
            "نوع الكيان": org.org_type,
            "البريد الرسمي": org.user?.email,
            "رقم الهاتف": org.user?.phone,
            "الفرص المنشورة": org.opportunities_count || 0,
            "حالة التوثيق": org.is_verified ? 'موثقة' : 'قيد المراجعة',
        }));
        addSheet(orgsData, "المؤسسات المعتمدة");

        // 3. بيانات الكوادر
        const volsData = data.volunteers.map(v => ({
            "ID": v.id,
            "الاسم الكامل": v.full_name,
            "البريد الإلكتروني": v.email,
            "الجامعة": v.profile?.university,
            "ساعات التطوع": v.profile?.total_volunteer_hours || 0,
            "الحالة": v.is_active ? 'نشط' : 'محظور',
        }));
        addSheet(volsData, "الكوادر والمتطوعين");

        // 4. بيانات الفرص
        const oppsData = data.opportunities.map(opp => ({
            "العنوان": opp.title,
            "المؤسسة": opp.user?.organization?.org_name,
            "النوع": opp.type === 'voluntary' ? 'تطوع' : 'أخرى',
            "الحالة": opp.status,
            "العدد المطلوب": opp.required_volunteers,
            "المدة": opp.duration,
        }));
        addSheet(oppsData, "سجل الفرص");

        XLSX.writeFile(wb, `التقرير_السنوي_الشامل_مساندة_${new Date().getFullYear()}.xlsx`);
    };

    if (loading) return <LoadingScreen />;

    return (
        <div className="flex min-h-screen bg-[#05050a] text-gray-200 font-['Cairo'] rtl" dir="rtl">
            <AdminSidebar activePage="analytics" />

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Dynamic Header */}
                <header className="h-24 border-b border-white/5 flex items-center justify-between px-10 bg-[#0a0a16]/80 backdrop-blur-3xl z-30">
                    <div className="flex items-center gap-5">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative p-4 bg-[#0f0f1a] rounded-2xl text-blue-500 border border-white/10">
                                <Database size={28} />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">الإحصائيات المتقدمة</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em]"> استخراج البيانات وتصديرها ملفات Excel </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={loadData}
                            className={`p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all ${refreshing ? 'animate-spin' : ''}`}
                        >
                            <RefreshCw size={20} className="text-blue-400" />
                        </button>
                        <button
                            onClick={() => handleExport('annual_report')}
                            className="group relative flex items-center gap-3 px-8 py-3 bg-white text-black rounded-2xl font-black text-xs transition-all hover:scale-105 active:scale-95 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Award size={18} className="relative z-10" />
                            <span className="relative z-10 text-black group-hover:text-white transition-colors">تصدير التقرير السنوي الشامل</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1  overflow-y-auto [scrollbar-width:_none] [-ms-overflow-style:_none] [&::-webkit-scrollbar]:hidden p-10 custom-scrollbar space-y-12 pb-32">

                    {/* Control Panel: Data Export Hub */}
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <Layers className="text-purple-500" size={20} />
                            <h2 className="text-lg font-black text-white">منصة استخراج السجلات (Master Export)</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <ExportCard
                                title="سجل المؤسسات"
                                desc="التراخيص، الهوية، بيانات المسؤولين، والمواقع"
                                icon={Building2}
                                color="blue"
                                onClick={() => handleExport('organizations')}
                            />
                            <ExportCard
                                title="قاعدة الكوادر"
                                desc="البيانات الشخصية، المهارات، والساعات المعتمدة"
                                icon={Users}
                                color="emerald"
                                onClick={() => handleExport('volunteers')}
                            />
                            <ExportCard
                                title="أرشيف الفرص"
                                desc="جميع الفرص (المكتملة والنشطة) مع كامل تفاصيلها"
                                icon={Briefcase}
                                color="purple"
                                onClick={() => handleExport('opportunities')}
                            />
                            <ExportCard
                                title="مصفوفة المهارات"
                                desc="تحليل العرض والطلب وفجوات الاحتياج التدريبي"
                                icon={Star}
                                color="amber"
                                onClick={() => handleExport('skills_analytics')}
                            />
                        </div>
                    </section>

                    {/* Analytics Matrix */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* الجهد الزمني */}
                        <div className="lg:col-span-2 bg-[#0f0f1a] border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">سجل الإنتاجية الزمنية</h3>
                                    <p className="text-xs text-gray-500 mt-1 font-bold">إجمالي الساعات الموثقة عبر النظام شهرياً</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-500 text-[10px] font-black">
                                        سنة {new Date().getFullYear()}
                                    </div>
                                </div>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={data.monthlyHours}>
                                        <defs>
                                            <linearGradient id="hourGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="month" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <Area
                                            type="monotone"
                                            dataKey="total_hours"
                                            stroke="#3b82f6"
                                            strokeWidth={4}
                                            fill="url(#hourGradient)"
                                            animationDuration={2000}
                                            activeDot={{ r: 8, stroke: '#0f0f1a', strokeWidth: 3, fill: '#3b82f6' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* توزيع الحالات */}
                        <div className="bg-[#0f0f1a] border border-white/5 p-8 rounded-[3rem] shadow-2xl flex flex-col">
                            <h3 className="text-lg font-black text-white mb-8 text-center uppercase tracking-widest">فرص النظام</h3>
                            <div className="flex-1 min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.opportunityStats}
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={10}
                                            dataKey="total"
                                            nameKey="status"
                                            animationBegin={0}
                                            animationDuration={1500}
                                        >
                                            {data.opportunityStats.map((entry, index) => {
                                                const STATUS_COLORS = { open: '#10b981', closed: '#ef4444', completed: '#3b82f6', pending: '#f59e0b' };
                                                const fill = STATUS_COLORS[entry.status] || COLORS[index % COLORS.length];
                                                return <Cell key={`cell-${index}`} fill={fill} stroke="rgba(15, 15, 26, 0.5)" strokeWidth={2} style={{ filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.3))', cursor: 'pointer' }} />;
                                            })}
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                        <Legend
                                            verticalAlign="bottom"
                                            iconType="circle"
                                            wrapperStyle={{ fontSize: '10px', fontWeight: '900', paddingTop: '20px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-gray-500 uppercase">معدل الإنجاز الكلي</span>
                                    <span className="text-xs font-black text-emerald-500">92.4%</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '92.4%' }}
                                        transition={{ duration: 2, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skill Gap Analysis Matrix */}
                    <div className="bg-[#0f0f1a]/80 border border-white/5 p-10 rounded-[3rem] backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30" />

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                            <div>
                                <h3 className="text-2xl font-black text-white flex items-center gap-4">
                                    <Star className="text-amber-500" size={32} />
                                    تحليل فجوة المهارات (Skill Gap Analysis)
                                </h3>
                                <p className="text-sm text-gray-500 mt-2 font-medium max-w-2xl leading-relaxed">
                                    يوضح هذا الجدول التوازن بين المهارات التي تطلبها المؤسسات (الطلب) والمهارات المتوفرة لدى قاعدة الكوادر (العرض). المهارات ذات الفجوة العالية تتطلب تدخلات تدريبية عاجلة.
                                </p>
                            </div>
                            <button
                                onClick={() => handleExport('skills_analytics')}
                                className="flex items-center gap-3 px-6 py-3 bg-purple-500/10 text-purple-500 rounded-2xl hover:bg-purple-500 hover:text-white transition-all font-black text-xs"
                            >
                                <FileSpreadsheet size={18} />
                                تصدير مصفوفة المهارات
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                            {data.topSkills.map((skill, index) => {
                                const demand = skill.opportunities_count || 0;
                                const supply = skill.users_count || 0;
                                const gap = Math.max(0, demand - supply);
                                const percentage = demand > 0 ? (supply / demand) * 100 : 100;
                                // هذا غير موجود 
                                console.log(skill.users_count)
                                return (
                                    <motion.div
                                        key={skill.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1 }}
                                        className="relative group"
                                    >
                                        <div className="flex justify-between items-end mb-4">
                                            <div className="flex items-center gap-4">
                                                <span className="text-3xl font-black text-white/5 group-hover:text-purple-500/20 transition-colors">0{index + 1}</span>
                                                <div>
                                                    <h4 className="text-base font-black text-gray-200 uppercase tracking-wide group-hover:text-white transition-colors">{skill.name}</h4>
                                                    <span className="text-[10px] text-gray-500 font-bold">مؤشر الكفاءة: {percentage.toFixed(0)}%</span>
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-black text-white">{demand}</span>
                                                    <TrendingUp size={14} className="text-blue-500" />
                                                </div>
                                                <span className="text-[9px] text-gray-500 font-black uppercase tracking-tighter">طلب مؤسسي نشط</span>
                                            </div>
                                        </div>

                                        <div className="h-4 w-full bg-white/5 rounded-full p-1 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${Math.min(100, (supply / Math.max(demand, supply)) * 100)}%` }}
                                                className={`h-full rounded-full ${gap > 5 ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`}
                                            />
                                        </div>

                                        <div className="flex justify-between items-center mt-3">
                                            <div className="flex items-center gap-2">
                                                <Users size={12} className="text-gray-600" />
                                                <span className="text-[10px] text-gray-400 font-bold">المتوفر: {supply} كادر</span>
                                            </div>
                                            {gap > 0 && (
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                                                    <AlertTriangle size={10} className="text-red-500" />
                                                    <span className="text-[9px] text-red-500 font-black">عجز: {gap}</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// --- المكونات الفرعية الاحترافية ---

const ExportCard = ({ title, desc, icon: Icon, color, onClick }) => {
    const themes = {
        blue: 'border-blue-500/10 hover:border-blue-500/40 text-blue-500 shadow-blue-900/5 hover:bg-blue-500/5',
        emerald: 'border-emerald-500/10 hover:border-emerald-500/40 text-emerald-500 shadow-emerald-900/5 hover:bg-emerald-500/5',
        amber: 'border-amber-500/10 hover:border-amber-500/40 text-amber-500 shadow-amber-900/5 hover:bg-amber-500/5',
        purple: 'border-purple-500/10 hover:border-purple-500/40 text-purple-500 shadow-purple-900/5 hover:bg-purple-500/5',
    };

    return (
        <motion.div
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            onClick={onClick}
            className={`p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all bg-[#0f0f1a]/60 backdrop-blur-xl flex flex-col gap-6 group ${themes[color]}`}
        >
            <div className="flex justify-between items-start">
                <div className={`p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform`}>
                    <Icon size={32} />
                </div>
                <div className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download size={16} />
                </div>
            </div>
            <div>
                <h4 className="text-lg font-black text-white mb-2">{title}</h4>
                <p className="text-xs text-gray-500 font-bold leading-relaxed">{desc}</p>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-50 group-hover:opacity-100">
                <span>استخراج الآن</span>
                <div className="h-px flex-1 bg-current opacity-20" />
            </div>
        </motion.div>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#0f0f1a] border border-white/10 p-5 rounded-2xl shadow-2xl backdrop-blur-2xl">
                <p className="text-[10px] font-black text-blue-400 mb-3 uppercase tracking-[0.2em]">{label}</p>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                        <Clock className="text-blue-500" size={20} />
                    </div>
                    <div>
                        <p className="text-lg font-black text-white">{payload[0].value.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500 font-bold">ساعة معتمدة سجلت</p>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const statuses = { open: 'متاحة (Open)', closed: 'مغلقة (Closed)', completed: 'منجزة (Completed)', pending: 'قيد الانتظار (Pending)' };
        const label = statuses[payload[0].name] || payload[0].name;
        return (
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-2xl">
                <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">{label}</p>
                <p className="text-3xl font-black" style={{ color: payload[0].payload.fill }}>{payload[0].value}</p>
            </div>
        );
    }
    return null;
};

const HealthBadge = ({ icon: Icon, value, label, color }) => (
    <div className="flex items-center gap-4 px-5 py-3 bg-[#0f0f1a]/95 border border-white/10 rounded-2xl backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className={`p-2 bg-${color}-500/10 rounded-lg`}>
            <Icon size={16} className={`text-${color}-500`} />
        </div>
        <div className="flex flex-col">
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-tighter">{label}</span>
            <span className="text-xs font-black text-white">{value}</span>
        </div>
    </div>
);

const TrendingUp = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
    </svg>
);

const LoadingScreen = () => (
    <div className="h-screen bg-[#05050a] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="relative">
            <div className="w-32 h-32 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
            <div className="absolute inset-4 border-4 border-purple-500/10 border-b-purple-500 rounded-full animate-spin-slow" />
        </div>
        <div className="mt-12 text-center relative z-10">
            <h2 className="text-2xl font-black text-white tracking-[0.3em] uppercase">Musanada Intelligence</h2>
            <p className="text-xs text-blue-400 mt-4 font-bold animate-pulse">جاري تجميع البيانات من بحيرة البيانات المركزية...</p>
        </div>
    </div>
);

export default AdminAnalytics;