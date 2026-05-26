import PromoCarousel from "@/components/PromoCarousel";
import Deals from "@/components/Deals";
import Trending from "@/components/Trending";

export default function Home() {
  return (
    <section id="view-home" className="view active">
      <PromoCarousel />
      <Deals />
      <Trending />
    </section>
  );
}

