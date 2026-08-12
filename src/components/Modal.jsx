import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './modal.css';

export default function Modal({ open, onClose, children, wide = false, overflowVisible = false }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal-content card ${wide ? 'modal-wide' : ''} ${overflowVisible ? 'modal-overflow-visible' : ''}`}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        {children}
      </div>
    </div>,
    document.body
  );
}
