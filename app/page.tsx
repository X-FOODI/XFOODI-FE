"use client";

import AboutUsSection from "./components/AboutUsSection";
import FeatureSection from "./components/FeatureSection";
import Footer from "./components/Footer";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import PageTransition from "./components/PageTransition";
import TestimonialsSection from "./components/TestimonialsSection";
import WorkflowSection from "./components/WorkflowSection";

export default function Home() {
  return (
    <PageTransition minimumLoadingTime={2000}>
      <div style={{ minHeight: "100vh" }}>
        <Header />
        <main>
          <section id="hero" style={{ scrollMarginTop: 120 }}>
            <HeroSection />
          </section>
          <section id="product" style={{ scrollMarginTop: 120 }}>
            <FeatureSection />
          </section>
          <section id="workflow" style={{ scrollMarginTop: 120 }}>
            <WorkflowSection />
          </section>
          <section id="about-us" style={{ scrollMarginTop: 120 }}>
            <AboutUsSection />
          </section>
          <section id="testimonials" style={{ scrollMarginTop: 120 }}>
            <TestimonialsSection />
          </section>
        </main>
        <footer id="footer" style={{ scrollMarginTop: 120 }}>
          <Footer />
        </footer>
      </div>
    </PageTransition>
  );
}
