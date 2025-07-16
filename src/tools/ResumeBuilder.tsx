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
import { doc, setDoc,getDoc } from 'firebase/firestore';
import { db,auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

type Skill = { name: string; level: number };
type Lang = { language: string; proficiency: string };

const ResumeBuilder = () => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<number>(1);
  const [theme, setTheme] = useState<string>('blue');
  const [font, setFont] = useState<string>('sans');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    profilePhoto: '',
    summary: '',

    skills: [{ name: '', level: 3 }] as Skill[],
    languages: [{ language: '', proficiency: '' }] as Lang[],
    hobbies: [''] as string[],

    experiences: [{ company: '', role: '', duration: '', description: '' }],
    education: [{ institution: '', degree: '', year: '' }],
    projects: [{ title: '', description: '' }],
    certifications: [{ name: '', issuer: '', year: '' }],
    family: [{ relation: '', name: '', occupation: '' }],
    linkedin: '',
  });
const [user, setUser] = useState<any>(null); // store current user

  // Listen for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
     // console.log('Current user:', currentUser);
//       if (currentUser) {
//         // Load resume if saved before
//         const docRef = doc(db, 'resumes', currentUser.uid);
//         const docSnap:any = await getDoc(docRef);
//         if (docSnap.exists()) {
//         const data = docSnap.data();
//         // ✅ Load only if email is present
//         if (data.email) {
//           setForm(data);
//         } else {
//           console.warn('Resume exists but email is missing in the data.');
//         }
//       }
//       } else {
//         const defaultForm:any = {
//   name: '',
//   email: '',
//   phone: '',
//   address: '',
//   profilePhoto: '',
//   summary: '',
//   skills: [] as Skill[],
//   languages: [] as Lang[],
//   hobbies: [] as string[],
//   experiences: [] as {
//     company: string;
//     role: string;
//     duration: string;
//     description: string;
//   }[],
//   education: [] as {
//     institution: string;
//     degree: string;
//     duration: string;
//     description: string;
//   }[],
//   projects: [] as {
//     title: string;
//     link: string;
//     description: string;
//   }[],
//   certificates: [] as {
//     title: string;
//     authority: string;
//     year: string;
//   }[],
// };

//        setForm(defaultForm);
//       }
    });
    return () => unsubscribe();
  }, []);
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

  const onPrint = () => window.print();
  const autoFill = () => {
  setForm({
    name: 'Raj Kumar',
    email: 'rajkumar@example.com',
    phone: '9876543210',
    address: '123, Anna Nagar, Chennai',
    linkedin: 'https://www.linkedin.com/in/rajkumar',
    profilePhoto: '',
    summary:
      'Experienced software developer with 3+ years in frontend and backend technologies. Skilled in building scalable web apps using React and Node.js. Passionate about solving real-world problems through clean and efficient code.',
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
      },
    ],
    education: [
      {
        institution: 'Anna University',
        degree: 'B.E. Computer Science',
        year: '2020',
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
      },
    ],
    certifications: [
      {
        name: 'Full Stack Developer Certification',
        issuer: 'Coursera',
        year: '2022',
      },
    ],
  });
};
const saveToCloud = async () => {
  try {
    const resumeId = form.email || 'anonymous'; // unique ID
    await setDoc(doc(db, 'resumes', resumeId), form);
    alert('Resume saved to cloud!');
  } catch (err) {
    console.error('Error saving:', err);
    alert('Failed to save resume.');
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
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">AI Resume Builder</h2>

      <div className="flex gap-4 items-center">
        <label>PDF Template:</label>
        <select
          value={template}
          onChange={e => setTemplate(parseInt(e.target.value, 10))}
          className="p-1 border"
        >
          <option value={1}>Classic</option>
          <option value={2}>Modern</option>
        </select>
        <select onChange={(e) => setTheme(e.target.value)} className="border p-2">
          <option value="blue">Blue</option>
          <option value="green">Green</option>
          <option value="gray">Gray</option>
        </select>
        <select onChange={(e) => setFont(e.target.value)} className="border p-2">
          <option value="sans">Sans-serif</option>
          <option value="serif">Serif</option>
          <option value="mono">Monospace</option>
        </select>
        <Button variant="outline" onClick={loadFromCloud}>
    Load Resume
  </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core fields */}
        <Input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
        <Input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <Input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} />
        <Input name="address" placeholder="Address" value={form.address} onChange={handleChange} />
