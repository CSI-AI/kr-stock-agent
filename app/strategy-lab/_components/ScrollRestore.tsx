"use client";

import { useEffect } from "react";

export function ScrollRestore() {
  useEffect(() => {
    const saved = sessionStorage.getItem("wababa_scroll_y");

    if (!saved) {
      return;
    }

    const y = Number(saved);

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: Number.isFinite(y) ? y : 0,
        behavior: "auto",
      });

      sessionStorage.removeItem("wababa_scroll_y");
    });
  }, []);

  return null;
}
