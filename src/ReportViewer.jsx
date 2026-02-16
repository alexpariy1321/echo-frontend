import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const ReportViewer = ({ manager, files, onClose }) => {
  const [content, setContent] = useState('Loading...');

  useEffect(() => {
    if (files && files.length > 0) {
      fetch(`/api/files/${files[0]}`).then(r => r.text()).then(setContent).catch(() => setContent('Error'));
    } else {
      setContent('No report found.');
    }
  }, [files]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col p-6">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-bold">AI Report: {manager}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">Close</button>
        </div>
        <div className="overflow-y-auto prose max-w-none">
           <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
export default ReportViewer;
