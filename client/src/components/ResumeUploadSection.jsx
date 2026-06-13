// client/src/components/ResumeUploadSection.jsx
// Resume list and upload-dropzone section with slot and selection handling.

import React, { useRef } from 'react';
import { useComingSoon } from '../context/ComingSoonContext';

/**
 * ResumeUploadSection
 * Renders uploaded resume cards, selection/delete actions, and upload slot availability.
 * @param {Object} props
 * @param {Array<{id:number,title:string,target_role?:string,uploadedDate:string,size?:string}>} props.uploadedResumes
 * @param {number} props.MAX_RESUMES
 * @param {(event: React.ChangeEvent<HTMLInputElement>) => void} props.onResumeUpload
 * @param {(resumeId:number) => void} props.onDeleteResume
 * @param {(resumeId:number) => void} [props.onSelectResume]
 * @param {number|null} [props.selectedResumeId]
 */
const ResumeUploadSection = ({ 
  uploadedResumes, 
  MAX_RESUMES, 
  onResumeUpload, 
  onDeleteResume,
  onSelectResume,
  selectedResumeId
}) => {
  const { openComingSoon } = useComingSoon();
  const fileInputRef = useRef(null);
  const resumeCount = uploadedResumes.length;

  const handleBrowseClick = (event) => {
    event.preventDefault();
    if (resumeCount < MAX_RESUMES) {
      fileInputRef.current?.click();
    }
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Resume Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your professional documents and keep them up to date.</p>
        </div>
        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider w-fit">
          {resumeCount} of {MAX_RESUMES} slots used
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-1">Uploaded Resumes</h3>
          
          {uploadedResumes.map((resume) => (
            <div 
              key={resume.id} 
              onClick={() => onSelectResume?.(resume.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all shadow-sm hover:shadow-md cursor-pointer group ${
                selectedResumeId === resume.id
                  ? 'bg-primary/5 border-primary dark:bg-primary/10 dark:border-primary'
                  : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark'
              }`}
            >
              <div className={`flex items-center justify-center shrink-0 size-12 rounded-lg ${
                resume.type === 'pdf' 
                  ? 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400'
              }`}>
                <span className="material-symbols-outlined text-[28px]">
                  {resume.type === 'pdf' ? 'picture_as_pdf' : 'description'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 dark:text-white font-medium truncate">{resume.title || resume.name}</p>
                {resume.target_role && (
                  <p className="text-xs text-primary/80 font-medium truncate mt-0.5">→ {resume.target_role}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Uploaded {resume.uploadedDate}</p>
                  {resume.size && <><span className="text-gray-300">•</span><p className="text-xs text-gray-500 dark:text-gray-400">{resume.size}</p></>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteResume(resume.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          ))}

          {resumeCount < MAX_RESUMES && (
            <div className="flex items-center gap-4 bg-transparent border-2 border-dashed border-border-light dark:border-border-dark p-4 rounded-xl min-h-[88px] justify-center text-gray-400 dark:text-gray-600">
              <span className="text-sm font-medium">{MAX_RESUMES - resumeCount} Slot{MAX_RESUMES - resumeCount > 1 ? 's' : ''} Remaining</span>
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2 lg:mb-3 opacity-0 pointer-events-none">Upload</h3>
          <div className={`h-full min-h-[220px] bg-surface-light dark:bg-surface-dark rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-8 text-center group relative overflow-hidden ${
            resumeCount >= MAX_RESUMES 
              ? 'border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-50'
              : 'border-primary/30 hover:border-primary hover:bg-primary/5 cursor-pointer'
          }`}>
            <div className="absolute inset-0 bg-[radial-gradient(#ec7f13_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none"></div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx"
              onChange={onResumeUpload}
              disabled={resumeCount >= MAX_RESUMES}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
            />
            <div className={`size-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 transition-transform ${
              resumeCount < MAX_RESUMES ? 'group-hover:scale-110' : ''
            }`}>
              <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Upload Resume</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-[200px]">
              {resumeCount >= MAX_RESUMES 
                ? 'Maximum uploads reached'
                : 'Drag & drop your file here or click to browse'
              }
            </p>
            <button 
              disabled={resumeCount >= MAX_RESUMES}
              onClick={handleBrowseClick}
              className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative z-20 pointer-events-auto"
            >
              Browse Files
            </button>
            <p className="text-xs text-gray-400 mt-4">Word/DOCX only (Max 3MB)</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResumeUploadSection;