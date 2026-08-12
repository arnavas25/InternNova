import LegalLayout from '../components/LegalLayout';

export default function RefundPolicy() {
  return (
    <LegalLayout title="Refund Policy" effectiveDate="09 July 2026">
      <h2>1. Paid Courses</h2>
      <p>
        For our premium paid courses, refunds are only issued if requested within
        3 days of successful enrollment, provided the student has not attended
        more than 1 live session or downloaded course materials. After this
        period, no refunds will be granted under any circumstances.
      </p>

      <h2>2. Processing Time</h2>
      <p>
        Approved refunds will be processed back to the original method of payment
        (bank account, UPI, card) within 5-7 business days.
      </p>

      <h2>3. Internship Registration</h2>
      <p>
        Any administrative fees associated with standard internship registrations
        are strictly non-refundable once the batch allocation has been completed.
      </p>

      <h2>4. Duplicate Payments</h2>
      <p>
        Duplicate payments caused by technical issues will be reviewed and
        refunded after verification by the InternNova team.
      </p>

      <h2>5. Contact for Refunds</h2>
      <p>
        To initiate a refund request, please email{' '}
        <strong>support@internnova.co.in</strong> with your payment ID,
        registered email, and enrollment details. Our team will respond within
        48 business hours.
      </p>
    </LegalLayout>
  );
}
