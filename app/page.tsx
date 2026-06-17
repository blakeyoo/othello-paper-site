import Hero from "@/components/Hero";
import Challenge from "@/components/Challenge";
import OthelloDemo from "@/components/OthelloDemo";
import Benchmark from "@/components/Benchmark";
import Environment from "@/components/Environment";
import Results from "@/components/Results";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      <Hero />
      <OthelloDemo />
      <Challenge />
      <Environment />
      <Benchmark />
      <Results />
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © 2026 Byunghwa Yoo, Sundong Kim, Kyung-Joong Kim · GIST Department of AI Convergence
      </footer>
    </main>
  );
}
