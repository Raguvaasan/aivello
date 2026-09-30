/**
 * Resume exports: PDF (jsPDF) and Word (docx).
 *
 * Both libraries are imported lazily inside the builders so they are only downloaded
 * when the user exports. Only jsPDF's type is imported statically (erased at build).
 */
import type { jsPDF as JsPDF } from 'jspdf';
import {
  ACCENTS,
  FONTS,
  ResumeData,
  ResumeDesign,
  additionalDetails,
  displayUrl,
  filledCertifications,
  filledEducation,
  filledExperiences,
  filledLanguages,
  filledProjects,
  filledSkills,
  normalizeUrl,
  resumeLinks,
  skillLevelLabel,
  splitDescription,
  templateById,
} from './resumeBuilderData';
import { toPdfSafeText } from './pdfSafeText';
import { stripInvalidXmlChars } from './pdfToWordText';

const joinParts = (parts: Array<string | undefined>, separator: string) =>
  parts.map((p) => (p ?? '').trim()).filter(Boolean).join(separator);

const experienceTitle = (role: string, company: string) => joinParts([role, company], ' - ');
const certificationLine = (name: string, issuer: string, year: string) =>
  joinParts([joinParts([name, issuer], ' - '), year ? `(${year.trim()})` : ''], ' ');

const photoData = (dataUrl: string): { format: 'PNG' | 'JPEG'; bytes: Uint8Array } | null => {
  const match = /^data:image\/(png|jpeg);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  try {
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return { format: match[1] === 'png' ? 'PNG' : 'JPEG', bytes };
  } catch {
    return null;
  }
};

/* ==================================================================== PDF */

const PT = 0.3528; // mm per point
const MARGIN = 18;
const PAGE_BOTTOM = 297 - 16;
const PHOTO_SIZE = 28;
const TEXT: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [107, 114, 128];
const WHITE: [number, number, number] = [255, 255, 255];

type FontStyle = 'normal' | 'bold' | 'italic';

