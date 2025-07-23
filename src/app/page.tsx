import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-6xl font-serif mb-4">Sweet Potato Tattoo</h1>
        {/* Signup form */}
        <form className="w-full max-w-md mx-auto mb-8 flex gap-2" onSubmit={(e)=>e.preventDefault()}>
          <input
            type="email"
            placeholder="Enter your email"
            required
            className="flex-1 border rounded-lg p-2"
          />
          <button
            type="submit"
            className="bg-foreground text-background px-4 py-2 rounded-lg border"
          >
            Sign Up
          </button>
        </form>
        {/* Hero image */}
        <Image
          src="https://picsum.photos/seed/sweetpotato/1024/768"
          alt="Placeholder image"
          width={1024}
          height={768}
          className="rounded-lg"
          priority
        />
      </div>
    </main>
  );
}
