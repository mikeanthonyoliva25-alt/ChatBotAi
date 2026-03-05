# App Submission Checklist

## ✅ Completed Requirements for Google Play Store / App Stores

### 1. **App Icon**
- **File:** `icon.svg` (can be scaled to 1024x1024)
- **Theme:** Fitness (dumbbells + heart)
- **Colors:** Purple gradient matching app branding
- **Note:** Convert SVG to PNG 1024x1024 for submission

### 2. **Privacy Policy**
- **File:** `PRIVACY_POLICY.md`
- **URL:** Host this at `https://yourwebsite.com/privacy-policy`
- **Contains:**
  - What data is collected
  - How data is used
  - Third-party services (Google OAuth, Facebook, Supabase)
  - Data storage & security
  - User rights to delete data
  - GDPR/Privacy compliance

### 3. **User Data Deletion**
- **Location:** Settings page (`settings.html`)
- **Feature:** "Delete My Account" button
- **What it does:**
  - Deletes all conversations, assessments, plans, messages
  - Removes auth user account
  - Permanent deletion within 30 days
- **How to access:** Users sign in → Settings → Delete Account

### 4. **Category**
- **Recommended:** `Health & Fitness` or `Lifestyle`
- **Tags:** Fitness, AI, Workout, Health, Exercise

---

## 📋 Store Submission Steps

### For Google Play Store:
1. Create Google Play Console account
2. Create new app project
3. Upload app (APK/AAB) — if using Capacitor/Expo wrapper
4. Add:
   - App icon (1024x1024 PNG)
   - Screenshots
   - Privacy policy URL
   - App category: Health & Fitness
   - Description mentioning AI coaching
5. Submit for review

### For Apple App Store:
1. Create Apple Developer account
2. Create new app in App Store Connect
3. Upload app binary (via Xcode)
4. Add:
   - App icon (1024x1024 PNG)
   - Screenshots
   - Privacy policy URL
   - Category: Health & Fitness
5. Submit for review

### For Web (Recommended for now):
1. Deploy to Vercel, Netlify, or similar
2. Host privacy policy at public URL
3. Share link with users
4. No app store submission needed

---

## 🔧 How to Convert SVG Icon to PNG

**Using an online tool:**
1. Go to [CloudConvert.com](https://cloudconvert.com/) or [Convertio](https://convertio.co/)
2. Upload `icon.svg`
3. Convert to PNG, set size to 1024x1024
4. Download PNG file
5. Use for app submission

**Using command line (ImageMagick):**
```bash
convert icon.svg -resize 1024x1024 icon.png
```

---

## 🌐 Hosting Privacy Policy

**Option 1: GitHub Pages (Free)**
1. Create `docs/privacy-policy.md` in your repo
2. Enable GitHub Pages
3. Access at: `https://username.github.io/repo/privacy-policy`

**Option 2: Your Website**
1. Add privacy policy to your website
2. URL: `https://yourwebsite.com/privacy-policy`

**Option 3: Supabase Docs**
1. Host on Supabase's static hosting
2. Use in app store submission

---

## ✨ Next Steps

1. **Convert icon:** SVG → PNG 1024x1024
2. **Host privacy policy:** Make it publicly accessible via URL
3. **Test data deletion:** Sign up, go to Settings, test delete account
4. **Choose platform:** Web (easiest) or wrapped native app (Capacitor/Expo)
5. **Submit:** Follow platform-specific guidelines

All features are ready! 🚀
