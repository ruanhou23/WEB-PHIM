"use client";

import Image from "next/image";
import { useState, useCallback } from "react";

const FALLBACK_POSTER_DATA_URI = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="360"><rect width="100%" height="100%" fill="#0b1020"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-family="Arial" font-size="14">No Image</text></svg>`,
)}`;

type MoviePosterImageProps = {
    src: string;
    alt: string;
};

export default function MoviePosterImage({ src, alt }: MoviePosterImageProps) {
    const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

    const handleLoad = useCallback(() => {
        setStatus("loaded");
    }, []);

    const handleError = useCallback(() => {
        setStatus("error");
    }, []);

    const isDataUri = src.startsWith("data:");

    return (
        <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg bg-black/40 ring-1 ring-white/10">
            {/* Skeleton shimmer – visible while loading */}
            {status === "loading" && !isDataUri && (
                <div className="absolute inset-0 z-10 animate-pulse rounded-lg bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800" />
            )}

            {/* Error fallback */}
            {status === "error" ? (
                <img
                    src={FALLBACK_POSTER_DATA_URI}
                    alt={alt}
                    className="h-full w-full object-cover"
                />
            ) : isDataUri ? (
                <img
                    src={src}
                    alt={alt}
                    className="h-full w-full object-cover"
                />
            ) : (
                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes="44px"
                    className={`object-cover transition-all duration-500 ease-out group-hover:scale-110 ${status === "loaded"
                        ? "opacity-100 blur-0 scale-100"
                        : "opacity-0 blur-sm scale-105"
                        }`}
                    onLoad={handleLoad}
                    onError={handleError}
                    unoptimized
                />
            )}
        </div>
    );
}
