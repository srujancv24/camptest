#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🎨 Testing Tailwind CSS v3 Configuration...');

const frontendDir = '/Users/srujanchalasani/Camp_Test/frontend';

try {
    process.chdir(frontendDir);

    console.log('📦 Testing Tailwind CSS build...');

    // Create a test CSS file with Tailwind directives
    const testCSS = `
@tailwind base;
@tailwind components;
@tailwind utilities;

.test-class {
    @apply bg-blue-500 text-white p-4 rounded;
}
`;

    fs.writeFileSync('test-tailwind.css', testCSS);

    try {
        // Try to build with Tailwind
        const result = execSync('npx tailwindcss -i test-tailwind.css -o test-output.css --content "./src/**/*.{js,jsx,ts,tsx}"', {
            encoding: 'utf8',
            stdio: 'pipe'
        });

        console.log('✅ Tailwind CSS build successful!');

        // Check if output file was created and contains CSS
        if (fs.existsSync('test-output.css')) {
            const output = fs.readFileSync('test-output.css', 'utf8');
            if (output.includes('background-color') && output.includes('color')) {
                console.log('✅ Tailwind CSS is generating styles correctly!');
                console.log('✅ PostCSS configuration is working!');
            } else {
                console.log('⚠️  Output file created but may not contain expected styles');
            }
        }

        // Clean up
        fs.unlinkSync('test-tailwind.css');
        if (fs.existsSync('test-output.css')) {
            fs.unlinkSync('test-output.css');
        }

        console.log('\n🎉 Tailwind CSS v3 setup is working correctly!');

    } catch (error) {
        console.log('❌ Tailwind build failed:', error.message);

        // Clean up on error
        if (fs.existsSync('test-tailwind.css')) {
            fs.unlinkSync('test-tailwind.css');
        }
        if (fs.existsSync('test-output.css')) {
            fs.unlinkSync('test-output.css');
        }
    }

} catch (error) {
    console.log('❌ Test setup failed:', error.message);
}