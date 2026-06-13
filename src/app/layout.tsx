import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MobileTabBar, Nav } from "@/components/nav";
import { IntroAnimation } from "@/components/intro-animation";
import { getAllUsers, getCurrentUser } from "@/lib/queries";
import { countIncomingOffers } from "@/lib/offers";

export const metadata: Metadata = {
  title: "CardSwap — card-for-card trading",
  description:
    "A pure card-for-card trading marketplace for Pokémon TCG and One Piece. No cash, just cards.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#090e1a",
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
  const navUsers = users.map((u) => ({
    id: u.id,
    displayName: u.displayName,
    trustTier: u.trustTier,
  }));

  return (
    <html lang="en" data-theme="vault">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('cs-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}",
          }}
        />
        {/* Cover the screen before first paint on the session's first load, so
            the intro animation doesn't flash the page underneath. The React
            IntroAnimation removes this when the logo flies off; a timeout is a
            safety net if JS never hydrates. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(sessionStorage.getItem('cs-intro')==='1')return;if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;var d=document.documentElement;d.classList.add('cs-intro-cover');setTimeout(function(){d.classList.remove('cs-intro-cover');},3500);}catch(e){}})();",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Hanken+Grotesk:wght@400;500;600;700;800&family=Newsreader:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <IntroAnimation />
        <div className="cs-app">
          <Nav users={navUsers} currentUserId={currentUser.id} incomingOffers={incomingOffers} />
          <main className="cs-main">{children}</main>
          <footer className="cs-foot">
            CardSwap · Pokémon TCG + One Piece · cards-for-cards only
          </footer>
          <MobileTabBar incomingOffers={incomingOffers} />
        </div>
      </body>
    </html>
  );
}
