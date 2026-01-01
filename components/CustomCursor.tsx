import React, { useEffect, useRef, useState } from 'react';

export const CustomCursor: React.FC = () => {
    const cursorRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Position refs
    const pos = useRef({ x: 0, y: 0 });
    const cursorPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        // Only enable on devices with a fine pointer (mouse), not touch
        if (!window.matchMedia("(pointer: fine)").matches) return;

        setIsVisible(true);

        const onMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            pos.current = { x: clientX, y: clientY };
        };

        const onMouseDown = () => setIsClicking(true);
        const onMouseUp = () => setIsClicking(false);

        const onMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Enhanced detection for interactive elements
            const isClickable = 
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.tagName === 'INPUT' ||
                target.tagName === 'SELECT' ||
                target.tagName === 'TEXTAREA' ||
                target.onclick !== null ||
                target.closest('button') || 
                target.closest('a') ||
                target.closest('[role="button"]') ||
                target.classList.contains('cursor-pointer') ||
                window.getComputedStyle(target).cursor === 'pointer';

            if (isClickable) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mouseover', onMouseOver);

        // Animation Loop
        let animationFrameId: number;
        
        const loop = () => {
            // Speed factor
            const speed = 0.25; 
            
            cursorPos.current.x += (pos.current.x - cursorPos.current.x) * speed;
            cursorPos.current.y += (pos.current.y - cursorPos.current.y) * speed;

            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${cursorPos.current.x}px, ${cursorPos.current.y}px, 0)`;
            }
            
            animationFrameId = requestAnimationFrame(loop);
        };
        
        loop();

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('mouseover', onMouseOver);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div 
            ref={cursorRef}
            className="fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform flex items-center justify-center"
            style={{ 
                // Adjust margin so the tip of the SVG aligns with the click coordinate
                marginLeft: '-12px', 
                marginTop: '-12px',
                width: '24px',
                height: '24px'
            }}
        >
            <div className="relative w-full h-full flex items-center justify-center">
                
                {/* 1. Active Ring (Shows only when hovering) */}
                <div 
                    className={`absolute inset-0 rounded-full border border-cyan-400 opacity-0 transition-all duration-300 ease-out
                        ${isHovering ? 'opacity-100 scale-150 animate-spin-slow' : 'scale-50'}
                    `}
                    style={{ borderStyle: 'dashed', borderWidth: '1.5px' }}
                ></div>

                {/* 2. Glow Layer */}
                <div 
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-400 rounded-full blur-md -z-10 transition-all duration-300 
                        ${isHovering ? 'opacity-60 scale-150 bg-cyan-400' : 'opacity-20 scale-100'}
                    `}
                ></div>

                {/* 3. The Arrow Icon Container */}
                <div 
                    className={`relative transition-transform duration-300 ease-out origin-center
                        ${isClicking ? 'scale-75' : 'scale-100'}
                        ${isHovering ? '-rotate-45' : 'rotate-0'} 
                    `}
                >
                    <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        className="drop-shadow-lg"
                    >
                        <defs>
                            <linearGradient id="cursor-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={isHovering ? "#22d3ee" : "#3b82f6"} /> {/* Cyan on hover, Blue normal */}
                                <stop offset="100%" stopColor={isHovering ? "#3b82f6" : "#06b6d4"} /> 
                            </linearGradient>
                        </defs>
                        
                        {/* The Arrow Shape */}
                        <path 
                            d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" 
                            fill="url(#cursor-gradient)" 
                            stroke="white" 
                            strokeWidth="1.5" 
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
};