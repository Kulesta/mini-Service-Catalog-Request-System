import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useToast } from '../components/toastContext';

const Banners = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: '', subtitle: '', discount_text: '', background_color: '#3b82f6', text_color: '#ffffff', link_url: '', is_active: true });
    const toast = useToast();

    const fetchBanners = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/banners', { headers: { Authorization: `Bearer ${token}` } });
            setBanners(res.data);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchBanners(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            if (editing) {
                await api.put(`/banners/${editing._id}`, formData, { headers });
                toast.success('Banner updated!');
            } else {
                await api.post('/banners', formData, { headers });
                toast.success('Banner created!');
            }
            setShowModal(false);
            setEditing(null);
            resetForm();
            fetchBanners();
        } catch (error) { console.error(error); toast.error('Failed to save banner'); }
        finally { setSubmitting(false); }
    };

    const resetForm = () => setFormData({ title: '', subtitle: '', discount_text: '', background_color: '#3b82f6', text_color: '#ffffff', link_url: '', is_active: true });

    const openCreate = () => { setEditing(null); resetForm(); setShowModal(true); };
    const openEdit = (b) => {
        setEditing(b);
        setFormData({ title: b.title || '', subtitle: b.subtitle || '', discount_text: b.discount_text || '', background_color: b.background_color || '#3b82f6', text_color: b.text_color || '#ffffff', link_url: b.link_url || '', is_active: b.is_active !== false });
        setShowModal(true);
    };

    const deleteBanner = async (b) => {
        if (!confirm(`Delete "${b.title}"?`)) return;
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/banners/${b._id}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success('Banner deleted');
            fetchBanners();
        } catch (error) { console.error(error); toast.error('Failed to delete'); }
    };

    const toggleActive = async (b) => {
        try {
            const token = localStorage.getItem('token');
            await api.put(`/banners/${b._id}`, { is_active: !b.is_active }, { headers: { Authorization: `Bearer ${token}` } });
            fetchBanners();
        } catch (error) { console.error(error); }
    };

    const PRESET_COLORS = [
        { bg: '#3b82f6', text: '#ffffff', label: 'Blue' },
        { bg: '#8b5cf6', text: '#ffffff', label: 'Purple' },
        { bg: '#10b981', text: '#ffffff', label: 'Green' },
        { bg: '#f59e0b', text: '#ffffff', label: 'Amber' },
        { bg: '#ef4444', text: '#ffffff', label: 'Red' },
        { bg: '#ec4899', text: '#ffffff', label: 'Pink' },
        { bg: '#1e293b', text: '#ffffff', label: 'Dark' },
        { bg: '#f8fafc', text: '#1e293b', label: 'Light' },
    ];

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in-up">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Promotional Banners</h1>
                    <p className="text-sm text-gray-500 mt-1">Show sale banners on your public catalog page</p>
                </div>
                <button onClick={openCreate} className="btn-ripple inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    Add Banner
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16"><div className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" /></div>
            ) : banners.length === 0 ? (
                <div className="animate-scale-in bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6 animate-bounce-in">
                        <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No banners yet</h3>
                    <p className="text-gray-500 mb-6">Create banners to announce sales and promotions on your public catalog.</p>
                    <button onClick={openCreate} className="btn-ripple inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        Create Banner
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {banners.map((b, idx) => (
                        <div key={b._id} className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in-up`} style={{ animationDelay: `${idx * 60}ms` }}>
                            {/* Banner Preview */}
                            <div className="p-1">
                                <div className="rounded-xl p-6 relative overflow-hidden" style={{ backgroundColor: b.background_color, color: b.text_color }}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold">{b.title}</h3>
                                            {b.subtitle && <p className="text-sm opacity-90 mt-1">{b.subtitle}</p>}
                                        </div>
                                        {b.discount_text && (
                                            <span className="px-4 py-2 rounded-xl text-sm font-bold bg-white/20 backdrop-blur-sm">{b.discount_text}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Actions */}
                            <div className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => toggleActive(b)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${b.is_active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {b.is_active !== false ? 'Active' : 'Inactive'}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openEdit(b)} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors active:scale-95">Edit</button>
                                    <button onClick={() => deleteBanner(b)} className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors active:scale-95">Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm animate-fade-in" onClick={() => !submitting && setShowModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">{editing ? 'Edit Banner' : 'New Banner'}</h2>
                                <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors" disabled={submitting}>
                                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Live Preview */}
                            <div className="rounded-xl p-4" style={{ backgroundColor: formData.background_color, color: formData.text_color }}>
                                <p className="text-sm font-bold">{formData.title || 'Banner Title'}</p>
                                {formData.subtitle && <p className="text-xs opacity-90 mt-1">{formData.subtitle}</p>}
                                {formData.discount_text && <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold bg-white/20">{formData.discount_text}</span>}
                            </div>

                            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                                <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required disabled={submitting} /></div>
                            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Subtitle</label>
                                <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} disabled={submitting} /></div>
                            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Discount Text</label>
                                <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={formData.discount_text} onChange={e => setFormData({ ...formData, discount_text: e.target.value })} placeholder="e.g. 20% OFF" disabled={submitting} /></div>
                            <div><label className="block text-sm font-semibold text-gray-700 mb-2">Color Preset</label>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_COLORS.map(c => (
                                        <button key={c.label} type="button" onClick={() => setFormData({ ...formData, background_color: c.bg, text_color: c.text })}
                                            className={`w-10 h-10 rounded-xl border-2 transition-all active:scale-95 ${formData.background_color === c.bg ? 'border-blue-500 scale-110' : 'border-gray-200'}`}
                                            style={{ backgroundColor: c.bg }} title={c.label} />
                                    ))}
                                </div></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-semibold text-gray-700 mb-2">BG Color</label>
                                    <div className="flex items-center gap-2"><input type="color" value={formData.background_color} onChange={e => setFormData({ ...formData, background_color: e.target.value })} className="w-10 h-10 rounded-lg border cursor-pointer" />
                                        <input type="text" value={formData.background_color} onChange={e => setFormData({ ...formData, background_color: e.target.value })} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div></div>
                                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Text Color</label>
                                    <div className="flex items-center gap-2"><input type="color" value={formData.text_color} onChange={e => setFormData({ ...formData, text_color: e.target.value })} className="w-10 h-10 rounded-lg border cursor-pointer" />
                                        <input type="text" value={formData.text_color} onChange={e => setFormData({ ...formData, text_color: e.target.value })} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div></div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors active:scale-95" disabled={submitting}>Cancel</button>
                                <button type="submit" className="btn-ripple flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-95" disabled={submitting}>
                                    {submitting ? 'Saving...' : (editing ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Banners;
