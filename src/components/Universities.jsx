import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Agar aapka path alag hai to adjust kar lein

export default function Universities() {
  const [universities, setUniversities] = useState([]);

  useEffect(() => {
    async function fetchUniversities() {
      try {
        const { data, error } = await supabase
          .from('universities')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && data) {
          setUniversities(data);
        }
      } catch (err) {
        console.error('Error fetching universities:', err);
      }
    }
    fetchUniversities();
  }, []);

  // Image fail hone par UI-Avatars ka clean fallback logo set karega
  const handleImageError = (e, name) => {
    e.currentTarget.onerror = null; // Infinite loop prevention
    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=8b5cf6&color=fff&bold=true`;
  };

  if (universities.length === 0) return null;

  // Infinite Scroll ke liye array duplicate kiya hai
  const displayList = [...universities, ...universities];

  return (
    <section className="colleges-section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Global Community</span>
          <h2>Trusted by Students From 100+ Universities</h2>
          <p>From premier Indian institutes to top global universities, students choose InternNova.</p>
        </div>
      </div>

      <div className="university-marquee">
        <div className="university-track">
          {displayList.map((uni, idx) => (
            <div className="uni-card" key={`${uni.id}-${idx}`}>
              {/* Flag Emoji directly from database */}
              {uni.flag_emoji && <span className="flag">{uni.flag_emoji}</span>}

              {/* Logo with Automatic Broken Image Fallback */}
              <img 
                src={uni.logo_url} 
                alt={uni.name} 
                className="uni-logo-img"
                onError={(e) => handleImageError(e, uni.name)}
              />

              <span className="uni-name">{uni.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
