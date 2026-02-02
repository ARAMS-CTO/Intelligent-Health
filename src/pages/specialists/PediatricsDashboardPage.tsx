import React from 'react';
import { PediatricsDashboard } from '../../components/pediatrics/PediatricsDashboard';

const PediatricsDashboardPage: React.FC = () => {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <PediatricsDashboard />
        </div>
    );
};

export default PediatricsDashboardPage;
