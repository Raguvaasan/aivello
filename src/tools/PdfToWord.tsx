import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaFilePdf, FaFileWord, FaDownload, FaTrash, FaSpinner } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ExtractedText {
  pageNumber: number;
  content: string;
}

export default function PdfToWord() {
  const [extractedText, setExtractedText] = useState<ExtractedText[]>([]);
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a valid PDF file.');
      return;
    }

    setLoading(true);
    setError('');
    setExtractedText([]);
    setFileName(file.name.replace('.pdf', ''));

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const extractedPages: ExtractedText[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (pageText) {
          extractedPages.push({
            pageNumber: pageNum,
            content: pageText
          });
        }
      }

      if (extractedPages.length === 0) {
        setError('No text found in the PDF. The PDF might contain only images or be password protected.');
      } else {
        setExtractedText(extractedPages);
      }
    } catch (err) {
      console.error('Error extracting PDF text:', err);
      setError('Failed to extract text from PDF. Please ensure the file is not corrupted or password protected.');
    }
    
    setLoading(false);
  };

  const generateWordDocument = async () => {
    if (extractedText.length === 0) return;

    setConverting(true);
    
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Converted from: ${fileName}.pdf`,
                  bold: true,
                  size: 28,
                }),
              ],
              spacing: { after: 400 },
            }),
            ...extractedText.flatMap((page, index) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Page ${page.pageNumber}`,
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: { before: 200, after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: page.content,
                    size: 22,
                  }),
                ],
                spacing: { after: 300 },
              }),
            ]),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${fileName}_converted.docx`);
      
    } catch (err) {
      console.error('Error generating Word document:', err);
      setError('Failed to generate Word document. Please try again.');
    }
    
    setConverting(false);
  };

  const resetTool = () => {
    setExtractedText([]);
    setFileName('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getTotalWords = () => {
    return extractedText.reduce((total, page) => {
      return total + page.content.split(' ').filter(word => word.length > 0).length;
    }, 0);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <IconWrapper icon={FaFilePdf} className="text-3xl text-red-600" />
          <IconWrapper icon={FaFileWord} className="text-3xl text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            PDF to Word Converter
          </h2>
        </div>

        {/* File Upload Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select PDF File
          </label>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileUpload}
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                       file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {extractedText.length > 0 && (
              <button
                onClick={resetTool}
                className="p-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg 
                         transition-colors duration-200"
                title="Clear and start over"
              >
                <IconWrapper icon={FaTrash} />
              </button>
            )}
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 
                       text-red-700 dark:text-red-300 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <IconWrapper icon={FaSpinner} className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Extracting text from PDF...</p>
          </motion.div>
        )}

        {/* Results Section */}
        {extractedText.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {extractedText.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Pages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {getTotalWords().toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Words</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {extractedText.reduce((total, page) => total + page.content.length, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Characters</div>
                </div>
              </div>
            </div>

            {/* Convert Button */}
            <div className="text-center">
              <button
                onClick={generateWordDocument}
                disabled={converting}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400
                         text-white font-medium rounded-lg transition-colors duration-200
                         flex items-center gap-3 mx-auto"
              >
                {converting ? (
                  <>
                    <IconWrapper icon={FaSpinner} className="animate-spin" />
                    Converting to Word...
                  </>
                ) : (
                  <>
                    <IconWrapper icon={FaDownload} />
                    Download as Word Document
                  </>
                )}
              </button>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Text Preview
              </h3>
              <div className="max-h-96 overflow-y-auto space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {extractedText.map((page, index) => (
                  <div key={index} className="border-b border-gray-200 dark:border-gray-600 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        Page {page.pageNumber}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({page.content.split(' ').filter(word => word.length > 0).length} words)
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {page.content.length > 500 
                        ? page.content.substring(0, 500) + '...' 
                        : page.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
            💡 How to use:
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>• Upload any PDF file to extract its text content</li>
            <li>• Preview the extracted text before conversion</li>
            <li>• Download as a properly formatted Word document (.docx)</li>
            <li>• Maintains page structure and provides word/character counts</li>
            <li>• Works with text-based PDFs (not scanned images)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
