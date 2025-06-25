#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎨 Testing Tailwind CSS Configuration...');

const frontendDir = '/Users/srujanchalasani/Camp_Test/frontend';

try {
    // Change to frontend directory
    process.chdir(frontendDir);

    // Test if we can build CSS
    console.log('📦 Testing CSS build...');

    // Create a simple test CSS file
    const testCSS = `
@import "tailwindcss";

.test {
    @apply bg-blue-500 text-white p-4;
}
`;

    fs.writeFileSync('test.css', testCSS);

    // Try to process it with PostCSS
    try {
        execSync('npx postcss test.css -o test.output.css', { stdio: 'pipe' });
        console.log('✅ PostCSS processing works!');

        // Check if output contains Tailwind classes
        const output = fs.readFileSync('test.output.css', 'utf8');
        if (output.includes('background-color') || output.includes('color')) {
            console.log('✅ Tailwind CSS is working!');
        } else {
            console.log('⚠️  PostCSS works but Tailwind might not be processing correctly');
        }

        // Clean up
        fs.unlinkSync('test.css');
        fs.unlinkSync('test.output.css');

    } catch (error) {
        console.log('❌ PostCSS processing failed:', error.message);
    }

} catch (error) {
    console.log('❌ Test failed:', error.message);
}

console.log('\n🔧 Suggested fix: Try downgrading to Tailwind CSS v3 for better compatibility');
console.log('Run: npm install tailwindcss@^3.4.0 @tailwindcss/postcss@^3.4.0');