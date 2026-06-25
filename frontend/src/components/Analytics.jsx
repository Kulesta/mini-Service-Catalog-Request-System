import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from '../components/toastContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
const PIE_COLORS = ['#f59e0b', '#10b981', '#ef4444'];

export default function Analytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('30');
    const toast = useToast();

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/analytics', {
                headers: { Authorization: `Bearer ${token}` },
                params: { period }
            });
            setData(res.data);
        } catch (error) {
            console.error('Error fetching analytics', error);
            toast?.error?.('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-8">
            {/* Period Selector */}
            <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100 inline-flex">
                {[{ v: '7', l: '7 Days' }, { v: '30', l: '30 Days' }, { v: '90', l: '90 Days' }].map(p => (
                    <button key={p.v} onClick={() => { setPeriod(p.v); setLoading(true); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === p.v ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        {p.l}
                    </button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up">
                    <p className="text-sm font-medium text-gray-500 mb-1">Revenue ({data.summary.period} days)</p>
                    <p className="text-3xl font-bold text-gray-900">${data.summary.totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-emerald-600 mt-1">From completed requests</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up stagger-1">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Requests</p>
                    <p className="text-3xl font-bold text-gray-900">{data.summary.totalRequests}</p>
                    <p className="text-xs text-blue-600 mt-1">In the last {data.summary.period} days</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Over Time */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up stagger-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
                    {data.revenueData.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No completed requests yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={data.revenueData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                                <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Revenue']} labelFormatter={v => new Date(v).toLocaleDateString()} />
                                <Bar dataKey="revenue" fill="url(#blueGradient)" radius={[6, 6, 0, 0]} />
                                <defs>
                                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#6366f1" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Request Trends */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up stagger-3">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Trends</h3>
                    {data.requestData.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No requests yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={data.requestData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip labelFormatter={v => new Date(v).toLocaleDateString()} />
                                <Legend />
                                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Request Status Distribution */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up stagger-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Status</h3>
                    {data.statusData.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={data.statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                    {data.statusData.map((entry, index) => (
                                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Popular Services */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up stagger-5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Popular Services</h3>
                    {data.serviceData.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">No service data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={data.serviceData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                                <Tooltip />
                                <Bar dataKey="orders" fill="url(#greenGradient)" radius={[0, 6, 6, 0]} />
                                <defs>
                                    <linearGradient id="greenGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#06b6d4" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Recent Requests */}
            {data.recentRequests && data.recentRequests.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up stagger-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Requests</h3>
                    <div className="space-y-3">
                        {data.recentRequests.map((req) => {
                            const statusColors = {
                                pending: 'bg-amber-100 text-amber-700',
                                completed: 'bg-emerald-100 text-emerald-700',
                                cancelled: 'bg-red-100 text-red-700'
                            };
                            return (
                                <div key={req._id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <span className="text-sm font-bold text-blue-600">{req.customer_name?.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{req.customer_name}</p>
                                            <p className="text-xs text-gray-500">
                                                {req.services?.map(s => s.service_name).join(', ')}
                                                {req.booking_date ? ` · ${req.booking_date} ${req.booking_time || ''}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[req.status] || 'bg-gray-100 text-gray-700'}`}>
                                        {req.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
