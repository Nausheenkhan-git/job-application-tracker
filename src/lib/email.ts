import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendFollowUpEmail(to: string, name: string, company: string, position: string, reminderDate: Date) {
  try {
    const formattedDate = new Date(reminderDate).toLocaleDateString();
    
    const { data, error } = await resend.emails.send({
      from: 'Job Tracker <onboarding@resend.dev>', // Note: For production, verify your domain
      to: [to],
      subject: `Follow-up Reminder: ${company} - ${position}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Job Tracker Reminder</h1>
            </div>
            <div class="content">
              <p>Hello ${name},</p>
              <p>This is a reminder to follow up on your application at <strong>${company}</strong> for the <strong>${position}</strong> position.</p>
              <p>You set this reminder for <strong>${formattedDate}</strong>.</p>
              <p>Suggested follow-up actions:</p>
              <ul>
                <li>Send a polite email checking on your application status</li>
                <li>Connect with the recruiter on LinkedIn</li>
                <li>Prepare for potential next interview rounds</li>
                <li>Research the company further</li>
              </ul>
              <a href="http://localhost:3000/dashboard" class="button">View My Applications</a>
            </div>
            <div class="footer">
              <p>This is an automated reminder from your Job Application Tracker.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Email error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}