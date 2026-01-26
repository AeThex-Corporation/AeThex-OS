import { X, Code2, Star, Download } from 'lucide-react';
import { useLocation } from 'wouter';
import { haptics } from '@/lib/haptics';

interface Module {
  id: string;
  name: string;
  description: string;
  language: string;
  stars: number;
}

export default function MobileModules() {
  const [, navigate] = useLocation();
  
  const modules: Module[] = [
    {
      id: '1',
      name: 'Auth Guard',
      description: 'Secure authentication middleware',
      language: 'TypeScript',
      stars: 234
    },
    {
      id: '2',
      name: 'Data Mapper',
      description: 'ORM and database abstraction',
      language: 'TypeScript',
      stars: 456
    },
    {
      id: '3',
      name: 'API Builder',
      description: 'RESTful API framework',
      language: 'TypeScript',
      stars: 789
    },
    {
      id: '4',
      name: 'State Manager',
      description: 'Reactive state management',
      language: 'TypeScript',
      stars: 345
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-cyan-500/20">
        <div className="px-4 py-4 safe-area-inset-top">
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
                MODULES
              </h1>
              <p className="text-xs text-cyan-300 font-mono">{modules.length} available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="px-4 py-4">
        <div className="space-y-3">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => haptics.light()}
              className="w-full text-left rounded-lg p-4 bg-gradient-to-br from-emerald-900/40 to-cyan-900/40 border border-emerald-500/40 hover:border-emerald-400/60 transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-emerald-600/30">
                  <Code2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white uppercase">{module.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{module.description}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono bg-gray-800 px-2 py-1 rounded">
                  {module.language}
                </span>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-bold text-yellow-400">{module.stars}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
