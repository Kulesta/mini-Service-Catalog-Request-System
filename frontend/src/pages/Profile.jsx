import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useToast } from '../components/toastContext';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABELS = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

const Profile = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '', phone: '', company_name: '', about: '', cover_photo: '',
        social_links: { facebook: '', instagram: '', twitter: '', website: '' },
        business_hours: {}
    });
    const [coverPreview, setCoverPreview] = useState('');
    const toast = useToast();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const user = JSON.parse(localStorage.getItem('user'));
                const res = await api.get(`/profile/${user._id}`, { headers: { Authorization: `Bearer ${token}` } });
                const profileData = res.data;
                const hours = {};
                DAYS.forEach(d => {
                    hours[d] = profileData.business_hours?.[d] || { open: '09:00', close: '17:00', enabled: DAYS.includes(d) && !['sat', 'sun'].includes(d) };
                });
                setFormData({
                    full_name: profileData.full_name || '', phone: profileData.phone || '', company_name: profileData.company_name || '',
                    about: profileData.about || '', cover_photo: profileData.cover_photo || '',
                    social_links: { facebook: profileData.social_links?.facebook || '', instagram: profileData.social_links?.instagram || '', twitter: profileData.social_links?.twitter || '', website: profileData.social_links?.website || '' },
                    business_hours: hours
                });
                setCoverPreview(profileData.cover_photo || '');
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            await api.put('/profile/me', formData, { headers: { Authorization: `Bearer ${token}` } });
            const updatedUser = JSON.parse(localStorage.getItem('user'));
            updatedUser.full_name = formData.full_name;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            toast.success('Profile updated!');
        } catch (error) { console.error(error); toast.error('Failed to update profile'); }
        finally { setSaving(false); }
    };

    const handleCoverUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => { const b64 = String(reader.result); setFormData(p => ({ ...p, cover_photo: b64 })); setCoverPreview(b64); };
        reader.readAsDataURL(file);
    };

    const toggleDay = (day) => {
        setFormData(p => ({
            ...p,
            business_hours: {
                ...p.business_hours,
                [day]: { ...p.business_hours[day], enabled: !p.business_hours[day]?.enabled }
            }
        }));
    };

    const updateHour = (day, field, value) => {
        setFormData(p => ({
            ...p,
            business_hours: {
                ...p.business_hours,
                [day]: { ...p.business_hours[day], [field]: value }
            }
        }));
    };

    if (loading) return <Layout><div className="flex items-center justify-center py-16"><div className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" /></div></Layout>;

    return (
        <Layout>
            <h1 className="text-2xl font-bold text-gray-900 mb-8 animate-fade-in-up">Provider Profile</h1>

            <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
                {/* Cover Photo */}
                <div className="animate-fade-in-up stagger-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="relative h-48 bg-gradient-to-r from-blue-500 to-indigo-600">
                        {coverPreview && <img src={coverPreview} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute bottom-4 right-4">
                            <label className="btn-ripple inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-900 rounded-xl text-sm font-semibold cursor-pointer hover:bg-white transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Cover Photo
                                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="animate-fade-in-up stagger-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                            <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} /></div>
                        <div><label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                            <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} /></div>
                        <div className="sm:col-span-2"><label className="block text-sm font-semibold text-gray-700 mb-2">About</label>
                            <textarea className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none" rows={4} value={formData.about} onChange={e => setFormData({ ...formData, about: e.target.value })} placeholder="Tell customers about your business..." /></div>
                    </div>
                </div>

                {/* Business Hours */}
                <div className="animate-fade-in-up stagger-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Hours</h3>
                    <div className="space-y-3">
                        {DAYS.map(day => {
                            const h = formData.business_hours[day] || { open: '09:00', close: '17:00', enabled: false };
                            return (
                                <div key={day} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                                    <button type="button" onClick={() => toggleDay(day)}
                                        className={`w-10 h-6 rounded-full transition-colors relative ${h.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${h.enabled ? 'translate-x-4' : ''}`} />
                                    </button>
                                    <span className={`text-sm font-medium w-24 ${h.enabled ? 'text-gray-900' : 'text-gray-400'}`}>{DAY_LABELS[day]}</span>
                                    {h.enabled ? (
                                        <div className="flex items-center gap-2">
                                            <input type="time" value={h.open} onChange={e => updateHour(day, 'open', e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                                            <span className="text-gray-400">to</span>
                                            <input type="time" value={h.close} onChange={e => updateHour(day, 'close', e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    ) : <span className="text-sm text-gray-400">Closed</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Social Links */}
                <div className="animate-fade-in-up stagger-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { key: 'website', label: 'Website', placeholder: 'https://yoursite.com', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
                            { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...', icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
                            { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...', icon: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5M12 7a5 5 0 110 10 5 5 0 010-10m0 2a3 3 0 100 6 3 3 0 000-6z' },
                            { key: 'twitter', label: 'Twitter / X', placeholder: 'https://x.com/...', icon: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' },
                        ].map(s => (
                            <div key={s.key}>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">{s.label}</label>
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={s.icon} /></svg>
                                    <input type="url" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm" value={formData.social_links[s.key]} onChange={e => setFormData({ ...formData, social_links: { ...formData.social_links, [s.key]: e.target.value } })} placeholder={s.placeholder} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end animate-fade-in-up stagger-5">
                    <button type="submit" disabled={saving}
                        className="btn-ripple px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </Layout>
    );
};

export default Profile;
