import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { SkeletonCard } from '../components/Skeleton';
import Confetti from '../components/Confetti';
import { useToast } from '../components/toastContext';

const Services = () => {
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [submitting, setSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState('');
    const [confetti, setConfetti] = useState(false);
    const [selected, setSelected] = useState([]);
    const [formData, setFormData] = useState({ service_name: '', category_id: '', base_price: '', vat_percent: 0, discount_amount: 0, image: '', images: [], tags: [], availability: { days: ['mon', 'tue', 'wed', 'thu', 'fri'], start_time: '09:00', end_time: '17:00', slot_duration: 60 } });
    const toast = useToast();

    const fetchData = async (opts = {}) => {
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const [servicesRes, categoriesRes] = await Promise.all([
                api.get('/services', { headers, params: { page: opts.page ?? page, limit: 10, search: opts.search ?? search, category: opts.category ?? categoryFilter } }),
                api.get('/categories', { headers })
            ]);
            const servicesData = Array.isArray(servicesRes.data) ? servicesRes.data : (servicesRes.data.data || []);
            const servicesMeta = servicesRes.data.meta || { page: 1, limit: 10, total: servicesData.length, totalPages: 1 };
            const categoriesData = Array.isArray(categoriesRes.data) ? categoriesRes.data : (categoriesRes.data.data || []);
            setServices(servicesData);
            setMeta(servicesMeta);
            setCategories(categoriesData);
        } catch (error) { console.error("Error fetching data", error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            if (editingService) {
                await api.put(`/services/${editingService._id}`, formData, { headers });
                toast.success('Service updated!');
            } else {
                await api.post('/services', formData, { headers });
                toast.success('Service created!');
                setConfetti(true);
            }
            setShowModal(false);
            setEditingService(null);
            resetForm();
            setPage(1);
            fetchData({ page: 1 });
        } catch (error) { console.error(error); toast.error('Failed to save service'); }
        finally { setSubmitting(false); }
    };

    const resetForm = () => {
        setFormData({ service_name: '', category_id: '', base_price: '', vat_percent: 0, discount_amount: 0, image: '', images: [], tags: [], availability: { days: ['mon', 'tue', 'wed', 'thu', 'fri'], start_time: '09:00', end_time: '17:00', slot_duration: 60 } });
        setImagePreview('');
    };

    const openCreate = () => { setEditingService(null); resetForm(); setShowModal(true); };
    const openEdit = (service) => {
        setEditingService(service);
        const img = service.image || '';
        const avail = service.availability || { days: ['mon', 'tue', 'wed', 'thu', 'fri'], start_time: '09:00', end_time: '17:00', slot_duration: 60 };
        setFormData({
            service_name: service.service_name || '', category_id: service.category?._id || service.category || '',
            base_price: service.base_price ?? '', vat_percent: service.vat_percent ?? 0, discount_amount: service.discount_amount ?? 0,
            image: img, images: service.images || [], tags: service.tags || [],
            availability: { days: avail.days || ['mon', 'tue', 'wed', 'thu', 'fri'], start_time: avail.start_time || '09:00', end_time: avail.end_time || '17:00', slot_duration: avail.slot_duration || 60 }
        });
        setImagePreview(img);
        setShowModal(true);
    };

    const deleteService = async (service) => {
        if (!confirm(`Delete "${service.service_name}"?`)) return;
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/services/${service._id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Service deleted');
            fetchData();
        } catch (error) { console.error(error); toast.error('Failed to delete'); }
    };

    const bulkDelete = async () => {
        if (selected.length === 0) return;
        if (!confirm(`Delete ${selected.length} selected services?`)) return;
        try {
            const token = localStorage.getItem('token');
            await api.post('/services/bulk-delete', { ids: selected }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`${selected.length} services deleted`);
            setSelected([]);
            fetchData();
        } catch (error) { console.error(error); toast.error('Failed to delete'); }
    };

    const toggleSelect = (id) => { setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); };

    const calculateTotal = (base, vat, discount) => {
        const b = parseFloat(base) || 0, v = parseFloat(vat) || 0, d = parseFloat(discount) || 0;
        return (b + (b * v / 100)) - d;
    };

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { toast.warning('Image must be under 5MB'); return; }
        const reader = new FileReader();
        reader.onload = () => { const b64 = String(reader.result || ''); setFormData(prev => ({ ...prev, image: b64 })); setImagePreview(b64); };
        reader.readAsDataURL(file);
    };

    const handleGalleryUpload = (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) return;
            const reader = new FileReader();
            reader.onload = () => {
                setFormData(prev => ({ ...prev, images: [...prev.images, String(reader.result)] }));
            };
            reader.readAsDataURL(file);
        });
    };

    const removeGalleryImage = (idx) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
    };

    const TAG_OPTIONS = ['Popular', 'New', 'Featured', 'Best Seller', 'Trending', 'Limited'];
    const toggleTag = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag]
        }));
    };

    const totalRevenue = services.reduce((sum, s) => sum + (s.total_price || 0), 0);

    return (
        <Layout>
            <Confetti show={confetti} onComplete={() => setConfetti(false)} />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Services</h1>
                    <p className="text-sm text-gray-500 mt-1">{meta.total} services &middot; Total value: ${totalRevenue.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                    {selected.length > 0 && (
                        <button onClick={bulkDelete} className="btn-ripple inline-flex items-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-all duration-300 shadow-md active:scale-95">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete ({selected.length})
                        </button>
                    )}
                    <button onClick={openCreate} className="btn-ripple inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Add Service
                    </button>
                </div>
            </div>

            <div className="animate-fade-in-up stagger-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" placeholder="Search services..." className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setLoading(true); setPage(1); fetchData({ page: 1, search, category: categoryFilter }); } }} />
                    </div>
                    <select className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-700"
                        value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="">All categories</option>
                        {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.title}</option>)}
                    </select>
                    <button onClick={() => { setLoading(true); setPage(1); fetchData({ page: 1, search, category: categoryFilter }); }}
                        className="btn-ripple px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium">Apply</button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}><SkeletonCard /></div>
                    ))}
                </div>
            ) : services.length === 0 ? (
                <div className="animate-scale-in bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6 animate-bounce-in">
                        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No services yet</h3>
                    <p className="text-gray-500 mb-6">Add your first service to start receiving requests.</p>
                    <button onClick={openCreate} className="btn-ripple inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Add Service
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service, idx) => (
                        <div key={service._id} className={`group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover-lift animate-fade-in-up stagger-${(idx % 8) + 1} ${selected.includes(service._id) ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
                            <div className="relative h-44 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                                <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                                    <input type="checkbox" checked={selected.includes(service._id)} onChange={() => toggleSelect(service._id)}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                </div>
                                {service.image ? (
                                    <img src={service.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                ) : service.images && service.images.length > 0 ? (
                                    <img src={service.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold bg-white/90 backdrop-blur-sm text-gray-900 shadow-sm">
                                        ${service.total_price?.toFixed(2)}
                                    </span>
                                </div>
                                {Number(service.discount_amount) > 0 && (
                                    <div className="absolute top-3 left-3">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-red-500 text-white shadow-sm animate-bounce-in">
                                            -${Number(service.discount_amount).toFixed(0)} OFF
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">{service.service_name}</h3>
                                </div>
                                {service.category?.title && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 mb-2">{service.category.title}</span>
                                )}
                                {service.tags && service.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {service.tags.map(tag => {
                                            const tagColors = { Popular: 'bg-blue-100 text-blue-700', New: 'bg-emerald-100 text-emerald-700', Featured: 'bg-purple-100 text-purple-700', 'Best Seller': 'bg-amber-100 text-amber-700', Trending: 'bg-pink-100 text-pink-700', Limited: 'bg-red-100 text-red-700' };
                                            return <span key={tag} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tagColors[tag] || 'bg-gray-100 text-gray-700'}`}>{tag}</span>;
                                        })}
                                    </div>
                                )}
                                {service.availability && service.availability.days && service.availability.days.length > 0 && (
                                    <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {service.availability.days.length === 7 ? 'Every day' : service.availability.days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                                        {' '}&middot; {service.availability.start_time} - {service.availability.end_time}
                                    </p>
                                )}
                                <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1">
                                    <div className="flex justify-between text-sm"><span className="text-gray-500">Base price</span><span className="text-gray-700">${Number(service.base_price).toFixed(2)}</span></div>
                                    {Number(service.vat_percent) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">VAT ({service.vat_percent}%)</span><span className="text-gray-700">+${(Number(service.base_price) * Number(service.vat_percent) / 100).toFixed(2)}</span></div>}
                                    {Number(service.discount_amount) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Discount</span><span className="text-red-500">-${Number(service.discount_amount).toFixed(2)}</span></div>}
                                    <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-200"><span className="text-gray-700">Total</span><span className="text-emerald-600">${service.total_price?.toFixed(2)}</span></div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openEdit(service)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-200 active:scale-95">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        Edit
                                    </button>
                                    <button onClick={() => deleteService(service)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all duration-200 active:scale-95">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && meta.totalPages > 1 && (
                <div className="mt-8 animate-fade-in-up flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
                    <p className="text-sm text-gray-500">Page <span className="font-semibold text-gray-900">{meta.page}</span> of <span className="font-semibold text-gray-900">{meta.totalPages}</span> ({meta.total} total)</p>
                    <div className="flex gap-2">
                        <button disabled={page <= 1} onClick={() => { const next = Math.max(page - 1, 1); setPage(next); setLoading(true); fetchData({ page: next }); }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${page <= 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>Prev</button>
                        <button disabled={page >= meta.totalPages} onClick={() => { const next = Math.min(page + 1, meta.totalPages); setPage(next); setLoading(true); fetchData({ page: next }); }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${page >= meta.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>Next</button>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={() => !submitting && setShowModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">{editingService ? 'Edit Service' : 'New Service'}</h2>
                                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors" disabled={submitting}>
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Service Name</label>
                                <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={formData.service_name} onChange={(e) => setFormData({ ...formData, service_name: e.target.value })} required disabled={submitting} /></div>
                            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} required disabled={submitting}>
                                    <option value="">Select Category</option>
                                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.title}</option>)}
                                </select></div>
                            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
                                <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={formData.image.startsWith('data:') ? '' : formData.image} onChange={(e) => { setFormData({ ...formData, image: e.target.value }); setImagePreview(e.target.value); }} placeholder="https://..." disabled={submitting} />
                                <div className="mt-3"><label className="block text-sm font-semibold text-gray-700 mb-2">Or Upload Image</label>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={submitting} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 file:cursor-pointer" /></div>
                                {imagePreview && (
                                    <div className="mt-3 relative inline-block animate-scale-in">
                                        <img src={imagePreview} alt="" className="h-24 w-24 rounded-xl border-2 border-gray-200 object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                        <button type="button" onClick={() => { setImagePreview(''); setFormData(prev => ({ ...prev, image: '' })); }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors active:scale-90">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                )}</div>

                            {/* Additional Images Gallery */}
                            <div className="border-t border-gray-100 pt-5">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Additional Images (Gallery)
                                </h4>
                                <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} disabled={submitting}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 file:cursor-pointer" />
                                {formData.images.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {formData.images.map((img, idx) => (
                                            <div key={idx} className="relative group animate-scale-in">
                                                <img src={img} alt="" className="h-16 w-16 rounded-lg border border-gray-200 object-cover" />
                                                <button type="button" onClick={() => removeGalleryImage(idx)}
                                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100">
                                                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            <div className="border-t border-gray-100 pt-5">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                    Tags
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {TAG_OPTIONS.map(tag => {
                                        const selected = formData.tags.includes(tag);
                                        return (
                                            <button key={tag} type="button" onClick={() => toggleTag(tag)} disabled={submitting}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all active:scale-95 ${
                                                    selected ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                                }`}>{tag}</button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Base Price ($)</label>
                                    <input type="number" step="0.01" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: e.target.value })} required disabled={submitting} /></div>
                                <div><label className="block text-sm font-semibold text-gray-700 mb-2">VAT (%)</label>
                                    <input type="number" step="0.01" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={formData.vat_percent} onChange={(e) => setFormData({ ...formData, vat_percent: e.target.value })} disabled={submitting} /></div>
                            </div>
                            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Discount ($)</label>
                                <input type="number" step="0.01" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={formData.discount_amount} onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })} disabled={submitting} /></div>

                            {/* Availability Section */}
                            <div className="border-t border-gray-100 pt-5">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Availability Schedule
                                </h4>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {[{ k: 'mon', l: 'Mon' }, { k: 'tue', l: 'Tue' }, { k: 'wed', l: 'Wed' }, { k: 'thu', l: 'Thu' }, { k: 'fri', l: 'Fri' }, { k: 'sat', l: 'Sat' }, { k: 'sun', l: 'Sun' }].map(d => {
                                        const selected = formData.availability.days.includes(d.k);
                                        return (
                                            <button key={d.k} type="button" disabled={submitting}
                                                onClick={() => {
                                                    const days = selected ? formData.availability.days.filter(x => x !== d.k) : [...formData.availability.days, d.k];
                                                    setFormData({ ...formData, availability: { ...formData.availability, days } });
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all active:scale-95 ${
                                                    selected ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                                }`}>{d.l}</button>
                                        );
                                    })}
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Start</label>
                                        <input type="time" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={formData.availability.start_time} onChange={e => setFormData({ ...formData, availability: { ...formData.availability, start_time: e.target.value } })} disabled={submitting} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">End</label>
                                        <input type="time" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={formData.availability.end_time} onChange={e => setFormData({ ...formData, availability: { ...formData.availability, end_time: e.target.value } })} disabled={submitting} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Slot (min)</label>
                                        <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={formData.availability.slot_duration} onChange={e => setFormData({ ...formData, availability: { ...formData.availability, slot_duration: Number(e.target.value) } })} disabled={submitting}>
                                            <option value={15}>15 min</option>
                                            <option value={30}>30 min</option>
                                            <option value={60}>60 min</option>
                                            <option value={90}>90 min</option>
                                            <option value={120}>2 hrs</option>
                                            <option value={180}>3 hrs</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-emerald-700">Total Price</span>
                                    <span className="text-2xl font-bold text-emerald-700">${calculateTotal(formData.base_price, formData.vat_percent, formData.discount_amount).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors active:scale-95" disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn-ripple flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95" disabled={submitting}>
                                    {submitting && <svg className="animate-spin h-4 w-4 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                                    {submitting ? 'Saving...' : (editingService ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Services;
