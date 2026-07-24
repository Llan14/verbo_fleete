"use client";

import Image from "next/image";
import { ButtonHTMLAttributes } from "react";

type BrandCtaButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  showDecorativeIcon?: boolean;
};

export default function BrandCtaButton({
  label,
  showDecorativeIcon = false,
  className,
  ...props
}: BrandCtaButtonProps) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl border border-brand-sky",
        "bg-brand-sky px-6 py-3 text-sm font-black text-white shadow-md transition",
        "hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky/50",
        "disabled:cursor-not-allowed disabled:opacity-60",
        "font-brand-heading",
        className ?? "",
      ].join(" ")}
    >
      <span>{label}</span>
      {showDecorativeIcon && (
        <Image
          src="/empezar.png"
          alt=""
          width={16}
          height={16}
          aria-hidden
          className="h-4 w-4"
        />
      )}
    </button>
  );
}
