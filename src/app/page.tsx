import Hero from "@/components/Hero";
import Deals from "@/components/Deals";
import Trending from "@/components/Trending";

export default function Home() {
  return (
    <section id="view-home" className="view active">
      <Hero />
      <Deals />
      <Trending />
    </section>
  );
}
