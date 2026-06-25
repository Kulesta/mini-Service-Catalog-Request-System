export default function FloatingOrbs() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
                className="absolute -top-24 -right-24 h-72 w-72 rounded-full opacity-[0.07] animate-float"
                style={{ background: 'radial-gradient(circle, #3b82f6, transparent 70%)', animationDuration: '4s' }}
            />
            <div
                className="absolute top-1/2 -left-20 h-56 w-56 rounded-full opacity-[0.05] animate-float"
                style={{ background: 'radial-gradient(circle, #8b5cf6, transparent 70%)', animationDuration: '5s', animationDelay: '1s' }}
            />
            <div
                className="absolute -bottom-16 right-1/4 h-48 w-48 rounded-full opacity-[0.06] animate-float"
                style={{ background: 'radial-gradient(circle, #06b6d4, transparent 70%)', animationDuration: '6s', animationDelay: '2s' }}
            />
        </div>
    );
}
