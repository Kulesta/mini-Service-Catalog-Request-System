import { useState, useEffect, useRef } from 'react';

export default function AnimatedCounter({ target, duration = 1200, prefix = '', suffix = '' }) {
    const [count, setCount] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const ref = useRef(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (hasAnimated.current) {
            setCount(target);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    setIsAnimating(true);
                    animateCount();
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target]);

    const animateCount = () => {
        const startTime = performance.now();
        const startVal = 0;
        const endVal = target;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startVal + (endVal - startVal) * eased);

            setCount(current);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                setTimeout(() => setIsAnimating(false), 200);
            }
        };

        requestAnimationFrame(step);
    };

    return (
        <span ref={ref} className={`counter-value ${isAnimating ? 'counting' : ''}`}>
            {prefix}{count.toLocaleString()}{suffix}
        </span>
    );
}
