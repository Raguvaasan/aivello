// ResumeBuilder.tsx

import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

import { QRCode } from 'react-qrcode-logo';

import { saveAs } from 'file-saver';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

type Skill = { name: string; level: number };
type Lang = { language: string; proficiency: string };
type AIAnalysis = {
  skillsGap: string[];
  industryTrends: string[];
  suggestions: string[];
  score: number;
};

interface ResumeTemplate {
  id: number;
  name: string;
  description: string;
  color: string;
  layout: 'modern' | 'classic' | 'creative' | 'minimal';
}

const resumeTemplates: ResumeTemplate[] = [
  { id: 1, name: 'Classic Professional', description: 'Traditional format for corporate roles', color: 'blue', layout: 'classic' },
  { id: 2, name: 'Modern Minimalist', description: 'Clean and contemporary design', color: 'gray', layout: 'modern' },
  { id: 3, name: 'Creative Bold', description: 'Eye-catching for creative industries', color: 'purple', layout: 'creative' },
  { id: 4, name: 'Tech Focused', description: 'Optimized for technical roles', color: 'green', layout: 'minimal' },
  { id: 5, name: 'Executive', description: 'Premium design for senior positions', color: 'navy', layout: 'classic' },
];

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Engineering', 
  'Design', 'Sales', 'Consulting', 'Legal', 'Media', 'Retail', 'Manufacturing'
];

const skillSuggestions = {
  'Technology': ['React', 'Node.js', 'Python', 'TypeScript', 'AWS', 'Docker', 'Git', 'SQL'],
  'Healthcare': ['Patient Care', 'Medical Records', 'HIPAA Compliance', 'Clinical Research'],
  'Finance': ['Financial Analysis', 'Excel', 'Risk Management', 'Regulatory Compliance'],
  'Marketing': ['Digital Marketing', 'SEO', 'Content Creation', 'Analytics', 'Social Media'],
  'Design': ['Adobe Creative Suite', 'Figma', 'UI/UX', 'Typography', 'Branding'],
  'Sales': ['CRM', 'Lead Generation', 'Negotiation', 'Customer Relations', 'Pipeline Management'],
};

