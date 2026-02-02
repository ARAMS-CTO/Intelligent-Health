import { useState, useEffect } from 'react';
import { DataService } from '../../services/api';
import { DentalChart, DentalProcedure } from '../../types';

export const useSpecializedData = (activeZone: string, patientId: string | undefined) => {
    const [dentalChart, setDentalChart] = useState<DentalChart | undefined>(undefined);
    const [procedures, setProcedures] = useState<DentalProcedure[]>([]);
    const [cardiologyData, setCardiologyData] = useState<any>(null);
    const [ophthalmologyData, setOphthalmologyData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!patientId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                if (activeZone === 'dentistry') {
                    const [chart, history] = await Promise.all([
                        DataService.getDentalChart(patientId),
                        DataService.getDentalHistory(patientId)
                    ]);
                    setDentalChart(chart);
                    setProcedures(history);
                } else if (activeZone === 'cardiology') {
                    const data = await DataService.getCardiologyData(patientId);
                    setCardiologyData(data);
                } else if (activeZone === 'ophthalmology') {
                    const data = await DataService.getOphthalmologyData(patientId);
                    setOphthalmologyData(data);
                }
            } catch (e) {
                console.error(`Failed to load data for ${activeZone}`, e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeZone, patientId]);

    return {
        dentalChart,
        procedures,
        cardiologyData,
        ophthalmologyData,
        loading
    };
};
