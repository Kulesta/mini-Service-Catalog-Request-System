import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { SkeletonRequest } from '../components/Skeleton';
import { useToast } from '../components/toastContext';

const Requests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const toast = useToast();

    const fetchRequests = async (opts = {}) => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/requests', {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: opts.page ?? page, limit: 10, search: opts.search ?? search, status: opts.status ?? statusFilter }
            });
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            const m = res.data.meta || { page: 1, limit: 10, total: data.length, totalPages: 1 };
            setRequests(data);
            setMeta(m);
        } catch (error) { console.error("Error fetching requests", error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchRequests(); }, []);

    const exportCSV = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = statusFilter ? `?status=${statusFilter}` : '';
            const res = await api.get(`/requests/export${params}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `requests-export-${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('Export downloaded!');
        } catch (error) {
            console.error(error);
            toast.error('Export failed');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('token');
            await api.put(`/requests/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`Request ${status}!`);
            fetchRequests();
        } catch (error) { console.error(error); toast.error('Failed to update'); }
    };

    const calculateServiceTotal = (services) => {
        if (!services || services.length === 0) return 0;
        return services.reduce((sum, s) => sum + (Number(s.total_price) || ((Number(s.base_price) || 0) + (Number(s.base_price || 0) * Number(s.vat_percent || 0) / 100) - (Number(s.discount_amount) || 0))), 0);
    };

    const statusConfig = {
        pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400', label: 'Pending', bar: 'from-amber-400 to-orange-500' },
        completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400', label: 'Completed', bar: 'from-emerald-400 to-teal-500' },
        cancelled: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-400', label: 'Cancelled', bar: 'from-red-400 to-rose-500' },
    };

    const filters = [
        { value: '', label: 'All' },
        { value: 'pending', label: 'Pending' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Incoming Requests</h1>
                    <p className="text-sm text-gray-500 mt-1">{meta.total} requests total</p>
                </div>
                <button onClick={exportCSV} className="btn-ripple inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Export CSV
                </button>
            </div>

            <div className="animate-fade-in-up stagger-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                        {filters.map((f) => (
                            <button key={f.value} onClick={() => { setStatusFilter(f.value); setLoading(true); setPage(1); fetchRequests({ page: 1, search, status: f.value }); }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95 ${
                                    statusFilter === f.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                }`}>{f.label}</button>
                        ))}
                    </div>
                    <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" placeholder="Search by name or phone..." className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setLoading(true); setPage(1); fetchRequests({ page: 1, search, status: statusFilter }); } }} />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}><SkeletonRequest /></div>
                    ))}
                </div>
            ) : requests.length === 0 ? (
                <div className="animate-scale-in bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6 animate-bounce-in">
                        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests found</h3>
                    <p className="text-gray-500">Customer requests will appear here once submitted.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((req, idx) => {
                        const sc = statusConfig[req.status] || statusConfig.pending;
                        return (
                            <div key={req._id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in-up stagger-${(idx % 8) + 1}`}>
                                <div className={`h-1 bg-gradient-to-r ${sc.bar}`} />
                                <div className="p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl ${sc.bg} flex items-center justify-center shrink-0`}>
                                                <svg className={`w-6 h-6 ${sc.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{req.customer_name}</h3>
                                                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                    {req.customer_phone}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    {new Date(req.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                {req.booking_date && (
                                                    <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1.5 font-medium">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        Booked: {req.booking_date}{req.booking_time ? ` at ${req.booking_time}` : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 sm:text-right">
                                            <div>
                                                <p className="text-2xl font-bold text-gray-900">${calculateServiceTotal(req.services).toFixed(2)}</p>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text} border ${sc.border} mt-1`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                                    {sc.label}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {req.services && req.services.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {req.services.map((s, i) => (
                                                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                                                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                    {s.service_name}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {req.customer_note && (
                                        <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                            <p className="text-sm text-amber-800 italic flex items-start gap-2">
                                                <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                                &ldquo;{req.customer_note}&rdquo;
                                            </p>
                                        </div>
                                    )}

                                    {req.status === 'pending' && (
                                        <div className="mt-5 flex gap-3 pt-4 border-t border-gray-100">
                                            <button onClick={() => updateStatus(req._id, 'completed')}
                                                className="flex-1 btn-ripple inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all active:scale-95">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                Mark Completed
                                            </button>
                                            <button onClick={() => updateStatus(req._id, 'cancelled')}
                                                className="flex-1 btn-ripple inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-all active:scale-95">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {!loading && meta.totalPages > 1 && (
                <div className="mt-8 animate-fade-in-up flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
                    <p className="text-sm text-gray-500">Page <span className="font-semibold text-gray-900">{meta.page}</span> of <span className="font-semibold text-gray-900">{meta.totalPages}</span> ({meta.total} total)</p>
                    <div className="flex gap-2">
                        <button disabled={page <= 1} onClick={() => { const next = Math.max(page - 1, 1); setPage(next); setLoading(true); fetchRequests({ page: next }); }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${page <= 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>Prev</button>
                        <button disabled={page >= meta.totalPages} onClick={() => { const next = Math.min(page + 1, meta.totalPages); setPage(next); setLoading(true); fetchRequests({ page: next }); }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${page >= meta.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>Next</button>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Requests;
