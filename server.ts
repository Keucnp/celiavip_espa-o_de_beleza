import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// Google OAuth Configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL || 'http://localhost:3000'}/auth/google/callback`
);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 1. Get Google Auth URL
app.get('/api/auth/google/url', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly'
    ],
    prompt: 'consent'
  });
  res.json({ url });
});

// 2. Google Auth Callback
app.get(['/auth/google/callback', '/auth/google/callback/'], async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Code missing');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    
    // Store tokens in a secure cookie
    // In a real app, you'd store this in a database linked to a user session
    res.cookie('google_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Autenticação concluída com sucesso! Esta janela fechará automaticamente.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.status(500).send('Authentication failed');
  }
});

// 3. Sync Calendar
app.post('/api/calendar/sync', async (req, res) => {
  const tokenCookie = req.cookies.google_tokens;
  if (!tokenCookie) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  try {
    const tokens = JSON.parse(tokenCookie);
    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const { tasks } = req.body; // App tasks to sync to Google

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Invalid tasks data' });
    }

    // 1. Fetch existing events from Google Calendar to avoid duplicates
    // We'll look for events with a specific extended property or just match by title/time
    const now = new Date();
    const minDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
    
    const googleEvents = await calendar.events.list({
      calendarId: 'primary',
      timeMin: minDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const existingTitles = new Set(googleEvents.data.items?.map(e => e.summary) || []);

    // 2. Push new tasks to Google Calendar
    const results = [];
    for (const task of tasks) {
      if (existingTitles.has(task.title)) {
        results.push({ id: task.id, status: 'skipped', reason: 'Already exists' });
        continue;
      }

      const startDateTime = `${task.date}T${task.time || '09:00'}:00Z`;
      const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();

      try {
        await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: task.title,
            description: task.description,
            start: { dateTime: startDateTime },
            end: { dateTime: endDateTime },
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: task.reminderMinutes || 15 },
              ],
            },
          },
        });
        results.push({ id: task.id, status: 'synced' });
      } catch (err) {
        console.error(`Failed to sync task ${task.id}:`, err);
        results.push({ id: task.id, status: 'failed' });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Calendar sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// 4. Check Auth Status
app.get('/api/auth/google/status', (req, res) => {
  const tokenCookie = req.cookies.google_tokens;
  res.json({ isAuthenticated: !!tokenCookie });
});

// 5. Logout Google
app.post('/api/auth/google/logout', (req, res) => {
  res.clearCookie('google_tokens', {
    secure: true,
    sameSite: 'none'
  });
  res.json({ success: true });
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
