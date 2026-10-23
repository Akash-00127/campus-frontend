"use client";

import { useEffect } from "react";

const lettersOnly = new Set(["name", "shopName", "city", "state"]);

export function AdminInputRules() {
  useEffect(() => {
    const enforce = (event: Event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement)) return;
      if (input.name === "phone") {
        input.value = input.value.replace(/\D/g, "").slice(0, 10);
      } else if (lettersOnly.has(input.name) && input.type === "text") {
        input.value = input.value.replace(/[0-9]/g, "");
      }
    };
    document.addEventListener("input", enforce, true);
    return () => document.removeEventListener("input", enforce, true);
  }, []);
  return null;
}
