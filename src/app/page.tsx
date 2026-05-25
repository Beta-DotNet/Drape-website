import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import Deals from "@/components/Deals";
import Trending from "@/components/Trending";

export default function Home() {
  return (
    <section id="view-home" className="view active">
      <HeroGeometric badge="Kokonut UI" title1="Elevate Your" title2="Digital Vision" />
      <Deals />
      <Trending />
    </section>
  );
}

