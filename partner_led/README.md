# Standalone Partner With Us Portal

This is the standalone React & TypeScript single-page application for the JAAN Entertainment **Partner With Us** portal. 

It is designed to be hosted on a separate subdomain (e.g. `partner.stackvil.com` or `partner.jaanentertainment.com`) and manages screen owner onboarding forms, technical LED details submissions, and media file uploads.

## Tech Stack
- **Framework:** React + TypeScript (via Vite)
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Setup & Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run local development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```
   The built static files will be located in the `dist` directory, ready to be deployed to Netlify, Vercel, Firebase Hosting, or any other web hosting provider.

## How to Push to GitHub

The local repository is already initialized with branch `main` and remote origin `https://github.com/konapalask/partner_led`.

To push the code to your GitHub repository:

```bash
git push -u origin main
```
