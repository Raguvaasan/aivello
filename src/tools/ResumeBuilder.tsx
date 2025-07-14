import React, { useState } from 'react';

const ResumeBuilder = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    summary: '',
    skills: '',
    experience: '',
  });
  const [generated, setGenerated] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleGenerate = () => {
    const result = `\nName: ${form.name}\nEmail: ${form.email}\nSummary: ${form.summary}\nSkills: ${form.skills}\nExperience: ${form.experience}`;
    setGenerated(result);
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold mb-4">AI Resume Builder</h2>
      <input className="w-full p-2 border rounded mb-2" name="name" placeholder="Name" onChange={handleChange} />
      <input className="w-full p-2 border rounded mb-2" name="email" placeholder="Email" onChange={handleChange} />
      <textarea className="w-full p-2 border rounded mb-2" name="summary" placeholder="Summary" onChange={handleChange} />
      <textarea className="w-full p-2 border rounded mb-2" name="skills" placeholder="Skills" onChange={handleChange} />
      <textarea className="w-full p-2 border rounded mb-2" name="experience" placeholder="Experience" onChange={handleChange} />
      <button onClick={handleGenerate} className="px-4 py-2 bg-blue-600 text-white rounded">
        Generate Resume
      </button>
      
      {generated && (
        <pre className="bg-gray-100 p-4 mt-4 rounded whitespace-pre-wrap">{generated}</pre>
      )}
    </div>
  );
};

export default ResumeBuilder;