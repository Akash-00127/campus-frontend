"use client";

import { ReactNode, useEffect, useRef } from "react";

export function AutoSubmitFilters({ children }: { children: ReactNode }) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function submitSoon(target: EventTarget | null) {
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    if (target.type === "hidden") return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = target.name === "q" ? 350 : 0;
    timerRef.current = setTimeout(() => formRef.current?.requestSubmit(), delay);
  }

  return <form ref={formRef} className="filters" onChange={(event) => submitSoon(event.target)}>{children}</form>;
}
