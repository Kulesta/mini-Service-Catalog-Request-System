import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { SkeletonCard } from '../components/Skeleton';
import Confetti from '../components/Confetti';
import { useToast } from '../components/toastContext';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [formData, setFormData] = useState({ title: '', image: '', description: '', status: 'active' });
    const [imagePreview, setImagePreview] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [confetti, setConfetti] = useState(false);
    const [selected, setSelected] = useState([]);
    const toast = useToast();

    const fetchCategories = async (opts = {}) => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/categories', {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: opts.page ?? page, limit: 10, search: opts.search ?? search }
            });
            const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
            const m = res.data.meta || { page: 1, limit: 10, total: data.length, totalPages: 1 };
            setCategories(data);
            setMeta(m);
        } catch (error) {
            console.error("Error fetching categories", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            if (editingCategory) {
                await api.put(`/categories/${editingCategory._id}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Category updated successfully!');
            } else {
                await api.post('/categories', formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Category created!');
                setConfetti(true);
            }
            setShowModal(false);
            setEditingCategory(null);
            setFormData({ title: '', image: '', description: '', status: 'active' });
            setImagePreview('');
            fetchCategories({ page: 1 });
            setPage(1);
        } catch (error) {
            console.error(error);
            toast.error('Failed to save category');
        } finally {
            setSubmitting(false);
        }
    };

    const openCreate = () => {
        setEditingCategory(null);
        setFormData({ title: '', image: '', description: '', status: 'active' });
        setImagePreview('');
        setShowModal(true);
    };

    const openEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            title: category.title || '',
            image: category.image || '',
            description: category.description || '',
            status: category.status || 'active'
        });
        setImagePreview(category.image || '');
        setShowModal(true);
    };

    const deleteCategory = async (category) => {
        if (!confirm(`Delete "${category.title}"?`)) return;
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/categories/${category._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Category deleted');
            fetchCategories();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete category');
        }
    };

    const bulkDelete = async () => {
        if (selected.length === 0) return;
        if (!confirm(`Delete ${selected.length} selected categories?`)) return;
        try {
            const token = localStorage.getItem('token');
            await api.post('/categories/bulk-delete', { ids: selected }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`${selected.length} categories deleted`);
            setSelected([]);
            fetchCategories();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete');
        }
    };

    const toggleSelect = (id) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    return (
        <Layout>
            <Confetti show={confetti} onComplete={() => setConfetti(false)} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Service Categories</h1>
                    <p className="text-sm text-gray-500 mt-1">{meta.total} categories total</p>
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
                        Add Category
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="animate-fade-in-up stagger-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setLoading(true); setPage(1);
                                    fetchCategories({ page: 1, search });
                                }
                            }}
                        />
                    </div>
                    <button
                        onClick={() => { setLoading(true); setPage(1); fetchCategories({ page: 1, search }); }}
                        className="btn-ripple px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                            <SkeletonCard />
                        </div>
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <div className="animate-scale-in bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6 animate-bounce-in">
                        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories yet</h3>
                    <p className="text-gray-500 mb-6">Create your first category to organize your services.</p>
                    <button onClick={openCreate} className="btn-ripple inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Create Category
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map((category, idx) => (
                        <div key={category._id} className={`group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover-lift animate-fade-in-up stagger-${(idx % 8) + 1} ${selected.includes(category._id) ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
                            <div className="relative h-44 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                                <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                                    <input type="checkbox" checked={selected.includes(category._id)} onChange={() => toggleSelect(category._id)}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                </div>
                                {category.image ? (
                                    <img src={category.image} alt={category.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                        <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-sm ${
                                        category.status === 'active' ? 'bg-emerald-500/90 text-white' : 'bg-gray-500/90 text-white'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${category.status === 'active' ? 'bg-emerald-200 animate-pulse' : 'bg-gray-300'}`} />
                                        {category.status}
                                    </span>
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{category.title}</h3>
                                {category.description && <p className="text-sm text-gray-500 line-clamp-2 mb-4">{category.description}</p>}
                                {!category.description && <div className="mb-4" />}
                                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                    <button onClick={() => openEdit(category)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-200 active:scale-95">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                    </button>
                                    <button onClick={() => deleteCategory(category)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all duration-200 active:scale-95">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && meta.totalPages > 1 && (
                <div className="mt-8 animate-fade-in-up flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4">
                    <p className="text-sm text-gray-500">
                        Page <span className="font-semibold text-gray-900">{meta.page}</span> of{' '}
                        <span className="font-semibold text-gray-900">{meta.totalPages}</span> ({meta.total} total)
                    </p>
                    <div className="flex gap-2">
                        <button disabled={page <= 1} onClick={() => { const next = Math.max(page - 1, 1); setPage(next); setLoading(true); fetchCategories({ page: next }); }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${page <= 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>Prev</button>
                        <button disabled={page >= meta.totalPages} onClick={() => { const next = Math.min(page + 1, meta.totalPages); setPage(next); setLoading(true); fetchCategories({ page: next }); }}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${page >= meta.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>Next</button>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={() => !submitting && setShowModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors" disabled={submitting}>
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                                <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required disabled={submitting} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Image URL</label>
                                <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    value={formData.image.startsWith('data:') ? '' : formData.image}
                                    onChange={(e) => { setFormData({ ...formData, image: e.target.value }); setImagePreview(e.target.value); }}
                                    placeholder="https://..." disabled={submitting} />
                                <div className="mt-3">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Or Upload Image</label>
                                    <input type="file" accept="image/*" onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        const reader = new FileReader();
                                        reader.onload = () => { const b64 = String(reader.result || ''); setFormData(prev => ({ ...prev, image: b64 })); setImagePreview(b64); };
                                        reader.readAsDataURL(file);
                                    }} disabled={submitting}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 file:cursor-pointer" />
                                </div>
                                {imagePreview && (
                                    <div className="mt-3 relative inline-block animate-scale-in">
                                        <img src={imagePreview} alt="" className="h-24 w-24 rounded-xl border-2 border-gray-200 object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                        <button type="button" onClick={() => { setImagePreview(''); setFormData(prev => ({ ...prev, image: '' })); }}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors active:scale-90">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                                <textarea className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} disabled={submitting} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                <div className="flex gap-3">
                                    {['active', 'inactive'].map((s) => (
                                        <button key={s} type="button" onClick={() => setFormData({ ...formData, status: s })} disabled={submitting}
                                            className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 ${
                                                formData.status === s
                                                    ? s === 'active' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                                                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                            }`}>
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors active:scale-95" disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn-ripple flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                    disabled={submitting}>
                                    {submitting && <svg className="animate-spin h-4 w-4 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>}
                                    {submitting ? 'Saving...' : (editingCategory ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Categories;