export const buildResumePdf = async (form: ResumeData, design: ResumeDesign): Promise<JsPDF> => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const template = templateById(design.templateId);
  const accent = ACCENTS[design.accent].rgb;
  const fontName = FONTS[design.font].pdf;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGIN * 2;
  const right = pageWidth - MARGIN;
  const safe = (s: string) => toPdfSafeText(s);

  doc.setProperties({ title: `${form.name.trim() || 'Resume'} - Resume`, creator: 'Aivello Resume Builder' });

  let y = MARGIN;
  const lineHeight = (size: number) => size * PT * 1.3;
  const setText = (size: number, style: FontStyle = 'normal', color: [number, number, number] = TEXT) => {
    doc.setFont(fontName, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const ensureSpace = (height: number) => {
    if (y + height > PAGE_BOTTOM) {
      doc.addPage();
      y = MARGIN;
    }
  };

  /** Writes wrapped text; `y` is the top of the next line. */
  const write = (
    text: string,
    opts: { size?: number; style?: FontStyle; color?: [number, number, number]; indent?: number; width?: number } = {}
  ) => {
    const { size = 10, style = 'normal', color = TEXT, indent = 0 } = opts;
    const width = opts.width ?? contentWidth - indent;
    setText(size, style, color);
    const lines: string[] = doc.splitTextToSize(safe(text), width);
    lines.forEach((line) => {
      ensureSpace(lineHeight(size));
      doc.text(line, MARGIN + indent, y + size * PT);
      y += lineHeight(size);
    });
  };

  const writeDescription = (text: string) => {
    splitDescription(text).forEach((part) => {
      if (part.bullet) {
        setText(10);
        ensureSpace(lineHeight(10));
        doc.text('•', MARGIN + 2, y + 10 * PT);
        write(part.text, { indent: 6 });
      } else {
        write(part.text);
      }
    });
  };

  /** Bold title on the left with an optional muted date right-aligned on the same line. */
  const writeEntryTitle = (title: string, date: string) => {
    setText(9.5, 'normal', MUTED);
    const dateText = safe(date.trim());
    const dateWidth = dateText ? doc.getTextWidth(dateText) + 4 : 0;
    setText(11, 'bold');
    const lines: string[] = doc.splitTextToSize(safe(title), contentWidth - dateWidth);
    ensureSpace(lineHeight(11) * Math.min(lines.length, 2) + lineHeight(10));
    lines.forEach((line, index) => {
      setText(11, 'bold');
      doc.text(line, MARGIN, y + 11 * PT);
      if (index === 0 && dateText) {
        setText(9.5, 'normal', MUTED);
        doc.text(dateText, right, y + 11 * PT, { align: 'right' });
      }
      y += lineHeight(11);
    });
  };

  const sectionHeading = (title: string) => {
    // Keep the heading with at least two lines of its content.
    ensureSpace(lineHeight(12) + 4 + lineHeight(10) * 2);
    y += 3;
    setText(12, 'bold', accent);
    doc.text(title.toUpperCase(), MARGIN, y + 12 * PT);
    y += lineHeight(12);
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, right, y);
    y += 2.5;
  };

  /* ---- Header ----------------------------------------------------------- */
  const photo = form.profilePhoto ? photoData(form.profilePhoto) : null;
  const band = template.header === 'band';
  const centered = template.header === 'center';
  const headerWidth = contentWidth - (photo ? PHOTO_SIZE + 6 : 0);
  const headerColor = band ? WHITE : TEXT;
  const subColor = band ? WHITE : MUTED;

  const links = resumeLinks(form);
  const headerRows: Array<{ text: string; size: number; style: FontStyle; color: [number, number, number] }> = [
    { text: form.name.trim() || 'Your Name', size: 22, style: 'bold', color: band ? WHITE : accent },
  ];
  if (form.targetRole.trim()) headerRows.push({ text: form.targetRole.trim(), size: 12, style: 'normal', color: headerColor });
  const contact = joinParts([form.email, form.phone, form.address], '  |  ');
  if (contact) headerRows.push({ text: contact, size: 9.5, style: 'normal', color: subColor });
  if (links.length) {
    headerRows.push({ text: links.map((l) => displayUrl(l.href)).join('  |  '), size: 9.5, style: 'normal', color: subColor });
  }

  const wrappedHeader = headerRows.map((row) => {
    setText(row.size, row.style);
    return { ...row, lines: doc.splitTextToSize(safe(row.text), headerWidth) as string[] };
  });
  const headerTextHeight = wrappedHeader.reduce((sum, row) => sum + row.lines.length * lineHeight(row.size), 0);
  const headerHeight = Math.max(headerTextHeight, photo ? PHOTO_SIZE : 0);

  if (band) {
    doc.setFillColor(...accent);
    doc.rect(0, 0, pageWidth, MARGIN + headerHeight + 8, 'F');
  }

  const headerTop = y;
  const textX = centered ? MARGIN + headerWidth / 2 : MARGIN;
  wrappedHeader.forEach((row) => {
    row.lines.forEach((line) => {
      setText(row.size, row.style, row.color);
      doc.text(line, textX, y + row.size * PT, centered ? { align: 'center' } : undefined);
      y += lineHeight(row.size);
    });
    if (row.size === 22) y += 1;
  });

  if (photo) {
    try {
      doc.addImage(photo.bytes, photo.format, right - PHOTO_SIZE, headerTop, PHOTO_SIZE, PHOTO_SIZE);
    } catch {
      // A damaged image must not block the rest of the export.
    }
  }

  y = headerTop + headerHeight + (band ? 12 : 4);
  if (!band) {
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, y - 2, right, y - 2);
    y += 1;
  }

  /* ---- Sections ---------------------------------------------------------- */
  if (form.summary.trim()) {
    sectionHeading('Professional Summary');
    write(form.summary.trim());
  }

  if (form.objective.trim()) {
    sectionHeading('Career Objective');
    write(form.objective.trim());
  }

  const experiences = filledExperiences(form);
  if (experiences.length) {
    sectionHeading('Experience');
    experiences.forEach((exp) => {
      writeEntryTitle(experienceTitle(exp.role, exp.company), exp.duration);
      if (exp.location.trim()) write(exp.location.trim(), { size: 9.5, style: 'italic', color: MUTED });
      if (exp.description.trim()) writeDescription(exp.description);
      y += 2;
    });
  }

  const projects = filledProjects(form);
  if (projects.length) {
    sectionHeading('Projects');
    projects.forEach((project) => {
      writeEntryTitle(project.title.trim(), '');
      const link = normalizeUrl(project.link);
      if (link) write(displayUrl(link), { size: 9.5, color: accent });
      if (project.description.trim()) writeDescription(project.description);
      y += 2;
    });
  }

  const education = filledEducation(form);
  if (education.length) {
    sectionHeading('Education');
    education.forEach((edu) => {
      writeEntryTitle(edu.degree.trim() || edu.institution.trim(), edu.year);
      const sub = joinParts([edu.degree.trim() ? edu.institution : '', edu.location], ', ');
      if (sub) write(sub, { size: 9.5, color: MUTED });
      if (edu.gpa.trim()) write(`GPA: ${edu.gpa.trim()}`, { size: 9.5, color: MUTED });
      y += 2;
    });
  }

  const skills = filledSkills(form);
  if (skills.length) {
    sectionHeading('Skills');
    write(skills.map((s) => `${s.name.trim()} (${skillLevelLabel(s.level)})`).join('   •   '));
  }

  const certifications = filledCertifications(form);
  if (certifications.length) {
    sectionHeading('Certifications');
    certifications.forEach((c) => {
      setText(10);
      ensureSpace(lineHeight(10));
      doc.text('•', MARGIN + 2, y + 10 * PT);
      write(certificationLine(c.name, c.issuer, c.year), { indent: 6 });
    });
  }

  const languages = filledLanguages(form);
  if (languages.length) {
    sectionHeading('Languages');
    write(
      languages
        .map((l) => (l.proficiency.trim() ? `${l.language.trim()} (${l.proficiency.trim()})` : l.language.trim()))
        .join('   •   ')
    );
  }

  const details = additionalDetails(form);
  if (details.length) {
    sectionHeading('Additional Information');
    details.forEach(([label, value]) => write(`${label}: ${value}`));
  }

  /* ---- Page numbers ------------------------------------------------------ */
  const pages = doc.getNumberOfPages();
  if (pages > 1) {
    for (let page = 1; page <= pages; page += 1) {
      doc.setPage(page);
      setText(8, 'normal', MUTED);
      doc.text(`Page ${page} of ${pages}`, right, 290, { align: 'right' });
    }
  }

  return doc;
};

