import { IntelligenceSection } from "@/components/site/intelligence/intelligence-section";

// TEMPORARY layout-QA route — renders the Intelligence Layer section in
// isolation so it fits a headless viewport. DELETE BEFORE SHIPPING.
export default function QaIntelligencePage() {
  return (
    <main className="min-h-screen bg-background pb-10">
      <IntelligenceSection />
    </main>
  );
}