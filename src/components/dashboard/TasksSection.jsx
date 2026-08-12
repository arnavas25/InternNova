import { useState } from 'react';
import { ListChecks, Calendar, CheckCircle2, Upload, ChevronDown, ChevronUp, RotateCw } from 'lucide-react';
import Modal from '../Modal';

const Linkify = ({ text }) => {
  if (!text) return 'No description provided.';
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    part.match(urlRegex) ? (
      <a key={i} href={part} target="_blank" rel="noreferrer" style={{color: 'var(--accent)', textDecoration: 'underline'}}>{part}</a>
    ) : part
  );
};

/* Collapsible description with Read More */
function TaskDescription({ text, title }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <p className="text-muted">No description provided.</p>;

  // Strip first line if it duplicates the task title (common in admin-entered data)
  let cleaned = text.trim();
  const firstNewline = cleaned.indexOf('\n');
  if (firstNewline !== -1) {
    const firstLine = cleaned.slice(0, firstNewline).trim();
    if (firstLine.toLowerCase() === (title || '').toLowerCase()) {
      cleaned = cleaned.slice(firstNewline + 1).trim();
    }
  }

  const lines = cleaned.split('\n').filter(l => l.trim() !== '');
  const isLong = lines.length > 4 || cleaned.length > 300;
  const preview = lines.slice(0, 3).join('\n');

  return (
    <div style={{ marginBottom: 12 }}>
      <p className="text-muted" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
        <Linkify text={expanded ? cleaned : (isLong ? preview + '…' : cleaned)} />
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--accent)', fontSize: '0.8rem', padding: 0,
            display: 'inline-flex', alignItems: 'center', gap: 4,
            marginTop: 4,
          }}
        >
          {expanded ? <><ChevronUp size={13} /> Show less</> : <><ChevronDown size={13} /> Read more</>}
        </button>
      )}
    </div>
  );
}

