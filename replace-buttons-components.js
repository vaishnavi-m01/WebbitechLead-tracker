const fs = require('fs');
const path = require('path');
const dir = 'd:/WebbiTechLeadTrack/src/component';

const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('.tsx') && file !== 'AnimatedButton.tsx') {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        let modified = false;

        if (content.includes('TouchableOpacity') && !content.includes('import AnimatedButton')) {
            content = content.replace(
                "import { StyleSheet",
                "import AnimatedButton from './AnimatedButton';\nimport { StyleSheet"
            );
            // If the above didn't match (because it might be imported differently), try replacing just 'import'
            if (!content.includes('import AnimatedButton')) {
               content = content.replace(
                   "import React",
                   "import React from 'react';\nimport AnimatedButton from './AnimatedButton';\n//import React"
               );
            }
            content = content.replace(/<TouchableOpacity/g, '<AnimatedButton');
            content = content.replace(/<\/TouchableOpacity>/g, '</AnimatedButton>');
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`Updated ${file}`);
        }
    }
});
console.log("Done updating components.");
