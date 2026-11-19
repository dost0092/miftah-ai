import { Header } from "@/components/Header";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Footer } from "@/components/Footer";
import { MiftahWidget } from "@/components/MiftahWidget";

/** Public marketing site: announcement bar, header and footer around every page. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <MiftahWidget />
    </>
  );
}
