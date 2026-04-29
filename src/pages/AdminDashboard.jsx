import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Users, Building2, Briefcase, Clock, ShieldCheck,
    TrendingUp, TrendingDown, ArrowUpRight, Search,
    Filter, Download, Bell, MoreHorizontal, Layers,
    Activity, Star, Calendar, FileText, CheckCircle2,
    AlertOctagon, UserPlus, MousePointer2, RefreshCcw,
    UserX, ShieldAlert, CheckCircle, XCircle, ExternalLink
} from 'lucide-react';
import Swal from 'sweetalert2'
import { motion, AnimatePresence } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import api from '../api/axios';
import AdminSidebar from '../components/AdminSidebar';
import { useNavigate } from 'react-router-dom';


const AdminDashboard = () => {
const API_URL = import.meta.env.VITE_API_URL;
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // حالة البيانات الأساسية
    const [stats, setStats] = useState({
        summary: {
            total_students: 0,
            verified_organizations: 0,
            active_opportunities: 0,
            total_documented_hours: 0,
            student_growth: 0,
            org_growth: 0,
            opp_growth: 0,
            hours_growth: 0
        },
        charts: {
            userGrowth: [],
            skillsGap: []
        },
        pendingOrganizations: [],
        systemLogs: []
    });

    const Toast = Swal.mixin({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 3000,
        background: '#ffffff',
        color: '#1e293b',
        customClass: { popup: 'rounded-2xl border border-slate-100 shadow-2xl' }
    });
    // جلب البيانات الشاملة (FR-A11)
    const fetchAdminData = useCallback(async (isRefresh = false) => {


        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [statsRes, growthRes, skillsRes, pendingRes, logsRes] = await Promise.all([
                api.get('/admin/dashboard/stats'),
                api.get('/admin/charts/user-growth'),
                api.get('/admin/charts/skills-comparison'),
                api.get('/admin/organizations/pending'),
                api.get('/admin/system/logs/latest')
            ]);
            
            setStats({
                summary: statsRes.data,
                charts: {
                    userGrowth: growthRes.data,
                    skillsGap: skillsRes.data
                },
                pendingOrganizations: pendingRes.data,
                systemLogs: logsRes.data
            });
        } catch (error) {
            console.error("Critical Error: Failed to sync with admin services", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }

    }, []);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

  const handleVerifyOrg = async (id, action) => {
    const isApprove = action === 'approve';
    
    const result = await Swal.fire({
        title: isApprove ? 'اعتماد المؤسسة' : 'حذف طلب التوثيق؟',
        html: isApprove 
            ? "هل أنت متأكد من توثيق هذه المؤسسة؟ سيتم تفعيل حسابهم فوراً."
            : `<div class="text-center p-2"><p class="text-sm text-slate-500 leading-relaxed">انتبه! هذا الإجراء سيؤدي إلى <span class="text-red-500 font-black">حذف كافة بيانات المؤسسة</span> نهائياً.</p></div>`,
        icon: isApprove ? 'success' : 'warning',
        iconColor: isApprove ? '#10b981' : '#ef4444',
        showCancelButton: true,
        confirmButtonText: isApprove ? 'نعم، قم بالتوثيق' : 'نعم، حذف نهائي',
        cancelButtonText: 'إلغاء',
        background: '#ffffff',
        color: '#1e293b',
        confirmButtonColor: isApprove ? '#10b981' : '#ef4444',
        customClass: {
            popup: 'rounded-[2.5rem] border border-slate-100 shadow-2xl backdrop-blur-md',
            confirmButton: 'rounded-xl px-6 py-3 font-black text-xs text-slate-900',
            cancelButton: 'rounded-xl px-6 py-3 font-black text-xs text-slate-400 bg-slate-50'
        }
    });

    if (result.isConfirmed) {
        try {
            Swal.showLoading();
            
            // تحديد المسار بناءً على النوع
            const endpoint = `/admin/organizations/${id}/${isApprove ? 'approve' : 'reject'}`;
            const response = await api.post(endpoint);

            // التحديث الذكي للحالة (State Update)
            setStats(prev => {
                // التأكد من الوصول للمصفوفة الصحيحة سواء كانت stats.pendingOrganizations أو stats.pendingOrganizations.data
                const currentData = Array.isArray(prev.pendingOrganizations) 
                    ? prev.pendingOrganizations 
                    : prev.pendingOrganizations.data;

                const filteredData = currentData.filter(org => org.id !== id);

                return {
                    ...prev,
                    pendingOrganizations: Array.isArray(prev.pendingOrganizations) 
                        ? filteredData 
                        : { ...prev.pendingOrganizations, data: filteredData }
                };
            });

            Toast.fire({
                icon: isApprove ? 'success' : 'warning',
                title: response.data.message || (isApprove ? 'تم التفعيل بنجاح' : 'تم الحذف بنجاح')
            });

        } catch (error) {
            const errMsg = error.response?.data?.error || "فشلت العملية";
            Toast.fire({ icon: 'error', title: errMsg });
        }
    }
};
    const colorVariants = {
        amber: 'bg-amber-50 text-amber-600 from-amber-500/5',
        emerald: 'bg-emerald-50 text-emerald-600 from-emerald-500/5',
        blue: 'bg-blue-50 text-blue-600 from-blue-500/5',
        purple: 'bg-purple-50 text-purple-600 from-purple-500/5',
    };
    // مكون بطاقة الإحصائيات الذكية
    const StatCard = useMemo(() => ({ title, value, icon: Icon, color, trend, description }) => (
        <motion.div
            whileHover={{ y: -5, scale: 1.01 }}
            className="bg-white border border-slate-100 p-6 rounded-[2.2rem] relative overflow-hidden group shadow-sm"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorVariants[color].split(' ')[2]} to-transparent rounded-full -mr-16 -mt-16 blur-3xl group-hover:opacity-100 opacity-50 transition-all duration-500`} />

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`p-4 rounded-2xl ${colorVariants[color].split(' ')[0]} ${colorVariants[color].split(' ')[1]} border border-slate-300 shadow-sm`}>
                    <Icon size={26} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 ${trend >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <h3 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">
                    {loading ? "---" : value.toLocaleString()}
                </h3>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">{title}</p>
                <p className="text-[10px] text-slate-500 mt-2 font-medium italic line-clamp-1">{description}</p>
            </div>
        </motion.div>
    ), [loading]);


    if (loading) return <LoadingScreen />;


    return (

        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-['Tajawal']" dir="rtl">
            <AdminSidebar />

            <main className="flex-1 transition-all duration-500 p-4 md:p-6 lg:p-10 max-h-screen overflow-y-auto custom-scrollbar">

                {/* Header: تحكم النظام */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)]" />
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900">لوحة التحكم</h1>
                        </div>
                        <p className="text-slate-500 font-bold text-sm mr-5 flex items-center gap-2">
                            <Activity size={14} className="text-emerald-500" />
                            حالة النظام: نشط ومستقر
                        </p>
                    </motion.div>

                    <div className="flex items-center gap-3 w-full md:w-auto bg-white p-2 rounded-[1.5rem] border border-slate-100 shadow-sm">
                        <button
                            onClick={() => fetchAdminData(true)}
                            disabled={refreshing}
                            className={`p-4 rounded-xl transition-all ${refreshing ? 'animate-spin text-slate-600' : 'text-amber-500 hover:bg-amber-50'}`}
                        >
                            <RefreshCcw size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/admin/analytics')}
                            className="flex items-center gap-3 bg-slate-900 text-slate-900 px-6 py-4 rounded-xl font-black text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                        >
                            <Download size={18} />
                            تصدير التقارير
                        </button>
                    </div>
                </header>

                {/* 1. Statistics Grid: بيانات حقيقية من API */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        title="قاعدة بيانات الطلاب"
                        value={stats.summary.total_students}
                        icon={Users}
                        color="amber"
                        trend={stats.summary.student_growth}
                        description="إجمالي حسابات الطلاب المسجلة"
                    />
                    <StatCard
                        title="الشركاء المعتمدون"
                        value={stats.summary.verified_organizations}
                        icon={Building2}
                        color="emerald"
                        trend={stats.summary.org_growth}
                        description="المؤسسات الموثقة رسمياً"
                    />
                    <StatCard
                        title="المبادرات القائمة"
                        value={stats.summary.active_opportunities}
                        icon={Briefcase}
                        color="blue"
                        trend={stats.summary.opp_growth}
                        description="فرص تطوعية نشطة حالياً"
                    />
                    <StatCard
                        title="ساعات التأثير"
                        value={stats.summary.total_documented_hours}
                        icon={Clock}
                        color="purple"
                        trend={stats.summary.hours_growth}
                        description="الساعات المعتمدة في النظام"
                    />
                </div>

                {/* 2. Advanced Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

                    {/* مخطط النمو السنوي */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        className="lg:col-span-2 bg-white border border-slate-100 p-8 rounded-[3rem] shadow-sm relative overflow-hidden"
                    >
                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <div>
                                <h4 className="text-xl font-black text-slate-900 mb-1">معدلات النمو</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Growth Metrics Overview</p>
                            </div>
                            <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                <button className="px-5 py-2.5 rounded-xl bg-white text-slate-900 text-[10px] font-black shadow-sm border border-slate-100">شهري</button>
                                <button className="px-5 py-2.5 rounded-xl text-slate-400 text-[10px] font-black hover:text-slate-600 transition-colors">سنوي</button>
                            </div>
                        </div>

                        <div className="h-[380px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.charts.userGrowth}>
                                    <defs>
                                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorOrgs" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorOpps" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                                    <Area type="monotone" dataKey="students" name="الطلاب" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                    <Area type="monotone" dataKey="organizations" name="المنظمات" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorOrgs)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                    <Area type="monotone" dataKey="opportunities" name="الفرص" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorOpps)" activeDot={{ r: 6, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* تحليل المهارات والاحتياج */}
                    <div className="bg-white border border-slate-100 p-8 rounded-[3rem] shadow-sm flex flex-col">
                        <h4 className="text-xl font-black text-slate-900 mb-1">ذكاء المهارات</h4>
                        <p className="text-xs text-slate-400 font-bold mb-10 italic">مقارنة العرض والطلب المهاراتي</p>

                        <div className="flex-1 w-full min-h-[250px]" dir='ltr'>
                            {stats.charts.skillsGap.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats.charts.skillsGap} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="skill_name" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={80} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                        <Bar dataKey="demanded" fill="#10b981" radius={[0, 4, 4, 0]} name="الطلب" barSize={10} />
                                        <Bar dataKey="available" fill="#f59e0b" radius={[0, 4, 4, 0]} name="العرض" barSize={10} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-900">
                                    <Activity size={48} />
                                    <p className="mt-4 text-[10px] font-black uppercase">لا توجد بيانات حالياً</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <ShieldAlert size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-900 font-black uppercase">تحليل الفجوة</p>
                                <p className="text-[9px] text-slate-500 font-bold">يتطلب النظام تعزيز مهارات البرمجة والقيادة</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Operational Grid: الإدارة المباشرة */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                    {/* مراجعة المؤسسات: نظام التوثيق (FR-A06) */}
                    <div className="overflow-auto bg-white border border-slate-100 rounded-[3rem] shadow-sm flex flex-col h-[550px]">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <ShieldCheck className="text-emerald-600" />
                                    طلبات التوثيق
                                </h4>
                                <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">Verification Queue</p>
                            </div>
                            <span className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-xl border border-emerald-100">
                                {(Array.isArray(stats.pendingOrganizations) ? stats.pendingOrganizations : stats.pendingOrganizations?.data || []).length} طلب معلق
                            </span>
                        </div>


                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                            <AnimatePresence mode='popLayout'>
                                {(() => {
                                    const organizations = Array.isArray(stats.pendingOrganizations) 
                                        ? stats.pendingOrganizations 
                                        : stats.pendingOrganizations?.data || [];
                                    
                                    return organizations.length > 0 ? organizations.map((org) => (
                                        <motion.div
                                            key={org.id}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="group p-5 rounded-3xl bg-white border border-slate-100 hover:border-emerald-500/30 transition-all flex items-center justify-between shadow-sm hover:shadow-md"
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
                                                    {org.user?.profile_image ? <img src={`${API_URL}/storage/${org.user.profile_image}`} alt="" className="w-10 h-10 rounded-lg object-contain" /> : <Building2 size={24} />}
                                                </div>
                                                <div>
                                                    <h5 className="text-sm font-black text-slate-900 flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                                                        {org.org_name}
                                                        <ExternalLink size={12} className="text-slate-600" />
                                                    </h5>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase italic tracking-tighter">
                                                        {org.org_type} • {org.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleVerifyOrg(org.id, 'approve')}
                                                    className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleVerifyOrg(org.id, 'reject')}
                                                    className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-slate-900 transition-all flex items-center justify-center shadow-sm"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                                            <CheckCircle2 size={64} strokeWidth={1} />
                                            <p className="mt-4 font-black text-sm uppercase">لا توجد طلبات معلقة</p>
                                        </div>
                                    );
                                })()}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* سجل العمليات الفوري (System Audit Logs) */}
                    <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm flex flex-col h-[550px]">
                        <h4 className="text-xl font-black text-slate-900 mb-10 flex items-center gap-3">
                            <Layers className="text-amber-500" />
                            تحركات النظام
                        </h4>
                        <div className="flex-1 space-y-8 relative before:absolute before:right-4 before:top-0 before:bottom-0 before:w-px before:bg-slate-50">
                            {stats.systemLogs.map((log, idx) => (
                                <div key={idx} className="relative pr-12 group">
                                    <div className="absolute right-0 top-1.5 w-8 h-8 rounded-xl bg-white border border-slate-100 text-amber-500 flex items-center justify-center z-10 group-hover:border-amber-500 transition-colors shadow-sm">
                                        {log.type === 'user' ? <UserPlus size={14} /> : log.type === 'security' ? <ShieldAlert size={14} /> : <Activity size={14} />}
                                    </div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[12px] text-slate-900 font-black leading-tight group-hover:text-emerald-600 transition-colors">{log.message}</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase flex items-center gap-2">
                                                <span className="w-1 h-1 rounded-full bg-amber-500" />
                                                {log.user_affected || "النظام التلقائي"}
                                            </p>
                                        </div>
                                        <span className="text-[9px] text-slate-600 font-black italic whitespace-nowrap">{log.timestamp}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer Analysis: البيانات التقنية */}
                <footer className="mt-20 pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10 text-[11px] font-black uppercase tracking-widest text-slate-400 pb-10">
                    <div className="flex items-center gap-5">
                        <div className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 font-mono">
                            v2.5.0-STABLE
                        </div>
                        <p>© 2026 مساندة • منصة الإدارة الذكية</p>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2.5 text-emerald-600">
                            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                            حالة الخادم: متصل
                        </div>
                        <div className="flex items-center gap-2.5 hover:text-slate-600 transition-colors cursor-help">
                            <Activity size={14} className="text-amber-500" />
                            الاستجابة: 12ms
                        </div>
                    </div>
                </footer>

            </main>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #e2e8f0; }
                
                @media (max-width: 1024px) {
                    main { padding: 1.5rem !important; }
                }
            `}</style>
        </div>
    );
};

const LoadingScreen = () => (
    <div className="h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] rounded-full" />
        <div className="relative">
            <div className="w-32 h-32 border-4 border-emerald-500/10 border-t-emerald-600 rounded-full animate-spin" />
            <div className="absolute inset-4 border-4 border-slate-200 border-b-slate-400 rounded-full animate-spin-slow" />
        </div>
        <div className="mt-12 text-center relative z-10">
            <h2 className="text-2xl font-black text-slate-900 tracking-[0.3em] uppercase">MUSANADA ADMIN</h2>
            <p className="text-xs text-emerald-600 mt-4 font-bold animate-pulse tracking-widest">جاري تحميل لوحة التحكم الذكية...</p>
        </div>
    </div>
);
export default AdminDashboard;