# Lovable → Vercel Migration Guide

This is a complete copy of your Jetstream Airport Advisor project, ready to deploy to Vercel.

## 📁 Project Structure

```
jetstream-vercel-migration/
├── src/                    # React application source
├── supabase/              # Supabase migrations and functions
├── public/                # Static assets
├── vercel.json           # Vercel configuration (NEW)
├── package.json          # Updated for Vercel
└── .gitignore            # Git ignore rules
```

---

## 🚀 Deployment Steps

### Step 1: Initialize Git Repository

```bash
cd C:\Users\jesse\OneDrive\Desktop\jetstream-vercel-migration
git init
git add .
git commit -m "Initial commit - Migrated from Lovable"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `jetstream-airport-advisor-vercel`)
3. **DO NOT** initialize with README, .gitignore, or license
4. Copy the repository URL

### Step 3: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/jetstream-airport-advisor-vercel.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy to Vercel

#### Option A: Vercel Dashboard (Recommended)

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. Add Environment Variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
   VITE_TINYMCE_API_KEY=your_tinymce_key
   ```

6. Click "Deploy"

#### Option B: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

Follow the prompts and add environment variables when asked.

---

## 🔧 Configuration Changes

### What's Different from Lovable:

1. **Removed:**
   - `lovable-tagger` dependency
   - Lovable-specific build hooks

2. **Added:**
   - `vercel.json` configuration
   - `vercel-build` script
   - Proper `.gitignore`

3. **Updated:**
   - Package name: `jetstream-airport-advisor`
   - Version: `1.0.0`

### Vercel.json Explained:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This handles client-side routing for your React app.

---

## 🔐 Environment Variables

You'll need to add these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Supabase Dashboard → Settings → API |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | Google Cloud Console |
| `VITE_TINYMCE_API_KEY` | TinyMCE API key | TinyMCE Dashboard |

**Important:** Make sure to add these for all environments (Production, Preview, Development)

---

## 🔄 Continuous Deployment

Once set up, Vercel will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Run build checks before deploying

---

## 🧪 Testing Before Full Migration

1. Deploy to Vercel (it won't affect your Lovable deployment)
2. Test the Vercel URL
3. Verify all features work:
   - ✅ Authentication
   - ✅ Database queries
   - ✅ Chatbot
   - ✅ Edge functions
   - ✅ File uploads (if any)

4. Once confirmed, you can update your domain to point to Vercel

---

## 📊 Performance Optimizations

Vercel provides:
- ✅ Automatic CDN
- ✅ Edge caching
- ✅ Image optimization
- ✅ Automatic HTTPS
- ✅ DDoS protection

---

## 🔥 Supabase Edge Functions

Your Supabase edge functions will continue to work as-is since they're hosted on Supabase, not Vercel.

The frontend will still make requests to:
```
https://your-project.supabase.co/functions/v1/claude-autonomous-chat
```

No changes needed!

---

## 🎯 Custom Domain

After deployment, add your custom domain:

1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed by Vercel
4. Vercel handles SSL automatically

---

## 📝 Migration Checklist

- [ ] Initialize Git repository
- [ ] Create GitHub repository
- [ ] Push code to GitHub
- [ ] Deploy to Vercel
- [ ] Add environment variables
- [ ] Test deployment
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring/analytics
- [ ] Update documentation with new URL

---

## 🆘 Troubleshooting

### Build Fails

Check:
1. All dependencies in package.json
2. Environment variables are set
3. Build logs in Vercel dashboard

### Routing Issues

Make sure `vercel.json` has the rewrites configuration for client-side routing.

### Environment Variables Not Working

- Verify they start with `VITE_` prefix
- Redeploy after adding new variables
- Check they're added to the correct environment

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite on Vercel](https://vercel.com/docs/frameworks/vite)
- [Supabase + Vercel](https://supabase.com/docs/guides/hosting/vercel)

---

## 🔄 Keeping Both Versions

**Original (Lovable):**
- Located at: `C:\Users\jesse\OneDrive\Desktop\jetstream-airport-advisor`
- Still works independently
- Can continue development there

**Vercel Version:**
- Located at: `C:\Users\jesse\OneDrive\Desktop\jetstream-vercel-migration`
- Optimized for Vercel deployment
- Sync changes as needed

---

## 🎉 Next Steps

1. Test the deployment
2. Monitor performance
3. Set up error tracking (Sentry recommended)
4. Configure analytics
5. Enjoy better performance and scaling!

---

**Migration Created:** 2026-01-09
**Original Project:** jetstream-airport-advisor (Lovable)
**New Deployment:** Vercel
