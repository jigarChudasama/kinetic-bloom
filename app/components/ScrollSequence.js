"use client";
import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { motion, AnimatePresence } from "framer-motion";

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
                img.src = `/flower/ezgif-frame-${formattedIndex}.jpg`;
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
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("error", e));
        }
    };

    // Measure layout ONCE (or on resize), not on scroll
    const measureLayout = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;

        layoutRef.current.top = rect.top + scrollTop; // Absolute top position
        layoutRef.current.height = containerRef.current.offsetHeight;
        layoutRef.current.scrollHeight = layoutRef.current.height - window.innerHeight;

        // Also resize canvas here
        if (canvasRef.current) {
            const dpr = window.devicePixelRatio || 1;
            canvasRef.current.width = window.innerWidth * dpr;
            canvasRef.current.height = window.innerHeight * dpr;
        }
    };

    useEffect(() => {
        if (!isStarted) return;
        window.addEventListener("resize", measureLayout);
        measureLayout(); // Initial measurement
        return () => window.removeEventListener("resize", measureLayout);
    }, [isStarted]);


    // THE RENDER LOOP
    // We use useLenis to tap into the scroll loop efficiently
    useLenis(({ scroll }) => {
        if (!isStarted || images.length === 0 || !layoutRef.current.scrollHeight) return;

        // Calculate progress based on cached layout values
        // Scroll progress = (Current Scroll - Container Top) / Scrollable Height
        let relativeScroll = scroll - layoutRef.current.top;
        let progress = relativeScroll / layoutRef.current.scrollHeight;

        // Clamp
        progress = Math.max(0, Math.min(1, progress));

        // Update Progress Bar
        if (progressBarRef.current) {
            progressBarRef.current.style.width = `${progress * 100}%`;
        }

        const frameIndex = Math.min(
            frameCount - 1,
            Math.floor(progress * frameCount)
        );

        // Draw Canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext("2d", { alpha: false });
            // context.imageSmoothingEnabled = false; // Faster? or True for quality

            const img = images[frameIndex];
            if (img) {
                const canvasRatio = canvas.width / canvas.height;
                const imgRatio = img.width / img.height;
                let drawWidth, drawHeight, offsetX, offsetY;

                if (canvasRatio > imgRatio) {
                    drawWidth = canvas.width;
                    drawHeight = drawWidth / imgRatio;
                } else {
                    drawHeight = canvas.height;
                    drawWidth = drawHeight * imgRatio;
                }

                const scale = 0.8;
                drawWidth *= scale;
                drawHeight *= scale;

                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = (canvas.height - drawHeight) / 2;

                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            }
        }

        // Update Text (Logic remains same, driven by frameIndex)
        // Redesigned text reveal logic
        const texts = [
            { start: 0, end: 20, ref: textRefs.current[0] },
            { start: 25, end: 45, ref: textRefs.current[1] },
            { start: 50, end: 70, ref: textRefs.current[2] },
            { start: 75, end: 95, ref: textRefs.current[3] },
            { start: 100, end: 120, ref: textRefs.current[4] },
        ];

        texts.forEach(({ start, end, ref }) => {
            if (!ref) return;
            let opacity = 0, translateY = 40, blur = 20, scale = 1.1;

            if (frameIndex >= start && frameIndex <= end) {
                opacity = 1; translateY = 0; blur = 0; scale = 1;
            } else if (frameIndex > end && frameIndex < end + 10) {
                const exit = (frameIndex - end) / 10;
                opacity = 1 - exit; translateY = -40 * exit; blur = 20 * exit; scale = 1 + (0.1 * exit);
            } else if (frameIndex < start && frameIndex > start - 10) {
                const enter = (start - frameIndex) / 10;
                opacity = 1 - enter; translateY = 40 * enter; blur = 20 * enter; scale = 1 + (0.1 * enter);
            }

            // Use cssText for single-paint update speed
            ref.style.cssText = `
            opacity: ${opacity}; 
            transform: translate3d(0, ${translateY}px, 0) scale(${scale}); 
            filter: blur(${blur}px); 
            will-change: opacity, transform, filter;
        `;
        });

        const replayBtn = document.getElementById("replay-btn");
        if (replayBtn) {
            replayBtn.style.opacity = frameIndex > 115 ? "1" : "0";
            replayBtn.style.pointerEvents = frameIndex > 115 ? "auto" : "none";
        }

    }, [isStarted, images]); // Dep array for hook

    // Lenis scrollTo helper
    function handleReplay() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return (
        <>
            <audio ref={audioRef} loop>
                <source src="/audio/audio.mp3" type="audio/mpeg" />
            </audio>

            <AnimatePresence mode="wait">
                {(isLoading || !isStarted) && (
                    <motion.div
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }}
                    >
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

                        {isLoading ? (
                            <motion.div
                                className="relative flex flex-col items-center"
                                key="loader"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="text-[12vw] md:text-[8vw] font-serif font-light tracking-tighter leading-none flex items-start">
                                    <span className="mix-blend-difference">{loadProgress}</span>
                                    <span className="text-2xl md:text-4xl mt-4 opacity-50 font-mono">%</span>
                                </div>
                                <div className="mt-8 w-64 h-[1px] bg-white/10 relative overflow-hidden">
                                    <motion.div
                                        className="absolute inset-y-0 left-0 bg-white"
                                        initial={{ width: "0%" }}
                                        animate={{ width: `${loadProgress}%` }}
                                        transition={{ ease: "linear" }}
                                    />
                                </div>
                                <div className="mt-4 text-xs font-mono uppercase tracking-[0.3em] text-white/40">
                                    Initializing System
                                </div>
                            </motion.div>
                        ) : (
                            <motion.button
                                key="button"
                                onClick={handleStart}
                                className="group relative px-12 py-6 overflow-hidden"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <div className="absolute inset-0 border border-white/20 group-hover:border-white/50 transition-colors duration-500" />
                                <motion.div
                                    className="absolute inset-0 bg-white"
                                    initial={{ scaleX: 0 }}
                                    whileHover={{ scaleX: 1 }}
                                    transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
                                    style={{ originX: 0 }}
                                />
                                <span className="relative z-10 font-mono text-sm tracking-[0.3em] uppercase mix-blend-difference text-white">
                                    Enter Experience
                                </span>
                            </motion.button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <div ref={containerRef} className="relative h-[800vh] bg-[#050505]">
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

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-center px-4">
                        {[
                            "The Silent Beginning",
                            "Nature's Delicate Dance",
                            "Colors of Life",
                            "Unfolding Beauty",
                            "Eternal Grace"
                        ].map((text, i) => (
                            <h2
                                key={text}
                                ref={el => textRefs.current[i] = el}
                                className="absolute text-4xl md:text-7xl font-bold text-white drop-shadow-2xl mix-blend-difference tracking-tighter opacity-0 leading-tight"
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
        </>
    );
};

export default ScrollSequence;