<Input name="linkedin" placeholder="LinkedIn URL" value={form.linkedin} onChange={handleChange} />
        {/* Profile Photo */}
        <div className="md:col-span-2">
          <label className="font-semibold">Upload Profile Photo</label>
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

        {/* Summary */}
        <Textarea
          name="summary"
          placeholder="Summary"
          value={form.summary}
          onChange={handleChange}
          className="md:col-span-2"
        />

        {/* Skills with ratings */}
        <div className="md:col-span-2">
          <h4 className="font-semibold">Skills (1–5 rating)</h4>
          {form.skills.map((s, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input
                name="name"
                placeholder="Skill"
                value={s.name}
                onChange={e => handleChange(e, i, 'skills')}
              />
              <Input
                name="level"
                type="number"
                min="1"
                max="5"
                value={s.level}
                onChange={e => handleChange(e, i, 'skills')}
                className="w-16"
              />
            </div>
          ))}
          <Button variant="outline" onClick={() => add('skills', { name: '', level: 3 })}>
            + Add Skill
          </Button>
        </div>

        {/* Languages */}
        <div className="md:col-span-2">
          <h4 className="font-semibold">Languages Known</h4>
          {form.languages.map((l, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input
                name="language"
                placeholder="Language"
                value={l.language}
                onChange={e => handleChange(e, i, 'languages', 'language')}
              />
              <Input
                name="proficiency"
                placeholder="Proficiency"
                value={l.proficiency}
                onChange={e => handleChange(e, i, 'languages', 'proficiency')}
              />
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() => add('languages', { language: '', proficiency: '' })}
          >
            + Add Language
          </Button>
        </div>

        {/* Hobbies */}
        <div className="md:col-span-2">
          <h4 className="font-semibold">Hobbies / Interests</h4>
          {form.hobbies.map((h, i) => (
            <Input
              key={i}
              name="hobby"
              placeholder={`Hobby #${i + 1}`}
              value={h}
              onChange={e => handleChange(e, i, 'hobbies')}
              className="mb-2"
            />
          ))}
          <Button variant="outline" onClick={() => add('hobbies', '')}>
            + Add Hobby
          </Button>
        </div>

        {/* Experiences */}
        <div className="md:col-span-2">
          <h4 className="font-semibold">Experience</h4>
          {form.experiences.map((exp, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <Input
                placeholder="Company"
                value={exp.company}
                onChange={e => handleChange(e, i, 'experiences', 'company')}
              />
              <Input
                placeholder="Role"
                value={exp.role}
                onChange={e => handleChange(e, i, 'experiences', 'role')}
              />
              <Input
                placeholder="Duration"
                value={exp.duration}
                onChange={e => handleChange(e, i, 'experiences', 'duration')}
              />
              <Textarea
                placeholder="Description"
                className="md:col-span-3"
                value={exp.description}
                onChange={e => handleChange(e, i, 'experiences', 'description')}
              />
            </div>
          ))}
          <Button variant="outline" onClick={() => add('experiences', { company: '', role: '', duration: '', description: '' })}>
            + Add Experience
          </Button>
        </div>

        {/* Education */}
        <div className="md:col-span-2">
          <h4 className="font-semibold">Education</h4>
          {form.education.map((edu, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <Input
                placeholder="Institution"
                value={edu.institution}
                onChange={e => handleChange(e, i, 'education', 'institution')}
              />
              <Input
                placeholder="Degree"
                value={edu.degree}
                onChange={e => handleChange(e, i, 'education', 'degree')}
              />
              <Input
                placeholder="Year"
                value={edu.year}
                onChange={e => handleChange(e, i, 'education', 'year')}
              />
            </div>
          ))}
          <Button variant="outline" onClick={() => add('education', { institution: '', degree: '', year: '' })}>
            + Add Education
          </Button>
        </div>

        {/* Projects */}
        <div className="md:col-span-2">
          <h4 className="font-semibold">Projects</h4>
          {form.projects.map((p, i) => (
            <div key={i} className="mb-2">
              <Input
                placeholder="Project Title"
                value={p.title}
                onChange={e => handleChange(e, i, 'projects', 'title')}
              />
              <Textarea
                placeholder="Project Description"
                value={p.description}
                onChange={e => handleChange(e, i, 'projects', 'description')}
              />
            </div>
          ))}
          <Button variant="outline" onClick={() => add('projects', { title: '', description: '' })}>
            + Add Project
          </Button>
        </div>

        {/* Certifications */}
        <div className="md:col-span-2">
          <h4 className="font-semibold">Certifications</h4>
          {form.certifications.map((c, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <Input
                placeholder="Certificate Name"
                value={c.name}
                onChange={e => handleChange(e, i, 'certifications', 'name')}
              />
              <Input
                placeholder="Issuer"
                value={c.issuer}
                onChange={e => handleChange(e, i, 'certifications', 'issuer')}
              />
              <Input
                placeholder="Year"
                value={c.year}
                onChange={e => handleChange(e, i, 'certifications', 'year')}
              />
            </div>
          ))}
          <Button variant="outline" onClick={() => add('certifications', { name: '', issuer: '', year: '' })}>
            + Add Certification
          </Button>
        </div>

        {/* Family */}
        <div className="md:col-span-2">
          <h4 className="font-semibold">Family Details</h4>
          {form.family.map((f, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <Input
                placeholder="Relation"
                value={f.relation}
                onChange={e => handleChange(e, i, 'family', 'relation')}
              />
              <Input
                placeholder="Name"
                value={f.name}
                onChange={e => handleChange(e, i, 'family', 'name')}
              />
              <Input
                placeholder="Occupation"
                value={f.occupation}
                onChange={e => handleChange(e, i, 'family', 'occupation')}
              />
            </div>
          ))}
          <Button variant="outline" onClick={() => add('family', { relation: '', name: '', occupation: '' })}>
            + Add Family Member
          </Button>
        </div>
      </div>

     <div className="flex flex-wrap gap-4 mt-6">
  <Button className="bg-green-600 text-white" onClick={downloadPDF}>
    Download PDF
  </Button>
  <Button variant="outline" onClick={downloadDOCX}>
    Download DOCX
  </Button>
  <Button variant="outline" onClick={onPrint}>
    Print
  </Button>
  <Button variant="outline" onClick={autoFill}>
    AI Suggest
  </Button>
  <Button variant="outline" onClick={saveToCloud}>
    Save to Cloud
  </Button>
 
</div>


      <Card className="mt-10 print:p-0 print:shadow-none">
        <CardContent ref={previewRef} className="p-4 space-y-2">
          {form.profilePhoto && (
            <img
              src={form.profilePhoto}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
          )}
          <h2 className="text-xl font-bold">{form.name}</h2>
          <p>{form.email} | {form.phone} | {form.address}</p>
{form.linkedin && (
            <div className="mt-2">
              <h4 className="font-semibold">LinkedIn QR</h4>
              <QRCode value={form.linkedin} size={64} />
            </div>
          )}

          <div>
            <h4 className="font-semibold">Summary</h4>
            <p>{form.summary}</p>
          </div>

          <div>
            <h4 className="font-semibold">Skills</h4>
            {form.skills.map((s, i) => (
              <p key={i}>{
                '★'.repeat(s.level) + '☆'.repeat(5 - s.level)
              } {s.name}</p>
            ))}
          </div>

          <div>
            <h4 className="font-semibold">Languages</h4>
            {form.languages.map((l, i) => (
              <p key={i}>{l.language} ({l.proficiency})</p>
            ))}
          </div>

          <div>
            <h4 className="font-semibold">Hobbies / Interests</h4>
            <p>{form.hobbies.filter(Boolean).join(', ')}</p>
          </div>

          <div>
            <h4 className="font-semibold">Experience</h4>
            {form.experiences.map((e, i) => (
              <div key={i}>
                <p className="font-semibold">{e.role} at {e.company} ({e.duration})</p>
                <p>{e.description}</p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-semibold">Education</h4>
            {form.education.map((e, i) => (
              <p key={i}>{e.degree} - {e.institution} ({e.year})</p>
            ))}
          </div>

          <div>
            <h4 className="font-semibold">Projects</h4>
            {form.projects.map((p, i) => (
              <div key={i}>
                <p className="font-semibold">{p.title}</p>
                <p>{p.description}</p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-semibold">Certifications</h4>
            {form.certifications.map((c, i) => (
              <p key={i}>{c.name} – {c.issuer} ({c.year})</p>
            ))}
          </div>

          <div>
            <h4 className="font-semibold">Family Details</h4>
            {form.family.map((f, i) => (
              <p key={i}>{f.relation}: {f.name} ({f.occupation})</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeBuilder;
