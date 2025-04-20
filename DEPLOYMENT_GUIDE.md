# Crypto Trading System Deployment Guide

This guide will help you deploy your crypto trading system to Vercel for permanent hosting.

## Prerequisites

1. A Vercel account (free tier is sufficient)
2. Your Coinbase and/or Kraken API keys
3. Git installed on your computer (optional)

## Deployment Steps

### Option 1: Deploy directly from GitHub

1. Create a GitHub repository for your project
   - Go to [GitHub](https://github.com) and create a new repository
   - Clone the repository to your local machine
   - Copy all files from the extracted zip to your local repository
   - Commit and push the changes to GitHub

2. Connect Vercel to your GitHub repository
   - Go to [Vercel](https://vercel.com) and sign in
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Configure the project:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: npm run build
     - Output Directory: .next
   - Add Environment Variables:
     - WEBHOOK_SECRET: NortheastNoir777!
     - NEXT_PUBLIC_ACCESS_PASSWORD: NortheastNoir777!
     - COINBASE_API_KEY: your_coinbase_api_key
     - COINBASE_API_SECRET: your_coinbase_api_secret
     - KRAKEN_API_KEY: your_kraken_api_key
     - KRAKEN_API_SECRET: your_kraken_api_secret
     - PREFERRED_EXCHANGE: COINBASE
   - Click "Deploy"

### Option 2: Deploy using Vercel CLI

1. Install Vercel CLI
   ```bash
   npm install -g vercel
   ```

2. Navigate to your project directory
   ```bash
   cd path/to/extracted/zip
   ```

3. Login to Vercel
   ```bash
   vercel login
   ```

4. Deploy the project
   ```bash
   vercel
   ```

5. Follow the prompts and configure environment variables when asked

## After Deployment

1. Your trading system will be available at the URL provided by Vercel (e.g., https://your-project.vercel.app)

2. Configure TradingView alerts to send webhooks to your new URL:
   - Webhook URL: https://your-project.vercel.app/api/tradingview-webhook
   - Format: JSON
   - Add header: Authorization: Bearer NortheastNoir777!

3. Test the system by sending a manual webhook or triggering a TradingView alert

## Security Considerations

1. Keep your API keys secure by using Vercel's environment variables
2. Consider changing the default webhook secret (WEBHOOK_SECRET) and access password (NEXT_PUBLIC_ACCESS_PASSWORD)
3. Regularly monitor your trading activity to ensure everything is working as expected

## Troubleshooting

If you encounter any issues during deployment:

1. Check Vercel's deployment logs for errors
2. Ensure all environment variables are correctly set
3. Verify your API keys are valid and have the necessary permissions
4. Test your webhook endpoint using a tool like Postman or curl

## Updating Your Deployment

To update your deployment after making changes:

1. If using GitHub, simply push your changes to the repository and Vercel will automatically redeploy
2. If using Vercel CLI, run `vercel` again from your project directory
