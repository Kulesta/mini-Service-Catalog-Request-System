import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';
import { useToast } from '../components/toastContext';

const Star = ({ filled }) => (
    <svg className="w-4 h-4" viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} style={{ color: filled ? '#f59e0b' : '#d1d5db' }}>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const PublicCatalog = () => {
    const { providerId, slug } = useParams();
    const toast = useToast();
    const [provider, setProvider] = useState(null);
    const [catalog, setCatalog] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [banners, setBanners] = useState([]);
    const [availableDates, setAvailableDates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedTime, setSelectedTime] = useState('');
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [requestForm, setRequestForm] = useState({ customerName: '', customerPhone: '', customerNote: '' });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('services');
    const [reviewForm, setReviewForm] = useState({ customer_name: '', rating: 5, comment: '' });
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);
    const [serviceDetail, setServiceDetail] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                const res = slug ? await api.get(`/public/services/${slug}`) : await api.get(`/public/${providerId}`);
                setProvider(res.data.provider);
                setCatalog(res.data.catalog);
                setReviews(res.data.reviews || []);
                setAvgRating(res.data.avgRating || 0);
                setTotalReviews(res.data.totalReviews || 0);
                setBanners(res.data.banners || []);
                setAvailableDates(res.data.availableDates || []);
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        if (slug || providerId) fetchCatalog();
    }, [providerId, slug]);

    const toggleService = (id) => {
        setSelectedServices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const fetchSlots = async (date) => {
        setSelectedDate(date);
        setSelectedTime('');
        if (!date) { setAvailableSlots([]); return; }
        setSlotsLoading(true);
        try {
            const ids = selectedServices.length > 0 ? selectedServices.join(',') : '';
            const pid = provider?._id || providerId;
            const res = await api.get(`/public/slots/${pid}?date=${date}${ids ? `&serviceIds=${ids}` : ''}`);
            setAvailableSlots(res.data.slots || []);
        } catch { setAvailableSlots([]); }
        finally { setSlotsLoading(false); }
    };

    const selectedTotal = catalog.flatMap(c => c.services || []).filter(s => selectedServices.includes(s._id)).reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!requestForm.customerName.trim() || !requestForm.customerPhone) { toast?.error?.('Please fill in your name and phone'); return; }
        setSubmitting(true);
        try {
            await api.post('/public/request', {
                providerId: provider?._id || providerId,
                serviceIds: selectedServices,
                bookingDate: selectedDate,
                bookingTime: selectedTime,
                ...requestForm
            });
            setSubmitted(true);
        } catch (error) { toast?.error?.(error.response?.data?.message || 'Failed to submit'); }
        finally { setSubmitting(false); }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewForm.customer_name.trim()) { toast?.error?.('Name is required'); return; }
        setReviewSubmitting(true);
        try {
            await api.post('/public/review', { providerId: provider?._id || providerId, ...reviewForm });
            setReviewSubmitted(true);
        } catch { toast?.error?.('Failed to submit review'); }
        finally { setReviewSubmitting(false); }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="h-10 w-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        </div>
    );

    if (!provider) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <p className="text-gray-400 text-lg">Provider not found</p>
                <p className="text-gray-300 text-sm mt-2">This salon page doesn't exist.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="relative max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl font-bold text-white mb-1">{provider.company_name}</h1>
                    <p className="text-blue-100/70 text-sm">{provider.full_name} &middot; {provider.phone}</p>
                    {totalReviews > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} filled={i <= Math.round(avgRating)} />)}
                            <span className="text-white text-xs font-medium ml-1">{avgRating} ({totalReviews})</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                        {provider.phone && <a href={`tel:${provider.phone}`} className="text-[11px] text-white/60 hover:text-white transition-colors">Call</a>}
                        {provider.phone && <a href={`https://wa.me/${provider.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-white/60 hover:text-white transition-colors">WhatsApp</a>}
                        {provider.email && <a href={`mailto:${provider.email}`} className="text-[11px] text-white/60 hover:text-white transition-colors">Email</a>}
                    </div>
                </div>
            </div>

            {/* Banners — Large Cards */}
            {banners.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                    <div className={`grid gap-4 ${banners.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                        {banners.map(b => (
                            <div key={b._id} className="relative overflow-hidden rounded-2xl p-6 sm:p-8 min-h-[160px] flex items-end" style={{ backgroundColor: b.background_color, color: b.text_color }}>
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white blur-2xl" />
                                    <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white blur-2xl" />
                                </div>
                                <div className="relative flex items-end justify-between w-full gap-4">
                                    <div>
                                        <p className="text-xs font-semibold opacity-70 mb-1">{provider.company_name}</p>
                                        <h3 className="text-xl sm:text-2xl font-bold mb-1">{b.title}</h3>
                                        {b.subtitle && <p className="text-sm opacity-80">{b.subtitle}</p>}
                                    </div>
                                    {b.discount_text && (
                                        <div className="shrink-0 px-5 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/20">
                                            <p className="text-2xl sm:text-3xl font-black">{b.discount_text}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5">
                <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100 inline-flex">
                    {[{ k: 'services', l: 'Services' }, { k: 'reviews', l: `Reviews (${totalReviews})` }].map(t => (
                        <button key={t.k} onClick={() => setActiveTab(t.k)}
                            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === t.k ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                            {t.l}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {submitted ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 animate-bounce-in">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Sent</h2>
                        <p className="text-sm text-gray-500">{provider.company_name} will contact you shortly.</p>
                    </div>
                ) : activeTab === 'services' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Service List */}
                        <div className="md:col-span-2 space-y-5">
                            {catalog.map(category => (
                                <div key={category._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                                        <h3 className="text-sm font-semibold text-gray-900">{category.title}</h3>
                                        {category.description && <p className="text-xs text-gray-500 mt-0.5">{category.description}</p>}
                                    </div>
                                    <ul className="divide-y divide-gray-100">
                                        {category.services.map(service => (
                                            <li key={service._id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setServiceDetail(service)}>
                                                <input type="checkbox" checked={selectedServices.includes(service._id)}
                                                    onChange={(e) => { e.stopPropagation(); toggleService(service._id); }}
                                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 shrink-0" />
                                                {service.image && <img src={service.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0" />}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{service.service_name}</p>
                                                        {service.tags?.slice(0, 2).map(tag => {
                                                            const tc = { Popular: 'bg-blue-50 text-blue-600', New: 'bg-emerald-50 text-emerald-600', Featured: 'bg-purple-50 text-purple-600', 'Best Seller': 'bg-amber-50 text-amber-600', Trending: 'bg-pink-50 text-pink-600', Limited: 'bg-red-50 text-red-600' };
                                                            return <span key={tag} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tc[tag] || 'bg-gray-100 text-gray-600'}`}>{tag}</span>;
                                                        })}
                                                    </div>
                                                    {service.availability?.days && <p className="text-[11px] text-gray-400 mt-0.5">{service.availability.days.length} days &middot; {service.availability.start_time}–{service.availability.end_time}</p>}
                                                </div>
                                                <div className="text-right shrink-0">
                                                    {Number(service.discount_amount) > 0 && <p className="text-[11px] text-gray-400 line-through">${((Number(service.base_price) + (Number(service.base_price) * Number(service.vat_percent || 0) / 100))).toFixed(2)}</p>}
                                                    <p className="text-sm font-semibold text-gray-900">${Number(service.total_price).toFixed(2)}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Request Panel */}
                        <div className="md:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                                {submitted ? (
                                    <div className="p-6 text-center">
                                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">Request Sent</p>
                                        <p className="text-xs text-gray-500 mt-1">We'll contact you soon</p>
                                    </div>
                                ) : (
                                    <div className="p-5">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Book Services</h3>
                                        <p className="text-xs text-gray-400 mb-4">Select services, then fill in your details</p>

                                        {/* Selected Summary */}
                                        {selectedServices.length > 0 && (
                                            <div className="bg-blue-50 rounded-xl p-3 mb-4 border border-blue-100">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-blue-600 font-medium">{selectedServices.length} service{selectedServices.length > 1 ? 's' : ''}</span>
                                                    <span className="font-bold text-blue-900">${selectedTotal.toFixed(2)}</span>
                                                </div>
                                                <p className="text-[10px] text-blue-400">Incl. VAT & discounts</p>
                                            </div>
                                        )}

                                        <form onSubmit={handleSubmit} className="space-y-3">
                                            {/* Date */}
                                            {availableDates.length > 0 && (
                                                <div>
                                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Date</label>
                                                    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                                                        {availableDates.slice(0, 7).map(d => (
                                                            <button key={d.date} type="button" onClick={() => fetchSlots(d.date)}
                                                                className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${selectedDate === d.date ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                                                                {d.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Time */}
                                            {selectedDate && (
                                                <div>
                                                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Time</label>
                                                    {slotsLoading ? (
                                                        <div className="flex items-center gap-2 py-2"><div className="h-3 w-3 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin" /><span className="text-[11px] text-gray-400">Loading...</span></div>
                                                    ) : availableSlots.length === 0 ? (
                                                        <p className="text-[11px] text-gray-400">No slots available</p>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {availableSlots.map(slot => (
                                                                <button key={slot.time} type="button" disabled={!slot.available} onClick={() => setSelectedTime(slot.time)}
                                                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${!slot.available ? 'bg-gray-50 text-gray-300 line-through cursor-not-allowed' : selectedTime === slot.time ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                                                                    {slot.time}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div>
                                                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Your Name</label>
                                                <input type="text" required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={requestForm.customerName} onChange={e => setRequestForm({ ...requestForm, customerName: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Phone</label>
                                                <PhoneInput defaultCountry="US" value={requestForm.customerPhone} onChange={v => setRequestForm({ ...requestForm, customerPhone: v || '' })}
                                                    className="w-full text-sm border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-blue-500" />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Notes</label>
                                                <textarea rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" value={requestForm.customerNote} onChange={e => setRequestForm({ ...requestForm, customerNote: e.target.value })} placeholder="Any special requests..." />
                                            </div>
                                            <button type="submit" disabled={selectedServices.length === 0 || submitting}
                                                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${selectedServices.length === 0 || submitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md'}`}>
                                                {submitting ? 'Submitting...' : `Submit · $${selectedTotal.toFixed(2)}`}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Reviews Tab */
                    <div className="max-w-2xl mx-auto space-y-5">
                        {totalReviews > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                                <p className="text-4xl font-bold text-gray-900">{avgRating}</p>
                                <div className="flex items-center justify-center gap-0.5 mt-2">{[1, 2, 3, 4, 5].map(i => <Star key={i} filled={i <= Math.round(avgRating)} />)}</div>
                                <p className="text-xs text-gray-400 mt-1">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</p>
                            </div>
                        )}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Leave a Review</h3>
                            {reviewSubmitted ? (
                                <p className="text-sm text-blue-600">Thank you for your review!</p>
                            ) : (
                                <form onSubmit={handleReviewSubmit} className="space-y-3">
                                    <input type="text" placeholder="Your name" required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={reviewForm.customer_name} onChange={e => setReviewForm({ ...reviewForm, customer_name: e.target.value })} />
                                    <div className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map(s => (
                                            <button key={s} type="button" onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setReviewForm({ ...reviewForm, rating: s })} className="p-0.5">
                                                <svg className="w-6 h-6 transition-colors" viewBox="0 0 20 20" fill={(hoverRating || reviewForm.rating) >= s ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} style={{ color: (hoverRating || reviewForm.rating) >= s ? '#f59e0b' : '#d1d5db' }}>
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                    <textarea placeholder="Your experience (optional)" rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} />
                                    <button type="submit" disabled={reviewSubmitting} className="w-full py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">{reviewSubmitting ? 'Sending...' : 'Submit Review'}</button>
                                </form>
                            )}
                        </div>
                        {reviews.map(r => (
                            <div key={r._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">{r.customer_name?.charAt(0)?.toUpperCase()}</div>
                                        <span className="text-sm font-medium text-gray-900">{r.customer_name}</span>
                                    </div>
                                    <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(i => <Star key={i} filled={i <= r.rating} />)}</div>
                                </div>
                                {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                                <p className="text-[10px] text-gray-400 mt-2">{new Date(r.createdAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Service Detail Modal */}
            {serviceDetail && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setServiceDetail(null)}>
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        {(serviceDetail.image || serviceDetail.images?.[0]) && (
                            <div className="h-48 overflow-hidden rounded-t-2xl sm:rounded-t-2xl relative">
                                <img src={serviceDetail.image || serviceDetail.images[0]} alt="" className="w-full h-full object-cover" />
                                <button onClick={() => setServiceDetail(null)} className="absolute top-3 right-3 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow">
                                    <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        )}
                        <div className="p-5">
                            {!serviceDetail.image && !serviceDetail.images?.[0] && (
                                <button onClick={() => setServiceDetail(null)} className="absolute top-3 right-3 w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            )}
                            {serviceDetail.tags?.length > 0 && (
                                <div className="flex gap-1.5 mb-2">{serviceDetail.tags.map(t => {
                                    const tc = { Popular: 'bg-blue-50 text-blue-600', New: 'bg-emerald-50 text-emerald-600', Featured: 'bg-purple-50 text-purple-600', 'Best Seller': 'bg-amber-50 text-amber-600', Trending: 'bg-pink-50 text-pink-600', Limited: 'bg-red-50 text-red-600' };
                                    return <span key={t} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tc[t] || 'bg-gray-100 text-gray-600'}`}>{t}</span>;
                                })}</div>
                            )}
                            <h3 className="text-lg font-semibold text-gray-900">{serviceDetail.service_name}</h3>
                            {serviceDetail.category?.title && <p className="text-xs text-gray-500 mt-0.5">{serviceDetail.category.title}</p>}
                            <div className="mt-3 bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                                {Number(serviceDetail.discount_amount) > 0 && <p className="text-xs text-gray-400 line-through">${((Number(serviceDetail.base_price) + (Number(serviceDetail.base_price) * Number(serviceDetail.vat_percent || 0) / 100))).toFixed(2)}</p>}
                                <p className="text-xl font-bold text-gray-900">${Number(serviceDetail.total_price).toFixed(2)}</p>
                            </div>
                            {serviceDetail.availability?.days?.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-2">Available Days</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(d => (
                                            <span key={d} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${serviceDetail.availability.days.includes(d) ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-300'}`}>
                                                {d.charAt(0).toUpperCase() + d.slice(1)}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">{serviceDetail.availability.start_time} – {serviceDetail.availability.end_time} · {serviceDetail.availability.slot_duration} min slots</p>
                                </div>
                            )}
                            {serviceDetail.images && serviceDetail.images.length > 1 && (
                                <div className="mt-4">
                                    <p className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase mb-2">Gallery</p>
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {serviceDetail.images.map((img, i) => (
                                            <img key={i} src={img} alt="" className="h-16 w-16 rounded-lg object-cover border border-gray-100 shrink-0 cursor-pointer hover:scale-105 transition-transform" onClick={(e) => { e.stopPropagation(); setSelectedImage(img); }} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button onClick={() => { toggleService(serviceDetail._id); setServiceDetail(null); }}
                                className={`w-full mt-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${selectedServices.includes(serviceDetail._id) ? 'bg-blue-600 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md'}`}>
                                {selectedServices.includes(serviceDetail._id) ? 'Remove from Selection' : 'Add to Selection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Lightbox */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-2xl max-h-[80vh] animate-scale-in" onClick={e => e.stopPropagation()}>
                        <img src={selectedImage} alt="" className="w-full h-full object-contain rounded-2xl" />
                        <button onClick={() => setSelectedImage(null)} className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors">
                            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="border-t border-gray-100 bg-white py-5 text-center mt-8">
                <p className="text-[11px] text-gray-300">Powered by Service Catalog</p>
            </footer>
        </div>
    );
};

export default PublicCatalog;
