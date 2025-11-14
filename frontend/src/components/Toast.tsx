"use client";

import { FaTimesCircle } from "react-icons/fa";

interface ToastProps {
  type: "error" | "success" | "warning";
  message: string;
  title?: string;
  onClose: () => void;
}

export default function Toast({ type, message, title, onClose }: ToastProps) {
  const colors = {
    error: {
      accent: "#FF6B6B",
      text: "#FF6B6B",
      bg: "bg-white",
    },
    success: {
      accent: "#00D26A",
      text: "#00D26A",
      bg: "bg-white",
    },
    warning: {
      accent: "#FFD93D",
      text: "#FFC700",
      bg: "bg-white",
    },
  };

  const currentColor = colors[type];

  return (
    <div className="fixed top-24 right-6 z-50 flex w-3/4 h-24 overflow-hidden bg-white shadow-lg max-w-96 rounded-xl animate-slide-in">
      <svg width="16" height="96" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path
          d="M 8 0 
                   Q 4 4.8, 8 9.6 
                   T 8 19.2 
                   Q 4 24, 8 28.8 
                   T 8 38.4 
                   Q 4 43.2, 8 48 
                   T 8 57.6 
                   Q 4 62.4, 8 67.2 
                   T 8 76.8 
                   Q 4 81.6, 8 86.4 
                   T 8 96 
                   L 0 96 
                   L 0 0 
                   Z"
          fill={currentColor.accent}
          stroke={currentColor.accent}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <div className="mx-2.5 overflow-hidden w-full">
        <p
          className="mt-1.5 text-xl font-bold leading-8 mr-3 overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ color: currentColor.text }}
        >
          {title || (type === "error" ? "Notice !" : type === "success" ? "Success !" : "Warning !")}
        </p>
        <p className="overflow-hidden leading-5 break-all text-[#8E8E8E] max-h-10">
          {message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="w-16 cursor-pointer focus:outline-none flex items-center justify-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke={currentColor.accent}
          fill="none"
          className="w-7 h-7"
        >
          <path
            d="M6 18L18 6M6 6l12 12"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

