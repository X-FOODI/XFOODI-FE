"use client";

import AboutUsSection from "./components/AboutUsSection";
import CaseStudiesSection from "./components/CaseStudiesSection";
import CTASection from "./components/CTASection";
import CustomerJourneySection from "./components/CustomerJourneySection";
import FaqSection from "./components/FaqSection";
import FeatureSection from "./components/FeatureSection";
import Footer from "./components/Footer";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import MultiTenantSection from "./components/MultiTenantSection";
import PageTransition from "./components/PageTransition";
import PricingSection from "./components/PricingSection";
import WorkflowSection from "./components/WorkflowSection";
import RestaurantsSection from "./components/RestaurantsSection";
import TestimonialsSection from "./components/TestimonialsSection";

export default function Home() {
  return (
    <PageTransition minimumLoadingTime={2000}>
      <div style={{ minHeight: "100vh" }}>
        <Header />
        <main>
          {/* 1. Hero Section (Includes Trusted By Partners bar) */}
          <section id="hero" style={{ scrollMarginTop: 120 }}>
            <HeroSection />
          </section>

          {/* 2. Customer Journey Pipeline */}
          <CustomerJourneySection />

          {/* 3. Core Features (Alternating Layout) */}
          <section id="product" style={{ scrollMarginTop: 120 }}>
            <FeatureSection />
          </section>

          {/* 4. Workflow Section */}
          <WorkflowSection />

          {/* 5. Multi-Tenant SaaS Architecture Visual */}
          <MultiTenantSection />

          {/* 6. Active Partner Restaurants Map & Grid */}
          <RestaurantsSection />

          {/* 7. Case Studies & Typical Customers Logo Wall */}
          <CaseStudiesSection />

          {/* 8. Customer Testimonials */}
          <section id="testimonials" style={{ scrollMarginTop: 120 }}>
            <TestimonialsSection />
          </section>

          {/* 9. Metrics & Growth Statistics */}
          <section id="about-us" style={{ scrollMarginTop: 120 }}>
            <AboutUsSection />
          </section>

          {/* 10. Pricing Preview */}
          <PricingSection />

          {/* 11. FAQ Accordion */}
          <FaqSection />

          {/* 12. Bottom CTA checklist */}
          <CTASection />
        </main>
        
        {/* Footer */}
        <footer id="footer" style={{ scrollMarginTop: 120 }}>
          <Footer />
        </footer>
      </div>
    </PageTransition>
  );
}
