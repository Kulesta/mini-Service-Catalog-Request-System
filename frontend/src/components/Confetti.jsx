import { useState, useEffect } from 'react';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

function Particle({ index }) {
    const color = COLORS[index % COLORS.length];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.5;
    const size = Math.random() * 8 + 4;
    const rotation = Math.random() * 360;
    const drift = (Math.random() - 0.5) * 100;

    return (
        <div
            className="absolute pointer-events-none"
            style={{
                left: `${left}%`,
                top: '-10px',
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animation: `confetti-fall 1.5s ease-out ${delay}s forwards`,
                transform: `rotate(${rotation}deg)`,
                '--drift': `${drift}px`,
            }}
        />
    );
}

export default function Confetti({ show, onComplete }) {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (show) {
            setParticles(Array.from({ length: 40 }, (_, i) => i));
            const timer = setTimeout(() => {
                setParticles([]);
                onComplete?.();
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [show]);

    if (particles.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            <style>{`
                @keyframes confetti-fall {
                    0% { transform: translateY(0) translateX(0) rotate(0deg) scale(1); opacity: 1; }
                    100% { transform: translateY(100vh) translateX(var(--drift)) rotate(720deg) scale(0.5); opacity: 0; }
                }
            `}</style>
            {particles.map(i => <Particle key={i} index={i} />)}
        </div>
    );
}
