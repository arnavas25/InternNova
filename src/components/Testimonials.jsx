import { useEffect, useState, useRef } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  // Smooth Auto-scroll Logic (Pause on Hover/Touch)
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || testimonials.length === 0) return;

    let isHovered = false;
    
    const autoScroll = setInterval(() => {
      if (!isHovered) {
        // Agar end tak pahunch jaye toh wapas start par chala jaye
        if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 10) {
          slider.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          slider.scrollBy({ left: 320, behavior: 'smooth' });
        }
      }
    }, 3500); // Har 3.5 sec me aage badhega

    const handleMouseEnter = () => { isHovered = true; };
    const handleMouseLeave = () => { isHovered = false; };
    const handleTouchStart = () => { isHovered = true; };
    const handleTouchEnd = () => { isHovered = false; };

    slider.addEventListener('mouseenter', handleMouseEnter);
    slider.addEventListener('mouseleave', handleMouseLeave);
    slider.addEventListener('touchstart', handleTouchStart);
    slider.addEventListener('touchend', handleTouchEnd);

    return () => {
      clearInterval(autoScroll);
      slider.removeEventListener('mouseenter', handleMouseEnter);
      slider.removeEventListener('mouseleave', handleMouseLeave);
      slider.removeEventListener('touchstart', handleTouchStart);
      slider.removeEventListener('touchend', handleTouchEnd);
    };
  }, [testimonials]);

  const fetchTestimonials = async () => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (err) {
      console.error('Error fetching testimonials:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualNav = (direction) => {
    if (!sliderRef.current) return;
    const scrollAmount = direction === 'left' ? -340 : 340;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (loading || testimonials.length === 0) return null;

  return (
    <section className="section" id="testimonials" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <div className="container">
        
        {/* Header with Navigation Arrows for Laptop */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div className="section-head" style={{ marginBottom: 0 }}>
            <span className="eyebrow">STUDENT STORIES</span>
            <h2>What Our Interns Say</h2>
            <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
              Hear from students who transformed their technical skills and accelerated their careers with InternNova.
            </p>
          </div>

          {/* Desktop Navigation Buttons */}
          <div className="slider-nav-btns">
            <button onClick={() => handleManualNav('left')} aria-label="Previous">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => handleManualNav('right')} aria-label="Next">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Natural Interactive Horizontal Scroll */}
        <div className="testimonial-manual-slider" ref={sliderRef}>
          {testimonials.map((t) => {
            const imageUrl = t.avatar_url || t.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=0D8ABC&color=fff`;

            return (
              <div className="testimonial-card-native" key={t.id}>
                <Quote 
                  size={32} 
                  style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--border-strong)', zIndex: 0 }} 
                />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', color: '#f59e0b' }}>
                    {[...Array(t.rating || 5)].map((_, idx) => (
                      <Star key={idx} size={16} fill="#f59e0b" stroke="none" />
                    ))}
                  </div>

                  <p style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: 'var(--text-muted)',
                    marginBottom: '20px',
                    fontStyle: 'italic'
                  }}>
                    "{t.comment}"
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto', position: 'relative', zIndex: 1 }}>
                  <img
                    src={imageUrl}
                    alt={t.name}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=0D8ABC&color=fff`;
                    }}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--surface-3)',
                      border: '1px solid var(--border-strong)',
                      objectFit: 'cover'
                    }}
                  />
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text)', margin: 0 }}>
                      {t.name}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      {t.role} • <span style={{ color: 'var(--text-faint)' }}>{t.college}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
