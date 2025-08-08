import React, { useState, useRef } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';

// Initialize PDF.js worker using CDN
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ResumeAnalysis {
  score: number;
  keywordMatch: number;
  missingKeywords: string[];
  suggestions: string[];
  formatIssues: string[];
  readabilityScore: number;
  fileInfo?: {
    name: string;
    type: string;
    size: number;
  };
}

// Helper functions for resume analysis
const extractKeywords = (jobDescription: string): string[] => {
  // Simple keyword extraction (you can enhance this with more sophisticated NLP)
  const words = jobDescription.toLowerCase().match(/\b\w+\b/g) || [];
  const commonWords = new Set(['the', 'and', 'or', 'in', 'at', 'on', 'to', 'for', 'a', 'an', 'of']);
  return Array.from(new Set(words.filter(word => 
    word.length > 2 && !commonWords.has(word)
  )));
};

const calculateATSScore = (resume: string, jobDescription: string): number => {
  const keywords = extractKeywords(jobDescription);
  const foundKeywords = keywords.filter(keyword => 
    resume.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Base score from keyword matches
  let score = (foundKeywords.length / keywords.length) * 60;
  
  // Add points for proper formatting
  if (resume.includes('EXPERIENCE') || resume.includes('EDUCATION')) score += 10;
  if (resume.includes('SKILLS') || resume.includes('TECHNOLOGIES')) score += 10;
  if (!/[^\x00-\x7F]/g.test(resume)) score += 10; // No special characters
  if (resume.length > 300) score += 10; // Adequate length
  
  return Math.min(Math.round(score), 100);
};

const checkFormatIssues = (resume: string): string[] => {
  const issues: string[] = [];
  
  if (/[^\x00-\x7F]/g.test(resume)) {
    issues.push('Contains special characters that may cause ATS issues');
  }
  
  if (resume.length < 300) {
    issues.push('Resume content appears too short');
  }
  
  if (!/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(resume)) {
    issues.push('No email address detected');
  }
  
  if (!/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(resume)) {
    issues.push('No phone number detected');
  }
  
  return issues;
};

const calculateReadabilityScore = (text: string): number => {
  const sentences = text.split(/[.!?]+/).length;
  const words = text.split(/\s+/).length;
  const syllables = text.split(/[aeiou]/i).length - 1;
  
  // Simplified Flesch Reading Ease calculation
  const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
  return Math.min(Math.round(Math.max(score, 0)), 100);
};

const generateSuggestions = (resume: string, jobDescription: string, missingKeywords: string[]): string[] => {
  const suggestions: string[] = [];

  if (missingKeywords.length > 0) {
    suggestions.push(`Add missing keywords: ${missingKeywords.join(', ')}`);
  }

  if (!/\d+/.test(resume)) {
    suggestions.push('Add more quantifiable achievements with numbers');
  }

  if (!resume.includes('EDUCATION') && !resume.includes('QUALIFICATION')) {
    suggestions.push('Add an Education section');
  }

  if (!resume.includes('EXPERIENCE') && !resume.includes('WORK HISTORY')) {
    suggestions.push('Add a Work Experience section');
  }

  if (!resume.includes('SKILLS') && !resume.includes('TECHNOLOGIES')) {
    suggestions.push('Add a Skills section');
  }

  return suggestions;
};

const AIResumeScanner: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // PDF.js worker is initialized at the top of the file

  const processPdfFile = async (file: File): Promise<string> => {
    try {
      // Convert file to ArrayBuffer
      const buffer = await new Promise<ArrayBuffer>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.readAsArrayBuffer(file);
      });

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;
      
      // Get total pages
      const numPages = pdf.numPages;
      let fullText = '';

      // Extract text from each page
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item: any) => item.str.trim().length > 0) // Remove empty strings
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\\n';
      }

      // Clean up the text
      return fullText
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\\n') // Replace multiple newlines with single newline
        .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
        .trim();
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error('Failed to process PDF file. Please ensure it\'s a valid PDF document.');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setUploadedFile(file);

    // Read file content based on type
    const reader = new FileReader();
    
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
      setUploadedFile(null);
    };

    try {
      if (file.type === 'application/pdf') {
        try {
          const pdfText = await processPdfFile(file);
          setResumeText(pdfText);
        } catch (error) {
          setError('Error processing PDF file. Please try again or paste the content manually.');
          setResumeText('');
        }
      } else if (file.type.includes('word')) {
        setResumeText(`Word Document Detected: ${file.name}\nPlease paste the content manually for Word documents.`);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setResumeText(text);
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Error processing file. Please try again.');
    } finally {
      setIsProcessing(false);
    }

    // Start reading the file
    if (file.type === 'application/pdf' || file.type.includes('word')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const analyzeResume = async () => {
    if (!resumeText || !jobDescription) {
      setError('Please provide both resume content and job description');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Clean and normalize text for better matching
      const normalizedResume = resumeText.toLowerCase().replace(/[^\w\s]/g, ' ');
      const normalizedJob = jobDescription.toLowerCase().replace(/[^\w\s]/g, ' ');
      
      // Extract keywords from job description
      const keywords = extractKeywords(normalizedJob);
      
      // Find exact and partial matches
      const exactMatches = new Set<string>();
      const partialMatches = new Set<string>();
      
      keywords.forEach(keyword => {
        if (normalizedResume.includes(` ${keyword} `)) {
          exactMatches.add(keyword);
        } else if (keyword.length > 4 && normalizedResume.includes(keyword)) {
          partialMatches.add(keyword);
        }
      });
      
      // Calculate weighted keyword match percentage
      const totalKeywords = keywords.length;
      const weightedMatches = (exactMatches.size + (partialMatches.size * 0.5));
      const keywordMatch = Math.round((weightedMatches / totalKeywords) * 100);
      
      // Calculate ATS compatibility score with additional factors
      const atsScore = calculateATSScore(normalizedResume, normalizedJob);
      
      // Get missing important keywords (prioritize exact matches)
      const missingKeywords = keywords.filter(keyword => 
        !exactMatches.has(keyword) && !partialMatches.has(keyword)
      );

      // Generate suggestions based on analysis
      const suggestions = generateSuggestions(resumeText, jobDescription, missingKeywords);

      const mockAnalysis: ResumeAnalysis = {
        score: atsScore,
        keywordMatch,
        missingKeywords,
        suggestions,
        formatIssues: checkFormatIssues(resumeText),
        readabilityScore: calculateReadabilityScore(resumeText),
        fileInfo: uploadedFile ? {
          name: uploadedFile.name,
          type: uploadedFile.type,
          size: uploadedFile.size
        } : undefined
      };
      setAnalysis(mockAnalysis);
    } catch (error) {
      console.error('Error analyzing resume:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ToolWrapper
      toolId="ai-resume-scanner"
      toolName="AI Resume Scanner"
      toolDescription="Optimize your resume for ATS systems and improve your chances of getting hired"
      toolCategory="Career"
    >
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Upload Resume</label>
              <div 
                className={`flex flex-col items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none ${!isProcessing ? 'cursor-pointer hover:border-blue-500' : ''} focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:hover:border-blue-500`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    // Create a DataTransfer to simulate file input change
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    if (fileInputRef.current) {
                      fileInputRef.current.files = dataTransfer.files;
                      // Create a synthetic event to trigger the handler
                      const changeEvent = new Event('change', { bubbles: true });
                      fileInputRef.current.dispatchEvent(changeEvent);
                    }
                  }
                }}
              >
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                />
                <span className="flex items-center space-x-2">
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="font-medium text-blue-500">Processing PDF...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="font-medium text-gray-600 dark:text-gray-300">
                        {uploadedFile ? uploadedFile.name : 'Drop files to Attach, or click to browse'}
                      </span>
                    </>
                  )}
                </span>
                {uploadedFile && (
                  <span className="mt-2 text-sm text-gray-500">
                    File size: {(uploadedFile.size / 1024 / 1024).toFixed(2)}MB
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Resume Content</label>
              <textarea
                className="w-full h-48 p-3 border rounded-lg"
                placeholder="Or paste your resume content here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Job Description</label>
            <textarea
              className="w-full h-64 p-3 border rounded-lg"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
        </div>

        <button
          className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={analyzeResume}
          disabled={isAnalyzing || !resumeText || !jobDescription}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
        </button>

        {analysis && (
          <div className="mt-8 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold mb-4">Analysis Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium">ATS Compatibility Score</p>
                  <div className="text-3xl font-bold text-blue-600">{analysis.score}%</div>
                </div>
                <div>
                  <p className="text-sm font-medium">Keyword Match</p>
                  <div className="text-3xl font-bold text-green-600">{analysis.keywordMatch}%</div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-2">Suggested Improvements</h4>
                <ul className="list-disc pl-5 space-y-2">
                  {analysis.suggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="text-sm">{suggestion}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </ToolWrapper>
  );
};

export default AIResumeScanner;
