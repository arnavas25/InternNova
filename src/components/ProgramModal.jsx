import { ShieldCheck, Calendar } from 'lucide-react';
import Modal from './Modal';
import { APPLY_FORM_URL } from '../lib/programs';

export default function ProgramModal({ program, onClose }) {
  return (
    <Modal open={!!program} onClose={onClose}>
      {program && (
        <>
          <div className="modal-hero">
            <span className="program-code">DOMAIN—{program.code}</span>
            <h2>{program.title}</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
              <span className="badge badge-open"><ShieldCheck size={13} /> CERTIFICATE INCLUDED</span>
            </div>
          </div>
          
          <h3 className="modal-subhead">Course Overview</h3>
          <p className="text-muted">{program.summary}</p>
          
          <div style={{ marginTop: 32 }}>
            <button onClick={() => { onClose(); window.location.href = '/apply'; }} className="btn btn-primary btn-block">Apply Now</button>
          </div>
        </>
      )}
    </Modal>
  );
}
