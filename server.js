import express from 'express';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const messages = [];

app.use(express.json({ limit: '1mb' }));
app.use(express.static('.', { index: ['index.html'] }));

export function validateContactPayload(payload = {}) {
  const errors = [];
  const clean = {
    name: typeof payload.name === 'string' ? payload.name.trim() : '',
    email: typeof payload.email === 'string' ? payload.email.trim() : '',
    subject: typeof payload.subject === 'string' ? payload.subject.trim() : '',
    message: typeof payload.message === 'string' ? payload.message.trim() : ''
  };

  if (!clean.name) errors.push('Name is required.');
  if (!clean.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) {
    errors.push('A valid email address is required.');
  }
  if (!clean.subject) errors.push('Subject is required.');
  if (!clean.message || clean.message.length < 10) {
    errors.push('Message must be at least 10 characters long.');
  }

  return { valid: errors.length === 0, errors, data: clean };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Portfolio backend is running.' });
});

app.post('/api/contact', (req, res) => {
  const { valid, errors, data } = validateContactPayload(req.body);

  if (!valid) {
    return res.status(400).json({
      ok: false,
      message: 'Please complete all fields correctly before sending your message.',
      errors
    });
  }

  const entry = {
    ...data,
    createdAt: new Date().toISOString()
  };
  messages.push(entry);

  const smtpPass = process.env.SMTP_PASS || 'yorbshuxpwqdodit';
  const hasRealSmtpConfig = Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    smtpPass &&
    !smtpPass.toLowerCase().includes('your-') &&
    !smtpPass.toLowerCase().includes('replace')
  );

  if (hasRealSmtpConfig) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: smtpPass
      }
    });

    transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.RECEIVER_EMAIL || process.env.SMTP_USER,
      subject: `[KhobbyTech Portfolio] ${data.subject}`,
      text: `Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`,
      html: `<p><strong>Name:</strong> ${data.name}</p><p><strong>Email:</strong> ${data.email}</p><p><strong>Subject:</strong> ${data.subject}</p><p><strong>Message:</strong></p><p>${data.message.replace(/\n/g, '<br>')}</p>`
    }).catch((error) => {
      console.error('Email send failed:', error.message);
    });
  } else {
    console.log('SMTP not configured. Message saved locally only.');
  }

  console.log('New portfolio message received:', entry);

  return res.status(200).json({
    ok: true,
    message: 'Thanks for getting in touch. Your message has been sent successfully.'
  });
});

app.get('/api/messages', (_req, res) => {
  res.json({ ok: true, count: messages.length, messages });
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, message: 'Route not found.' });
});

app.listen(PORT, () => {
  console.log(`KhobbyTech portfolio backend running at http://localhost:${PORT}`);
});
