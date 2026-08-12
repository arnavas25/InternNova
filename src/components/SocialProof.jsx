import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Google Apps Script API URL
const GAS_API = "https://script.google.com/macros/s/AKfycbz3qH5RsNH10HJRTjSPTQM4YqkU4BDTIJEiYQeN1KQg4iLmlNX49GOKV2dIwwsXGG6Kjw/exec";

export default function SocialProof() {
  const location = useLocation();
  const [toastData, setToastData] = useState([]);
  const [current, setCurrent] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    async function fetchAllSocialData() {
      let combinedToasts = [];

      // 1. Fetch Latest Batch from Supabase
      try {
        const { data: batchData } = await supabase
          .from('batches')
          .select('*')
          .order('id', { ascending: false })
          .limit(1);

        if (batchData && batchData.length > 0) {
          const b = batchData[0];
          
          const rawDate = b.start_date || b.batch_date || b.date || b.start_time || b.created_at;
          
          let formattedDate = 'soon';
          if (rawDate) {
            try {
              const d = new Date(rawDate);
              if (!isNaN(d.getTime())) {
                formattedDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
              } else {
                formattedDate = rawDate;
              }
            } catch (e) {
              formattedDate = rawDate;
            }
          }

          const batchTitle = b.title || b.course_name || b.name || b.batch_name || 'Next Cohort';

          // Fixed Text Logic (Sahi text status ke hisaab se)
          combinedToasts.push({
            icon: "⚡",
            title: `${batchTitle}`,
            desc: `Upcoming Cohort • Starts on ${formattedDate}. Limited seats!`,
            badge: "Upcoming"
          });
        }
      } catch (err) {
        console.error("Batch fetch error:", err);
      }

      // 2. REAL Testimonials Data (Live Rating & Reviews Count)
      try {
        const { data: reviewsData } = await supabase
          .from('testimonials')
          .select('*')
          .order('id', { ascending: false });

        if (reviewsData && reviewsData.length > 0) {
          const totalRating = reviewsData.reduce((acc, curr) => acc + Number(curr.rating || 5), 0);
          const avgRating = (totalRating / reviewsData.length).toFixed(1);
          const totalCount = reviewsData.length;

          // Toast A: Live Avg Rating
          combinedToasts.push({
            icon: "⭐",
            title: `${avgRating} / 5 Rating`,
            desc: `Based on ${totalCount}+ verified student reviews!`,
            badge: "Reviews"
          });

          // Toast B: Recent Student Feedback
          const latestReview = reviewsData[0];
          const studentName = latestReview.name || latestReview.student_name || 'Verified Intern';
          const role = latestReview.role || latestReview.domain || 'Intern';

          combinedToasts.push({
            icon: "💬",
            title: `${studentName} (${role})`,
            desc: `"${latestReview.content || latestReview.feedback || 'Great learning experience!'}"`,
            badge: "Feedback"
          });
        }
      } catch (revErr) {
        console.error("Testimonials fetch error:", revErr);
      }

      // 3. Fetch Top Ambassador from Google Apps Script (Exact Original Logic)
      try {
        const res = await fetch(`${GAS_API}?action=top`);
        const ambData = await res.json();

        // Safe extraction whether array or object
        const topAmb = Array.isArray(ambData) ? ambData[0] : (ambData?.data ? ambData.data[0] : ambData);

        if (topAmb && (topAmb.name || topAmb.Name)) {
          const name = topAmb.name || topAmb.Name || 'Ambassador';
          const college = (topAmb.college || topAmb.College) ? ` (${topAmb.college || topAmb.College})` : '';
          
          // Purane code se exact `impact` key ka extract logic
          const impact = topAmb.impact || topAmb.applications || topAmb.apps || topAmb.referrals || 'great performance';

          combinedToasts.push({
            icon: "🌟",
            title: "Top Campus Ambassador",
            desc: `${name}${college} generated ${impact}!`,
            badge: "Top Rank"
          });
        }
      } catch (ambErr) {
        console.error("Ambassador fetch error:", ambErr);
      }

      // 4. REAL Certified Interns Count (Hall of fame)
      try {
        const { count } = await supabase
          .from('hall_of_fame')
          .select('*', { count: 'exact', head: true });

        if (count && count > 0) {
          combinedToasts.push({
            icon: "🎓",
            title: "Verified Graduates",
            desc: `${count}+ students issued verified certificates.`,
            badge: "Official"
          });
        } else {
          combinedToasts.push({
            icon: "🛡️",
            title: "Verified Credentials",
            desc: "All issued certificates can be verified live on portal.",
            badge: "Official"
          });
        }
      } catch (fameErr) {
        console.error("Hall of fame fetch error:", fameErr);
      }

      setToastData(combinedToasts);
    }

    if (location.pathname === '/') {
      fetchAllSocialData();
    }
  }, [location.pathname]);

  // Toast Display Cycle (6.5s Display, 15s Gap)
  useEffect(() => {
    if (toastData.length === 0 || location.pathname !== '/') return;

    let index = 0;
    const triggerToast = () => {
      setCurrent(toastData[index]);
      setShow(true);

      // Card 6.5 seconds tak screen par rukega
      setTimeout(() => {
        setShow(false);
      }, 6500);

      index = (index + 1) % toastData.length;
    };

    const timer = setTimeout(() => {
      triggerToast();
      const interval = setInterval(triggerToast, 15000);
      return () => clearInterval(interval);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toastData, location.pathname]);

  if (location.pathname !== '/' || !current) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: 998,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '16px',
      boxShadow: '0 16px 36px -8px rgba(0, 0, 0, 0.35), 0 0 12px rgba(99, 102, 241, 0.15)',
      transform: show ? 'translateY(0) scale(1)' : 'translateY(80px) scale(0.95)',
      opacity: show ? 1 : 0,
      transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      maxWidth: '330px',
      pointerEvents: 'none',
      color: '#fff'
    }}>
      <div style={{
        fontSize: '1.2rem',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(225,29,72,0.25) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {current.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
          <p style={{ margin: 0, fontSize: '0.84rem', fontWeight: '700', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {current.title}
          </p>
          {current.badge && (
            <span style={{
              fontSize: '0.6rem',
              padding: '1px 6px',
              borderRadius: '6px',
              background: 'rgba(99, 102, 241, 0.25)',
              color: '#818cf8',
              border: '1px solid rgba(129, 140, 248, 0.3)',
              fontWeight: '600',
              textTransform: 'uppercase',
              flexShrink: 0
            }}>
              {current.badge}
            </span>
          )}
        </div>
        <p style={{ 
          margin: 0, 
          fontSize: '0.76rem', 
          color: '#94a3b8', 
          lineHeight: '1.35',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {current.desc}
        </p>
      </div>
    </div>
  );
}
