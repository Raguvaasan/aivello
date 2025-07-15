import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

const ResumeBuilder = () => {
  const previewRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    profilePhoto: '',
    summary: '',
    skills: [''],
    experiences: [{ company: '', role: '', duration: '', description: '' }],
    education: [{ institution: '', degree: '', year: '' }],
    family: [{ relation: '', name: '', occupation: '' }],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index?: number,
    section?: string,
    field?: string
  ) => {
    const { name, value } = e.target;

    if (section === 'skills') {
      const updatedSkills = [...form.skills];
      if (typeof index === 'number') updatedSkills[index] = value;
      setForm({ ...form, skills: updatedSkills });
    } else if (section === 'experiences') {
      const updatedExp: any = [...form.experiences];
      if (typeof index === 'number' && field) updatedExp[index][field] = value;
      setForm({ ...form, experiences: updatedExp });
    } else if (section === 'education') {
      const updatedEdu: any = [...form.education];
      if (typeof index === 'number' && field) updatedEdu[index][field] = value;
      setForm({ ...form, education: updatedEdu });
    } else if (section === 'family') {
      const updatedFam: any = [...form.family];
      if (typeof index === 'number' && field) updatedFam[index][field] = value;
      setForm({ ...form, family: updatedFam });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const addSkill = () => setForm({ ...form, skills: [...form.skills, ''] });
  const addExperience = () => setForm({ ...form, experiences: [...form.experiences, { company: '', role: '', duration: '', description: '' }] });
  const addEducation = () => setForm({ ...form, education: [...form.education, { institution: '', degree: '', year: '' }] });
  const addFamily = () => setForm({ ...form, family: [...form.family, { relation: '', name: '', occupation: '' }] });

  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;

    if (form.profilePhoto) {
      doc.addImage(form.profilePhoto, 'JPEG', 150, 10, 40, 40);
    }

    doc.setFontSize(14);
    doc.text(form.name, 15, y); y += 8;
    doc.setFontSize(11);
    doc.text(`Email: ${form.email}`, 15, y); y += 6;
    doc.text(`Phone: ${form.phone}`, 15, y); y += 6;
    doc.text(`Address: ${form.address}`, 15, y); y += 10;

    doc.setFont("helvetica", 'bold');
    doc.text('Summary:', 15, y); y += 6;
    doc.setFont("helvetica", 'normal');
    doc.text(doc.splitTextToSize(form.summary, 180), 15, y);
    y += 10;

    doc.setFont("helvetica", 'bold');
    doc.text('Skills:', 15, y); y += 6;
    doc.setFont("helvetica", 'normal');
    form.skills.filter(Boolean).forEach(skill => {
      doc.text(`• ${skill}`, 20, y);
      y += 6;
    });

    doc.setFont("helvetica", 'bold');
    doc.text('Experience:', 15, y); y += 6;
    doc.setFont("helvetica", 'normal');
    form.experiences.forEach(exp => {
      doc.text(`${exp.role} at ${exp.company} (${exp.duration})`, 15, y);
      y += 6;
      doc.text(doc.splitTextToSize(exp.description, 180), 20, y);
      y += 10;
    });

    doc.setFont("helvetica", 'bold');
    doc.text('Education:', 15, y); y += 6;
    doc.setFont("helvetica", 'normal');
    form.education.forEach(edu => {
      doc.text(`${edu.degree} - ${edu.institution} (${edu.year})`, 15, y);
      y += 6;
    });

    if (form.family.length > 0) {
      doc.setFont("helvetica", 'bold');
      doc.text('Family Details:', 15, y); y += 6;
      doc.setFont("helvetica", 'normal');
      form.family.forEach(f => {
        doc.text(`${f.relation}: ${f.name} (${f.occupation})`, 20, y);
        y += 6;
      });
    }

    doc.save('resume.pdf');
  };

  const autoFill = () => {
    setForm({
      name: 'Raj Kumar',
      email: 'rajkumar@example.com',
      phone: '9876543210',
      address: '123, Anna Nagar, Chennai',
      profilePhoto: '',
      summary: 'Experienced software developer with expertise in frontend and backend development.',
      skills: ['React', 'Node.js', 'TypeScript'],
      experiences: [
        {
          company: 'TCS',
          role: 'Frontend Developer',
          duration: '2020 - 2023',
          description: 'Worked on large-scale React applications with integration to REST APIs.',
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
    });
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">AI Resume Builder</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input name="name" placeholder="Name" onChange={handleChange} />
        <Input name="email" placeholder="Email" onChange={handleChange} />
        <Input name="phone" placeholder="Phone Number" onChange={handleChange} />
        <Input name="address" placeholder="Address" onChange={handleChange} />

        <div className="mb-4 md:col-span-2">
          <label className="block font-semibold mb-1">Upload Profile Photo</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setForm(prev => ({ ...prev, profilePhoto: reader.result as string }));
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>

        <Textarea name="summary" placeholder="Professional Summary" onChange={handleChange} className="md:col-span-2" />

        <div className="md:col-span-2">
          <h4 className="font-semibold mb-1">Skills</h4>
          {form.skills.map((skill, index) => (
            <Input
              key={index}
              value={skill}
              onChange={(e) => handleChange(e, index, 'skills')}
              placeholder={`Skill #${index + 1}`}
              className="mb-2"
            />
          ))}
          <Button variant="outline" onClick={addSkill}>+ Add Skill</Button>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-semibold mb-1">Experience</h4>
          {form.experiences.map((exp, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <Input placeholder="Company" value={exp.company} onChange={(e) => handleChange(e, index, 'experiences', 'company')} />
              <Input placeholder="Role" value={exp.role} onChange={(e) => handleChange(e, index, 'experiences', 'role')} />
              <Input placeholder="Duration" value={exp.duration} onChange={(e) => handleChange(e, index, 'experiences', 'duration')} />
              <Textarea placeholder="Description" className="md:col-span-3" value={exp.description} onChange={(e) => handleChange(e, index, 'experiences', 'description')} />
            </div>
          ))}
          <Button variant="outline" onClick={addExperience}>+ Add Experience</Button>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-semibold mb-1">Education</h4>
          {form.education.map((edu, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <Input placeholder="Institution" value={edu.institution} onChange={(e) => handleChange(e, index, 'education', 'institution')} />
              <Input placeholder="Degree" value={edu.degree} onChange={(e) => handleChange(e, index, 'education', 'degree')} />
              <Input placeholder="Year" value={edu.year} onChange={(e) => handleChange(e, index, 'education', 'year')} />
            </div>
          ))}
          <Button variant="outline" onClick={addEducation}>+ Add Education</Button>
        </div>

        <div className="md:col-span-2">
          <h4 className="font-semibold mb-1">Family Details</h4>
          {form.family.map((member, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
              <Input placeholder="Relation" value={member.relation} onChange={(e) => handleChange(e, index, 'family', 'relation')} />
              <Input placeholder="Name" value={member.name} onChange={(e) => handleChange(e, index, 'family', 'name')} />
              <Input placeholder="Occupation" value={member.occupation} onChange={(e) => handleChange(e, index, 'family', 'occupation')} />
            </div>
          ))}
          <Button variant="outline" onClick={addFamily}>+ Add Family Member</Button>
        </div>
      </div>

      <div className="flex justify-between items-center mt-6 gap-4">
        <Button className="bg-green-600 text-white" onClick={downloadPDF}>Download as PDF</Button>
        <Button variant="outline" onClick={autoFill}>AI Suggest</Button>

      </div>

      <Card className="mt-10">
        <CardContent ref={previewRef} className="p-4 space-y-2">
          {form.profilePhoto && <img src={form.profilePhoto} alt="Profile" className="w-24 h-24 object-cover rounded-full" />}
          <h2 className="text-xl font-bold">{form.name}</h2>
          <p>{form.email}</p>
          <p>{form.phone}</p>
          <p>{form.address}</p>
          <p>{form.summary}</p>

          <div>
            <h4 className="font-semibold mt-4">Skills:</h4>
            <ul className="list-disc ml-5">
              {form.skills.filter(Boolean).map((skill, idx) => <li key={idx}>{skill}</li>)}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mt-4">Experience:</h4>
            {form.experiences.map((exp, idx) => (
              <div key={idx}>
                <p className="font-semibold">{exp.role} at {exp.company} ({exp.duration})</p>
                <p>{exp.description}</p>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-semibold mt-4">Education:</h4>
            {form.education.map((edu, idx) => (
              <p key={idx}>{edu.degree} - {edu.institution} ({edu.year})</p>
            ))}
          </div>

          <div>
            <h4 className="font-semibold mt-4">Family Details:</h4>
            {form.family.map((f, idx) => (
              <p key={idx}>{f.relation}: {f.name} ({f.occupation})</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeBuilder;
