import React, { useRef, useEffect } from 'react';

export const ECGViewer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let x = 0;
        let lastY = 100;

        // Simulating ECG waveform logic
        const draw = () => {
            // Fade effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; // Trail
            // Dark mode support check needed, assuming dark for contrast looks cool usually
            // but let's clear rect for clean look in this demo
            // ctx.fillRect(0, 0, canvas.width, canvas.height); 

            // Actually, we want a scrolling graph.
            // Let's just draw continuously and clear when x > width

            if (x > canvas.width) {
                x = 0;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // Draw Grid
                drawGrid(ctx, canvas.width, canvas.height);
            }

            ctx.beginPath();
            ctx.strokeStyle = '#ef4444'; // Red-500
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.moveTo(x, lastY);

            // Generate next point
            // Normal Sinus Rhythm Simulation
            // Baseline
            let y = 100;

            // Simple P-QRS-T simulation using sine waves and spikes
            const time = Date.now() / 1000;
            const cycle = (Date.now() % 1000) / 1000; // 1 second beat

            if (cycle < 0.1) y = 100; // Isoelectric
            else if (cycle < 0.15) y = 90; // P wave
            else if (cycle < 0.2) y = 100; // PR segment
            else if (cycle < 0.22) y = 110; // Q wave (dip)
            else if (cycle < 0.26) y = 20;  // R wave (spike up)
            else if (cycle < 0.28) y = 120; // S wave (dip down)
            else if (cycle < 0.35) y = 100; // ST segment
            else if (cycle < 0.45) y = 80;  // T wave
            else y = 100; // Isoelectric

            // Add some noise
            y += (Math.random() - 0.5) * 5;

            x += 2;
            ctx.lineTo(x, y);
            ctx.stroke();

            lastY = y;
            animationFrameId = window.requestAnimationFrame(draw);
        };

        const drawGrid = (context: CanvasRenderingContext2D, w: number, h: number) => {
            context.strokeStyle = 'rgba(200, 200, 200, 0.2)';
            context.lineWidth = 1;
            context.beginPath();
            for (let i = 0; i < w; i += 20) {
                context.moveTo(i, 0);
                context.lineTo(i, h);
            }
            for (let j = 0; j < h; j += 20) {
                context.moveTo(0, j);
                context.lineTo(w, j);
            }
            context.stroke();
        };

        // Initial Grid
        drawGrid(ctx, canvas.width, canvas.height);
        draw();

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="glass-card p-4 rounded-2xl bg-black overflow-hidden relative">
            <h4 className="absolute top-2 left-4 text-xs font-bold text-red-500 uppercase tracking-widest">Live ECG Lead II</h4>
            <div className="absolute top-2 right-4 text-2xl font-black text-white flex items-end gap-1">
                72 <span className="text-xs font-normal text-slate-400 mb-1">BPM</span>
            </div>
            <canvas ref={canvasRef} width={600} height={200} className="w-full h-[150px]"></canvas>
        </div>
    );
};
