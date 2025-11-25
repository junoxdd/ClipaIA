import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './services/supabaseClient';
import { Job, JobStatus, Clip } from './types';
import { Play, Download, Loader2, AlertCircle, Video, Scissors, Sparkles, Youtube } from 'lucide-react';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchClips = useCallback(async (jobId: string) => {
    const { data, error } = await supabase
      .from('clips')
      .select('*')
      .eq('job_id', jobId);
    
    if (error) {
      console.error('Error fetching clips:', error);
      return;
    }
    setClips(data as Clip[]);
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError(null);
    setClips([]);
    setCurrentJob(null);

    try {
      // 1. Create Job in Supabase
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert([{ youtube_url: url, status: JobStatus.PENDING }])
        .select()
        .single();

      if (jobError) throw jobError;

      const job = jobData as Job;
      setCurrentJob(job);

      // 2. Trigger Backend Processing
      fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, youtube_url: url }),
      }).then(async (res) => {
        if (!res.ok) {
           const errData = await res.json();
           console.error("API Error", errData);
           // If immediate error, we might want to set status to error in DB or UI
        }
      }).catch(err => {
         console.error("Failed to trigger API asynchronously", err);
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to create job');
      setLoading(false);
    }
  };

  // Realtime Subscription
  useEffect(() => {
    if (!currentJob) return;

    const channel = supabase
      .channel('job-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `id=eq.${currentJob.id}`,
        },
        (payload) => {
          const updatedJob = payload.new as Job;
          setCurrentJob(updatedJob);
          
          if (updatedJob.status === JobStatus.DONE) {
            setLoading(false);
            fetchClips(updatedJob.id);
          } else if (updatedJob.status === JobStatus.ERROR) {
            setLoading(false);
            setError('The video could not be processed. It might be too long (>10m) or restricted.');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentJob, fetchClips]);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse duration-700" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-12 md:py-20 space-y-12">
        
        {/* Header */}
        <header className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="bg-gradient-to-tr from-purple-500 to-blue-500 p-3.5 rounded-2xl shadow-xl shadow-purple-500/20">
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Culto<span className="text-purple-400">Clips</span>
            </h1>
          </div>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Turn long YouTube videos into <span className="text-white font-semibold">viral shorts</span> instantly.
            <br className="hidden md:block"/> Powered by Gemini AI.
          </p>
        </header>

        {/* Input Section */}
        <section className="max-w-3xl mx-auto">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-2 rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-white/5">
            <form onSubmit={handleCreateJob} className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Youtube className="h-5 w-5 text-slate-500 group-focus-within:text-red-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube URL here..."
                  className="w-full h-14 bg-slate-950/50 border border-transparent text-white rounded-xl pl-12 pr-4 focus:bg-slate-900 focus:ring-2 focus:ring-purple-500/50 focus:outline-none transition-all placeholder:text-slate-600 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !url}
                className="h-14 bg-white text-slate-950 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold px-8 rounded-xl transition-all flex items-center justify-center gap-2 md:min-w-[180px] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>Processing</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <span>Generate</span>
                  </>
                )}
              </button>
            </form>
          </div>
          
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-200 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-100">Generation Failed</p>
                <p className="text-sm opacity-80">{error}</p>
              </div>
            </div>
          )}
        </section>

        {/* Status Section */}
        {currentJob && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Processing State */}
            {(currentJob.status === JobStatus.PENDING || currentJob.status === JobStatus.PROCESSING) && (
               <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center border-t border-slate-800">
                 <div className="relative">
                    <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse"></div>
                    <Loader2 className="w-16 h-16 text-purple-400 animate-spin relative z-10" />
                 </div>
                 <div className="space-y-2 max-w-md">
                    <h3 className="text-2xl font-bold text-white">Extracting Gold...</h3>
                    <p className="text-slate-400">
                        AI is analyzing the video structure, finding viral hooks, and rendering clips.
                    </p>
                    <div className="pt-4 flex justify-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-bounce"></span>
                    </div>
                 </div>
               </div>
            )}

            {/* Results Grid */}
            {clips.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-800"></div>
                  <h2 className="text-slate-400 text-sm uppercase tracking-widest font-bold">Results</h2>
                  <div className="h-px flex-1 bg-slate-800"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {clips.map((clip) => (
                    <div key={clip.id} className="group bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-purple-500/50 transition-all hover:shadow-2xl hover:shadow-purple-900/20 flex flex-col">
                      <div className="aspect-[9/16] bg-black relative overflow-hidden">
                         <video 
                            src={clip.download_url} 
                            className="w-full h-full object-cover"
                            controls
                            preload="metadata"
                         />
                      </div>
                      <div className="p-6 flex flex-col gap-4 flex-1">
                        <div className="space-y-2 flex-1">
                            <h3 className="font-bold text-lg leading-tight text-white group-hover:text-purple-300 transition-colors">
                            {clip.title}
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                            {clip.summary}
                            </p>
                        </div>
                        <a 
                          href={clip.download_url} 
                          download
                          className="flex items-center justify-center gap-2 w-full py-3.5 bg-white/5 hover:bg-white text-white hover:text-black rounded-xl text-sm font-bold transition-all border border-white/10"
                        >
                          <Download className="w-4 h-4" />
                          Download HD Clip
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
};

export default App;