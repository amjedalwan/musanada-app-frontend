import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, Award, Users, ChevronLeft, Map, Star } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const LandingPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        if (token && role) {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    const stats = [
        { label: 'متطوع مسجل', value: '+5,000', icon: Users, color: 'from-blue-500 to-cyan-400' },
        { label: 'ساعة تطوعية', value: '+12,000', icon: Award, color: 'from-purple-500 to-indigo-500' },
        { label: 'فرصة متاحة', value: '+300', icon: Map, color: 'from-emerald-500 to-teal-400' },
    ];

    const features = [
        {
            title: 'فرص حقيقية وموثوقة',
            desc: 'جميع المنظمات والفرص التطوعية يتم التحقق منها بعناية من قبل إدارة المنصة.',
            icon: ShieldCheck,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/20'
        },
        {
            title: 'توثيق دقيق للساعات',
            desc: 'نظام إلكتروني دقيق يسجل ساعاتك التطوعية ويحفظها في ملفك الشخصي.',
            icon: Star,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20'
        },
        {
            title: 'شهادات معتمدة',
            desc: 'احصل على شهادات رسمية ومعتمدة فور إكمالك للفرص التطوعية بنجاح.',
            icon: Award,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10 border-purple-500/20'
        }
    ];

    return (
        <div className="flex min-h-screen bg-[#020205] text-white font-sans selection:bg-purple-500/30" dir="rtl">
            <Sidebar />

            <main className="flex-1 relative overflow-y-auto custom-scrollbar">
                {/* Background effects */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] pointer-events-none rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] pointer-events-none rounded-full"></div>

                <div className="max-w-6xl mx-auto p-4 lg:p-10 relative z-10">
                    
                    {/* Hero Section */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 py-10 lg:py-20 border-b border-white/5">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="flex-1 text-center lg:text-right"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-gray-300">منصة مساندة التطوعية</span>
                            </div>
                            
                            <h1 className="text-4xl lg:text-7xl font-black mb-6 leading-tight text-white">
                                اصنع <span className="text-transparent bg-clip-text bg-gradient-to-l from-purple-400 to-indigo-600">الأثر</span>، <br/>
                                وابدأ رحلتك التطوعية
                            </h1>
                            
                            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                مساندة هي منصتك الأولى للوصول إلى الفرص التطوعية، توثيق ساعاتك، وبناء سجل حافل بالإنجازات يخدم مجتمعك ومستقبلك المهني.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <button 
                                    onClick={() => navigate('/opportunities')}
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/25 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                                >
                                    <Search size={20} /> استكشف الفرص
                                </button>
                                <button 
                                    onClick={() => navigate('/register')}
                                    className="w-full sm:w-auto px-8 py-4 rounded-2xl font-black text-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-white"
                                >
                                    انضم كمتطوع <ChevronLeft size={20} />
                                </button>
                            </div>
                        </motion.div>

                        {/* Hero Illustration */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex-1 w-full max-w-lg relative"
                        >
                            <div className="aspect-square rounded-[3rem] bg-gradient-to-tr from-purple-900/40 to-indigo-900/40 border border-white/10 p-8 relative overflow-hidden backdrop-blur-sm">
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50"></div>
                                <div className="h-full w-full rounded-[2rem] bg-[#0a0a0f]/80 border border-white/5 flex flex-col items-center justify-center relative z-10 shadow-2xl p-6">
                                    <ShieldCheck size={80} className="text-purple-500 mb-6 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                                    <h3 className="text-2xl font-black text-white text-center mb-2">موثوقية وأمان</h3>
                                    <p className="text-center text-sm text-gray-400">بيئة تطوعية آمنة وموثوقة</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Stats Section */}
                    <div className="py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] flex items-center gap-6"
                            >
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                                    <stat.icon size={28} />
                                </div>
                                <div>
                                    <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">{stat.label}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Features Section */}
                    <div className="py-16 border-t border-white/5">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-black text-white mb-4">لماذا تختار منصة مساندة؟</h2>
                            <p className="text-gray-400">نقدم لك بيئة متكاملة تضمن تجربة تطوعية سلسة واحترافية</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {features.map((feature, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-[#0a0a0f] border border-white/5 p-8 rounded-[2.5rem] hover:bg-white/[0.02] transition-colors"
                                >
                                    <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center ${feature.color} mb-6 border`}>
                                        <feature.icon size={24} />
                                    </div>
                                    <h3 className="text-xl font-black text-white mb-3">{feature.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed font-medium">
                                        {feature.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="my-16 bg-gradient-to-r from-purple-900/20 to-indigo-900/20 border border-purple-500/20 rounded-[3rem] p-10 lg:p-16 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>
                        
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-3xl lg:text-4xl font-black text-white mb-6">هل أنت مستعد للبدء؟</h2>
                            <p className="text-gray-300 mb-10 leading-relaxed">
                                انضم إلى آلاف المتطوعين والمنظمات الذين يصنعون الفارق يومياً. سجل الآن وابدأ رحلة العطاء.
                            </p>
                            <div className="flex justify-center gap-4">
                                <button 
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-4 rounded-2xl font-black text-white bg-purple-600 hover:bg-purple-500 shadow-lg transition-all"
                                >
                                    تسجيل الدخول
                                </button>
                                <button 
                                    onClick={() => navigate('/register')}
                                    className="px-8 py-4 rounded-2xl font-black text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
                                >
                                    إنشاء حساب مجاني
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default LandingPage;
