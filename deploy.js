#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🎮 Deploying Four Immortals Game to Vercel...\n');

try {
    // Build the project
    console.log('📦 Building project...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Deploy to Vercel
    console.log('\n🚀 Deploying to Vercel...');
    execSync('vercel --prod', { stdio: 'inherit' });
    
    console.log('\n✅ Deployment complete!');
    console.log('🎯 Your game is now live on Vercel!');
    
} catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
}