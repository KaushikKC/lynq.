"use client";

import { useEffect } from "react";

export default function FontLoader() {
  useEffect(() => {
    // Check if font is already loaded to avoid duplicates
    if (document.querySelector('link[href*="Stack+Sans+Notch"]')) {
      return;
    }

    // Preconnect to Google Fonts for faster loading
    const preconnect1 = document.createElement("link");
    preconnect1.rel = "preconnect";
    preconnect1.href = "https://fonts.googleapis.com";
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement("link");
    preconnect2.rel = "preconnect";
    preconnect2.href = "https://fonts.gstatic.com";
    preconnect2.crossOrigin = "anonymous";
    document.head.appendChild(preconnect2);

    // Load Stack Sans Notch font
    const fontLink = document.createElement("link");
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Stack+Sans+Notch:wght@200..700&display=swap";
    fontLink.rel = "stylesheet";
    fontLink.media = "print";
    fontLink.onload = function () {
      // Switch to screen media after load to prevent FOUT
      (this as HTMLLinkElement).media = "all";
    };
    document.head.appendChild(fontLink);
  }, []);

  return null;
}
