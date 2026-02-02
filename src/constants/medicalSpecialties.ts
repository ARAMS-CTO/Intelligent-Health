export const MEDICAL_SPECIALTIES = [
    {
        id: 'child_adolescent_psychiatry',
        label: 'Child and Adolescent Psychiatry',
        category: 'Medical',
        description: 'Diagnosis, treatment, and prevention of mental disorders in children, adolescents, and their families.'
    },
    {
        id: 'speech_therapy',
        label: 'Speech Therapy',
        category: 'Allied Health',
        description: 'Assessment and treatment of communication problems and speech disorders.'
    },
    {
        id: 'osteopathy',
        label: 'Osteopathy',
        category: 'Alternative Medicine',
        description: 'Holistic approach emphasizing the physical manipulation of muscle tissue and bones.'
    },
    {
        id: 'podiatrist',
        label: 'Podiatrist',
        category: 'Medical',
        description: 'Diagnosis and treatment of disorders of the foot, ankle, and lower extremity.'
    },
    {
        id: 'physiotherapy',
        label: 'Physiotherapy',
        category: 'Allied Health',
        description: 'Treatment of injury, disease, and disorders through physical methods — such as exercise, massage, manipulation.'
    },
    {
        id: 'dermatology',
        label: 'Dermatology',
        category: 'Medical',
        description: 'Diagnosis and treatment of skin, hair, and nail conditions.'
    },
    {
        id: 'cardiologist',
        label: 'Cardiologist',
        category: 'Medical',
        description: 'Diagnosis and treatment of heart and blood vessel disorders.'
    },
    {
        id: 'implantologist',
        label: 'Implantologist',
        category: 'Dental',
        description: 'Specializes in dental implants to replace missing teeth.'
    },
    {
        id: 'endodontics',
        label: 'Endodontics',
        category: 'Dental',
        description: 'Diagnosis and treatment of tooth pain and root canal procedures.'
    },
    {
        id: 'orthodontist',
        label: 'Orthodontist',
        category: 'Dental',
        description: 'Correction of misaligned teeth and jaws.'
    },
    {
        id: 'general_dentistry',
        label: 'General Dentistry',
        category: 'Dental',
        description: 'Primary dental care including checkups, cleaning, and basic procedures.'
    },
    {
        id: 'cosmetic_dentistry',
        label: 'Cosmetic Dentistry',
        category: 'Dental',
        description: 'Dental work that improves the appearance of teeth, gums, and bite.'
    }
];

export const getSpecialtiesByCategory = (category: string) => {
    return MEDICAL_SPECIALTIES.filter(s => s.category === category);
};
