import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import { getAllUsers, getCurrentUser } from "@/lib/queries";
import { countIncomingOffers } from "@/lib/offers";

export const metadata: Metadata = {
  title: "CardSwap — card-for-card trading",
  description:
    "A pure card-for-card trading marketplace for Pokémon TCG and One Piece. No cash, just cards.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0b1020",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [users, currentUser] = await Promise.all([
    getAllUsers(),
    getCurrentUser(),
  ]);
  const incomingOffers = await countIncomingOffers(currentUser.id);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Nav
          users={users.map((u) => ({
            id: u.id,
            displayName: u.displayName,
            trustTier: u.trustTier,
          }))}
          currentUserId={currentUser.id}
          incomingOffers={incomingOffers}
        />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-border text-muted text-xs text-center py-4">
          CardSwap · MVP · Pokémon TCG + One Piece · cards-for-cards only
        </footer>
      </body>
    </html>
  );
}
