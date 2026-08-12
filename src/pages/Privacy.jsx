import LegalLayout from '../components/LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" effectiveDate="05 June 2026">
      <h2>1. Introduction</h2>
      <p>Welcome to Internnova. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website and enroll in our 4-6 week internships.</p>

      <h2>2. Information We Collect</h2>
      <p>When you register for our training programs or internships, we may collect the following information:</p>
      <ul>
        <li><strong>Personal &amp; Demographic Information:</strong> Full Name, Email Address, Mobile Number, and Gender.</li>
        <li><strong>Educational &amp; Professional Details:</strong> College Name, Branch, Current Year, domain of interest, prior experience, and any information provided within your uploaded Resume/CV.</li>
        <li><strong>Usage Data:</strong> IP address, browser type, and interaction with our website to improve user experience.</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>The data we collect is solely used to:</p>
      <ul>
        <li>Register you for the 4-6 week internship.</li>
        <li>Communicate program updates, assignments, and announcements.</li>
        <li>Generate and verify your Skill Certificate upon successful completion of the training.</li>
        <li>Provide student support and respond to your queries.</li>
      </ul>

      <h2>4. Data Sharing and Security</h2>
      <p>We <strong>do not</strong> sell, rent, or trade your personal information to third parties. Your data is stored securely. We only share data with trusted third-party service providers (like email delivery systems) strictly for operating our platform.</p>

      <h2>5. Cookies</h2>
      <p>Our website may use basic cookies to enhance your browsing experience. You can choose to disable cookies through your browser settings.</p>

      <h2>6. Your Rights</h2>
      <p>You have the right to request access to the personal data we hold about you and ask for it to be corrected or deleted.</p>

      <h2>7. Contact Us</h2>
      <p>If you have any questions regarding this Privacy Policy, please contact us at:</p>
      <div className="legal-contact-box">
        <p><strong>Email:</strong> info@internnova.co.in</p>
        <p><strong>Business & Collaboration:</strong> info@internnova.co.in</p>
      </div>
    </LegalLayout>
  );
}
