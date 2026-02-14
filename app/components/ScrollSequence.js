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
            canvasRef.current.width = window.innerWidth;
            canvasRef.current.height = window.innerHeight;
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

                const scale = 1.2;
                drawWidth *= scale;
                drawHeight *= scale;

                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = (canvas.height - drawHeight) / 2;

                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
            }
        }

        // Update Text (Logic remains same, driven by frameIndex)
        const texts = [
            { start: 10, end: 30, ref: textRefs.current[0] },
            { start: 40, end: 60, ref: textRefs.current[1] },
            { start: 70, end: 90, ref: textRefs.current[2] },
            { start: 100, end: 115, ref: textRefs.current[3] },
        ];

        texts.forEach(({ start, end, ref }) => {
            if (!ref) return;
            let opacity = 0, translateY = 20, blur = 10;

            if (frameIndex >= start && frameIndex <= end) {
                opacity = 1; translateY = 0; blur = 0;
            } else if (frameIndex > end && frameIndex < end + 10) {
                const exit = (frameIndex - end) / 10;
                opacity = 1 - exit; translateY = -20 * exit; blur = 10 * exit;
            } else if (frameIndex < start && frameIndex > start - 10) {
                const enter = (start - frameIndex) / 10;
                opacity = 1 - enter; translateY = 20 * enter;
            }

            // Use cssText for single-paint update speed
            ref.style.cssText = `
            opacity: ${opacity}; 
            transform: translateY(${translateY}px); 
            filter: blur(${blur}px); 
            transition: opacity 0.1s linear, transform 0.1s linear, filter 0.1s linear;
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
        // We can use the lenis instance from useLenis hook?
        // Actually useLenis returns the lenis instance? No, it takes a callback.
        // To get the instance we need useLenis() without args?
        // documentation: useLenis((lenis) => ...) 
        // To control it: const lenis = useLenis(); only works if we don't pass callback?
        // Let's rely on window scrolling or document query if needed, or import standard hook usage.
        // Correct usage: const lenis = useLenis(); is NOT how lenis-react works typically for *getting* instance if we are *in* a component using it for scroll loop.
        // But typically we can just scroll window in React 18+ and Lenis listens.
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (isLoading || !isStarted) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white">
                {isLoading ? (
                    <>
                        <div className="mb-4 text-2xl font-light tracking-widest">LOADING EXPERIENCE</div>
                        <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-300 ease-out"
                                style={{ width: `${loadProgress}%` }}
                            />
                        </div>
                        <div className="mt-2 text-sm text-gray-400 font-mono">{loadProgress}%</div>
                    </>
                ) : (
                    <button
                        onClick={handleStart}
                        className="group relative px-8 py-4 bg-white text-black font-bold tracking-widest hover:bg-gray-200 transition-colors duration-300 rounded overflow-hidden"
                    >
                        <span className="relative z-10">ENTER EXPERIENCE</span>
                    </button>
                )}
            </div>
        );
    }

    return (
        <div ref={containerRef} className="relative h-[800vh] bg-black">
            <audio ref={audioRef} loop>
                <source src="/audio/ambient.mp3" type="audio/mpeg" />
            </audio>

            <div className="fixed top-0 left-0 w-full h-1 bg-gray-900 z-50">
                <div
                    ref={progressBarRef}
                    className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    style={{ width: `0%` }}
                />
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
    );
};

export default ScrollSequence;
