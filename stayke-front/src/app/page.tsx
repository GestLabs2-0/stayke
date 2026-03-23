//Own Components
import Footer from "../components/Footer";
import { HeroSection } from "../components/HeroSection";
import { LocaleSection } from "../components/LocaleSection/LocaleSection";
import StakingPage from "../components/StakeSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <LocaleSection />
      <StakingPage />
      <Footer />
    </>
  );
}
