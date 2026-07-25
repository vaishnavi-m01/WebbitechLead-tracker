const fs = require('fs');
const file = 'd:/WebbiTechLeadTrack/src/tabs/HomeScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import AnimatedButton')) {
    content = content.replace(
        "import { useSafeAreaInsets } from 'react-native-safe-area-context';",
        "import { useSafeAreaInsets } from 'react-native-safe-area-context';\nimport AnimatedButton from '../component/AnimatedButton';"
    );
}

content = content.replace(/<TouchableOpacity/g, '<AnimatedButton');
content = content.replace(/<\/TouchableOpacity>/g, '</AnimatedButton>');

fs.writeFileSync(file, content);
console.log("Successfully replaced TouchableOpacity with AnimatedButton in HomeScreen.tsx");
