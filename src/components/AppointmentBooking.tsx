import React, { useState, useEffect } from 'react';
import { DataService } from '../services/api';
import { useAuth } from './Auth';
import { showToast } from './Toast';
import { ICONS } from '../constants/index';

interface AppointmentBookingProps {
    patientId?: string;
    onSuccess?: () => void;
    onClose?: () => void;
    initialReason?: string;
    preselectedDoctorId?: string;
    serviceCost?: string; // e.g. "AED 1,500"
    serviceId?: string;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ patientId, onSuccess, onClose, initialReason, preselectedDoctorId, serviceCost, serviceId }) => {
    const { user } = useAuth();
    const [doctors, setDoctors] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState(preselectedDoctorId || '');
    const [selectedPatient, setSelectedPatient] = useState(patientId || '');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedSlot, setSelectedSlot] = useState('');
    const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
    const [appointmentType, setAppointmentType] = useState('In-Person');
    const [reason, setReason] = useState(initialReason || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isSlotsLoading, setIsSlotsLoading] = useState(false);
    const [dynamicCost, setDynamicCost] = useState(serviceCost || '');

    useEffect(() => {
        // If doctor changes, check if they have specific price for this service
        if (selectedDoctor && serviceId) {
            const doc = doctors.find(d => d.id === selectedDoctor);
            // Assuming doctorProfile.servicePrices is available (camelCase from backend)
            if (doc?.doctorProfile?.servicePrices && doc.doctorProfile.servicePrices[serviceId]) {
                setDynamicCost(doc.doctorProfile.servicePrices[serviceId]);
            } else {
                // Fallback to initial serviceCost if no specific price found or no doctor selected
                setDynamicCost(serviceCost || '');
            }
        }
    }, [selectedDoctor, serviceId, doctors, serviceCost]);

    // Payment State
    const [paymentLocked, setPaymentLocked] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        loadDoctors();
        if (!patientId) loadPatients();
    }, []);

    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            loadSlots();
        }
    }, [selectedDoctor, selectedDate]);

    const loadDoctors = async () => {
        try {
            const users = await DataService.getUsers();
            const docs = users.filter(u => u.role === 'Doctor' || u.role === 'Specialist' || u.role === 'Dentist');
            setDoctors(docs);
        } catch (e) {
            console.error(e);
        }
    };

    const loadPatients = async () => {
        try {
            const pts = await DataService.getPatients();
            setPatients(pts);
        } catch (e) {
            console.error(e);
        }
    };

    const loadSlots = async () => {
        setIsSlotsLoading(true);
        try {
            const data = await DataService.getAvailableSlots(selectedDoctor, selectedDate);
            setSlots(data.slots || []);
        } catch (e) {
            console.error(e);
            setSlots([]);
        } finally {
            setIsSlotsLoading(false);
        }
    };

    // Parse Cost
    const getCostBreakdown = () => {
        if (!dynamicCost) return null;
        let costStr = String(dynamicCost).replace(/,/g, '');
        const numericCost = parseFloat(costStr.replace(/[^0-9.]/g, ''));
        if (isNaN(numericCost)) return null;

        const serviceFee = numericCost * 0.05; // 5% Fee
        const total = numericCost + serviceFee;

        return {
            base: numericCost,
            fee: serviceFee,
            total: total,
            currency: 'AED' // Default
        };
    };

    const handleLockFunds = async () => {
        if (!selectedDoctor || !selectedSlot) {
            showToast.error("Please select a doctor and time slot first.");
            return;
        }

        setProcessingPayment(true);
        try {
            // Simulate Blockchain Interaction
            await new Promise(resolve => setTimeout(resolve, 2000));
            // In real app: ConcordiumProvider.sendTransaction(...)

            setPaymentLocked(true);
            showToast.success("Funds locked securely via Concordium Smart Contract!");
        } catch (e) {
            showToast.error("Failed to lock funds. Please try again.");
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedDoctor || !selectedPatient || !selectedSlot) {
            showToast.error("Please fill all required fields");
            return;
        }

        if (dynamicCost && !paymentLocked) {
            showToast.error("Please proceed with payment locking to confirm booking.");
            return;
        }

        setIsLoading(true);
        try {
            await DataService.createAppointment({
                doctorId: selectedDoctor,
                patientId: selectedPatient,
                scheduledAt: selectedSlot,
                type: appointmentType,
                reason: reason,
                serviceId: serviceId,
                paymentStatus: dynamicCost ? 'Locked' : 'Pending',
                cost: getCostBreakdown()?.total
            });
            showToast.success("Appointment booked successfully!");
            onSuccess?.();
            onClose?.();
        } catch (e: any) {
            showToast.error(e.message || "Failed to book appointment");
        } finally {
            setIsLoading(false);
        }
    };

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const costDetails = getCostBreakdown();
    const activeDoctor = doctors.find(d => d.id === selectedDoctor);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-primary/10 to-indigo-500/10">
                <h2 className="text-xl font-heading font-bold text-text-main flex items-center gap-3">
                    {ICONS.calendar}
                    Book Appointment
                </h2>
            </div>

            <div className="p-6 space-y-6">
                {/* Doctor Selection */}
                <div>
                    <label className="block text-sm font-bold text-text-muted mb-2">Select Doctor *</label>
                    <select
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
                    >
                        <option value="">Choose a doctor...</option>
                        {doctors.map(doc => (
                            <option key={doc.id} value={doc.id}>Dr. {doc.name} - {doc.role}</option>
                        ))}
                    </select>

                    {/* Clinic Info Display */}
                    {activeDoctor?.doctorProfile?.clinicName && (
                        <div className="mt-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 animate-fade-in">
                            {activeDoctor.doctorProfile.clinicLogoUrl ? (
                                <img src={activeDoctor.doctorProfile.clinicLogoUrl} alt="Clinic Logo" className="w-12 h-12 object-contain rounded-lg bg-white" />
                            ) : (
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl border border-slate-200">🏥</div>
                            )}
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm">{activeDoctor.doctorProfile.clinicName}</h4>
                                <div className="text-xs text-slate-500 flex flex-col gap-0.5">
                                    <span>{activeDoctor.doctorProfile.clinicAddress}</span>
                                    {activeDoctor.doctorProfile.openingHours && (
                                        <span className="text-primary font-medium flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            {activeDoctor.doctorProfile.openingHours}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Patient Selection (if not pre-set) */}
                {!patientId && (
                    <div>
                        <label className="block text-sm font-bold text-text-muted mb-2">Select Patient *</label>
                        <select
                            value={selectedPatient}
                            onChange={(e) => setSelectedPatient(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
                        >
                            <option value="">Choose a patient...</option>
                            {patients.map(pat => (
                                <option key={pat.id} value={pat.id}>{pat.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Date Selection */}
                <div>
                    <label className="block text-sm font-bold text-text-muted mb-2">Select Date *</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={getMinDate()}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                </div>

                {/* Time Slots */}
                {selectedDoctor && selectedDate && (
                    <div>
                        <label className="block text-sm font-bold text-text-muted mb-2">Available Time Slots *</label>
                        {isSlotsLoading ? (
                            <div className="text-center py-4 text-text-muted">Loading slots...</div>
                        ) : slots.length === 0 ? (
                            <div className="text-center py-4 text-text-muted">No slots available</div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {slots.map((slot, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => slot.available && setSelectedSlot(slot.time)}
                                        disabled={!slot.available}
                                        className={`p-2 rounded-lg text-sm font-medium transition-all ${selectedSlot === slot.time
                                            ? 'bg-primary text-white shadow-lg'
                                            : slot.available
                                                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-primary/20 text-text-main'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed line-through'
                                            }`}
                                    >
                                        {new Date(slot.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Appointment Type */}
                <div>
                    <label className="block text-sm font-bold text-text-muted mb-2">Appointment Type</label>
                    <div className="flex gap-3">
                        {['In-Person', 'Video', 'Phone'].map(type => (
                            <button
                                key={type}
                                onClick={() => setAppointmentType(type)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${appointmentType === type
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-text-muted hover:bg-slate-200'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reason */}
                <div>
                    <label className="block text-sm font-bold text-text-muted mb-2">Reason for Visit</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        placeholder="Describe your symptoms or reason for visit..."
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                    />
                </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                {onClose && (
                    <button
                        onClick={onClose}
                        className="px-5 py-2 font-bold text-text-muted hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !selectedDoctor || !selectedPatient || !selectedSlot}
                    className="px-6 py-2 font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {isLoading ? 'Booking...' : 'Book Appointment'}
                </button>
            </div>

            {/* Right Column: Payment & Confirmation */}
            {costDetails && (
                <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-800/50 border-l border-slate-200 dark:border-slate-700 p-6 flex flex-col">
                    <h3 className="font-heading font-bold text-lg text-slate-800 dark:text-white mb-6">Booking Summary</h3>

                    <div className="space-y-4 mb-8 flex-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Service</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{serviceId || 'Consultation'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Base Price</span>
                            <span className="font-medium">{costDetails.currency} {costDetails.base.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Service Fee (5%)</span>
                            <span className="font-medium">{costDetails.currency} {costDetails.fee.toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-slate-200 dark:bg-slate-700 my-2"></div>
                        <div className="flex justify-between text-lg font-black text-primary">
                            <span>Total</span>
                            <span>{costDetails.currency} {costDetails.total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Smart Contract Payment */}
                    <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
                            <strong>🔒 No-Show Protection</strong><br />
                            Funds will be locked in a Smart Contract and released to the clinic upon check-in.
                        </div>

                        {!paymentLocked ? (
                            <button
                                onClick={handleLockFunds}
                                disabled={processingPayment || !selectedSlot}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${selectedSlot
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/30'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {processingPayment ? (
                                    <>⚙️ Processing...</>
                                ) : (
                                    <>💳 Lock Funds via Concordium</>
                                )}
                            </button>
                        ) : (
                            <div className="text-center p-3 bg-green-100 text-green-700 rounded-xl font-bold border border-green-200 text-sm">
                                ✅ Funds Locked Successfully
                            </div>
                        )}
                    </div>
                    <div className="hidden md:block mt-auto pt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={!paymentLocked}
                            className="w-full px-6 py-3 font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Confirm Booking
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentBooking;
