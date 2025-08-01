"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setMsg("Thanks! You'll hear from us soon.");
        setEmail("");
      } else {
        const { error } = await res.json();
        setMsg(error || "Something went wrong.");
      }
    } catch (err: unknown) {
      setMsg((err as Error).message);
    }
  };

  return (
    <>
      <form
        className="w-full max-w-md mx-auto mb-8 flex gap-2"
        onSubmit={handleSubmit}
      >
        <input
          name="email"
          type="email"
          placeholder="Enter your email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 border rounded-lg p-2 text-[#414141] placeholder-gray-500"
        />
        <button
          type="submit"
          className="bg-[#7B894C] text-white px-4 py-2 rounded-lg border hover:bg-[#6A7A3F] transition-colors"
        >
          Newsletter Sign Up
        </button>
      </form>
      {msg && <p className="mb-4 text-sm text-[#414141]">{msg}</p>}
    </>
  );
} 