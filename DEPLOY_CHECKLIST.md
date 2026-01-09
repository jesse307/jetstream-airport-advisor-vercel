# ✅ Vercel Deployment Checklist

## Pre-Deployment

- [ ] Review code in `jetstream-vercel-migration` folder
- [ ] Ensure all recent changes are included
- [ ] Test locally with `npm run dev`
- [ ] Build locally with `npm run build` to verify no errors

## GitHub Setup

- [ ] Create new GitHub repository
- [ ] Initialize git in project folder
- [ ] Add all files: `git add .`
- [ ] Commit: `git commit -m "Initial commit"`
- [ ] Add remote: `git remote add origin <your-repo-url>`
- [ ] Push: `git push -u origin main`

## Vercel Deployment

- [ ] Go to https://vercel.com
- [ ] Click "Add New..." → "Project"
- [ ] Import your GitHub repository
- [ ] Configure build settings:
  - Framework: Vite
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Install Command: `npm install`

## Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `VITE_GOOGLE_MAPS_API_KEY`
- [ ] `VITE_TINYMCE_API_KEY`

**Important:** Add for all environments (Production, Preview, Development)

## Post-Deployment Testing

- [ ] Visit deployed URL
- [ ] Test user authentication
- [ ] Test lead creation
- [ ] Test chatbot functionality
- [ ] Test account creation (new feature!)
- [ ] Test opportunity creation
- [ ] Verify all pages load correctly
- [ ] Check console for errors

## Supabase Configuration

- [ ] Verify edge function is deployed on Supabase
- [ ] Run migration: `20260109000001_make_opportunities_user_id_nullable.sql`
- [ ] Test edge function from Vercel deployment

## Optional: Custom Domain

- [ ] Add custom domain in Vercel settings
- [ ] Update DNS records
- [ ] Wait for SSL provisioning
- [ ] Test custom domain

## Final Steps

- [ ] Update documentation with new URL
- [ ] Set up monitoring/analytics
- [ ] Configure error tracking (Sentry recommended)
- [ ] Notify team of new deployment
- [ ] Keep Lovable version as backup (for now)

---

## Rollback Plan

If something goes wrong:
1. Lovable version is still running at original location
2. Revert Vercel deployment to previous version
3. Check Vercel logs for errors
4. Fix issues and redeploy

---

## Notes

- Original project location: `C:\Users\jesse\OneDrive\Desktop\jetstream-airport-advisor`
- Vercel project location: `C:\Users\jesse\OneDrive\Desktop\jetstream-vercel-migration`
- Both can run independently
- Sync changes as needed

---

**Deployment Date:** _________________
**Deployed By:** _________________
**Vercel URL:** _________________
**Status:** _________________
