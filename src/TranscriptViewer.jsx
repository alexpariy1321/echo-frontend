import React from 'react';

const TranscriptViewer = ({ manager, files, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col p-6">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-bold">{manager} Transcripts</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500">Close</button>
        </div>
        <div className="overflow-y-auto space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="p-3 bg-gray-50 rounded hover:bg-gray-100 flex justify-between">
               <span className="text-sm truncate">{file.split('/').pop()}</span>
               <a href={`/api/files/${file}`} target="_blank" className="text-blue-600 text-sm">Open</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default TranscriptViewer;
