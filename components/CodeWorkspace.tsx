
import React from 'react';
import { ProjectFile } from '../types';
import { FileText, Cpu, Info, Zap } from 'lucide-react';

interface CodeWorkspaceProps {
  file?: ProjectFile;
}

const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({ file }) => {
  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-600">
        Select a file to view code
      </div>
    );
  }

  // Sample static code for visualization if file has no content yet
  const displayContent = file.content === "Reading content..." 
    ? `/**
 * @file ${file.name}
 * DevStudio AI Analysis Pending...
 */

import React from 'react';

export const ${file.name.split('.')[0]} = () => {
  // Logic will be analyzed here
  return (
    <div>
      <h1>Analyzing Component Identity...</h1>
    </div>
  );
};` : file.content;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
      <div className="flex-1 overflow-auto p-6 code-font text-sm leading-relaxed">
        <pre className="text-slate-300 whitespace-pre-wrap">
          {displayContent}
        </pre>
      </div>

      {/* Analysis Overlay/Quick Info */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <Cpu className="w-4 h-4" />
            <span className="text-xs font-bold">Architecture</span>
          </div>
          <p className="text-[10px] text-slate-500">React Functional Pattern detected. Hooks-based state management.</p>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 text-yellow-400 mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-bold">Performance</span>
          </div>
          <p className="text-[10px] text-slate-500">Low complexity. Render cycles appear optimized.</p>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
          <div className="flex items-center gap-2 text-green-400 mb-1">
            <Info className="w-4 h-4" />
            <span className="text-xs font-bold">Best Practices</span>
          </div>
          <p className="text-[10px] text-slate-500">Prop-types or TS interfaces recommended for robust scaling.</p>
        </div>
      </div>
    </div>
  );
};

export default CodeWorkspace;
