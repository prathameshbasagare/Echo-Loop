# Deploying Echo Loop to GitHub Pages

This guide will help you deploy your Echo Loop game to GitHub Pages for free hosting.

## Prerequisites

- A GitHub account
- Git installed on your computer
- Your game project ready

## Step-by-Step Deployment

### 1. Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Name it `echo-loop` (or any name you prefer)
4. Keep it **Public** (required for free GitHub Pages)
5. **Don't** initialize with README (we already have files)
6. Click **"Create repository"**

### 2. Initialize Git in Your Project

Open terminal in your project folder and run:

```bash
git init
git add .
git commit -m "Initial commit: Echo Loop game"
```

### 3. Connect to GitHub

Replace `YOUR_USERNAME` with your GitHub username:

```bash
git remote add origin https://github.com/prathameshbasagare/echo-loop.git
git branch -M main
git push -u origin main
```

### 4. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Pages** in the left sidebar
4. Under **"Build and deployment"**:
   - **Source**: Select **"GitHub Actions"**
5. That's it! The workflow will run automatically

### 5. Wait for Deployment

1. Go to the **Actions** tab in your repository
2. You'll see the "Deploy to GitHub Pages" workflow running
3. Wait for it to complete (usually 1-2 minutes)
4. Once done, your game will be live!

### 6. Access Your Game

Your game will be available at:
```
https://prathameshbasagare.github.io/echo-loop/
```

## How the Workflow Works

The `.github/workflows/deploy.yml` file automatically:

1. **Triggers** when you push to the `main` branch
2. **Installs** Node.js and dependencies
3. **Builds** your game (`npm run build`)
4. **Deploys** the `dist` folder to GitHub Pages

## Making Updates

Whenever you want to update your game:

```bash
# Make your changes, then:
git add .
git commit -m "Description of your changes"
git push
```

The workflow will automatically rebuild and redeploy!

## Troubleshooting

### Build fails?
- Check the **Actions** tab for error messages
- Make sure `npm run build` works locally first

### Page shows 404?
- Wait a few minutes after first deployment
- Check that GitHub Pages source is set to "GitHub Actions"
- Verify the workflow completed successfully

### Need to redeploy manually?
- Go to **Actions** tab
- Click **"Deploy to GitHub Pages"** workflow
- Click **"Run workflow"** button

## Custom Domain (Optional)

Want to use your own domain like `echoloop.com`?

1. Buy a domain from any registrar
2. In repository **Settings** → **Pages**
3. Add your custom domain
4. Configure DNS at your domain registrar (GitHub provides instructions)

## Cost

**100% FREE!** GitHub Pages is completely free for public repositories.

## Need Help?

- Check [GitHub Pages Documentation](https://docs.github.com/en/pages)
- Review workflow logs in the Actions tab
- Make sure your repository is public
