import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-6xl font-serif mb-8">Sweet Potato Tattoo</h1>
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
