import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';

export default function NotFound() {
  return (
    <div className="page-top" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container text-center">
        <Reveal>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <h1 style={{ fontSize: 'clamp(6rem, 15vw, 12rem)', lineHeight: 1, margin: 0, opacity: 0.05, fontWeight: 900 }}>404</h1>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="blob" style={{ width: 120, height: 120, filter: 'blur(40px)', opacity: 0.5 }}></div>
            </div>
          </div>
          <h2 style={{ fontSize: 'var(--step-3)', margin: '20px 0 16px' }}>Page Not Found</h2>
          <p className="text-muted" style={{ maxWidth: 400, margin: '0 auto 32px' }}>
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link to="/" className="btn btn-primary">Return Home</Link>
        </Reveal>
      </div>
    </div>
  );
}
