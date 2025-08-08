import React, { useState, useRef } from 'react';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ToolWrapper } from '../components/common/ToolWrapper';

interface CodeSuggestion {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  category: string;
}

interface CodeAnalysis {
  issues: string[];
  suggestions: string[];
  complexity: 'Low' | 'Medium' | 'High';
  score: number;
  optimizations: string[];
}

const AICodeAssistant = () => {
  const [userCode, setUserCode] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [codePrompt, setCodePrompt] = useState('');
  const [analysisResult, setAnalysisResult] = useState<CodeAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('generate');
  const [codeSuggestions, setCodeSuggestions] = useState<CodeSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const codeRef = useRef<HTMLTextAreaElement>(null);

  // Programming languages supported
  const languages = [
    'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust',
    'php', 'ruby', 'swift', 'kotlin', 'dart', 'html', 'css', 'sql', 'bash'
  ];

  // Code templates for different use cases
  const codeTemplates: Record<string, Record<string, string>> = {
    'react-component': {
      javascript: `import React, { useState } from 'react';

const MyComponent = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};

export default MyComponent;`,
      typescript: `import React, { useState } from 'react';

interface MyComponentProps {
  initialCount?: number;
}

const MyComponent: React.FC<MyComponentProps> = ({ initialCount = 0 }) => {
  const [count, setCount] = useState<number>(initialCount);

  return (
    <div>
      <h1>Counter: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
};

export default MyComponent;`
    },
    'api-fetch': {
      javascript: `// Fetch data from API
const fetchData = async (url) => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// Usage
fetchData('https://api.example.com/data')
  .then(data => console.log(data))
  .catch(error => console.error(error));`,
      python: `import requests
import json

def fetch_data(url):
    """Fetch data from API with error handling"""
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raises an HTTPError for bad responses
        
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        raise

# Usage
try:
    data = fetch_data('https://api.example.com/data')
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Failed to fetch data: {e}")`
    },
    'form-validation': {
      javascript: `// Form validation utility
const validateForm = (formData) => {
  const errors = {};
  
  // Email validation
  if (!formData.email) {
    errors.email = 'Email is required';
  } else if (!/\\S+@\\S+\\.\\S+/.test(formData.email)) {
    errors.email = 'Email is invalid';
  }
  
  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  
  // Name validation
  if (!formData.name || formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Usage
const formData = {
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe'
};

const validation = validateForm(formData);
if (!validation.isValid) {
  console.log('Form errors:', validation.errors);
}`
    }
  };

  // AI Code Generation
  const generateCode = async () => {
    if (!codePrompt.trim()) {
      alert('Please enter a code prompt');
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate AI code generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let generated = '';
      const prompt = codePrompt.toLowerCase();
      
      // Smart code generation based on prompt
      if (prompt.includes('react') && prompt.includes('component')) {
        generated = codeTemplates['react-component']?.[codeLanguage] || 
                   codeTemplates['react-component']?.['javascript'] || '';
      } else if (prompt.includes('api') || prompt.includes('fetch')) {
        generated = codeTemplates['api-fetch']?.[codeLanguage] || 
                   codeTemplates['api-fetch']?.['javascript'] || '';
      } else if (prompt.includes('form') || prompt.includes('validation')) {
        generated = codeTemplates['form-validation']?.[codeLanguage] || 
                   codeTemplates['form-validation']?.['javascript'] || '';
      } else if (prompt.includes('function') || prompt.includes('method')) {
        generated = generateFunctionCode(prompt, codeLanguage);
      } else if (prompt.includes('class') || prompt.includes('object')) {
        generated = generateClassCode(prompt, codeLanguage);
      } else {
        generated = generateGenericCode(prompt, codeLanguage);
      }
      
      setGeneratedCode(generated);
      alert('✨ Code generated successfully! Check the Generated Code section.');
    } catch (error) {
      console.error('Error generating code:', error);
      alert('❌ Failed to generate code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate function code
  const generateFunctionCode = (prompt: string, language: string) => {
    const funcName = extractFunctionName(prompt);
    
    if (language === 'javascript' || language === 'typescript') {
      return `// AI Generated Function based on: "${prompt}"
const ${funcName} = (${generateParameters(prompt)}) => {
  // TODO: Implement function logic
  try {
    // Your implementation here
    console.log('Function ${funcName} called with:', arguments);
    
    // Example implementation
    return { success: true, data: null };
  } catch (error) {
    console.error('Error in ${funcName}:', error);
    throw error;
  }
};

// Usage example
const result = ${funcName}();
console.log(result);`;
    } else if (language === 'python') {
      return `# AI Generated Function based on: "${prompt}"
def ${funcName}(${generateParameters(prompt, 'python')}):
    """
    ${prompt}
    """
    try:
        # TODO: Implement function logic
        print(f"Function ${funcName} called")
        
        # Example implementation
        return {"success": True, "data": None}
    except Exception as e:
        print(f"Error in ${funcName}: {e}")
        raise

# Usage example
result = ${funcName}()
print(result)`;
    }
    return `// Generated code for ${language}`;
  };

  // Generate class code
  const generateClassCode = (prompt: string, language: string) => {
    const className = extractClassName(prompt);
    
    if (language === 'javascript' || language === 'typescript') {
      return `// AI Generated Class based on: "${prompt}"
class ${className} {
  constructor(${generateParameters(prompt)}) {
    // Initialize properties
    this.id = Math.random().toString(36).substr(2, 9);
    this.createdAt = new Date();
    
    // TODO: Add your properties here
  }
  
  // Method example
  performAction() {
    console.log(\`\${this.constructor.name} performing action\`);
    // TODO: Implement action logic
  }
  
  // Getter example
  get info() {
    return {
      id: this.id,
      className: this.constructor.name,
      createdAt: this.createdAt
    };
  }
}

// Usage example
const instance = new ${className}();
console.log(instance.info);
instance.performAction();`;
    } else if (language === 'python') {
      return `# AI Generated Class based on: "${prompt}"
class ${className}:
    def __init__(self, ${generateParameters(prompt, 'python')}):
        """Initialize ${className}"""
        self.id = self._generate_id()
        self.created_at = datetime.now()
        
        # TODO: Add your properties here
    
    def _generate_id(self):
        """Generate unique ID"""
        import random
        import string
        return ''.join(random.choices(string.ascii_letters + string.digits, k=9))
    
    def perform_action(self):
        """Perform action"""
        print(f"{self.__class__.__name__} performing action")
        # TODO: Implement action logic
    
    def __str__(self):
        return f"${className}(id={self.id})"

# Usage example
instance = ${className}()
print(instance)
instance.perform_action()`;
    }
    return `// Generated class for ${language}`;
  };

  // Generate generic code
  const generateGenericCode = (prompt: string, language: string) => {
    if (language === 'javascript' || language === 'typescript') {
      return `// AI Generated Code based on: "${prompt}"
// TODO: Implement your logic here

console.log('Starting implementation for: ${prompt}');

// Example implementation
const implementation = {
  init: function() {
    console.log('Initializing...');
    // Your initialization code
  },
  
  execute: function() {
    console.log('Executing...');
    // Your main logic
  },
  
  cleanup: function() {
    console.log('Cleaning up...');
    // Your cleanup code
  }
};

// Run the implementation
implementation.init();
implementation.execute();
implementation.cleanup();`;
    } else if (language === 'python') {
      return `# AI Generated Code based on: "${prompt}"
# TODO: Implement your logic here

print("Starting implementation for: ${prompt}")

# Example implementation
def main():
    """Main function"""
    print("Initializing...")
    # Your initialization code
    
    print("Executing...")
    # Your main logic
    
    print("Cleaning up...")
    # Your cleanup code

if __name__ == "__main__":
    main()`;
    }
    
    return `// Generated code for ${language}\n// TODO: Implement logic for: ${prompt}`;
  };

  // Helper functions
  const extractFunctionName = (prompt: string) => {
    const words = prompt.toLowerCase().split(' ');
    const functionWords = words.filter(word => 
      !['create', 'make', 'generate', 'build', 'a', 'an', 'the', 'function', 'method'].includes(word)
    );
    return functionWords.length > 0 ? toCamelCase(functionWords.join(' ')) : 'myFunction';
  };

  const extractClassName = (prompt: string) => {
    const words = prompt.toLowerCase().split(' ');
    const classWords = words.filter(word => 
      !['create', 'make', 'generate', 'build', 'a', 'an', 'the', 'class', 'object'].includes(word)
    );
    return classWords.length > 0 ? toPascalCase(classWords.join(' ')) : 'MyClass';
  };

  const generateParameters = (prompt: string, language: string = 'javascript') => {
    // Simple parameter generation based on common patterns
    if (prompt.includes('user') || prompt.includes('person')) {
      return language === 'python' ? 'name, email' : 'name, email';
    } else if (prompt.includes('data') || prompt.includes('item')) {
      return language === 'python' ? 'data' : 'data';
    } else if (prompt.includes('id')) {
      return language === 'python' ? 'id' : 'id';
    }
    return '';
  };

  const toCamelCase = (str: string) => {
    return str.replace(/(?:^\\w|[A-Z]|\\b\\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\\s+/g, '');
  };

  const toPascalCase = (str: string) => {
    return str.replace(/(?:^\\w|[A-Z]|\\b\\w)/g, (word) => {
      return word.toUpperCase();
    }).replace(/\\s+/g, '');
  };

  // Code Analysis
  const analyzeCode = async () => {
    if (!userCode.trim()) {
      alert('Please enter some code to analyze');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const analysis: CodeAnalysis = {
        issues: [],
        suggestions: [],
        complexity: 'Low',
        score: 0,
        optimizations: []
      };

      // Basic code analysis
      const lines = userCode.split('\\n');
      
      // Calculate complexity
      const complexityIndicators = ['for', 'while', 'if', 'switch', 'try', 'catch', 'function', 'class'];
      const complexityCount = complexityIndicators.reduce((count, indicator) => {
        return count + (userCode.match(new RegExp(indicator, 'g')) || []).length;
      }, 0);
      
      if (complexityCount > 10) {
        analysis.complexity = 'High';
      } else if (complexityCount > 5) {
        analysis.complexity = 'Medium';
      }

      // Score calculation
      let score = 100;
      
      // Check for common issues
      if (userCode.includes('console.log')) {
        analysis.issues.push('Remove console.log statements from production code');
        score -= 5;
      }
      
      if (userCode.includes('var ')) {
        analysis.issues.push('Use let/const instead of var');
        score -= 10;
      }
      
      if (lines.length > 50) {
        analysis.issues.push('Function/file is too long, consider breaking it down');
        score -= 5;
      }
      
      if (!userCode.includes('try') && userCode.includes('fetch')) {
        analysis.issues.push('Add error handling for async operations');
        score -= 15;
      }

      // Generate suggestions
      analysis.suggestions = [
        'Add proper error handling',
        'Use meaningful variable names',
        'Add code comments for complex logic',
        'Consider code reusability',
        'Follow consistent formatting'
      ];

      // Optimization suggestions
      analysis.optimizations = [
        'Use async/await for better readability',
        'Implement caching for expensive operations',
        'Use array methods like map/filter/reduce',
        'Consider using TypeScript for better type safety',
        'Break down large functions into smaller ones'
      ];

      analysis.score = Math.max(0, score);
      setAnalysisResult(analysis);
      
      alert(`🔍 Code analysis complete! Score: ${analysis.score}/100`);
    } catch (error) {
      console.error('Error analyzing code:', error);
      alert('❌ Failed to analyze code. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Copy code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      alert('📋 Code copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy code:', err);
    });
  };

  // Load code template
  const loadTemplate = (template: string) => {
    const templateCode = codeTemplates[template]?.[codeLanguage] || 
                        codeTemplates[template]?.['javascript'] || '';
    if (templateCode) {
      setGeneratedCode(templateCode);
      alert('📝 Template loaded successfully!');
    } else {
      alert('❌ Template not found for the selected language.');
    }
  };

  // Get code suggestions
  const getCodeSuggestions = async () => {
    setShowSuggestions(true);
    
    const suggestions: CodeSuggestion[] = [
      {
        id: '1',
        title: 'React Hook useState',
        description: 'State management in functional components',
        code: `const [state, setState] = useState(initialValue);`,
        language: 'javascript',
        category: 'React'
      },
      {
        id: '2',
        title: 'Async/Await Pattern',
        description: 'Modern asynchronous JavaScript',
        code: `const fetchData = async () => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};`,
        language: 'javascript',
        category: 'JavaScript'
      },
      {
        id: '3',
        title: 'Array Methods',
        description: 'Functional programming with arrays',
        code: `const result = array
  .filter(item => item.active)
  .map(item => item.name)
  .reduce((acc, name) => acc + name, '');`,
        language: 'javascript',
        category: 'JavaScript'
      },
      {
        id: '4',
        title: 'Python List Comprehension',
        description: 'Elegant list creation in Python',
        code: `result = [x**2 for x in range(10) if x % 2 == 0]`,
        language: 'python',
        category: 'Python'
      },
      {
        id: '5',
        title: 'TypeScript Interface',
        description: 'Type definitions for better code',
        code: `interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}`,
        language: 'typescript',
        category: 'TypeScript'
      }
    ];
    
    setCodeSuggestions(suggestions);
  };

  return (
    <ToolWrapper
      toolId="ai-code-assistant"
      toolName="AI Code Assistant"
      toolDescription="Generate, analyze, and optimize code with AI assistance. Support for multiple programming languages."
      toolCategory="Development"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">🤖 AI Code Assistant</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Language:</label>
              <select 
                value={codeLanguage} 
                onChange={(e) => setCodeLanguage(e.target.value)}
                className="border p-2 rounded"
              >
                {languages.map(lang => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-4 mb-6">
          {[
            { id: 'generate', label: '🎯 Generate Code', icon: '🎯' },
            { id: 'analyze', label: '🔍 Analyze Code', icon: '🔍' },
            { id: 'optimize', label: '⚡ Optimize', icon: '⚡' },
            { id: 'templates', label: '📝 Templates', icon: '📝' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Generate Code Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">🎯 AI Code Generator</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Describe what you want to code:</label>
                    <Textarea
                      placeholder="e.g., Create a React component for user authentication, Write a Python function to sort array, Generate API endpoint for user registration..."
                      value={codePrompt}
                      onChange={(e) => setCodePrompt(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={generateCode}
                      disabled={isGenerating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isGenerating ? '🤖 Generating...' : '🤖 Generate Code'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={getCodeSuggestions}
                    >
                      💡 Get Suggestions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generated Code Display */}
            {generatedCode && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Generated Code</h3>
                    <Button 
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCode)}
                    >
                      📋 Copy Code
                    </Button>
                  </div>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code className={`language-${codeLanguage}`}>
                      {generatedCode}
                    </code>
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Analyze Code Tab */}
        {activeTab === 'analyze' && (
          <div className="space-y-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-4">🔍 Code Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Paste your code here:</label>
                    <Textarea
                      ref={codeRef}
                      placeholder="Paste your code here for AI analysis..."
                      value={userCode}
                      onChange={(e) => setUserCode(e.target.value)}
                      className="min-h-[200px] font-mono"
                    />
                  </div>
                  <Button 
                    onClick={analyzeCode}
                    disabled={isAnalyzing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isAnalyzing ? '🔍 Analyzing...' : '🔍 Analyze Code'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisResult && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Code Score:</span>
                        <div className="w-20 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-green-500 rounded-full transition-all duration-300"
                            style={{ width: `${analysisResult.score}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">{analysisResult.score}/100</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Complexity: </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          analysisResult.complexity === 'High' ? 'bg-red-100 text-red-800' :
                          analysisResult.complexity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {analysisResult.complexity}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {analysisResult.issues.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-red-700 mb-2">⚠️ Issues Found:</h4>
                      <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                        {analysisResult.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysisResult.suggestions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-blue-700 mb-2">💡 Suggestions:</h4>
                      <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                        {analysisResult.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {analysisResult.optimizations.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-green-700 mb-2">⚡ Optimizations:</h4>
                      <ul className="list-disc list-inside text-sm text-green-600 space-y-1">
                        {analysisResult.optimizations.map((optimization, index) => (
                          <li key={index}>{optimization}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">📝 Code Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.keys(codeTemplates).map(template => (
                    <div
                      key={template}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                      onClick={() => loadTemplate(template)}
                    >
                      <h4 className="font-medium capitalize">
                        {template.replace('-', ' ')}
                      </h4>
                      <p className="text-sm text-gray-600 mt-2">
                        {template === 'react-component' && 'React functional component with hooks'}
                        {template === 'api-fetch' && 'API data fetching with error handling'}
                        {template === 'form-validation' && 'Form validation utility function'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Code Suggestions */}
        {showSuggestions && codeSuggestions.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">💡 Code Suggestions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {codeSuggestions.map(suggestion => (
                  <div
                    key={suggestion.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setGeneratedCode(suggestion.code);
                      setCodeLanguage(suggestion.language);
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{suggestion.title}</h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {suggestion.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      <code>{suggestion.code}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {/* Quick Actions */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">🚀 Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline"
                onClick={() => setCodePrompt('Create a React component with state')}
              >
                React Component
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCodePrompt('Write a Python function to process data')}
              >
                Python Function
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCodePrompt('Generate API endpoint with Express.js')}
              >
                API Endpoint
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCodePrompt('Create a database query with SQL')}
              >
                SQL Query
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCodePrompt('Build a responsive CSS layout')}
              >
                CSS Layout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ToolWrapper>
  );  
};

export default AICodeAssistant;
