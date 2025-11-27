import React from 'react';
import { Download, FileJson, ShieldCheck } from 'lucide-react';

const Instructions: React.FC = () => {
  return (
    <div className="space-y-6 text-slate-600 dark:text-slate-300 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
          Privacy First
        </h3>
        <p className="leading-relaxed">
          Your data is processed <strong>entirely on your device</strong> (in your browser). 
          We never upload your files to any server. You can turn off your internet connection 
          after loading this page and it will still work.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Download className="w-6 h-6 text-blue-500 dark:text-blue-400" />
          How to get your data
        </h3>
        
        <ol className="list-decimal list-inside space-y-4 pl-2">
          <li className="p-2">
            Open the <strong className="text-slate-900 dark:text-white">Instagram App</strong> on your phone.
          </li>
          <li className="p-2">
            Go to your profile <span className="text-slate-400">→</span> Tap the menu (≡) <span className="text-slate-400">→</span> <strong className="text-slate-900 dark:text-white">Your activity</strong>.
          </li>
          <li className="p-2">
            Scroll down to <strong className="text-slate-900 dark:text-white">Download your information</strong>.
          </li>
          <li className="p-2">
            Tap <strong className="text-slate-900 dark:text-white">Download or transfer information</strong> <span className="text-slate-400">→</span> Select "Some of your information".
          </li>
          <li className="p-2">
            Scroll down and select <strong className="text-slate-900 dark:text-white">Followers and following</strong>.
          </li>
          <li className="p-2">
            Select <strong className="text-slate-900 dark:text-white">Download to device</strong>.
          </li>
          <li className="p-2">
            <span className="bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-sm font-medium mr-2">IMPORTANT</span>
            Set format to <strong className="text-slate-900 dark:text-white">JSON</strong> (not HTML). Date range: "All time".
          </li>
          <li className="p-2">
            Once Instagram emails you the file, download and unzip it. Look for <code className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-pink-600 dark:text-pink-400 font-mono text-sm">followers_1.json</code> and <code className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-pink-600 dark:text-pink-400 font-mono text-sm">following.json</code> inside the "connections" folder.
          </li>
        </ol>
      </div>
    </div>
  );
};

export default Instructions;