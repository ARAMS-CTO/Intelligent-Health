import React, { useState } from 'react';

const DeveloperPortal: React.FC = () => {
    const [formData, setFormData] = useState({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        website: '',
        device_category: 'vital_signs',
        device_description: '',
        api_experience: 'intermediate',
        expected_volume: 'medium',
        message: ''
    });

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [applicationId, setApplicationId] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/partners/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setApplicationId(data.application_id);
                setSubmitted(true);
            } else {
                alert(data.detail || 'Submission failed. Please try again.');
            }
        } catch (error) {
            alert('Network error. Please check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center p-6">
                <div className="glass-card p-12 max-w-2xl text-center">
                    <div className="text-6xl mb-6">✅</div>
                    <h1 className="text-3xl font-bold mb-4">Application Submitted!</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
                        Thank you for your interest in partnering with Intelligent Health.
                        We'll review your application and contact you within 5-7 business days.
                    </p>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-6">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Your Application ID:
                        </p>
                        <code className="text-indigo-600 dark:text-indigo-400 font-mono text-sm">
                            {applicationId}
                        </code>
                    </div>
                    <button
                        onClick={() => window.location.href = '/marketplace'}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                    >
                        Back to Marketplace
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
            <div className="container mx-auto px-6 py-20">
                {/* Header */}
                <div className="text-center max-w-4xl mx-auto mb-12">
                    <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 px-4 py-2 rounded-full mb-6">
                        <span className="text-indigo-600 dark:text-indigo-400">🔌</span>
                        <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                            SDK Access Application
                        </span>
                    </div>

                    <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
                        Hardware Partner Program
                    </h1>

                    <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                        Join our ecosystem to integrate your health monitoring devices with our platform.
                        Approved partners receive SDK access, technical support, and marketplace listing.
                    </p>
                </div>

                {/* Application Form */}
                <div className="max-w-3xl mx-auto glass-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Company Information */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
                                Company Information
                            </h3>

                            <div>
                                <label className="block text-sm font-medium mb-2">Company Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., HealthTech Devices Inc."
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Contact Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                                        placeholder="contact@company.com"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Phone *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Website</label>
                                    <input
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                                        placeholder="https://www.company.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Device Information */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
                                Device Information
                            </h3>

                            <div>
                                <label className="block text-sm font-medium mb-2">Device Category *</label>
                                <select
                                    required
                                    value={formData.device_category}
                                    onChange={(e) => setFormData({ ...formData, device_category: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="vital_signs">Vital Signs Monitors (BP, Pulse, ECG)</option>
                                    <option value="metabolic">Metabolic Monitors (Glucose, Weight)</option>
                                    <option value="activity">Activity Trackers (Steps, Sleep)</option>
                                    <option value="specialized">Specialized Equipment (CGM, Spirometer)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Device Description *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.device_description}
                                    onChange={(e) => setFormData({ ...formData, device_description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Describe your device, its capabilities, certifications (FDA, CE), and key features..."
                                />
                            </div>
                        </div>

                        {/* Technical Information */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold border-b border-slate-200 dark:border-slate-700 pb-2">
                                Technical Details
                            </h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">API Integration Experience *</label>
                                    <select
                                        required
                                        value={formData.api_experience}
                                        onChange={(e) => setFormData({ ...formData, api_experience: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="beginner">Beginner (New to APIs)</option>
                                        <option value="intermediate">Intermediate (Some experience)</option>
                                        <option value="advanced">Advanced (Extensive experience)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Expected Data Volume *</label>
                                    <select
                                        required
                                        value={formData.expected_volume}
                                        onChange={(e) => setFormData({ ...formData, expected_volume: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="small">Small (&lt;1,000 devices)</option>
                                        <option value="medium">Medium (1,000-10,000 devices)</option>
                                        <option value="large">Large (10,000+ devices)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Additional Message */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Additional Information</label>
                            <textarea
                                rows={3}
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
                                placeholder="Any additional details about your integration needs, timeline, or questions..."
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : 'Submit Application'}
                            </button>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 text-center">
                                By submitting, you agree to our terms and conditions for hardware partners
                            </p>
                        </div>
                    </form>
                </div>

                {/* What Happens Next */}
                <div className="max-w-3xl mx-auto mt-12 glass-card p-8">
                    <h3 className="text-2xl font-bold mb-6">What Happens Next?</h3>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                1
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1">Application Review</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Our team reviews your application and device specifications (5-7 business days)
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                2
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1">SDK Access Granted</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    If approved, you'll receive SDK credentials and access to our sandbox environment
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                3
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1">Integration & Testing</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Complete integration, pass security audits, and perform clinical validation
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                4
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1">Marketplace Launch</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Your certified devices get listed in our marketplace when we reach 100K users
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeveloperPortal;
