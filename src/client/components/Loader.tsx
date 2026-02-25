interface LoaderProps {
    message?: string;
}

const Loader = ({ message = "Loading..." }: LoaderProps) => {
    // SIZE CALCULATION:
    // Base size: 48px (w-12 / h-12)
    // Offset: 24px (half of 48px) to keep the cube centered

    return (
        <div className="flex flex-col items-center justify-center h-full space-y-8 px-6 text-center">
            <style>{`
                @keyframes cube-spinner {
                    0% { transform: rotate(45deg) rotateX(-25deg) rotateY(25deg); }
                    50% { transform: rotate(45deg) rotateX(-385deg) rotateY(25deg); }
                    100% { transform: rotate(45deg) rotateX(-385deg) rotateY(385deg); }
                }
                .preserve-3d { transform-style: preserve-3d; }
                .animate-cube { animation: cube-spinner 1.6s infinite ease; }
            `}</style>

            {/* Container: Changed from 70.4px to w-12/h-12 (48px) */}
            <div className="relative w-12 h-12 animate-cube preserve-3d">

                {/* Back: translateZ is now -24px */}
                <div className="absolute inset-0 border-[2.5px] border-gray-500 bg-gray-500/10 [transform:translateZ(-24px)_rotateY(180deg)]" />

                {/* Right */}
                <div className="absolute inset-0 border-[2.5px] border-gray-500 bg-gray-500/10 [transform:rotateY(-270deg)_translateX(50%)] origin-top-right" />

                {/* Left */}
                <div className="absolute inset-0 border-[2.5px] border-gray-500 bg-gray-500/10 [transform:rotateY(270deg)_translateX(-50%)] origin-left" />

                {/* Top */}
                <div className="absolute inset-0 border-[2.5px] border-gray-500 bg-gray-500/10 [transform:rotateX(90deg)_translateY(-50%)] origin-top" />

                {/* Bottom */}
                <div className="absolute inset-0 border-[2.5px] border-gray-500 bg-gray-500/10 [transform:rotateX(-90deg)_translateY(50%)] origin-bottom" />

                {/* Front: translateZ is now 24px */}
                <div className="absolute inset-0 border-[2.5px] border-gray-500 bg-gray-500/10 [transform:translateZ(24px)]" />
            </div>

            <div className="space-y-2">
                <p className="text-sm font-bold text-gray-900 tracking-tight lowercase">
                    {message}
                </p>
            </div>
        </div>
    );
}

export default Loader;