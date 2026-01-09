# Jetstream Airport Advisor - Vercel Deployment

This is the Vercel-optimized version of Jetstream Airport Advisor, migrated from Lovable.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Deploy to Vercel

See [VERCEL_MIGRATION_GUIDE.md](./VERCEL_MIGRATION_GUIDE.md) for complete deployment instructions.

**Quick Deploy:**
1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

---

## 📋 Environment Variables Required

Create a `.env.local` file for local development:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_TINYMCE_API_KEY=your_tinymce_key
```

---

## 🔗 Links

- **Lovable Version:** Still working at original location
- **Vercel Version:** This repository
- **Migration Guide:** [VERCEL_MIGRATION_GUIDE.md](./VERCEL_MIGRATION_GUIDE.md)

---

## 📚 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Database + Auth + Edge Functions)
- **Deployment:** Vercel
- **Maps:** Google Maps API
- **Editor:** TinyMCE

---

## 🎯 Features

- ✅ Lead Management
- ✅ Account & Opportunity Tracking
- ✅ AI Chatbot (Claude-powered)
- ✅ Flight Search & Booking
- ✅ Operator Management
- ✅ Email Automation
- ✅ Real-time Database

---

## 📝 Recent Updates

- **2026-01-09:** Migrated from Lovable to Vercel
- **2026-01-09:** Fixed chatbot account creation
- **2026-01-09:** Enhanced chatbot UI with persistence and markdown

---

**Version:** 1.0.0
**Last Updated:** 2026-01-09