const ResumeBuilder = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<number>(1);
  const [theme, setTheme] = useState<string>('blue');
  const [font, setFont] = useState<string>('sans');
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeScore, setResumeScore] = useState<number>(0);
  const [resumeVersion, setResumeVersion] = useState<number>(1);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    profilePhoto: '',
    summary: '',
    objective: '',
    skills: [{ name: '', level: 3 }] as Skill[],
    languages: [{ language: '', proficiency: '' }] as Lang[],
    hobbies: [''] as string[],
    experiences: [{ company: '', role: '', duration: '', description: '', location: '', achievements: [''] }],
    education: [{ institution: '', degree: '', year: '', gpa: '', location: '', coursework: [''] }],
    projects: [{ title: '', description: '', technologies: [''], link: '', duration: '' }],
    certifications: [{ name: '', issuer: '', year: '', expiryDate: '', credentialId: '' }],
    family: [{ relation: '', name: '', occupation: '' }],
    linkedin: '',
    github: '',
    portfolio: '',
    awards: [{ title: '', issuer: '', year: '', description: '' }],
    publications: [{ title: '', journal: '', year: '', coAuthors: [''] }],
    references: [{ name: '', title: '', company: '', email: '', phone: '', relationship: '' }],
    customSections: [{ title: '', content: '' }],
    targetRole: '',
    careerLevel: 'entry',
    industry: 'Technology',
    workAuthorization: '',
    salaryExpectation: '',
    availability: '',
    relocate: false,
  });
  const [user, setUser] = useState<any>(null);

  // Listen for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // AI-powered resume analysis
  const analyzeResume = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis - in production, this would call an AI service
      const analysis: AIAnalysis = {
        skillsGap: [],
        industryTrends: [],
        suggestions: [],
        score: 0
      };

      // Calculate resume completeness score
      let score = 0;
      if (form.name) score += 10;
      if (form.email) score += 10;
      if (form.phone) score += 10;
      if (form.summary) score += 15;
      if (form.experiences.length > 0 && form.experiences[0].company) score += 20;
      if (form.education.length > 0 && form.education[0].institution) score += 15;
      if (form.skills.length > 0 && form.skills[0].name) score += 10;
      if (form.projects.length > 0 && form.projects[0].title) score += 10;

      analysis.score = score;

      // Generate suggestions based on missing fields
      if (!form.summary) analysis.suggestions.push('Add a compelling professional summary');
      if (form.skills.length < 3) analysis.suggestions.push('Add more relevant skills for your industry');
      if (form.experiences.length === 0) analysis.suggestions.push('Include your work experience');
      if (!form.linkedin) analysis.suggestions.push('Add your LinkedIn profile');

      // Industry-specific suggestions
      const industrySkills = skillSuggestions[form.industry as keyof typeof skillSuggestions] || [];
      const missingSkills = industrySkills.filter(skill => 
        !form.skills.some(s => s.name.toLowerCase().includes(skill.toLowerCase()))
      );
      analysis.skillsGap = missingSkills.slice(0, 3);

      // Mock industry trends
      analysis.industryTrends = [
        'Remote work capabilities are highly valued',
        'AI and automation skills are in demand',
        'Cross-functional collaboration is important'
      ];

      setAiAnalysis(analysis);
      setResumeScore(score);
      
      // Provide user feedback based on score
      if (score >= 85) {
        alert('🎉 Excellent! Your resume scored ' + score + '/100. Your resume is well-optimized and ready to impress employers!');
      } else if (score >= 70) {
        alert('👍 Good job! Your resume scored ' + score + '/100. Consider implementing the suggestions to make it even better.');
      } else {
        alert('💡 Your resume scored ' + score + '/100. There\'s room for improvement. Check the AI suggestions to enhance your resume.');
      }
    } catch (error) {
      console.error('Error analyzing resume:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI content generation
  const generateContent = async (section: string) => {
    setIsGeneratingContent(true);
    try {
      // Simulate AI content generation
      let generatedContent = '';
      
      switch (section) {
        case 'summary':
          generatedContent = `Experienced ${form.targetRole || 'professional'} with ${form.careerLevel === 'entry' ? '1-2' : form.careerLevel === 'mid' ? '3-5' : '7+'} years of expertise in ${form.industry.toLowerCase()}. Proven track record of delivering high-quality results and driving business growth through innovative solutions and strategic thinking.`;
          setForm(prev => ({ ...prev, summary: generatedContent }));
          alert('✨ Professional summary generated successfully! Check the Summary section to review the content.');
          break;
        case 'objective':
          generatedContent = `Seeking a challenging ${form.targetRole || 'position'} in ${form.industry.toLowerCase()} where I can utilize my skills and experience to contribute to organizational success while advancing my career in a dynamic environment.`;
          setForm(prev => ({ ...prev, objective: generatedContent }));
          alert('🎯 Career objective generated successfully! Check the Objective section to review the content.');
          break;
        case 'skills':
          const suggestedSkills = skillSuggestions[form.industry as keyof typeof skillSuggestions] || [];
          const newSkills = [...form.skills];
          let addedCount = 0;
          
          suggestedSkills.slice(0, 5).forEach(skill => {
            if (!newSkills.some(s => s.name.toLowerCase() === skill.toLowerCase())) {
              newSkills.push({ name: skill, level: 3 });
              addedCount++;
            }
          });
          
          setForm(prev => ({ ...prev, skills: newSkills }));
          
          if (addedCount > 0) {
            alert(`✨ Success! Added ${addedCount} new skills for ${form.industry}!\n\nSkills added:\n${suggestedSkills.slice(0, addedCount).map(skill => '• ' + skill).join('\n')}`);
          } else {
            alert('🎯 All suggested skills are already in your resume! Your skills section is well-optimized.');
          }
          break;
      }

    } catch (error) {
      console.error('Error generating content:', error);
      alert('❌ Failed to generate content. Please try again or check your internet connection.');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // Extract keywords from job description
  const extractKeywords = (jobDesc: string) => {
    const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'do', 'does', 'did', 'this', 'that', 'these', 'those', 'a', 'an'];
    const words = jobDesc.toLowerCase().split(/\W+/).filter(word => 
      word.length > 2 && !commonWords.includes(word)
    );
    const frequency = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const keywordList = Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
    
    setKeywords(keywordList);
    
    if (keywordList.length > 0) {
      alert(`🔍 Found ${keywordList.length} key skills from the job description:\n\n${keywordList.map(kw => '• ' + kw).join('\n')}\n\nConsider adding these to your resume to improve ATS compatibility!`);
    } else {
      alert('⚠️ No specific keywords found. Try pasting a more detailed job description to get better keyword suggestions.');
    }
  };

  // Save version
  const saveVersion = async () => {
    try {
      const versionData = {
        ...form,
        version: resumeVersion,
        createdAt: new Date().toISOString(),
        templateId: template,
        theme,
        font
      };
      
      if (user) {
        await addDoc(collection(db, 'resumeVersions'), {
          ...versionData,
          userId: user.uid,
          timestamp: serverTimestamp()
        });
      }
      
      setResumeVersion(prev => prev + 1);
      alert('Version saved successfully!');
    } catch (error) {
      console.error('Error saving version:', error);
    }
  };

  // ATS (Applicant Tracking System) optimization
  const optimizeForATS = () => {
    const optimizations = [];
    
    // Check for ATS-friendly formatting
    if (form.summary.length < 50) {
      optimizations.push('Expand your summary to 2-3 sentences');
    }
    
    // Check for keywords
    if (keywords.length > 0) {
      const missingKeywords = keywords.filter(keyword => 
        !form.summary.toLowerCase().includes(keyword) &&
        !form.skills.some(skill => skill.name.toLowerCase().includes(keyword))
      );
      if (missingKeywords.length > 0) {
        optimizations.push(`Consider adding these keywords: ${missingKeywords.slice(0, 3).join(', ')}`);
      }
    }
    
    return optimizations;
  };

  // Export with progress tracking
  const exportWithProgress = async (format: 'pdf' | 'docx') => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      if (format === 'pdf') {
        await downloadPDF();
      } else {
        await downloadDOCX();
      }
      
      setExportProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        alert(`✅ Resume exported successfully as ${format.toUpperCase()}! Check your Downloads folder.`);
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      setExportProgress(0);
    }
  };
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    idx?: number,
    section?: string,
    field?: string
  ) => {
    const { name, value } = e.target;
    setForm(prev => {
      const clone: any = { ...prev };
      if (section && idx !== undefined) {
        if (section === 'hobbies') {
          clone.hobbies[idx] = value;
        } else if (section === 'skills') {
          clone.skills[idx][name] = name === 'level' ? +value : value;
        } else {
          clone[section][idx][field!] = value;
        }
      } else {
        clone[name] = value;
      }
      return clone;
    });
  };

  const add = (section: string, data: any) =>
    setForm(prev => ({ ...prev, [section]: [...(prev as any)[section], data] }));

  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    const write = (txt: string, indent = 0) => {
      doc.text(txt, 15 + indent * 10, y);
      y += 6;
      if (y > 270) { doc.addPage(); y = 20; }
    };

    if (form.profilePhoto) {
      doc.addImage(form.profilePhoto, 'JPEG', 150, 10, 40, 40);
    }

    doc.setFontSize(14);
    write(form.name);
    doc.setFontSize(11);
    write(`Email: ${form.email}`);
    write(`Phone: ${form.phone}`);
    write(`Address: ${form.address}`);
    y += 4;

    doc.setFont('helvetica', 'bold'); write('Summary:');
    doc.setFont('helvetica', 'normal');
    doc.text(doc.splitTextToSize(form.summary, 180), 15, y);
    y += 10;

    if (form.skills.length) {
      write('Skills:');
      form.skills.forEach(s => write(`• ${s.name} (${s.level}/5)`, 1));
      y += 4;
    }

    if (form.languages.length) {
      write('Languages:');
      form.languages.forEach(l => write(`• ${l.language} (${l.proficiency})`, 1));
      y += 4;
    }

    if (form.hobbies.length) {
      write('Hobbies:');
      form.hobbies.forEach(h => write(`• ${h}`, 1));
      y += 4;
    }

    const sections = {
      experiences: 'Experience:',
      education: 'Education:',
      projects: 'Projects:',
      certifications: 'Certifications:',
      family: 'Family Details:',
    } as const;

    (Object.keys(sections) as Array<keyof typeof sections>).forEach(sec => {
      const arr = (form as any)[sec];
      if (arr && arr.length) {
        write(sections[sec]);
        arr.forEach((item: any) => {
          if (sec === 'experiences') {
            write(`${item.role} at ${item.company} (${item.duration})`, 1);
            doc.text(doc.splitTextToSize(item.description, 160), 20, y);
            y += 10;
          } else if (sec === 'education') {
            write(`${item.degree} - ${item.institution} (${item.year})`, 1);
          } else if (sec === 'projects') {
            write(`• ${item.title}`, 1);
            doc.text(doc.splitTextToSize(item.description, 160), 20, y);
            y += 10;
          } else if (sec === 'certifications') {
            write(`• ${item.name} - ${item.issuer} (${item.year})`, 1);
          } else if (sec === 'family') {
            write(`${item.relation}: ${item.name} (${item.occupation})`, 1);
          }
        });
        y += 4;
      }
    });

    doc.save(`resume-template${template}.pdf`);
  };

  const downloadDOCX = async () => {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ children: [new TextRun({ text: form.name, bold: true, size: 28 })] }),
          new Paragraph(`Email: ${form.email}`),
          new Paragraph(`Phone: ${form.phone}`),
          new Paragraph(`Address: ${form.address}`),
          new Paragraph({
  children: [
    new TextRun({ text: 'Summary:', bold: true })
  ]
}),



          new Paragraph(form.summary),
          new Paragraph({
    children: [new TextRun({ text: 'Skills:', bold: true })],
  }),
  ...form.skills.map(s => new Paragraph(`• ${s.name} (${s.level}/5)`)),
  new Paragraph({
    children: [new TextRun({ text: 'Languages:', bold: true })],
  }),
  ...form.languages.map(l => new Paragraph(`• ${l.language} (${l.proficiency})`)),
  new Paragraph({
    children: [new TextRun({ text: 'Hobbies:', bold: true })],
  }),
  ...form.hobbies.map(h => new Paragraph(`• ${h}`)),
  new Paragraph({
    children: [new TextRun({ text: 'Experience:', bold: true })],
  }),
  ...form.experiences.flatMap(e => [
    new Paragraph(`${e.role} at ${e.company} (${e.duration})`),
    new Paragraph(e.description),
  ]),
  new Paragraph({
    children: [new TextRun({ text: 'Education:', bold: true })],
  }),
  ...form.education.map(e => new Paragraph(`${e.degree} - ${e.institution} (${e.year})`)),
  new Paragraph({
    children: [new TextRun({ text: 'Projects:', bold: true })],
  }),
  ...form.projects.flatMap(p => [
    new Paragraph(`• ${p.title}`),
    new Paragraph(p.description),
  ]),
  new Paragraph({
    children: [new TextRun({ text: 'Certifications:', bold: true })],
  }),
  ...form.certifications.map(c => new Paragraph(`• ${c.name} - ${c.issuer} (${c.year})`)),
  new Paragraph({
    children: [new TextRun({ text: 'Family Details:', bold: true })],
  }),
  ...form.family.map(f => new Paragraph(`${f.relation}: ${f.name} (${f.occupation})`)),
]
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'resume.docx');
  };

  const onPrint = () => {
    window.print();
    // Show feedback after print dialog
    setTimeout(() => {
      alert('🖨️ Print dialog opened! Make sure to review the print preview before printing.');
    }, 500);
  };
  const autoFill = () => {
  setForm({
    name: 'Raj Kumar',
    email: 'rajkumar@example.com',
    phone: '9876543210',
    address: '123, Anna Nagar, Chennai',
    linkedin: 'https://www.linkedin.com/in/rajkumar',
    website: 'https://rajkumar.dev',
    github: 'https://github.com/rajkumar',
    portfolio: 'https://rajkumar.dev/portfolio',
    profilePhoto: '',
    summary:
      'Experienced software developer with 3+ years in frontend and backend technologies. Skilled in building scalable web apps using React and Node.js. Passionate about solving real-world problems through clean and efficient code.',
    objective: 'Seeking a challenging role in software development to leverage my technical skills and contribute to innovative projects.',
    skills: [
      { name: 'React', level: 4 },
      { name: 'Node.js', level: 4 },
      { name: 'TypeScript', level: 4 },
    ],
    languages: [{ language: 'English', proficiency: 'Fluent' }],
    hobbies: ['Coding', 'Reading', 'Cycling'],
    experiences: [
      {
        company: 'TCS',
        role: 'Frontend Developer',
        duration: '2020 - 2023',
        description:
          'Worked on large-scale React applications with REST API integration, optimizing UI performance and accessibility.',
        location: 'Chennai, India',
        achievements: ['Improved app performance by 40%', 'Led team of 5 developers']
      },
    ],
    education: [
      {
        institution: 'Anna University',
        degree: 'B.E. Computer Science',
        year: '2020',
        gpa: '8.5/10',
        location: 'Chennai, India',
        coursework: ['Data Structures', 'Algorithms', 'Web Development']
      },
    ],
    family: [
      { relation: 'Father', name: 'Kumarasamy', occupation: 'Retired Teacher' },
      { relation: 'Mother', name: 'Lakshmi', occupation: 'Homemaker' },
    ],
    projects: [
      {
        title: 'AI Resume Builder',
        description:
          'Built a resume generator using React and TypeScript with AI-powered content suggestion and PDF/DOCX export support.',
        technologies: ['React', 'TypeScript', 'AI'],
        link: 'https://github.com/rajkumar/resume-builder',
        duration: '3 months'
      },
    ],
    certifications: [
      {
        name: 'Full Stack Developer Certification',
        issuer: 'Coursera',
        year: '2022',
        expiryDate: '2025',
        credentialId: 'ABC123'
      },
    ],
    awards: [{ title: 'Best Developer Award', issuer: 'TCS', year: '2022', description: 'Recognized for outstanding performance' }],
    publications: [{ title: 'Building Scalable Web Apps', journal: 'Tech Magazine', year: '2023', coAuthors: ['John Doe'] }],
    references: [{ name: 'Jane Smith', title: 'Team Lead', company: 'TCS', email: 'jane@tcs.com', phone: '9876543210', relationship: 'Manager' }],
    customSections: [{ title: 'Volunteer Work', content: 'Teaching programming to underprivileged children' }],
    targetRole: 'Senior Frontend Developer',
    careerLevel: 'mid',
    industry: 'Technology',
    workAuthorization: 'citizen',
    salaryExpectation: '$80,000 - $100,000',
    availability: 'immediate',
    relocate: true,
  });
  
  alert('🚀 Demo data loaded successfully! This is sample data to show you how your resume will look. You can now customize it with your own information.');
};
const saveToCloud = async () => {
  try {
    const resumeId = form.email || 'anonymous'; // unique ID
    await setDoc(doc(db, 'resumes', resumeId), form);
    alert('☁️ Resume saved to cloud successfully! Your resume is now backed up and can be accessed from any device.');
  } catch (err) {
    console.error('Error saving:', err);
    alert('❌ Failed to save resume to cloud. Please check your internet connection and try again.');
  }
};
const loadFromCloud = async () => {
  const resumeId = form.email;
  if (!resumeId) return alert('Enter email to load your resume');
  const ref = doc(db, 'resumes', resumeId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    setForm(snap.data() as typeof form);
    alert('Resume loaded!');
  } else {
    alert('No resume found.');
  }
};


  return (
    <ToolWrapper
      toolId="resume-builder"
      toolName="AI Resume Builder"
      toolDescription="Create professional resumes with AI assistance. Build, customize, and download your resume in PDF or Word format"
      toolCategory="Career"
    >
      <div className="min-h-screen bg-white dark:bg-gray-900 p-6 space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI-Powered Resume Builder</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Resume Score:</span>
              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div 
                  className="h-2 bg-green-500 dark:bg-green-400 rounded-full transition-all duration-300"
                  style={{ width: `${resumeScore}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{resumeScore}%</span>
            </div>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="flex items-center space-x-4 mb-6">
          {['Basic Info', 'Experience', 'Skills', 'Education', 'Review'].map((step, index) => (
            <button
              key={step}
              onClick={() => setCurrentStep(index + 1)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStep === index + 1
                  ? 'bg-blue-500 dark:bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {index + 1}. {step}
            </button>
          ))}
        </div>

        {/* AI Analysis Panel */}
        {aiAnalysis && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300">AI Analysis & Suggestions</h3>
                <Button 
                  variant="outline" 
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setShowAiSuggestions(!showAiSuggestions)}
                >
                  {showAiSuggestions ? 'Hide' : 'Show'} Details
                </Button>
              </div>
              
              {showAiSuggestions && (
                <div className="space-y-4">
                  {aiAnalysis.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2">Improvement Suggestions:</h4>
                      <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                        {aiAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {aiAnalysis.skillsGap.length > 0 && (
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2">Trending Skills in {form.industry}:</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiAnalysis.skillsGap.map((skill, index) => (
                          <button
                            key={index}
                            onClick={() => add('skills', { name: skill, level: 3 })}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {aiAnalysis.industryTrends.length > 0 && (
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2">Industry Trends:</h4>
                      <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
                        {aiAnalysis.industryTrends.map((trend, index) => (
                          <li key={index}>{trend}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Job Description Analyzer */}
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Job Description Analyzer</h3>
            <div className="space-y-4">
              <Textarea
                placeholder="Paste the job description here to get AI-powered keyword suggestions..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={() => extractKeywords(jobDescription)}
                  disabled={!jobDescription.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Extract Keywords
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const optimizations = optimizeForATS();
                    alert(optimizations.length > 0 ? optimizations.join('\n') : 'Your resume is well-optimized for ATS!');
                  }}
                >
                  Check ATS Compatibility
                </Button>
              </div>
              {keywords.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-700 mb-2">Extracted Keywords:</h4>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Template Selection */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4">Choose Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {resumeTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => setTemplate(tmpl.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    template === tmpl.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-full h-20 rounded mb-2 bg-${tmpl.color}-100`} />
                  <h4 className="font-medium text-sm">{tmpl.name}</h4>
                  <p className="text-xs text-gray-600">{tmpl.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Industry & Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Target Industry</label>
            <select
              value={form.industry}
              onChange={(e) => setForm(prev => ({ ...prev, industry: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            >
              {industries.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Target Role</label>
            <Input
              name="targetRole"
              placeholder="e.g., Software Engineer"
              value={form.targetRole}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Career Level</label>
            <select
              value={form.careerLevel}
              onChange={(e) => setForm(prev => ({ ...prev, careerLevel: e.target.value }))}
              className="w-full p-2 border rounded-lg"
            >
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="executive">Executive</option>
            </select>
          </div>
        </div>

        {/* AI Content Generation */}
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-purple-800 mb-4">AI Content Assistant</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => generateContent('summary')}
                disabled={isGeneratingContent}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGeneratingContent ? 'Generating...' : 'Generate Summary'}
              </Button>
              <Button
                onClick={() => generateContent('objective')}
                disabled={isGeneratingContent}
                variant="outline"
              >
                Generate Objective
              </Button>
              <Button
                onClick={() => generateContent('skills')}
                disabled={isGeneratingContent}
                variant="outline"
              >
                Suggest Skills
              </Button>
              <Button
                onClick={analyzeResume}
                disabled={isAnalyzing}
                variant="outline"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Theme:</label>
            <select onChange={(e) => setTheme(e.target.value)} className="border p-2 rounded">
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="purple">Purple</option>
              <option value="gray">Gray</option>
              <option value="navy">Navy</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Font:</label>
            <select onChange={(e) => setFont(e.target.value)} className="border p-2 rounded">
              <option value="sans">Sans-serif</option>
              <option value="serif">Serif</option>
              <option value="mono">Monospace</option>
            </select>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button variant="outline" onClick={loadFromCloud}>
            Load Resume
          </Button>
          <Button variant="outline" onClick={saveVersion}>
            Save Version
          </Button>
        </div>

        {/* Skills Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Skills & Proficiency</h4>
            <Button
              variant="outline"
              onClick={() => generateContent('skills')}
              disabled={isGeneratingContent}
              className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
            >
              {isGeneratingContent ? '🎯 Suggesting...' : '🎯 AI Suggest'}
            </Button>
          </div>
          {form.skills.map((skill, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                name="name"
                placeholder="Skill name"
                value={skill.name}
                onChange={e => handleChange(e, i, 'skills')}
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Level:</span>
                <Input
                  name="level"
                  type="number"
                  min="1"
                  max="5"
                  value={skill.level}
                  onChange={e => handleChange(e, i, 'skills')}
                  className="w-16"
                />
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={() => add('skills', { name: '', level: 3 })}>
            + Add Skill
          </Button>
        </div>

        {/* Languages Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Languages</h4>
          {form.languages.map((lang, i) => (
            <div key={i} className="flex gap-2">
              <Input
                name="language"
                placeholder="Language"
                value={lang.language}
                onChange={e => handleChange(e, i, 'languages', 'language')}
                className="flex-1"
              />
              <Input
                name="proficiency"
                placeholder="Proficiency Level"
                value={lang.proficiency}
                onChange={e => handleChange(e, i, 'languages', 'proficiency')}
                className="flex-1"
              />
            </div>
          ))}
          <Button variant="outline" onClick={() => add('languages', { language: '', proficiency: '' })}>
            + Add Language
          </Button>
        </div>

        {/* Experience Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Work Experience</h4>
          {form.experiences.map((exp, i) => (
            <Card key={i} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  placeholder="Company Name"
                  value={exp.company}
                  onChange={e => handleChange(e, i, 'experiences', 'company')}
                />
                <Input
                  placeholder="Job Title"
                  value={exp.role}
                  onChange={e => handleChange(e, i, 'experiences', 'role')}
                />
                <Input
                  placeholder="Duration (e.g., Jan 2020 - Present)"
                  value={exp.duration}
                  onChange={e => handleChange(e, i, 'experiences', 'duration')}
                />
                <Input
                  placeholder="Location"
                  value={exp.location}
                  onChange={e => handleChange(e, i, 'experiences', 'location')}
                />
              </div>
              <Textarea
                placeholder="Job description and key achievements..."
                value={exp.description}
                onChange={e => handleChange(e, i, 'experiences', 'description')}
                className="mb-4"
              />
            </Card>
          ))}
          <Button variant="outline" onClick={() => add('experiences', { 
            company: '', 
            role: '', 
            duration: '', 
            description: '', 
            location: '', 
            achievements: [''] 
          })}>
            + Add Experience
          </Button>
        </div>

        {/* Education Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Education</h4>
          {form.education.map((edu, i) => (
            <Card key={i} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Institution Name"
                  value={edu.institution}
                  onChange={e => handleChange(e, i, 'education', 'institution')}
                />
                <Input
                  placeholder="Degree/Program"
                  value={edu.degree}
                  onChange={e => handleChange(e, i, 'education', 'degree')}
                />
                <Input
                  placeholder="Graduation Year"
                  value={edu.year}
                  onChange={e => handleChange(e, i, 'education', 'year')}
                />
                <Input
                  placeholder="GPA (optional)"
                  value={edu.gpa}
                  onChange={e => handleChange(e, i, 'education', 'gpa')}
                />
              </div>
            </Card>
          ))}
          <Button variant="outline" onClick={() => add('education', { 
            institution: '', 
            degree: '', 
            year: '', 
            gpa: '', 
            location: '', 
            coursework: [''] 
          })}>
            + Add Education
          </Button>
        </div>

        {/* Projects Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Projects</h4>
          {form.projects.map((project, i) => (
            <Card key={i} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input
                  placeholder="Project Title"
                  value={project.title}
                  onChange={e => handleChange(e, i, 'projects', 'title')}
                />
                <Input
                  placeholder="Project Link (optional)"
                  value={project.link}
                  onChange={e => handleChange(e, i, 'projects', 'link')}
                />
              </div>
              <Textarea
                placeholder="Project description..."
                value={project.description}
                onChange={e => handleChange(e, i, 'projects', 'description')}
              />
            </Card>
          ))}
          <Button variant="outline" onClick={() => add('projects', { 
            title: '', 
            description: '', 
            technologies: [''], 
            link: '', 
            duration: '' 
          })}>
            + Add Project
          </Button>
        </div>

        {/* Certifications Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Certifications</h4>
          {form.certifications.map((cert, i) => (
            <Card key={i} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Certification Name"
                  value={cert.name}
                  onChange={e => handleChange(e, i, 'certifications', 'name')}
                />
                <Input
                  placeholder="Issuing Organization"
                  value={cert.issuer}
                  onChange={e => handleChange(e, i, 'certifications', 'issuer')}
                />
                <Input
                  placeholder="Year Obtained"
                  value={cert.year}
                  onChange={e => handleChange(e, i, 'certifications', 'year')}
                />
              </div>
            </Card>
          ))}
          <Button variant="outline" onClick={() => add('certifications', { 
            name: '', 
            issuer: '', 
            year: '', 
            expiryDate: '', 
            credentialId: '' 
          })}>
            + Add Certification
          </Button>
        </div>

        {/* Enhanced Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Information */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
              <Input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
              <Input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />
              <Input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
              <Input name="linkedin" placeholder="LinkedIn URL" value={form.linkedin} onChange={handleChange} />
              <Input name="github" placeholder="GitHub URL" value={form.github} onChange={handleChange} />
              <Input name="website" placeholder="Personal Website" value={form.website} onChange={handleChange} />
              <Input name="portfolio" placeholder="Portfolio URL" value={form.portfolio} onChange={handleChange} />
            </div>
          </div>

          {/* Profile Photo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Profile Photo</label>
            <Input
              type="file"
              accept="image/*"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) {
                  const rdr = new FileReader();
                  rdr.onload = () =>
                    setForm(prev => ({ ...prev, profilePhoto: rdr.result as string }));
                  rdr.readAsDataURL(f);
                }
              }}
            />
          </div>

          {/* Professional Summary */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Professional Summary</label>
              <Button
                variant="outline"
                onClick={() => generateContent('summary')}
                disabled={isGeneratingContent}
                className="bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700"
              >
                {isGeneratingContent ? '🤖 Generating...' : '🤖 AI Generate'}
              </Button>
            </div>
            <Textarea
              name="summary"
              placeholder="Professional summary highlighting your key achievements and skills..."
              value={form.summary}
              onChange={handleChange}
              className="min-h-[100px]"
            />
          </div>

          {/* Career Objective */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Career Objective</label>
              <Button
                variant="outline"
                onClick={() => generateContent('objective')}
                disabled={isGeneratingContent}
                className="bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700"
              >
                {isGeneratingContent ? '🤖 Generating...' : '🤖 AI Generate'}
              </Button>
            </div>
            <Textarea
              name="objective"
              placeholder="Career objective and goals..."
              value={form.objective}
              onChange={handleChange}
            />
          </div>

          {/* Work Authorization */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Work Authorization</label>
                <select
                  value={form.workAuthorization}
                  onChange={(e) => setForm(prev => ({ ...prev, workAuthorization: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select Status</option>
                  <option value="citizen">US Citizen</option>
                  <option value="permanent">Permanent Resident</option>
                  <option value="visa">Visa Holder</option>
                  <option value="sponsorship">Require Sponsorship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Availability</label>
                <select
                  value={form.availability}
                  onChange={(e) => setForm(prev => ({ ...prev, availability: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select Availability</option>
                  <option value="immediate">Immediate</option>
                  <option value="2weeks">2 Weeks</option>
                  <option value="1month">1 Month</option>
                  <option value="negotiable">Negotiable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Salary Expectation</label>
                <Input
                  name="salaryExpectation"
                  placeholder="e.g., $80,000 - $100,000"
                  value={form.salaryExpectation}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Export Options */}
        <div className="flex flex-wrap gap-4 mt-6">
          <Button 
            className="bg-green-600 text-white hover:bg-green-700" 
            onClick={() => exportWithProgress('pdf')}
            disabled={isExporting}
          >
            {isExporting ? `Exporting... ${exportProgress}%` : 'Download PDF'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportWithProgress('docx')}
            disabled={isExporting}
          >
            Download DOCX
          </Button>
          <Button variant="outline" onClick={onPrint}>
            Print Resume
          </Button>
          <Button variant="outline" onClick={autoFill}>
            AI Demo Data
          </Button>
          <Button variant="outline" onClick={saveToCloud}>
            Save to Cloud
          </Button>
        </div>

        {/* Export Progress */}
        {isExporting && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">Exporting resume... {exportProgress}%</p>
          </div>
        )}

        {/* Resume Preview */}
        {showPreview && (
          <Card className="mt-10 print:p-0 print:shadow-none">
            <CardContent ref={previewRef} className="p-6 space-y-4">
              {/* Header Section */}
              <div className="flex items-start gap-6 border-b pb-4">
                {form.profilePhoto && (
                  <img
                    src={form.profilePhoto}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
                  <p className="text-gray-600">{form.targetRole}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                    <span>{form.email}</span>
                    <span>{form.phone}</span>
                    <span>{form.address}</span>
                  </div>
                  <div className="flex gap-4 mt-2">
                    {form.linkedin && (
                      <a href={form.linkedin} className="text-blue-600 text-sm hover:underline">
                        LinkedIn
                      </a>
                    )}
                    {form.github && (
                      <a href={form.github} className="text-blue-600 text-sm hover:underline">
                        GitHub
                      </a>
                    )}
                    {form.website && (
                      <a href={form.website} className="text-blue-600 text-sm hover:underline">
                        Website
                      </a>
                    )}
                  </div>
                </div>
                {form.linkedin && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">LinkedIn QR</p>
                    <QRCode value={form.linkedin} size={64} />
                  </div>
                )}
              </div>

              {/* Professional Summary */}
              {form.summary && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Summary</h3>
                  <p className="text-gray-700">{form.summary}</p>
                </div>
              )}

              {/* Career Objective */}
              {form.objective && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Career Objective</h3>
                  <p className="text-gray-700">{form.objective}</p>
                </div>
              )}

              {/* Skills */}
              {form.skills.length > 0 && form.skills[0].name && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {form.skills.map((skill, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="font-medium">{skill.name}</span>
                        <div className="flex">
                          {'★'.repeat(skill.level)}
                          {'☆'.repeat(5 - skill.level)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {form.experiences.length > 0 && form.experiences[0].company && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Experience</h3>
                  {form.experiences.map((exp, i) => (
                    <div key={i} className="mb-4 last:mb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">{exp.role}</h4>
                          <p className="text-gray-600">{exp.company}</p>
                        </div>
                        <span className="text-sm text-gray-500">{exp.duration}</span>
                      </div>
                      <p className="text-gray-700">{exp.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Education */}
              {form.education.length > 0 && form.education[0].institution && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Education</h3>
                  {form.education.map((edu, i) => (
                    <div key={i} className="mb-2 last:mb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{edu.degree}</h4>
                          <p className="text-gray-600">{edu.institution}</p>
                        </div>
                        <span className="text-sm text-gray-500">{edu.year}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {form.projects.length > 0 && form.projects[0].title && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Projects</h3>
                  {form.projects.map((project, i) => (
                    <div key={i} className="mb-4 last:mb-0">
                      <h4 className="font-semibold text-gray-800">{project.title}</h4>
                      <p className="text-gray-700">{project.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Additional sections can be added here */}
            </CardContent>
          </Card>
        )}
      </div>
    </ToolWrapper>
  );
};

export default ResumeBuilder;
