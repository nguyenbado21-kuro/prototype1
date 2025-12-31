# Vercel Deployment Guide

## Quick Deploy

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel
   ```

3. **Follow the prompts**:
   - Link to existing project or create new one
   - Set up project name
   - Confirm build settings

## Alternative: GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Vercel will automatically detect it's a Vite project
5. Deploy with default settings

## Build Configuration

The project is configured with:
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Environment Variables

No environment variables are required for this game.

## Custom Domain

After deployment, you can add a custom domain in the Vercel dashboard under your project settings.

## Automatic Deployments

Once connected to GitHub, Vercel will automatically deploy:
- Production deployments from `main` branch
- Preview deployments from other branches and pull requests