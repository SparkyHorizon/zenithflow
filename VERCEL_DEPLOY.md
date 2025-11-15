# Deploying to Vercel

This guide will help you deploy your Focus-Study Dashboard with Spotify integration to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your Spotify App credentials (Client ID and Client Secret)
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Update Spotify App Settings

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Select your app
3. Click "Edit Settings"
4. Add your Vercel deployment URL to **Redirect URIs**:
   - `https://your-app-name.vercel.app/api/callback`
   - Replace `your-app-name` with your actual Vercel project name

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your Git repository
4. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (root)
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: `./` (root)
5. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts to link your project

## Step 3: Configure Environment Variables

After your first deployment, you need to add environment variables:

1. Go to your project on Vercel dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

   | Variable Name | Value | Description |
   |--------------|-------|-------------|
   | `SPOTIFY_CLIENT_ID` | Your Spotify Client ID | From Spotify Dashboard |
   | `SPOTIFY_CLIENT_SECRET` | Your Spotify Client Secret | From Spotify Dashboard |
   | `REDIRECT_URI` | `https://your-app-name.vercel.app/api/callback` | Your Vercel callback URL |

4. **Important**: After adding environment variables, you need to **redeploy** your project:
   - Go to **Deployments** tab
   - Click the three dots (⋯) on the latest deployment
   - Select "Redeploy"

## Step 4: Update Frontend Configuration (Optional)

The frontend automatically detects the backend URL. If you need to override it, you can:

1. Add a script tag in `index.html` before the `spotify.js` script:
   ```html
   <script>
       window.SPOTIFY_BACKEND_URL = 'https://your-app-name.vercel.app';
   </script>
   ```

2. Or set it dynamically:
   ```javascript
   window.SPOTIFY_BACKEND_URL = window.location.origin;
   ```

## Step 5: Verify Deployment

1. Visit your deployed site: `https://your-app-name.vercel.app`
2. Click "Login with Spotify"
3. Complete the OAuth flow
4. Verify that the Spotify player appears and works correctly

## Troubleshooting

### Issue: "Redirect URI mismatch"
- **Solution**: Make sure the `REDIRECT_URI` environment variable matches exactly what's in your Spotify app settings
- The redirect URI should be: `https://your-app-name.vercel.app/api/callback`

### Issue: "Invalid client" or authentication fails
- **Solution**: 
  1. Verify your `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are correct
  2. Make sure you redeployed after adding environment variables
  3. Check that the environment variables are set for the correct environment (Production, Preview, Development)

### Issue: API routes return 404
- **Solution**: 
   - Verify the `api/` folder structure is correct
   - Check that `vercel.json` is in the root directory
   - Ensure the routes in `vercel.json` match your API structure

### Issue: CORS errors
- **Solution**: The serverless functions already include CORS headers. If you still see CORS errors, check:
  - The frontend is using the correct backend URL
  - The API routes are being called correctly

## Custom Domain (Optional)

1. Go to your project settings on Vercel
2. Navigate to **Domains**
3. Add your custom domain
4. Update your Spotify app's Redirect URI to match your custom domain
5. Update the `REDIRECT_URI` environment variable

## Continuous Deployment

Vercel automatically deploys when you push to your main branch. Each push creates a new deployment preview.

- **Production**: Deploys from your main/master branch
- **Preview**: Deploys from pull requests and other branches

Make sure to set environment variables for all environments (Production, Preview, Development) if you want them to work in preview deployments.

## File Structure for Vercel

```
zenithflow/
├── api/
│   ├── callback.js          # OAuth callback handler
│   └── spotify/
│       ├── login.js         # Login endpoint
│       └── refresh.js       # Token refresh endpoint
├── assets/                  # Static assets
├── index.html              # Main HTML file
├── styles.css              # Styles
├── main.js                 # Main JavaScript
├── notes.js                # Notes functionality
├── spotify.js              # Spotify integration
├── package.json            # Dependencies
├── vercel.json             # Vercel configuration
└── .gitignore             # Git ignore rules
```

## Notes

- The `server.js` file is not needed for Vercel deployment (it's for local development)
- All API routes are converted to serverless functions in the `api/` folder
- Static files (HTML, CSS, JS, images) are served automatically
- Environment variables are securely stored and not exposed to the frontend

