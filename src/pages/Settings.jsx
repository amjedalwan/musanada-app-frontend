import React, { useState } from 'react';
import {
    User, Lock, Bell, Globe,
    Shield, Moon, Sun, Save,
    LogOut, Trash2, Camera,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Settings = () => {
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [activeTab, setActiveTab] = useState('profile'); // profile, security, notifications
    const [isDarkMode, setIsDarkMode] = useState(true);

    return (
        <div className="flex min-h-screen bg-[#0a0a16] text-white font-sans" dir="rtl">
            <Sidebar role={user?.role} />

            <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
                {/* Header */}
                <div className="mb-10">
                    <h1 className="text-3xl font-black">الإعدادات</h1>
                    <p className="text-gray-500 mt-2">إدارة حسابك وتفضيلات المنصة</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Sidebar Tabs */}
                    <div className="space-y-2">
                        {[
                            { id: 'profile', label: 'الملف الشخصي', icon: User },
                            { id: 'security', label: 'الأمان والخصوصية', icon: Lock },
                            { id: 'notifications', label: 'التنبيهات', icon: Bell },
                            { id: 'appearance', label: 'المظهر واللغة', icon: Globe },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === tab.id
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                                    : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                    }`}
                            >
                                <tab.icon size={20} />
                                {tab.label}
                            </button>
                        ))}

                        <div className="pt-8 mt-8 border-t border-white/5">
                            <button className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-red-400 hover:bg-red-400/10 transition-all">
                                <LogOut size={20} /> تسجيل الخروج
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="flex items-center gap-6 mb-10">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full bg-purple-600/20 flex items-center justify-center text-3xl font-black text-purple-400 border-2 border-dashed border-purple-500/30">
                                            {user?.full_name?.charAt(0)}
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                                            <Camera size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">صورة الحساب</h3>
                                        <p className="text-sm text-gray-500 mt-1">يفضل استخدام صورة مربعة بجودة عالية</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-2">الاسم الكامل</label>
                                        <input type="text" defaultValue={user?.full_name} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-purple-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 px-2">البريد الإلكتروني</label>
                                        <input type="email" defaultValue={user?.email} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:border-purple-500 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 px-2">روابط مهنية (GitHub / LinkedIn)</label>
                                        <div className="flex gap-4">
                                            <div className="flex-1 relative">
                                                <Github className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                                <input type="text" placeholder="رابط غيت هاب" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 focus:border-purple-500 outline-none" />
                                            </div>
                                            <div className="flex-1 relative">

                                                <input type="text" placeholder="رابط لينكد إن" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 focus:border-purple-500 outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 pt-10 border-t border-white/5 flex justify-end">
                                    <button className="px-10 py-4 bg-purple-600 hover:bg-purple-700 rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-purple-900/20 transition-all active:scale-95">
                                        <Save size={18} /> حفظ التعديلات
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Appearance Tab */}
                        {activeTab === 'appearance' && (
                            <div className="bg-white/[0.03] border border-white/5 rounded-[2.5rem] p-8 animate-in fade-in slide-in-from-left-4 duration-300">
                                <h3 className="text-xl font-bold mb-8">تخصيص الواجهة</h3>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                                                {isDarkMode ? <Moon size={24} /> : <Sun size={24} />}
                                            </div>
                                            <div>
                                                <p className="font-bold">الوضع الليلي (Dark Mode)</p>
                                                <p className="text-xs text-gray-500">تقليل إجهاد العين في البيئات المظلمة</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsDarkMode(!isDarkMode)}
                                            className={`w-14 h-8 rounded-full transition-all relative ${isDarkMode ? 'bg-purple-600' : 'bg-gray-700'}`}
                                        >
                                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${isDarkMode ? 'right-7' : 'right-1'}`}></div>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-6 bg-white/5 rounded-[2rem] border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                                                <Globe size={24} />
                                            </div>
                                            <div>
                                                <p className="font-bold">لغة المنصة</p>
                                                <p className="text-xs text-gray-500">اختر اللغة المناسبة لواجهة المستخدم</p>
                                            </div>
                                        </div>
                                        <select className="bg-[#0a0a16] border border-white/10 rounded-xl px-4 py-2 outline-none">
                                            <option className="bg-gray-900 text-white" >العربية (Yemen)</option>
                                            <option className="bg-gray-900 text-white" >English</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Tab Footer - Danger Zone */}
                        {activeTab === 'security' && (
                            <div className="bg-red-500/5 border border-red-500/10 rounded-[2.5rem] p-8">
                                <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
                                    <Shield size={20} /> منطقة الخطر
                                </h3>
                                <p className="text-sm text-gray-500 mb-6 italic">هذا الإجراء نهائي ولا يمكن التراجع عنه.</p>
                                <button className="flex items-center gap-2 px-6 py-4 bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all">
                                    <Trash2 size={18} /> حذف حسابي نهائياً
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Settings;