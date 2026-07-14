import { Logo } from "@/components/Logo";
import { DeckSkeleton } from "@/components/Skeletons";

export default function DiscoverLoading() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <Logo />
        <span className="overline-label">Discover</span>
      </header>
      <DeckSkeleton />
    </main>
  );
}
