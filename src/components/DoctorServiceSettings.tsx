import React, { useState, useEffect } from 'react';
import { useAuth } from './Auth';
import { DataService } from '../services/api';
import { showToast } from './Toast';
import { DENTAL_SERVICES } from '../constants/dentalServices';
import { MEDICAL_SPECIALTIES } from '../constants/medicalSpecialties';
import { ICONS } from '../constants/index';

const DoctorServiceSettings: React.FC = () => {
    const { user } = useAuth();
    const [prices, setPrices] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [clinicName, setClinicName] = useState('');
    const [clinicAddress, setClinicAddress] = useState('');
    const [website, setWebsite] = useState('');
    const [clinicLogoUrl, setClinicLogoUrl] = useState('');
    const [openingHours, setOpeningHours] = useState('');
    const [subSpecialties, setSubSpecialties] = useState(''); // Managed as string for input

    useEffect(() => {
        loadProfile();
    }, [user?.doctorProfileId]);

    const loadProfile = async () => {
        if (!user?.doctorProfileId) return; // Matches type interface
        setIsLoading(true);
        try {
            const profile = await DataService.getDoctorProfile('me');
            setClinicName(profile.clinicName || '');
            setClinicAddress(profile.clinicAddress || '');
            setWebsite(profile.website || '');
            setClinicLogoUrl(profile.clinicLogoUrl || '');
            setOpeningHours(profile.openingHours || '');
            setSubSpecialties(profile.subSpecialties?.join(', ') || '');
            if (profile.servicePrices) {
                setPrices(profile.servicePrices);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePriceChange = (serviceId: string, value: string) => {
        setPrices(prev => ({
            ...prev,
            [serviceId]: value
        }));
    };

    const handleSave = async () => {
        if (!user?.doctorProfileId) return;
        setIsSaving(true);
        try {
            await DataService.updateDoctorProfile('me', {
                clinicName: clinicName,
                clinicAddress: clinicAddress,
                servicePrices: prices,
                website: website,
                clinicLogoUrl: clinicLogoUrl,
                openingHours: openingHours,
                subSpecialties: subSpecialties.split(',').map(s => s.trim()).filter(Boolean)
            });
            showToast.success("Service settings updated successfully");
        } catch (e) {
            showToast.error("Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading settings...</div>;

    // Filter services based on role if needed, currently showing Dental for everyone or just Dentists
    // For demo purposes, we show Dental Services table.
    // Ideally we'd have a SERVICE_REGISTRY map by Role.
    const serviceList = DENTAL_SERVICES;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-w-4xl mx-auto my-8">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-heading font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {ICONS.settings} Service & Clinic Settings
                    </h2>
                    <p className="text-sm text-slate-500">Configure your clinic details and service pricing</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover transition-all disabled:opacity-50"
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="p-6 space-y-8">
                {/* Clinic Details */}
                <section>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                        🏥 Clinic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Clinic Name</label>
                            <input
                                type="text"
                                value={clinicName}
                                onChange={(e) => setClinicName(e.target.value)}
                                placeholder="e.g. Bright Smile Dental"
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Location / Address</label>
                            <input
                                type="text"
                                value={clinicAddress}
                                onChange={(e) => setClinicAddress(e.target.value)}
                                placeholder="e.g. 123 Health Ave, Dubai"
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>
                    </div>
                </section>

                <hr className="border-slate-100 dark:border-slate-800" />

                <section>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                        📝 Additional Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Website URL</label>
                            <input
                                type="text"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="https://clinic.com"
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Clinic Logo URL</label>
                            <input
                                type="text"
                                value={clinicLogoUrl}
                                onChange={(e) => setClinicLogoUrl(e.target.value)}
                                placeholder="/path/to/logo.png"
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Opening Hours</label>
                            <input
                                type="text"
                                value={openingHours}
                                onChange={(e) => setOpeningHours(e.target.value)}
                                placeholder="Mon-Fri: 9am-5pm"
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
                            />
                        </div>
                        {/* Sub-Specialties Multi-Select */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-500 mb-2">Sub-Specialties & Focus Areas</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {MEDICAL_SPECIALTIES.map(spec => {
                                    const isSelected = subSpecialties.includes(spec.label);
                                    return (
                                        <button
                                            key={spec.id}
                                            onClick={() => {
                                                let current = subSpecialties ? subSpecialties.split(',').map(s => s.trim()).filter(Boolean) : [];
                                                if (isSelected) {
                                                    current = current.filter(s => s !== spec.label);
                                                } else {
                                                    current.push(spec.label);
                                                }
                                                setSubSpecialties(current.join(', '));
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isSelected
                                                ? 'bg-primary text-white border-primary shadow-md'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-primary/50'
                                                }`}
                                        >
                                            {spec.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {/* Allow custom entry as well */}
                            <input
                                type="text"
                                value={subSpecialties}
                                onChange={(e) => setSubSpecialties(e.target.value)}
                                placeholder="Or type custom specialties separated by commas..."
                                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                            />
                        </div>
                    </div>
                </section>

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Service Pricing */}
                <section>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                        💲 Service Pricing Configuration
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-left">
                            <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-4 text-sm font-bold text-slate-600 dark:text-slate-400">Service Name</th>
                                    <th className="p-4 text-sm font-bold text-slate-600 dark:text-slate-400">Category</th>
                                    <th className="p-4 text-sm font-bold text-slate-600 dark:text-slate-400">Standard Rate</th>
                                    <th className="p-4 text-sm font-bold text-slate-600 dark:text-slate-400">Your Price (AED)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {serviceList.map(service => (
                                    <tr key={service.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-100/50 dark:hover:bg-slate-700/50">
                                        <td className="p-4 font-medium text-slate-800 dark:text-white flex items-center gap-2">
                                            <span className="text-xl">{service.icon}</span> {service.title}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${service.category === 'Esthetic' ? 'bg-purple-100 text-purple-600' :
                                                service.category === 'Therapeutic' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-teal-100 text-teal-600'
                                                }`}>
                                                {service.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-400 italic">
                                            {service.priceEstimate}
                                        </td>
                                        <td className="p-4">
                                            <input
                                                type="text"
                                                value={prices[service.id] || ''}
                                                onChange={(e) => handlePriceChange(service.id, e.target.value)}
                                                placeholder={service.priceEstimate}
                                                className="w-32 p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div >
    );
};

export default DoctorServiceSettings;
