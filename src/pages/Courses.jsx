import PricingSection from '../components/home/PricingSection';

export default function Courses() {
  return (
    <div className="page-top" style={{ minHeight: '100vh' }}>
      <div className="container">
        <span className="eyebrow">Learn & Grow</span>
        <h1 style={{ fontSize: 'var(--step-5)', margin: '14px 0 20px' }}>Premium Courses</h1>
        <p className="text-muted" style={{ maxWidth: 800, marginBottom: 40, fontSize: '1.05rem', lineHeight: 1.7 }}>
          Take your skills to the next level with our rigorous training programs. 
          These intensive tracks are designed to prepare you for top-tier product companies.
        </p>
      </div>
      <PricingSection />
    </div>
  );
}