/* =================================================================== DOCX */

// A4 in twentieths of a point, with 0.75in margins.
const DOCX_PAGE = { width: 11906, height: 16838, margin: 1080 };
const DOCX_RIGHT_TAB = DOCX_PAGE.width - DOCX_PAGE.margin * 2;

export const buildResumeDocx = async (form: ResumeData, design: ResumeDesign): Promise<Blob> => {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    ExternalHyperlink,
    ImageRun,
    Packer,
    Paragraph,
    ShadingType,
    Tab,
    TabStopType,
    TextRun,
  } = await import('docx');

  const template = templateById(design.templateId);
  const accent = ACCENTS[design.accent].hex.replace('#', '');
  const band = template.header === 'band';
  const alignment = template.header === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT;
  const clean = (s: string) => stripInvalidXmlChars(s.trim());
  const bandShading = band ? { type: ShadingType.CLEAR, color: 'auto', fill: accent } : undefined;
  const headerText = band ? 'FFFFFF' : undefined;
  const muted = band ? 'FFFFFF' : '6B7280';

  const children: InstanceType<typeof Paragraph>[] = [];

  /* ---- Header ---- */
  const photo = form.profilePhoto ? photoData(form.profilePhoto) : null;
  if (photo) {
    children.push(
      new Paragraph({
        alignment,
        shading: bandShading,
        children: [
          new ImageRun({
            type: photo.format === 'PNG' ? 'png' : 'jpg',
            data: photo.bytes,
            transformation: { width: 96, height: 96 },
            altText: { name: 'Profile photo', description: 'Profile photo', title: 'Profile photo' },
          }),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      alignment,
      shading: bandShading,
      spacing: { after: 40 },
      children: [new TextRun({ text: clean(form.name) || 'Your Name', bold: true, size: 44, color: band ? 'FFFFFF' : accent })],
    })
  );
  if (form.targetRole.trim()) {
    children.push(
      new Paragraph({
        alignment,
        shading: bandShading,
        children: [new TextRun({ text: clean(form.targetRole), size: 24, color: headerText })],
      })
    );
  }
  const contact = joinParts([form.email, form.phone, form.address], '  |  ');
  if (contact) {
    children.push(
      new Paragraph({
        alignment,
        shading: bandShading,
        children: [new TextRun({ text: clean(contact), size: 19, color: muted })],
      })
    );
  }
  const links = resumeLinks(form);
  if (links.length) {
    children.push(
      new Paragraph({
        alignment,
        shading: bandShading,
        children: links.flatMap((link, index) => [
          ...(index > 0 ? [new TextRun({ text: '  |  ', size: 19, color: muted })] : []),
          new ExternalHyperlink({
            link: link.href,
            children: [new TextRun({ text: displayUrl(link.href), style: 'Hyperlink', size: 19, color: band ? 'FFFFFF' : undefined })],
          }),
        ]),
      })
    );
  }

  /* ---- Building blocks ---- */
  const heading = (title: string) =>
    new Paragraph({
      spacing: { before: 280, after: 100 },
      keepNext: true,
      border: { bottom: { color: accent, space: 1, style: BorderStyle.SINGLE, size: 6 } },
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 24, color: accent })],
    });

  const entryTitle = (title: string, date: string) =>
    new Paragraph({
      keepNext: true,
      spacing: { before: 120 },
      tabStops: [{ type: TabStopType.RIGHT, position: DOCX_RIGHT_TAB }],
      children: [
        new TextRun({ text: clean(title), bold: true, size: 22 }),
        ...(date.trim() ? [new TextRun({ children: [new Tab(), clean(date)], size: 19, color: '6B7280' })] : []),
      ],
    });

  const subLine = (text: string, italics = false) =>
    new Paragraph({ children: [new TextRun({ text: clean(text), size: 19, color: '6B7280', italics })] });

  const body = (text: string) => new Paragraph({ children: [new TextRun({ text: clean(text) })] });

  const description = (text: string) =>
    splitDescription(text).map((part) =>
      part.bullet
        ? new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: clean(part.text) })] })
        : body(part.text)
    );

  /* ---- Sections ---- */
  if (form.summary.trim()) children.push(heading('Professional Summary'), ...description(form.summary));
  if (form.objective.trim()) children.push(heading('Career Objective'), ...description(form.objective));

  const experiences = filledExperiences(form);
  if (experiences.length) {
    children.push(heading('Experience'));
    experiences.forEach((exp) => {
      children.push(entryTitle(experienceTitle(exp.role, exp.company), exp.duration));
      if (exp.location.trim()) children.push(subLine(exp.location, true));
      if (exp.description.trim()) children.push(...description(exp.description));
    });
  }

  const projects = filledProjects(form);
  if (projects.length) {
    children.push(heading('Projects'));
    projects.forEach((project) => {
      children.push(entryTitle(project.title, ''));
      const link = normalizeUrl(project.link);
      if (link) {
        children.push(
          new Paragraph({
            children: [
              new ExternalHyperlink({ link, children: [new TextRun({ text: displayUrl(link), style: 'Hyperlink', size: 19 })] }),
            ],
          })
        );
      }
      if (project.description.trim()) children.push(...description(project.description));
    });
  }

  const education = filledEducation(form);
  if (education.length) {
    children.push(heading('Education'));
    education.forEach((edu) => {
      children.push(entryTitle(edu.degree.trim() || edu.institution.trim(), edu.year));
      const sub = joinParts([edu.degree.trim() ? edu.institution : '', edu.location], ', ');
      if (sub) children.push(subLine(sub));
      if (edu.gpa.trim()) children.push(subLine(`GPA: ${edu.gpa.trim()}`));
    });
  }

  const skills = filledSkills(form);
  if (skills.length) {
    children.push(heading('Skills'), body(skills.map((s) => `${s.name.trim()} (${skillLevelLabel(s.level)})`).join('   •   ')));
  }

  const certifications = filledCertifications(form);
  if (certifications.length) {
    children.push(heading('Certifications'));
    certifications.forEach((c) =>
      children.push(
        new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: clean(certificationLine(c.name, c.issuer, c.year)) })] })
      )
    );
  }

  const languages = filledLanguages(form);
  if (languages.length) {
    children.push(
      heading('Languages'),
      body(
        languages
          .map((l) => (l.proficiency.trim() ? `${l.language.trim()} (${l.proficiency.trim()})` : l.language.trim()))
          .join('   •   ')
      )
    );
  }

  const details = additionalDetails(form);
  if (details.length) {
    children.push(heading('Additional Information'));
    details.forEach(([label, value]) =>
      children.push(
        new Paragraph({ children: [new TextRun({ text: `${label}: `, bold: true }), new TextRun({ text: clean(value) })] })
      )
    );
  }

  const doc = new Document({
    creator: 'Aivello Resume Builder',
    title: `${clean(form.name) || 'Resume'} - Resume`,
    styles: {
      default: {
        document: {
          run: { font: FONTS[design.font].docx, size: 21 },
          paragraph: { spacing: { after: 60 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: DOCX_PAGE.width, height: DOCX_PAGE.height },
            margin: {
              top: DOCX_PAGE.margin,
              right: DOCX_PAGE.margin,
              bottom: DOCX_PAGE.margin,
              left: DOCX_PAGE.margin,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
};
