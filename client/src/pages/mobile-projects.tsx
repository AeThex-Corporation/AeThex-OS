import { useState, useEffect } from 'react';
import { X, Plus, Folder, GitBranch } from 'lucide-react';
import { useLocation } from 'wouter';
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  progress: number;
  created_at?: string;
}

export default function MobileProjects() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      if (!user) {
        setProjects([
          {
            id: 'demo',
            name: 'Sign in to view projects',
            description: 'Create and manage your development projects',
            status: 'active',
            progress: 0
          }
        ]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped = data.map(p => ({
          id: p.id.toString(),
          name: p.name || 'Untitled Project',
          description: p.description || 'No description',
          status: (p.status || 'active') as 'active' | 'completed' | 'archived',
          progress: p.progress || 0,
          created_at: p.created_at
        }));
        setProjects(mapped);
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-900/40 border-emerald-500/40';
      case 'completed': return 'bg-cyan-900/40 border-cyan-500/40';
      default: return 'bg-gray-900/40 border-gray-500/40';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-cyan-500';
    if (progress >= 75) return 'bg-emerald-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-cyan-500/20">
        <div className="px-4 py-4 safe-area-inset-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  navigate('/');
                  haptics.light();
                }}
                className="p-2 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 transition-colors"
              >
                <X className="w-6 h-6 text-cyan-400" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-white uppercase tracking-wider">
                  PROJECTS
                </h1>
                <p className="text-xs text-cyan-300 font-mono">{projects.length} items</p>
              </div>
            </div>
            <button className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition-colors">
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="px-4 py-4">
        <div className="space-y-3">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => haptics.light()}
              className={`w-full text-left rounded-lg p-4 border transition-all ${getStatusColor(project.status)}`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-cyan-600/30">
                  <Folder className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white uppercase">{project.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{project.description}</p>
                </div>
                <div className="text-xs font-mono px-2 py-1 bg-gray-800 rounded">
                  {project.status}
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(project.progress)} transition-all`}
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">{project.progress}% complete</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
