import { useRef, useState, type CSSProperties, type PointerEvent } from "react";

/** Pointer-driven 3D tilt used by the hero preview card. */
export function useTilt(max = 8) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    setStyle({
      transform: `perspective(1000px) rotateX(${(0.5 - y) * max * 2}deg) rotateY(${(x - 0.5) * max * 2}deg) translateY(-2px)`,
      "--mx": `${x * 100}%`,
      "--my": `${y * 100}%`,
    } as CSSProperties);
  };

  const onPointerLeave = () => {
    setStyle({ transform: "", "--mx": "50%", "--my": "50%" } as CSSProperties);
  };

  return { ref, style, onPointerMove, onPointerLeave };
}
