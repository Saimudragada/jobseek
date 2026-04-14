"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function Nav() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/browse" className="font-serif font-bold text-xl text-foreground">
          Jobseek
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/browse"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Browse
          </Link>
          <Link
            href="/resume"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Resume
          </Link>
          <Link
            href="/tracker"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Tracker
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        </nav>
      </div>
    </header>
  );
}
