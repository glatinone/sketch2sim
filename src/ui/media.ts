import { useSyncExternalStore } from "react";

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Single-column phone/tablet layout (matches Tailwind's `lg` breakpoint). */
export const useIsMobile = () => useMedia("(max-width: 1023px)");

/** Touch-first device: use the phone's native camera app instead of a live <video> preview. */
export const useCoarsePointer = () => useMedia("(pointer: coarse)");
