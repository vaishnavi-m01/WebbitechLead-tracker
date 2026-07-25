const fs = require('fs');
const path = require('path');
const dir = 'd:/WebbiTechLeadTrack/src/component';

const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('.tsx') && file !== 'AnimatedButton.tsx') {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Fix the broken React imports
        // Pattern: "import React from 'react';\nimport AnimatedButton from './AnimatedButton';\n//import React"
        // Followed by the rest of the original import.
        content = content.replace(/import React from 'react';\nimport AnimatedButton from '\.\/AnimatedButton';\n\/\/import React/g, "import AnimatedButton from './AnimatedButton';\nimport React");

        fs.writeFileSync(filePath, content);
    }
});
console.log("Fixed imports in components.");
