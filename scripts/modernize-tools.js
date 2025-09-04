#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const toolsDir = path.join(__dirname, '../src/tools');

// Modern theme wrapper template
const wrapWithModernTheme = (content, toolName, toolEmoji = '🛠️') => {
  // Extract the main content (everything inside the return statement)
  const returnMatch = content.match(/return\s*\(([\s\S]*)\);?\s*};\s*export/);
  if (!returnMatch) return content;

  const innerContent = returnMatch[1];
  
  // Check if already modernized
  if (innerContent.includes('bg-gradient-to-br from-gray-950')) {
    console.log(`${toolName} already modernized, skipping...`);
    return content;
  }

  const modernWrapper = `return (
    <ToolWrapper
      toolId="${toolName.toLowerCase().replace(/\s+/g, '-')}"
      toolName="${toolName}"
      toolDescription="AI-powered tool for enhanced productivity"
      toolCategory="AI"
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950/20 to-gray-950 p-6">
        {/* Background Pattern */}
        <div 
          className="fixed inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: \`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23a855f7' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")\`,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4">
              ${toolEmoji} ${toolName}
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              AI-powered tool for enhanced productivity and creativity
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            ${innerContent.replace(/return\s*\(/g, '').replace(/\);?\s*$/, '')}
          </div>
        </div>
      </div>
    </ToolWrapper>
  );`;

  return content.replace(/return\s*\(([\s\S]*)\);?\s*};\s*export/, modernWrapper + '\n\n};\\n\\nexport');
};

// Function to update tool files
const updateToolFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, '.tsx');
    
    // Skip if file is too small or doesn't contain a React component
    if (content.length < 100 || !content.includes('export') || !content.includes('ToolWrapper')) {
      return;
    }

    console.log(`Processing ${fileName}...`);
    
    const updatedContent = wrapWithModernTheme(content, fileName);
    
    if (updatedContent !== content) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Updated ${fileName}`);
    } else {
      console.log(`⏭️ Skipped ${fileName} (no changes needed)`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
};

// Main execution
console.log('🚀 Starting tool modernization...\n');

if (fs.existsSync(toolsDir)) {
  const files = fs.readdirSync(toolsDir);
  
  files.forEach(file => {
    if (file.endsWith('.tsx')) {
      const filePath = path.join(toolsDir, file);
      updateToolFile(filePath);
    }
  });
} else {
  console.error('Tools directory not found!');
}

console.log('\n✨ Tool modernization complete!');
