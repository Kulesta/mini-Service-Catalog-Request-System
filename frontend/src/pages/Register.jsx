import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'
import {
    validateEmail,
    validateLength,
    validatePassword,
    validatePhoneE164,
    validateRequired,
} from '../utils/validation';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        company_name: '',
        license_number: ''
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = (data) => {
        const errs = {};

        errs.full_name =
            validateRequired(data.full_name, 'Full name') ||
            validateLength(data.full_name, { min: 2, max: 80 }, 'Full name');

        errs.email =
            validateRequired(data.email, 'Email') ||
            validateEmail(data.email);

        errs.phone =
            validateRequired(data.phone, 'Phone number') ||
            validatePhoneE164(data.phone, 'phone number');

        errs.password =
            validateRequired(data.password, 'Password') ||
            validatePassword(data.password, { minLength: 8, maxLength: 128 });

        errs.company_name =
            validateRequired(data.company_name, 'Company name') ||
            validateLength(data.company_name, { min: 2, max: 120 }, 'Company name');

        errs.license_number =
            validateRequired(data.license_number, 'License number') ||
            validateLength(data.license_number, { min: 3, max: 50 }, 'License number');

        // Remove empty strings so Object.keys(errs).length reflects real errors
        Object.keys(errs).forEach((k) => {
            if (!errs[k]) delete errs[k];
        });
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const errs = validateForm(formData);
        setFieldErrors(errs);
        if (Object.keys(errs).length > 0) return;
        setSubmitting(true);
        try {
            await api.post('/auth/register', formData);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Register as a Provider
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {success ? (
                        <div className="p-4 mb-4 text-green-700 bg-green-100 rounded">
                            Registration successful! Redirecting to login...
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && (
                                <div className="p-3 text-red-700 bg-red-100 rounded">
                                    {error}
                                </div>
                            )}

                            {['full_name', 'email', 'phone', 'company_name', 'license_number'].map((field) => (
                                <div key={field}>
                                    <label htmlFor={field} className="block text-sm font-medium text-gray-700 capitalize">
                                        {field.replace('_', ' ')}
                                    </label>
                                    <div className="mt-1">
                                        {field === 'phone' ? (
                                            <PhoneInput
                                                id={field}
                                                name={field}
                                                defaultCountry="US"
                                                value={formData[field]}
                                                onChange={(value) => {
                                                    setFormData({ ...formData, [field]: value || '' });
                                                    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: '' }));
                                                }}
                                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            />
                                        ) : (
                                            <input
                                                id={field}
                                                name={field}
                                                type={field === 'email' ? 'email' : 'text'}
                                                required
                                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                                                value={formData[field]}
                                                onChange={handleChange}
                                                disabled={submitting}
                                            />
                                        )}
                                    </div>
                                    {fieldErrors[field] && (
                                        <p className="mt-1 text-sm text-red-600">{fieldErrors[field]}</p>
                                    )}
                                </div>
                            ))}

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                <div className="mt-1">
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            className="appearance-none block w-full pr-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                                            value={formData.password}
                                            onChange={handleChange}
                                            disabled={submitting}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? (
                                                // Eye-off icon
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="h-5 w-5"
                                                >
                                                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.74-1.76 1.87-3.36 3.29-4.64" />
                                                    <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                                                    <path d="M9.88 5.09A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a11.05 11.05 0 0 1-2.06 3.06" />
                                                    <path d="M3 3l18 18" />
                                                </svg>
                                            ) : (
                                                // Eye icon
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="h-5 w-5"
                                                >
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                {!fieldErrors.password && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Min 8 chars, include uppercase, lowercase, number, and a special character.
                                    </p>
                                )}
                                {fieldErrors.password && (
                                    <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                                )}
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting && (
                                        <svg className="animate-spin h-4 w-4 inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    )}
                                    {submitting ? 'Registering...' : 'Register'}
                                </button>
                            </div>
                        </form>
                    )}
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    Already have an account?
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