export default function TasksSection({ tasks, onToggle, onSubmit, onDeleteSubmission }) {
  const [week, setWeek] = useState(1);
  const [modalTask, setModalTask] = useState(null);
  const [link, setLink] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [fileUrl, setFileUrl] = useState('');

  const weekTasks = tasks.filter((t) => t.week_number === week);

  const openModal = (task) => { setModalTask(task); setLink(''); };

  const submit = (e) => {
    e.preventDefault();
    if (!link.trim() && !fileUrl.trim()) {
      alert('Please provide at least one link to submit.');
      return;
    }
    if (link.trim() && !link.includes('github.com')) {
      alert('Please provide a valid GitHub URL for your code repository.');
      return;
    }

    if (fileUrl.trim() && !fileUrl.includes('drive.google.com')) {
      alert('Please provide a valid Google Drive URL for your document/file.');
      return;
    }
    
    let submissionString = '';
    if (link.trim()) submissionString += `Repo/Project: ${link.trim()}`;
    if (fileUrl.trim()) submissionString += (submissionString ? '\n' : '') + `File: ${fileUrl.trim()}`;

    onSubmit(modalTask.id, submissionString);
    setModalTask(null);
  };

  return (
    <section id="tasks-section" className="tasks-card" style={{ width: '100%', boxSizing: 'border-box' }}>
      <div className="card" style={{ padding: 'clamp(16px, 3vw, 28px)' }}>
        <div className="card-header">
          <h3><ListChecks size={17} color="var(--accent)" /> Weekly Internship Tasks</h3>
          <span className="badge badge-neutral">Week 1-6 Roadmaps</span>
        </div>
        <div className="tasks-tabs">
          {[1, 2, 3, 4, 5, 6].map((w) => (
            <button key={w} className={`tasks-tab-btn ${week === w ? 'is-active' : ''}`} onClick={() => setWeek(w)}>Week {w}</button>
          ))}
        </div>
        <div className="tasks-list">
          {weekTasks.length === 0 ? (
            <p className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>No tasks assigned for Week {week}.</p>
          ) : weekTasks.map((task) => {
            const dueDateStr = task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'No deadline';
            const hasSubmitted = task.is_completed;
            const isMissing = !hasSubmitted && task.due_date && new Date(task.due_date).setHours(23, 59, 59, 999) < new Date();
            const isLate = hasSubmitted && task.submission_date && task.due_date && new Date(task.submission_date) > new Date(task.due_date).setHours(23, 59, 59, 999);
            
            let statusPill = null;
            if (isMissing) { statusPill = <span className="status-pill status-missing" style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 6px' }}>Missing</span>; }
            else if (hasSubmitted) {
              if (isLate) { statusPill = <span className="status-pill status-missing" style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 6px' }}>Late Submission</span>; }
              else { statusPill = <span className="status-pill status-active" style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 6px' }}>On Time</span>; }
            }
            
            return (
              <div className={`task-item ${task.is_completed ? 'is-completed' : ''} ${isMissing ? 'is-missing' : ''}`} key={task.id}>
                <label className="task-checkbox-wrap">
                  <input 
                    type="checkbox" 
                    checked={task.is_completed} 
                    onChange={(e) => {
                      if (e.target.checked && !task.submission_link) {
                        alert('Please submit your project using the "Submit Project" button first to mark this task as done!');
                        return;
                      }
                      onToggle(task.id, e.target.checked);
                    }} 
                  />
                  <span className="task-checkbox-visual"><CheckCircle2 size={16} /></span>
                </label>
                <div className="task-details">
                  <h4>
                    {task.task_title}
                    {statusPill}
                  </h4>
                  <TaskDescription text={task.task_description} title={task.task_title} />
                  
                  {hasSubmitted && (
                    <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: '8px', marginBottom: '12px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: task.marks_obtained !== null && task.marks_obtained !== undefined ? '8px' : '0' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>Mentor Evaluation</span>
                        {task.marks_obtained !== null && task.marks_obtained !== undefined ? (
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                            Marks: {task.marks_obtained} / {task.marks || 100}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Evaluation Pending</span>
                        )}
                      </div>
                      {task.marks_obtained !== null && task.marks_obtained !== undefined && task.feedback && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-wrap', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                          <strong>Feedback:</strong> {task.feedback}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="task-meta">
                    <span className={`task-due ${isMissing ? 'text-danger' : ''}`}><Calendar size={13} /> Due: {dueDateStr}</span>
                    {task.submission_link ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <a href={task.submission_link} target="_blank" rel="noreferrer" className="submit-link-btn is-submitted">
                          <CheckCircle2 size={13} /> Submitted
                        </a>
                        <button
                          className="submit-link-btn resubmit-btn"
                          onClick={() => {
                            setDeleteConfirmId(task.id);
                          }}
                        >
                          <RotateCw size={12} /> Resubmit
                        </button>
                      </div>
                    ) : (
                      <button className="submit-link-btn" onClick={() => openModal(task)}><Upload size={13} /> Submit Project</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={!!modalTask} onClose={() => { setModalTask(null); setLink(''); setFileUrl(''); }}>
        {modalTask && (
          <>
            <h2>Submit: {modalTask.task_title}</h2>
            <p className="text-muted" style={{ margin: '8px 0 20px', whiteSpace: 'pre-wrap', maxHeight: 150, overflowY: 'auto' }}>{modalTask.task_description}</p>
            <form onSubmit={submit}>
              <div className="field">
                <label>Project / Code Repository URL (Optional)</label>
                <input type="url" placeholder="https://github.com/..." value={link} onChange={(e) => setLink(e.target.value)} />
              </div>
              <div className="field">
                <label>File / Document URL (Optional)</label>
                <input type="url" placeholder="https://drive.google.com/..." value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
              </div>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: 16 }}>Provide at least one link to submit.</p>
              <button type="submit" className="btn btn-primary btn-block">Save Submission</button>
            </form>
          </>
        )}
      </Modal>

      <Modal open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <h2>Delete Submission</h2>
        <p style={{ margin: '16px 0 24px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Are you sure you want to delete your current submission? You can submit a new one afterwards.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn outline" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
          <button className="btn primary" style={{ background: 'var(--err-500)', borderColor: 'var(--err-500)' }} onClick={() => { onDeleteSubmission(deleteConfirmId); setDeleteConfirmId(null); }}>Delete</button>
        </div>
      </Modal>
    </section>
  );
}
