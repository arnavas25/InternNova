import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ProjectCard from '../components/ProjectCard';
import { PlusCircle, FolderGit2 } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured()) {
      fetchProjects();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '120px 20px 60px',
      backgroundColor: '#fafafa',
      backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
      backgroundSize: '20px 20px'
    }}>
      <div style={{ maxWidth: '950px', margin: '0 auto' }}>
        
        {/* Top Header Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '32px 36px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div>
            <span style={{ 
              fontSize: '0.75rem', 
              letterSpacing: '2px', 
              color: '#d97706', 
              fontWeight: '700', 
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '6px'
            }}>
              — SHOWCASE YOUR WORK
            </span>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: '800', 
              color: '#0f172a', 
              margin: '0 0 6px 0', 
              fontFamily: 'serif',
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px' 
            }}>
              Student <span style={{ color: '#8b5cf6' }}>Projects</span> Hub
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
              Discover real-world projects built by talented students in the community.
            </p>
          </div>

          <Link 
            to="/add-project" 
            style={{
              backgroundColor: '#0f172a',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '999px',
              fontWeight: '600',
              fontSize: '0.9rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
              transition: 'all 0.2s ease'
            }}
          >
            <PlusCircle size={18} /> Add Project
          </Link>
        </div>

        {/* Content Section */}
        {loading ? (
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.95rem', marginTop: '40px' }}>
            Loading projects...
          </p>
        ) : projects.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '50px 20px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
          }}>
            <FolderGit2 size={44} color="#94a3b8" style={{ marginBottom: '12px' }} />
            <h3 style={{ margin: '0 0 6px 0', color: '#0f172a', fontSize: '1.25rem', fontFamily: 'serif' }}>
              No Projects Found
            </h3>
            <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
              Be the first student to showcase your work to the community!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {projects.map((item) => (
              <ProjectCard key={item.id} project={item} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
