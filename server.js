import express from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const messages = [];
const rootDir = process.cwd();
const staticFiles = express.static(rootDir, {
  index: 'index.html',
  extensions: ['html'],
  setHeaders(res, filePath) {
    if (path.extname(filePath) === '.js') {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
});

app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  if (req.path === '/api' || req.path.startsWith('/api/')) {
    return next();
  }

  return staticFiles(req, res, next);
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

export function validateContactPayload(payload = {}) {
  const errors = [];

  const clean = {
    name: typeof payload.name === 'string' ? payload.name.trim() : '',
    email: typeof payload.email === 'string' ? payload.email.trim() : '',
    subject: typeof payload.subject === 'string' ? payload.subject.trim() : '',
    message: typeof payload.message === 'string' ? payload.message.trim() : ''
  };

  if (!clean.name) {
    errors.push('Name is required.');
  }

  if (
    !clean.email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)
  ) {
    errors.push('A valid email address is required.');
  }

  if (!clean.subject) {
    errors.push('Subject is required.');
  }

  if (!clean.message || clean.message.length < 10) {
    errors.push('Message must be at least 10 characters long.');
  }

  return {
    valid: errors.length === 0,
    errors,
    data: clean
  };
}


/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    message: 'Portfolio backend is running.'
  });
});


/*
|--------------------------------------------------------------------------
| Contact Form
|--------------------------------------------------------------------------
*/

app.post('/api/contact', async (req, res) => {
  try {
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

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const hasSmtpConfig = Boolean(
      smtpHost &&
      smtpUser &&
      smtpPass
    );

    if (hasSmtpConfig) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || smtpUser,
        to: process.env.RECEIVER_EMAIL || smtpUser,
        replyTo: data.email,
        subject: `[KhobbyTech Portfolio] ${data.subject}`,

        text:
`Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}`,

        html: `
          <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
        `
      });

      console.log('Portfolio email sent successfully.');
    } else {
      console.log(
        'SMTP environment variables are not configured. Message received but email was not sent.'
      );
    }

    console.log('New portfolio message received:', entry);

    return res.status(200).json({
      ok: true,
      message: 'Thanks for getting in touch. Your message has been sent successfully.'
    });

  } catch (error) {
    console.error('Contact form error:', error);

    return res.status(500).json({
      ok: false,
      message: 'Unable to send your message right now. Please try again later.'
    });
  }
});


/*
|--------------------------------------------------------------------------
| Messages
|--------------------------------------------------------------------------
*/

app.get('/api/messages', (_req, res) => {
  res.json({
    ok: true,
    count: messages.length,
    messages
  });
});

app.use('/api', (_req, res) => {
  res.status(404).json({
    ok: false,
    message: 'API endpoint not found.'
  });
});


/*
|--------------------------------------------------------------------------
| Helper
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/*
|--------------------------------------------------------------------------
| Local Development
|--------------------------------------------------------------------------
|
| Vercel does not need app.listen().
| We only start the Express server when running locally.
|
*/

if (process.env.VERCEL !== '1') {
  const PORT = Number(process.env.PORT) || 3000;

  app.listen(PORT, () => {
    console.log(
      `KhobbyTech portfolio backend running at http://localhost:${PORT}`
    );
  });
}


export default app;