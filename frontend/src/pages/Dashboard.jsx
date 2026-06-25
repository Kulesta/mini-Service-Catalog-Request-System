import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import AnimatedCounter from '../components/AnimatedCounter';
import { SkeletonStat } from '../components/Skeleton';
import FloatingOrbs from '../components/FloatingOrbs';
import Analytics from '../components/Analytics';
import QRCodeCard from '../components/QRCodeCard';

const Dashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [emailStatus, setEmailStatus] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const [statsRes, emailRes] = await Promise.all([
                    api.get('/requests/stats', { headers: { Authorization: `Bearer ${token}` } }),
                    api.get('/settings/email-status', { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setStats(statsRes.data);
                setEmailStatus(emailRes.data);
            } catch (error) {
                console.error('Error fetching stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const statCards = stats
        ? [
            { label: 'Total Requests', value: stats.totalRequests, icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', gradient: 'from-blue-500 to-blue-600', bgLight: 'bg-blue-50', text: 'text-blue-600', trend: '+12%' },
            { label: 'Pending', value: stats.pendingRequests, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'from-amber-400 to-orange-500', bgLight: 'bg-amber-50', text: 'text-amber-600', trend: null },
            { label: 'Completed', value: stats.completedRequests, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'from-emerald-400 to-teal-500', bgLight: 'bg-emerald-50', text: 'text-emerald-600', trend: null },
            { label: 'Cancelled', value: stats.cancelledRequests, icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'from-red-400 to-rose-500', bgLight: 'bg-red-50', text: 'text-red-600', trend: null },
            { label: 'Categories', value: stats.activeCategories, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', gradient: 'from-violet-400 to-purple-500', bgLight: 'bg-violet-50', text: 'text-violet-600', trend: null },
            { label: 'Services', value: stats.totalServices, icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', gradient: 'from-indigo-400 to-blue-500', bgLight: 'bg-indigo-50', text: 'text-indigo-600', trend: null },
            { label: 'Revenue', value: stats.totalRevenue, prefix: '$', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', gradient: 'from-emerald-400 to-green-500', bgLight: 'bg-emerald-50', text: 'text-emerald-600', trend: null },
        ]
        : [];

    return (
        <Layout>
            <div className="relative">
                {/* Welcome Banner */}
                <div
                    className="relative overflow-hidden rounded-2xl p-8 mb-8 shadow-xl animate-fade-in-up"
                    style={{
                        background: 'linear-gradient(-45deg, #3b82f6, #8b5cf6, #06b6d4, #10b981)',
                        backgroundSize: '400% 400%',
                        animation: 'gradient-shift 8s ease infinite, fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    }}
                >
                    <FloatingOrbs />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">{getGreeting()}</p>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Welcome back, {user?.full_name}!
                            </h1>
                            <p className="text-blue-100/80 text-lg">
                                Here&apos;s what&apos;s happening with your business today.
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="text-4xl font-bold text-white tabular-nums">
                                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                            <p className="text-blue-100/60 text-sm mt-1">
                                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {loading
                        ? Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                                <SkeletonStat />
                            </div>
                        ))
                        : statCards.map((card, idx) => (
                            <div
                                key={card.label}
                                className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 hover-lift animate-fade-in-up stagger-${idx + 1}`}
                            >
                                <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${card.gradient} transition-all duration-500 group-hover:h-1.5`} />
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-12 h-12 rounded-xl ${card.bgLight} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                                            <svg className={`w-6 h-6 ${card.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                                            </svg>
                                        </div>
                                        {card.trend && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                </svg>
                                                {card.trend}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        <AnimatedCounter
                                            target={card.value}
                                            prefix={card.prefix || ''}
                                            duration={1200 + idx * 100}
                                        />
                                    </p>
                                </div>
                            </div>
                        ))
                    }
                </div>

                {/* Public Catalog + QR Code */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="animate-fade-in-up stagger-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover-glow transition-all duration-300">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
                                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">Your Public Catalog</h3>
                                <p className="text-sm text-gray-500">Share with customers via link or QR code</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <p className="text-xs text-gray-400 mb-2 font-medium">Your catalog URL:</p>
                            <p className="text-sm font-mono text-gray-700 break-all">
                                {user?.slug ? `${window.location.origin}/s/${user.slug}` : `${window.location.origin}/shop/${user?._id}`}
                            </p>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Print the QR code on your storefront, business cards, or flyers. Customers scan it to view your services and book appointments instantly — no login required.
                        </p>
                        <a
                            href={user?.slug ? `/s/${user.slug}` : `/shop/${user?._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ripple inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Preview Catalog
                        </a>
                    </div>
                    <div className="animate-fade-in-up stagger-4">
                        <QRCodeCard url={user?.slug ? `${window.location.origin}/s/${user.slug}` : `${window.location.origin}/shop/${user?._id}`} />
                    </div>
                </div>

                {/* Email Status */}
                {emailStatus && (
                    <div className={`animate-fade-in-up stagger-4 mb-8 rounded-2xl border p-4 flex items-center gap-3 ${emailStatus.configured ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${emailStatus.configured ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                            <svg className={`w-5 h-5 ${emailStatus.configured ? 'text-emerald-600' : 'text-amber-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                        </div>
                        <div>
                            <p className={`text-sm font-semibold ${emailStatus.configured ? 'text-emerald-800' : 'text-amber-800'}`}>
                                {emailStatus.configured ? 'Email notifications active' : 'Email notifications not configured'}
                            </p>
                            <p className={`text-xs ${emailStatus.configured ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {emailStatus.configured
                                    ? `Sending via ${emailStatus.host} (${emailStatus.from})`
                                    : 'Add SMTP_HOST, SMTP_USER, SMTP_PASS to .env to enable'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Analytics */}
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 animate-fade-in-up">Analytics & Insights</h2>
                    <Analytics />
                </div>

            </div>
        </Layout>
    );
};

export default Dashboard;
