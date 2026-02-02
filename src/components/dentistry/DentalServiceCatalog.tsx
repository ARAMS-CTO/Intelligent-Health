import React, { useState } from 'react';
import { DENTAL_SERVICES } from '../../constants/dentalServices';
import { DentalService, DentalCategory } from '../../types/index';
import AppointmentBooking from '../AppointmentBooking';
import Modal from '../Modal';

export const DentalServiceCatalog: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<DentalCategory | 'All'>('All');
    const [bookingService, setBookingService] = useState<DentalService | null>(null);

    const categories: (DentalCategory | 'All')[] = ['All', 'Esthetic', 'Therapeutic', 'Preventive'];

    const filteredServices = selectedCategory === 'All'
        ? DENTAL_SERVICES
        : DENTAL_SERVICES.filter(s => s.category === selectedCategory);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Professional Dental Services</h3>
                    <p className="text-slate-500 text-sm">Explore our specialized treatments tailored to your needs.</p>
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                                ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-md'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            {cat === 'Esthetic' && '✨ '}
                            {cat === 'Therapeutic' && '⚕️ '}
                            {cat === 'Preventive' && '🛡️ '}
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map(service => (
                    <div key={service.id} className="group glass-card p-0 rounded-2xl hover:shadow-xl transition-all duration-300 border border-transparent hover:border-primary/20 relative overflow-hidden flex flex-col h-full">
                        {/* Image Banner */}
                        {service.imageUrl ? (
                            <div className="relative h-40 w-full overflow-hidden">
                                <img
                                    src={service.imageUrl}
                                    alt={service.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-3 left-3 flex justify-between items-end right-3">
                                    <span className="text-3xl filter drop-shadow-md">{service.icon}</span>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full backdrop-blur-md ${service.category === 'Esthetic' ? 'bg-purple-500/80 text-white' :
                                        service.category === 'Therapeutic' ? 'bg-blue-500/80 text-white' :
                                            'bg-teal-500/80 text-white'
                                        }`}>
                                        {service.category}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 pb-0 relative">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full z-0 group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <span className="text-4xl filter drop-shadow-md group-hover:scale-110 transition-transform duration-300">{service.icon}</span>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${service.category === 'Esthetic' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' :
                                        service.category === 'Therapeutic' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' :
                                            'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300'
                                        }`}>
                                        {service.category}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="p-5 flex flex-col flex-1 relative z-10">
                            <h4 className="font-heading font-bold text-lg text-slate-800 dark:text-white mb-2 group-hover:text-primary transition-colors">
                                {service.title}
                            </h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-3 flex-1">
                                {service.description}
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/50">
                                <div className="text-xs font-bold text-slate-400">
                                    ⏱️ {service.durationMin} min <span className="mx-1">•</span> {service.priceEstimate}
                                </div>
                                <button
                                    onClick={() => setBookingService(service)}
                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-all transform active:scale-95 shadow-sm"
                                >
                                    Book Now
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Booking Modal */}
            <Modal
                isOpen={!!bookingService}
                onClose={() => setBookingService(null)}
                title={`Book ${bookingService?.title}`}
            >
                {bookingService && (
                    <AppointmentBooking
                        initialReason={`Requested service: ${bookingService.title}`}
                        onClose={() => setBookingService(null)}
                        preselectedDoctorId={undefined}
                        serviceCost={bookingService.priceEstimate}
                        serviceId={bookingService.id}
                    />
                )}
            </Modal>
        </div>
    );
};
