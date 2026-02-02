import { DentalService } from '../types/index';

export const DENTAL_SERVICES: DentalService[] = [
    // --- Esthetic (Cosmetic) ---
    {
        id: 'whitening',
        title: 'Professional Whitening',
        category: 'Esthetic',
        description: 'Advanced laser teeth whitening for immediate, long-lasting results. Up to 8 shades lighter in one session.',
        icon: '✨',
        durationMin: 60,
        priceEstimate: 'AED 1,500',
        imageUrl: '/artifacts/dental_whitening_premium_1769436073420.png'
    },
    {
        id: 'veneers',
        title: 'Porcelain Veneers',
        category: 'Esthetic',
        description: 'Custom-made thin shells to cover the front surface of teeth. Corrects medication discoloration, chips, or gaps.',
        icon: '🦷',
        durationMin: 90,
        priceEstimate: 'AED 2,500 / tooth',
        imageUrl: '/artifacts/dental_veneers_smile_1769436090553.png'
    },
    {
        id: 'aligners',
        title: 'Clear Aligners (Invisalign)',
        category: 'Esthetic',
        description: 'Invisible orthodontic treatment to straighten teeth without metal braces. Removable and comfortable.',
        icon: '😁',
        durationMin: 45,
        priceEstimate: 'AED 15,000+'
    },
    {
        id: 'composite_bonding',
        title: 'Composite Bonding',
        category: 'Esthetic',
        description: 'Repair decayed, chipped, or fractured teeth using tooth-colored composite resin.',
        icon: '🔨',
        durationMin: 60,
        priceEstimate: 'AED 800'
    },

    // --- Therapeutic (Restorative/Pain) ---
    {
        id: 'root_canal',
        title: 'Root Canal Therapy',
        category: 'Therapeutic',
        description: 'Saves a tooth that is badly decayed or infected. Removes nerve and pulp, cleans, and seals the inside.',
        icon: '🩹',
        durationMin: 90,
        priceEstimate: 'AED 2,000'
    },
    {
        id: 'crown',
        title: 'Dental Crown',
        category: 'Therapeutic',
        description: 'A cap placed over a tooth to restore its shape, size, strength, and appearance. Common after root canals.',
        icon: '👑',
        durationMin: 90,
        priceEstimate: 'AED 3,000'
    },
    {
        id: 'implant',
        title: 'Dental Implant',
        category: 'Therapeutic',
        description: 'Permanent replacement for missing teeth. Titanium post surgically positioned into the jawbone.',
        icon: '🔩',
        durationMin: 120,
        priceEstimate: 'AED 6,000',
        imageUrl: '/artifacts/dental_implant_3d_1769436104155.png'
    },
    {
        id: 'extraction',
        title: 'Tooth Extraction',
        category: 'Therapeutic',
        description: 'Removal of a tooth due to damage, decay, or crowding (e.g., Wisdom teeth).',
        icon: '🛑',
        durationMin: 45,
        priceEstimate: 'AED 500'
    },

    // --- Preventive ---
    {
        id: 'cleaning',
        title: 'Routine Cleaning (Scaling)',
        category: 'Preventive',
        description: 'Removal of plaque and tartar to prevent cavities, gingivitis, and gum disease. Includes polishing.',
        icon: '🧼',
        durationMin: 45,
        priceEstimate: 'AED 400'
    },
    {
        id: 'checkup',
        title: 'Comprehensive Checkup',
        category: 'Preventive',
        description: 'Full examination including X-rays (if needed), oral cancer screening, and gum health evaluation.',
        icon: '🔍',
        durationMin: 30,
        priceEstimate: 'AED 300',
        imageUrl: '/artifacts/dental_checkup_modern_1769436123629.png'
    }
];
