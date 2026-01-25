'use client';

import Link from "next/link";
import { useState } from "react";

export default function Footer() {
  const EMAIL_ADDRESS = 'SweetPotatoTattoo@gmail.com';
  const [emailCopied, setEmailCopied] = useState(false);

  return (
    <footer className="pt-4 pb-8">
      <div className="container mx-auto flex flex-col items-center gap-4">
        <ul className="flex gap-8">
          <li>
            <Link
              href="https://www.instagram.com/sweetpotatotat"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70 transition-opacity"
              aria-label="Instagram"
            >
              <svg
                width="44"
                height="44"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#414141]"
              >
                <rect
                  x="2"
                  y="2"
                  width="20"
                  height="20"
                  rx="5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle
                  cx="17"
                  cy="7"
                  r="1"
                  fill="currentColor"
                />
              </svg>
            </Link>
          </li>
        </ul>
        <div className="mb-6">
          <button
            type="button"
            className={`hover:underline text-[#414141] transition-colors ${
              emailCopied ? 'text-emerald-700' : ''
            }`}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(EMAIL_ADDRESS);
              } catch {
                const textarea = document.createElement('textarea');
                textarea.value = EMAIL_ADDRESS;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
              }
              setEmailCopied(true);
              window.setTimeout(() => setEmailCopied(false), 1800);
            }}
            title="Copy email address"
          >
            {emailCopied ? 'Email copied!' : EMAIL_ADDRESS}
          </button>
        </div>
      </div>
    </footer>
  );
} 