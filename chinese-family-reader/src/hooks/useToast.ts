import { useCallback, useRef } from "react";

export function useToast() {
  const toastRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    const el = toastRef.current;
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => el.classList.remove("show"), 2200);
  }, []);

  return { toastRef, showToast };
}
