"use client";

import { useEffect, useRef, useState } from "react";
import lottie, { AnimationItem } from "lottie-web";

type Props = {
    onOpenPlanner?: () => void;
    /** Hide completely (used while a modal is open). */
    hidden?: boolean;
};

const ANIM_PATH = "/Robot%20Futuristic%20Ai%20animated.json"; // public/Robot Futuristic Ai animated.json
const SIZE = 140; // px

export default function FloatingBuddy({ onOpenPlanner, hidden }: Props) {
    const animRef = useRef<HTMLDivElement | null>(null);
    const outerRef = useRef<HTMLDivElement | null>(null);
    const anim = useRef<AnimationItem | null>(null);

    // position (no auto movement)
    const [pos, setPos] = useState({ x: 0, y: 0 });

    // dragging
    const draggingRef = useRef(false);
    const [dragging, setDragging] = useState(false);
    const dragOffset = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
    const pointerIdRef = useRef<number | null>(null);

    // init animation + initial placement (bottom-right)
    useEffect(() => {
        if (!animRef.current) return;
        anim.current = lottie.loadAnimation({
            container: animRef.current,
            renderer: "svg",
            loop: true,
            autoplay: true,
            path: ANIM_PATH,
        });

        const place = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            setPos({
                x: Math.max(12, Math.min(w - SIZE - 12, w - SIZE - 20)),
                y: Math.max(12, Math.min(h - SIZE - 12, h - SIZE - 20)),
            });
        };
        place();

        const onResize = () => setPos((p) => clampToViewport(p));
        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("resize", onResize);
            anim.current?.destroy();
            anim.current = null;
        };
    }, []);

    // pointer handlers for drag
    useEffect(() => {
        const el = outerRef.current;
        if (!el) return;

        const onPointerDown = (e: PointerEvent) => {
            if (e.button !== 0) return;
            pointerIdRef.current = e.pointerId;
            (e.target as Element).setPointerCapture(e.pointerId);
            draggingRef.current = true;
            setDragging(true);
            const rect = el.getBoundingClientRect();
            dragOffset.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
            e.preventDefault();
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!draggingRef.current || pointerIdRef.current !== e.pointerId) return;
            const x = e.clientX - dragOffset.current.dx;
            const y = e.clientY - dragOffset.current.dy;
            setPos(clampToViewport({ x, y }));
        };

        const onPointerUp = (e: PointerEvent) => {
            if (pointerIdRef.current !== e.pointerId) return;
            draggingRef.current = false;
            setDragging(false);
            pointerIdRef.current = null;
            (e.target as Element).releasePointerCapture?.(e.pointerId);
        };

        el.addEventListener("pointerdown", onPointerDown);
        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        return () => {
            el.removeEventListener("pointerdown", onPointerDown);
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
        };
    }, []);

    if (hidden) return null;

    return (
        <div
            ref={outerRef}
            className="fixed z-[20] select-none"
            style={{
                width: SIZE,
                height: SIZE,
                transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                cursor: dragging ? "grabbing" : "grab",
                userSelect: "none",
                WebkitUserSelect: "none",
                bottom: 0,
                right: 0,
            }}
            role="button"
            aria-label="Floating assistant"
            tabIndex={0}
            onDoubleClick={() => onOpenPlanner?.()}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onOpenPlanner?.();
            }}
            title="Double-click to open the AI Planner. Drag me if you like."
        >
            <div ref={animRef} className="w-full h-full pointer-events-none drop-shadow-xl" />
        </div>
    );
}

function clampToViewport(p: { x: number; y: number }): { x: number; y: number } {
    const w = typeof window !== "undefined" ? window.innerWidth : 0;
    const h = typeof window !== "undefined" ? window.innerHeight : 0;
    const SIZE = 140;
    return {
        x: Math.max(0, Math.min(w - SIZE, p.x)),
        y: Math.max(0, Math.min(h - SIZE, p.y)),
    };
}
