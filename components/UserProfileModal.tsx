
import React, { useState, useEffect, useRef } from 'react';
import { User, Role, DoctorProfile, Certification } from '../types/index';
import { getDoctorProfileById, updateDoctorProfile } from '../services/api';
import { ICONS } from '../constants/index';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, user }) => {
    const [profile, setProfile] = useState<DoctorProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState<Partial<DoctorProfile>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (isOpen && user && user.role === Role.Doctor && user.doctorProfileId) {
                setIsLoading(true);
                const doctorProfile = await getDoctorProfileById(user.doctorProfileId);
                if (doctorProfile) {
                    setProfile(doctorProfile);
                    setEditedProfile(doctorProfile);
                }
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [isOpen, user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedProfile(prev => ({ ...prev, [name]: name === 'yearsOfExperience' ? parseInt(value) || 0 : value }));
    };

    const handleCertificationChange = (index: number, field: keyof Certification, value: string | number) => {
        const newCertifications = [...(editedProfile.certifications || [])];
        // @ts-ignore
        newCertifications[index][field] = value;
        setEditedProfile(prev => ({ ...prev, certifications: newCertifications }));
    };
    
    const addCertification = () => {
        const newCert: Certification = { id: `new-${Date.now()}`, name: '', issuingBody: '', year: new Date().getFullYear(), url: '' };
        setEditedProfile(prev => ({...prev, certifications: [...(prev.certifications || []), newCert]}));
    };
    
    const removeCertification = (id: string) => {
        setEditedProfile(prev => ({...prev, certifications: prev.certifications?.filter(c => c.id !== id) }));
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditedProfile(prev => ({ ...prev, profilePictureUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSave = async () => {
        if (!profile) return;
        setIsLoading(true);
        const updated = await updateDoctorProfile(profile.id, editedProfile);
        if (updated) {
            setProfile(updated);
        }
        setIsLoading(false);
        setIsEditing(false);
    };
    
    const handleCancel = () => {
        setEditedProfile(profile || {});
        setIsEditing(false);
    }

    if (!isOpen || !user) return null;

    const inputFieldClasses = "mt-1 block w-full px-3 py-2 bg-surface border border-gray-300 dark:bg-slate-700 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary";

    const renderDoctorProfile = () => (
        <>
            <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg leading-6 font-medium text-text-main">Professional Details</h3>
                    {isEditing ? (
                        <div className="flex gap-2">
                            <button onClick={handleCancel} className="text-sm font-semibold text-text-muted hover:text-text-main">Cancel</button>
                            <button onClick={handleSave} className="text-sm font-semibold text-primary hover:text-primary-hover">Save</button>
                        </div>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-primary hover:text-primary-hover">{ICONS.edit} Edit</button>
                    )}
                </div>
                <div className="mt-2 max-w-xl text-sm text-text-muted">
                    <p>Manage your professional information that other staff can see.</p>
                </div>
                {isEditing ? (
                    <div className="mt-5 space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-text-muted mb-2">Profile Picture</label>
                             <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden group cursor-pointer" onClick={triggerFileInput}>
                                     {editedProfile.profilePictureUrl ? (
                                        <img src={editedProfile.profilePictureUrl} alt="Preview" className="w-full h-full object-cover" />
                                     ) : (
                                         <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-300">
                                            {ICONS.user}
                                         </div>
                                     )}
                                     <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                     </div>
                                </div>
                                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                                <div className="text-xs text-text-muted">
                                    <p>Click image to change</p>
                                    <p>JPG, PNG or GIF. Max 2MB.</p>
                                </div>
                             </div>
                            {/* Hidden text input for fallback or manual URL entry if needed, though file upload is preferred */}
                            <input type="text" name="profilePictureUrl" value={editedProfile.profilePictureUrl || ''} onChange={handleInputChange} className={`${inputFieldClasses} mt-2 text-xs`} placeholder="Or enter image URL..." />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-text-muted">Specialty</label>
                                <input type="text" name="specialty" value={editedProfile.specialty || ''} onChange={handleInputChange} className={inputFieldClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-muted">Years of Experience</label>
                                <input type="number" name="yearsOfExperience" value={editedProfile.yearsOfExperience || ''} onChange={handleInputChange} className={inputFieldClasses} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-muted">Bio</label>
                            <textarea name="bio" rows={4} value={editedProfile.bio || ''} onChange={handleInputChange} className={inputFieldClasses} />
                        </div>
                        <div>
                            <h4 className="text-md font-medium text-text-main mb-2">Certifications</h4>
                            <div className="space-y-3">
                                {editedProfile.certifications?.map((cert, index) => (
                                    <div key={cert.id} className="grid grid-cols-2 gap-2 p-2 border dark:border-slate-600 rounded-md relative">
                                        <input type="text" placeholder="Certification Name" value={cert.name} onChange={(e) => handleCertificationChange(index, 'name', e.target.value)} className={`${inputFieldClasses} col-span-2 text-sm`} />
                                        <input type="text" placeholder="Issuing Body" value={cert.issuingBody} onChange={(e) => handleCertificationChange(index, 'issuingBody', e.target.value)} className={`${inputFieldClasses} text-sm`} />
                                        <input type="number" placeholder="Year" value={cert.year} onChange={(e) => handleCertificationChange(index, 'year', parseInt(e.target.value))} className={`${inputFieldClasses} text-sm`} />
                                        <button onClick={() => removeCertification(cert.id)} className="absolute top-1 right-1 text-danger p-1 rounded-full hover:bg-danger-light">&times;</button>
                                    </div>
                                ))}
                                <button onClick={addCertification} className="text-sm font-semibold text-primary hover:underline">+ Add Certification</button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <dl className="mt-5 grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-text-muted">Specialty</dt>
                            <dd className="mt-1 text-sm text-text-main font-semibold">{profile?.specialty}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-text-muted">Years of Experience</dt>
                            <dd className="mt-1 text-sm text-text-main font-semibold">{profile?.yearsOfExperience}</dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-text-muted">Bio</dt>
                            <dd className="mt-1 text-sm text-text-main">{profile?.bio}</dd>
                        </div>
                         <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-text-muted">Certifications</dt>
                            <dd className="mt-1 text-sm text-text-main">
                                <ul className="border border-gray-200 dark:border-slate-700 rounded-md divide-y divide-gray-200 dark:divide-slate-700">
                                    {profile?.certifications.map(cert => (
                                        <li key={cert.id} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                            <div className="w-0 flex-1 flex items-center">
                                                <span className="text-primary">{ICONS.certificate}</span>
                                                <span className="ml-2 flex-1 w-0 truncate">
                                                    <strong>{cert.name}</strong> - {cert.issuingBody} ({cert.year})
                                                </span>
                                            </div>
                                            <div className="ml-4 flex-shrink-0">
                                                <a href={cert.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:text-primary-hover">View</a>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </dd>
                        </div>
                    </dl>
                )}
            </div>
        </>
    );

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 ${isOpen ? 'animate-fade-in' : 'hidden'}`}>
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-3xl flex flex-col relative animate-slide-up-fade-in">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white p-1 rounded-full z-10">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {isLoading ? (
                    <div className="h-96 flex items-center justify-center">
                        <p>Loading profile...</p>
                    </div>
                ) : (
                    <div>
                        <div className="p-6 border-b dark:border-slate-700 flex items-center gap-4">
                             <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-4xl overflow-hidden">
                                {profile?.profilePictureUrl ? (
                                    <img src={profile.profilePictureUrl} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    user.name.charAt(0)
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-text-main">{user.name}</h2>
                                <p className="text-text-muted">{user.email}</p>
                                <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-text-muted mt-1 inline-block">{user.role}</span>
                            </div>
                        </div>
                        {user.role === Role.Doctor ? renderDoctorProfile() : (
                            <div className="p-6 text-text-muted">Profile editing for your role is not yet available.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfileModal;
