"use client";
import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";

const ScrollSequence = () => {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const audioRef = useRef(null);
    const progressBarRef = useRef(null);
    const textRefs = useRef([]);

    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState(0);
    const [isStarted, setIsStarted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    const toggleMute = () => {
        const audio = audioRef.current;
        if (audio) {
            audio.muted = !isMuted;
            setIsMuted((prev) => !prev);
            console.log("Audio Toggled:", !isMuted);
        }
    };

    const frameCount = 120;
    // Cache layout values to avoid thrashing
    const layoutRef = useRef({
        top: 0,
        height: 0,
        scrollHeight: 0
    });

    // Preload images
    useEffect(() => {
        const loadImages = async () => {
            const loadedImages = [];
            let loadedCount = 0;

            for (let i = 1; i <= frameCount; i++) {
                const img = new Image();
                const formattedIndex = i.toString().padStart(3, "0");
                img.src = `/flower/ezgif-frame-${formattedIndex}.png`;
                await new Promise((resolve) => {
                    img.onload = () => { loadedCount++; setLoadProgress(Math.round((loadedCount / frameCount) * 100)); resolve(); };
                    img.onerror = () => { loadedCount++; setLoadProgress(Math.round((loadedCount / frameCount) * 100)); resolve(); };
                });
                loadedImages.push(img);
            }
            setImages(loadedImages);
            setIsLoading(false);
        };

        loadImages();
    }, []);

    const handleStart = () => {
        setIsStarted(true);
        // Play audio immediately if available, or useEffect will catch it
        setTimeout(() => {
            if (audioRef.current) {
                audioRef.current.play().catch(e => console.log("Audio play error", e));
            }
        }, 100);
    };

    // ... (keep usage of other hooks/functions) ...

    return (
        <>
            <audio ref={audioRef} loop>
                <source src="/audio/audio.mp3" type="audio/mpeg" />
            </audio>

            {(isLoading || !isStarted) ? (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] text-white">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

                    {isLoading ? (
                        <div className="relative flex flex-col items-center">
                            <div className="text-9xl font-serif font-light tracking-tighter mix-blend-difference leading-none">
                                {loadProgress}<span className="text-4xl align-top opacity-50">%</span>
                            </div>
                            <div className="mt-8 w-64 h-px bg-white/20 relative overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 bg-white transition-all duration-300 ease-out"
                                    style={{ width: `${loadProgress}%` }}
                                />
                            </div>
                            <div className="mt-4 text-xs font-mono uppercase tracking-[0.2em] text-white/40">
                                Loading Sequence
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleStart}
                            className="group relative px-12 py-6 overflow-hidden bg-transparent border border-white/20 hover:border-white/50 transition-colors duration-500"
                        >
                            <span className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ease-out"></span>
                            <span className="relative z-10 font-mono text-sm tracking-[0.3em] uppercase group-hover:text-black transition-colors duration-500">
                                Enter Experience
                            </span>
                        </button>
                    )}
                </div>
            ) : (
                <div ref={containerRef} className="relative h-[800vh] bg-black">
                    <div className="fixed top-0 left-0 w-full h-1 bg-gray-900 z-50">
                        <div
                            ref={progressBarRef}
                            className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            style={{ width: `0%` }}
                        />
                    </div>

                    <div className="fixed bottom-8 right-8 z-50 mix-blend-difference">
                        <button
                            onClick={toggleMute}
                            className="flex items-center justify-center w-12 h-12 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
                        >
                            {isMuted ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    <div className="sticky top-0 h-screen w-full overflow-hidden">
                        <canvas
                            ref={canvasRef}
                            className="absolute inset-0 h-full w-full object-cover"
                        />

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            {["Bloom", "Unfold", "Flourish", "Beauty"].map((text, i) => (
                                <h2
                                    key={text}
                                    ref={el => textRefs.current[i] = el}
                                    className="absolute text-6xl md:text-9xl font-bold text-white drop-shadow-2xl mix-blend-difference tracking-tighter opacity-0"
                                >
                                    {text}
                                </h2>
                            ))}
                        </div>

                        <div
                            id="replay-btn"
                            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 opacity-0 pointer-events-none transition-opacity duration-1000"
                        >
                            <button
                                onClick={handleReplay}
                                className="px-6 py-3 border border-white/30 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-white hover:text-black transition-all duration-500 uppercase tracking-widest text-sm"
                            >
                                Replay Sequence
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ScrollSequence;
