
import React, { useEffect, useState, useRef } from 'react';
import { appEvents } from '../services/events';

interface PhysicsObject {
  element: HTMLElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  vr: number; // rotational velocity
  originalStyle: string;
  initialLeft: number;
  initialTop: number;
}

const AntigravityManager: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const requestRef = useRef<number | null>(null);
  const objectsRef = useRef<PhysicsObject[]>([]);

  useEffect(() => {
    const toggle = () => setIsActive(prev => !prev);
    const cleanup = appEvents.on('toggle-antigravity', toggle);
    return cleanup;
  }, []);

  useEffect(() => {
    if (isActive) {
      // Initialize Physics
      const elements = document.querySelectorAll('.antigravity-target');
      const objects: PhysicsObject[] = [];
      const bounds = { w: window.innerWidth, h: window.innerHeight };

      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const rect = htmlEl.getBoundingClientRect();
        
        // Store original state
        const originalStyle = htmlEl.style.cssText;
        
        // Create physics object with random velocities
        objects.push({
          element: htmlEl,
          x: rect.left,
          y: rect.top,
          initialLeft: rect.left,
          initialTop: rect.top,
          vx: (Math.random() - 0.5) * 3, // Random velocity X
          vy: (Math.random() - 0.5) * 3, // Random velocity Y
          width: rect.width,
          height: rect.height,
          rotation: 0,
          vr: (Math.random() - 0.5) * 1.5,
          originalStyle
        });

        // Detach from layout flow
        htmlEl.style.width = `${rect.width}px`;
        htmlEl.style.height = `${rect.height}px`;
        htmlEl.style.left = `${rect.left}px`;
        htmlEl.style.top = `${rect.top}px`;
        htmlEl.style.position = 'fixed';
        htmlEl.style.zIndex = '1000'; // Bring to front
        htmlEl.style.transition = 'none'; 
        htmlEl.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)'; // Enhanced shadow for floating effect
        htmlEl.style.userSelect = 'none';
      });

      objectsRef.current = objects;

      const animate = () => {
        objectsRef.current.forEach(obj => {
          // Update position
          obj.x += obj.vx;
          obj.y += obj.vy;
          obj.rotation += obj.vr;

          // Bounce off walls
          if (obj.x <= 0 || obj.x + obj.width >= bounds.w) {
            obj.vx *= -1;
            obj.x = Math.max(0, Math.min(obj.x, bounds.w - obj.width));
          }
          if (obj.y <= 64 || obj.y + obj.height >= bounds.h) { // 64px for header buffer
            obj.vy *= -1;
            obj.y = Math.max(64, Math.min(obj.y, bounds.h - obj.height));
          }

          // Apply transform
          // Calculate translation relative to the initial fixed position
          const tx = obj.x - obj.initialLeft;
          const ty = obj.y - obj.initialTop;
          
          obj.element.style.transform = `translate(${tx}px, ${ty}px) rotate(${obj.rotation}deg)`;
        });

        requestRef.current = requestAnimationFrame(animate);
      };

      requestRef.current = requestAnimationFrame(animate);

    } else {
      // Cleanup / Reset
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      
      objectsRef.current.forEach(obj => {
        obj.element.style.cssText = obj.originalStyle;
      });
      objectsRef.current = [];
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive]);

  return null;
};

export default AntigravityManager;
