import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, MessageSquare, Share2, ExternalLink, Code2, Send, User, GraduationCap, Lock, Mail } from 'lucide-react';

export default function ProjectCard({ project }) {
  const [likes, setLikes] = useState(project?.likes_count || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [loadingComment, setLoadingComment] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    if (project?.id) {
      fetchComments();
    }
  }, [project?.id]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('project_comments')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(data);
    }
  };

  const handleLike = async () => {
    if (hasLiked) return;

    const newLikeCount = likes + 1;
    setLikes(newLikeCount);
    setHasLiked(true);

    await supabase
      .from('projects')
      .update({ likes_count: newLikeCount })
      .eq('id', project.id);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoadingComment(true);
    setErrorMsg('');

    const authorName = userName.trim() ? userName.trim() : 'Anonymous Student';

    const { data, error } = await supabase
      .from('project_comments')
      .insert([
        {
          project_id: project.id,
          comment_text: newComment.trim(),
          user_name: authorName
        }
      ])
      .select();

    if (error) {
      console.error('Comment Error Details:', error);
      setErrorMsg(error.message || 'Failed to post comment. Please try again.');
    } else if (data && data.length > 0) {
      setComments([...comments, data[0]]);
      setNewComment('');
    }
    setLoadingComment(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: project.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Project link copied to clipboard!');
    }
  };

  const handleRequestAccess = () => {
    alert('Contact request sent to Admin! We will connect you with the author shortly.');
    setShowRequestModal(false);
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '24px',
      padding: '28px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
      marginBottom: '20px',
      position: 'relative'
    }}>
      {/* Banner / Image */}
      {project.image_url && (
        <img 
          src={project.image_url} 
          alt={project.title} 
          style={{
            width: '100%',
            maxHeight: '350px',
            objectFit: 'cover',
            borderRadius: '16px',
            marginBottom: '20px'
          }}
        />
      )}

      {/* Author & College Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {project.student_name && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: '700', color: '#8b5cf6', backgroundColor: '#f5f3ff', padding: '4px 12px', borderRadius: '999px' }}>
            <User size={13} /> {project.student_name}
          </span>
        )}
        {project.college_name && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: '600', color: '#64748b' }}>
            <GraduationCap size={14} /> {project.college_name}
          </span>
        )}
      </div>

      {/* Title & Description */}
      <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0', fontFamily: 'serif' }}>
        {project.title}
      </h2>
      <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', margin: '0 0 16px 0' }}>
        {project.description}
      </p>

      {/* Private Contact Request Box */}
      <div style={{
        backgroundColor: '#f8fafc',
        padding: '12px 16px',
        borderRadius: '12px',
        marginBottom: '16px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#475569', fontWeight: '500' }}>
          <Lock size={15} color="#d97706" /> Contact details are protected by Admin.
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            border: 'none',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Mail size={13} /> Request Author Contact
        </button>
      </div>

      {/* Tech Stack Pills */}
      {project.tech_stack && project.tech_stack.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {project.tech_stack.map((tech, index) => (
            <span key={index} style={{
              backgroundColor: '#f1f5f9',
              color: '#475569',
              fontSize: '0.8rem',
              fontWeight: '600',
              padding: '4px 12px',
              borderRadius: '999px',
              border: '1px solid #e2e8f0'
            }}>
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingTop: '16px',
        borderTop: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {project.repo_link && (
            <a href={project.repo_link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0f172a', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem' }}>
              <Code2 size={16} /> Repository
            </a>
          )}
          {project.live_link && (
            <a href={project.live_link} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#8b5cf6', textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem' }}>
              <ExternalLink size={16} /> Live Demo
            </a>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={handleLike}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              border: '1px solid #e2e8f0',
              backgroundColor: hasLiked ? '#fef2f2' : '#ffffff',
              color: hasLiked ? '#ef4444' : '#475569',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem'
            }}
          >
            <Heart size={16} fill={hasLiked ? '#ef4444' : 'none'} /> {likes} Likes
          </button>

          <button 
            onClick={() => setShowComments(!showComments)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#475569',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem'
            }}
          >
            <MessageSquare size={16} /> {comments.length} Comments
          </button>

          <button 
            onClick={handleShare}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '999px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#475569',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem'
            }}
          >
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#0f172a', fontFamily: 'serif' }}>
            Comments ({comments.length})
          </h4>

          <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="Your Name (Optional)" 
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                outline: 'none',
                fontSize: '0.85rem'
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Write a comment..." 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '999px',
                  border: '1px solid #cbd5e1',
                  outline: 'none',
                  fontSize: '0.9rem'
                }}
              />
              <button 
                type="submit" 
                disabled={loadingComment}
                style={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  padding: '10px 18px',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: loadingComment ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                <Send size={14} /> {loadingComment ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>

          {errorMsg && (
            <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '12px', border: '1px solid #fecaca' }}>
              {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {comments.map((item) => (
              <div key={item.id} style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', display: 'block' }}>
                  {item.user_name || 'Anonymous Student'}
                </span>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.9rem', color: '#1e293b' }}>
                  {item.comment_text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal / Popup for Request */}
      {showRequestModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '24px',
            borderRadius: '20px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#0f172a' }}>Request Author Details</h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              To get in touch with {project.student_name || 'the author'}, send a request to the platform admin.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowRequestModal(false)}
                style={{ padding: '8px 16px', borderRadius: '999px', border: '1px solid #cbd5e1', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleRequestAccess}
                style={{ padding: '8px 16px', borderRadius: '999px', border: 'none', backgroundColor: '#8b5cf6', color: '#fff', cursor: 'pointer', fontWeight: '600' }}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
