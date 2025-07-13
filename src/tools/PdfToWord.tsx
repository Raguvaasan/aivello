// File: src/tools/PdfToWord.tsx
import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function PdfToWord() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // const allText = await Promise.all(
      //   pages.map(async (page:any) => page.getTextContent?.()?.then?.(() => ''))
      // );

      const textContent = pages.map((page:any) => page.getTextContent());
      const extracted = (await Promise.all(textContent)).map((tc:any) =>
        tc.items.map((item: any) => item.str).join(' ')
      );

      setText(extracted.join('\n\n'));
    } catch (err) {
      console.error('Error extracting PDF text:', err);
      setText('Failed to extract text from PDF.');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">PDF to Word Converter</h2>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileUpload}
        className="mb-4"
      />
      {loading ? (
        <p>Extracting text...</p>
      ) : (
        <textarea
          value={text}
          readOnly
          rows={15}
          className="w-full p-3 border rounded resize-none"
        />
      )}
    </div>
  );
}
