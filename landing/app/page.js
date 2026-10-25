import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Menu from "@/components/Menu";
import WhyNexvyro from "@/components/WhyNexvyro";
import HowItWorks from "@/components/HowItWorks";
import Supplements from "@/components/Supplements";
import Team from "@/components/Team";
import Location from "@/components/Location";
import Footer from "@/components/Footer";
import StickyCallBar from "@/components/StickyCallBar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <Menu />
        <WhyNexvyro />
        <HowItWorks />
        <Supplements />
        <Team />
        <Location />
      </main>
      <Footer />
      <StickyCallBar />
    </>
  );
}
