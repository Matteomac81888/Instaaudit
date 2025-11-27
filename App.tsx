import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, FileJson, ArrowRight, Instagram, Moon, Sun, UploadCloud, FileArchive, Trash2, Loader2 } from 'lucide-react';
import Instructions from './components/Instructions';
import Results from './components/Results';
import { parseFollowers, parseFollowing, isValidFollowersFile, isValidFollowingFile } from './utils/parser';
import { AnalysisResult } from './types';
import JSZip from 'jszip';

function App() {
  const [view, setView] = useState<'upload' | 'results' | 'instructions'>('upload');
  const [darkMode, setDarkMode] = useState(true);
  
  // Raw file state
  const [followersFile, setFollowersFile] = useState<File | null>(null);
  const [followingFile, setFollowingFile] = useState<File | null>(null);
  
  // Parsed data state
  const [followersData, setFollowersData] = useState<AnalysisResult[]>([]);
  const [followingData, setFollowingData] = useState<AnalysisResult[]>([]);
  
  // Drag state
  const [dragActive, setDragActive] = useState<{followers: boolean; following: boolean; zip: boolean}>({
    followers: false,
    following: false,
    zip: false
  });
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  const [isProcessingZip, setIsProcessingZip] = useState(false);

  // Toggle Dark Mode
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [darkMode]);

  const validateAndSetFile = async (file: File, type: 'followers' | 'following') => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (type === 'followers') {
        if (isValidFollowersFile(json)) {
          setFollowersFile(file);
          setError(null);
        } else {
          setError(`Invalid Followers file. It looks like you uploaded a ${isValidFollowingFile(json) ? 'following' : 'different'} file.`);
        }
      } else {
        if (isValidFollowingFile(json)) {
          setFollowingFile(file);
          setError(null);
        } else {
          setError(`Invalid Following file. It looks like you uploaded a ${isValidFollowersFile(json) ? 'followers' : 'different'} file.`);
        }
      }
    } catch (e) {
      setError("Failed to parse JSON. Please check the file content.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'followers' | 'following' | 'zip') => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (type === 'zip') {
      processZipFile(file);
    } else {
      validateAndSetFile(file, type);
    }
  };

  const processZipFile = async (file: File) => {
    setIsProcessingZip(true);
    setError(null);
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      let foundFollowers: File | null = null;
      let foundFollowing: File | null = null;

      // Iterate through all files in the zip
      const filePromises: Promise<void>[] = [];
      
      contents.forEach((relativePath, zipEntry) => {
        if (zipEntry.dir) return;
        
        // Check for JSON files
        if (zipEntry.name.toLowerCase().endsWith('.json')) {
           const lowerName = zipEntry.name.toLowerCase();
           
           // Heuristic for file identification
           // Followers usually: "followers_1.json", "followers.json"
           // Following usually: "following.json"
           
           if (lowerName.includes('follower')) {
             filePromises.push((async () => {
                const text = await zipEntry.async('string');
                try {
                    const json = JSON.parse(text);
                    if (isValidFollowersFile(json)) {
                        const blob = await zipEntry.async('blob');
                        foundFollowers = new File([blob], zipEntry.name, { type: 'application/json' });
                    }
                } catch (e) { /* ignore parse errors for non-target files */ }
             })());
           } else if (lowerName.includes('following')) {
             filePromises.push((async () => {
                const text = await zipEntry.async('string');
                try {
                    const json = JSON.parse(text);
                    if (isValidFollowingFile(json)) {
                        const blob = await zipEntry.async('blob');
                        foundFollowing = new File([blob], zipEntry.name, { type: 'application/json' });
                    }
                } catch (e) { /* ignore */ }
             })());
           }
        }
      });

      await Promise.all(filePromises);

      if (foundFollowers && foundFollowing) {
        setFollowersFile(foundFollowers);
        setFollowingFile(foundFollowing);
        setError(null);
      } else if (foundFollowers) {
        setFollowersFile(foundFollowers);
        setError("Found 'Followers' file in ZIP but missing 'Following' file.");
      } else if (foundFollowing) {
        setFollowingFile(foundFollowing);
        setError("Found 'Following' file in ZIP but missing 'Followers' file.");
      } else {
        setError("Could not find valid 'followers' or 'following' JSON files in this ZIP.");
      }

    } catch (e) {
      console.error(e);
      setError("Error reading ZIP file.");
    } finally {
      setIsProcessingZip(false);
    }
  };

  // Drag Handlers
  const handleDrag = (e: React.DragEvent, type: 'followers' | 'following' | 'zip') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({...prev, [type]: true}));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({...prev, [type]: false}));
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'followers' | 'following' | 'zip') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({...prev, [type]: false}));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      if (type === 'zip') {
        if (file.name.endsWith('.zip')) {
          processZipFile(file);
        } else {
          setError("Please upload a .zip file in this area.");
        }
        return;
      }

      if (file.type === "application/json" || file.name.endsWith('.json')) {
        validateAndSetFile(file, type);
      } else {
        setError("Please upload a valid JSON file.");
      }
    }
  };

  const processFiles = async () => {
    if (!followersFile || !followingFile) {
      setError("Please upload both JSON files to continue.");
      return;
    }

    try {
      // Read Followers
      const followersText = await followersFile.text();
      const followersJson = JSON.parse(followersText);
      const parsedFollowers = parseFollowers(followersJson);

      // Read Following
      const followingText = await followingFile.text();
      const followingJson = JSON.parse(followingText);
      const parsedFollowing = parseFollowing(followingJson);

      setFollowersData(parsedFollowers);
      setFollowingData(parsedFollowing);
      setView('results');
    } catch (err: any) {
      console.error(err);
      setError("Error parsing files: " + (err.message || "Invalid JSON structure."));
    }
  };

  const reset = () => {
    setFollowersFile(null);
    setFollowingFile(null);
    setFollowersData([]);
    setFollowingData([]);
    setError(null);
    setView('upload');
  };

  const clearFiles = () => {
    setFollowersFile(null);
    setFollowingFile(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-pink-500/30">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2" onClick={reset} style={{cursor: 'pointer'}}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Instagram className="text-white w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-500 dark:from-white dark:to-slate-400">
                    InstaAudit
                </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
                <nav className="flex items-center gap-1 sm:gap-2 mr-2">
                    <button 
                        onClick={() => setView('upload')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'upload' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        Analyzer
                    </button>
                    <button 
                        onClick={() => setView('instructions')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'instructions' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                    >
                        Instructions
                    </button>
                </nav>
                
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Toggle Dark Mode"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {view === 'instructions' && <Instructions />}

        {view === 'results' && (
            <Results 
                followers={followersData} 
                following={followingData} 
                onReset={reset} 
            />
        )}

        {view === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
            
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Who isn't following you back?</h2>
                <p className="text-slate-600 dark:text-slate-400">Upload your Instagram JSON data to find out immediately.</p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* ZIP Upload Section */}
            <div 
                className={`
                    relative group border-2 border-dashed rounded-2xl p-8 transition-all
                    ${dragActive.zip 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 scale-[1.02]' 
                        : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-900'}
                `}
                onDragEnter={(e) => handleDrag(e, 'zip')}
                onDragLeave={(e) => handleDrag(e, 'zip')}
                onDragOver={(e) => handleDrag(e, 'zip')}
                onDrop={(e) => handleDrop(e, 'zip')}
            >
                <input 
                    type="file" 
                    accept=".zip"
                    onChange={(e) => handleFileChange(e, 'zip')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                    {isProcessingZip ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                            <span className="text-blue-600 dark:text-blue-400 font-medium">Processing ZIP file...</span>
                        </div>
                    ) : (
                        <>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${dragActive.zip ? 'bg-blue-200 dark:bg-blue-800' : 'bg-slate-200 dark:bg-slate-800'}`}>
                                <FileArchive className={`w-6 h-6 ${dragActive.zip ? 'text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`} />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Upload Data ZIP</h3>
                            <p className="text-sm text-slate-500">
                                Drag & drop your Instagram data ZIP file.<br/>
                                We'll automatically find the required JSONs inside.
                            </p>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-4 my-4">
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
                <span className="text-sm text-slate-400 font-medium uppercase tracking-wider">OR UPLOAD INDIVIDUALLY</span>
                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            </div>

            <div className="grid gap-6">
                {/* Followers Input */}
                <div 
                    className={`
                        relative group border-2 border-dashed rounded-2xl p-8 transition-all
                        ${dragActive.followers 
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 scale-[1.02]' 
                            : followersFile 
                                ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-500/5' 
                                : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-white dark:bg-slate-800/50'}
                    `}
                    onDragEnter={(e) => handleDrag(e, 'followers')}
                    onDragLeave={(e) => handleDrag(e, 'followers')}
                    onDragOver={(e) => handleDrag(e, 'followers')}
                    onDrop={(e) => handleDrop(e, 'followers')}
                >
                    <input 
                        type="file" 
                        accept=".json"
                        onChange={(e) => handleFileChange(e, 'followers')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={!!followersFile} 
                    />
                    <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                        {followersFile ? (
                            <>
                                <CheckCircle className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mb-3" />
                                <span className="text-emerald-700 dark:text-emerald-300 font-medium truncate max-w-xs">{followersFile.name}</span>
                                <span className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-1">Followers file ready</span>
                            </>
                        ) : (
                            <>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${dragActive.followers ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                    {dragActive.followers ? <UploadCloud className="w-6 h-6 text-emerald-600 dark:text-emerald-300" /> : <FileJson className="w-6 h-6 text-slate-500 dark:text-slate-400" />}
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Select Followers File</h3>
                                <p className="text-sm text-slate-500">Drag & drop <code className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-pink-600 dark:text-pink-400 font-mono">followers_1.json</code></p>
                            </>
                        )}
                    </div>
                </div>

                {/* Following Input */}
                <div 
                    className={`
                        relative group border-2 border-dashed rounded-2xl p-8 transition-all
                        ${dragActive.following 
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 scale-[1.02]' 
                            : followingFile 
                                ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-500/5' 
                                : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 bg-white dark:bg-slate-800/50'}
                    `}
                    onDragEnter={(e) => handleDrag(e, 'following')}
                    onDragLeave={(e) => handleDrag(e, 'following')}
                    onDragOver={(e) => handleDrag(e, 'following')}
                    onDrop={(e) => handleDrop(e, 'following')}
                >
                    <input 
                        type="file" 
                        accept=".json"
                        onChange={(e) => handleFileChange(e, 'following')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        disabled={!!followingFile}
                    />
                    <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                         {followingFile ? (
                            <>
                                <CheckCircle className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mb-3" />
                                <span className="text-emerald-700 dark:text-emerald-300 font-medium truncate max-w-xs">{followingFile.name}</span>
                                <span className="text-xs text-emerald-600/70 dark:text-emerald-500/70 mt-1">Following file ready</span>
                            </>
                        ) : (
                            <>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${dragActive.following ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                    {dragActive.following ? <UploadCloud className="w-6 h-6 text-emerald-600 dark:text-emerald-300" /> : <FileJson className="w-6 h-6 text-slate-500 dark:text-slate-400" />}
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Select Following File</h3>
                                <p className="text-sm text-slate-500">Drag & drop <code className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-pink-600 dark:text-pink-400 font-mono">following.json</code></p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-4 flex justify-center gap-4">
                {(followersFile || followingFile) && (
                  <button 
                      onClick={clearFiles}
                      className="flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                      <Trash2 className="w-5 h-5" /> Clear
                  </button>
                )}
                
                <button 
                    onClick={processFiles}
                    disabled={!followersFile || !followingFile}
                    className={`
                        flex items-center gap-2 px-8 py-3 rounded-full font-bold text-lg transition-all shadow-lg
                        ${(!followersFile || !followingFile) 
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none' 
                            : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-105 active:scale-95'}
                    `}
                >
                    Compare Files <ArrowRight className="w-5 h-5" />
                </button>
            </div>
            
            <p className="text-center text-xs text-slate-500 mt-8">
                Don't have your files yet? Check the <button onClick={() => setView('instructions')} className="text-pink-600 dark:text-pink-400 hover:underline">instructions tab</button>.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;