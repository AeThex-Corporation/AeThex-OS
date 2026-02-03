import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Trash2, ExternalLink, Github, Globe, Loader2, FolderKanban } from "lucide-react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { isEmbedded, getResponsiveStyles } from "@/lib/embed-utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { nanoid } from "nanoid";

interface Portfolio {
  id: string;
  user_id: string;
  title: string;
  description: string;
  tech_stack: string[];
  live_url?: string;
  github_url?: string;
  image?: string;
  status: "planning" | "in-progress" | "completed";
  progress: number;
  created_at?: Date;
  updated_at?: Date;
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setProjects(data.map(p => ({ ...p, technologies: p.tech_stack || [] })));
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    technologies: "",
  });

  const handleAddProject = async () => {
    if (!newProject.title || !user?.id) return;
    try {
      const { data, error } = await supabase.from('projects').insert({
        id: nanoid(),
        user_id: user.id,
        title: newProject.title,
        description: newProject.description,
        tech_stack: newProject.technologies.split(",").map((t) => t.trim()),
        status: "planning",
        progress: 0
      }).select().single();
      if (!error && data) {
        setProjects([{ ...data, technologies: data.tech_stack }, ...projects]);
        setNewProject({ title: "", description: "", technologies: "" });
        setShowForm(false);
      }
    } catch (err) {
      console.error('Error adding project:', err);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await supabase.from('projects').delete().eq('id', id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error deleting project:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "in-progress":
        return "bg-blue-500";
      case "planning":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const embedded = isEmbedded();
  const { useMobileStyles, theme } = getResponsiveStyles();

  // Mobile-optimized layout when embedded or on mobile device
  if (useMobileStyles) {
    return (
      <div className="min-h-screen" style={{ background: theme.gradientBg }}>
        <div className="p-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${theme.bgAccent} border ${theme.borderClass} flex items-center justify-center`}>
                <FolderKanban className={`w-5 h-5 ${theme.iconClass}`} />
              </div>
              <div>
                <h1 className={`${theme.primaryClass} font-bold text-lg`}>Projects</h1>
                <p className="text-zinc-500 text-xs">{projects.length} total</p>
              </div>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className={`${theme.activeBtn} ${theme.hoverBtn} gap-2`}
              size="sm"
            >
              <Plus className="w-4 h-4" />
              New
            </Button>
          </div>

          {/* Add Project Form */}
          {showForm && (
            <div className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-4 mb-6`}>
              <h2 className={`text-sm font-bold ${theme.secondaryClass} mb-4`}>Create New Project</h2>
              <div className="space-y-3">
                <Input
                  placeholder="Project Title"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className={`${theme.inputBg} border-zinc-700 text-white text-sm`}
                />
                <textarea
                  placeholder="Description..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className={`w-full ${theme.inputBg} border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:${theme.activeBorder}`}
                  rows={2}
                />
                <Input
                  placeholder="Technologies (comma-separated)"
                  value={newProject.technologies}
                  onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
                  className={`${theme.inputBg} border-zinc-700 text-white text-sm`}
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddProject} className={`flex-1 ${theme.activeBtn} ${theme.hoverBtn}`} size="sm">
                    Create
                  </Button>
                  <Button onClick={() => setShowForm(false)} variant="outline" className="border-zinc-700 text-zinc-400" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className={`w-6 h-6 ${theme.iconClass} animate-spin`} />
            </div>
          )}

          {/* Projects Grid */}
          {!loading && (
            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-8 text-center`}>
                  <FolderKanban className={`w-12 h-12 ${theme.iconClass} mx-auto mb-3 opacity-50`} />
                  <p className="text-zinc-500 text-sm">No projects yet</p>
                  <p className="text-zinc-600 text-xs mt-1">Create your first project to get started</p>
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`${theme.cardBg} border ${theme.borderClass} rounded-xl p-4 active:scale-[0.98] transition-transform`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`${getStatusColor(project.status)} text-white text-[10px] font-bold px-2 py-0.5 rounded capitalize`}>
                            {project.status}
                          </span>
                        </div>
                        <h3 className="text-white font-bold text-sm">{project.title}</h3>
                      </div>
                      <button onClick={() => deleteProject(project.id)} className="text-red-400 p-2 -m-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Description */}
                    {project.description && (
                      <p className="text-zinc-400 text-xs mb-3 line-clamp-2">{project.description}</p>
                    )}

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-zinc-500">Progress</span>
                        <span className={`text-xs ${theme.primaryClass}`}>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${theme.isFoundation ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Technologies */}
                    {Array.isArray(project.tech_stack) && project.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {project.tech_stack.slice(0, 4).map((tech) => (
                          <span key={tech} className={`${theme.bgAccent} ${theme.primaryClass} text-[10px] px-2 py-0.5 rounded`}>
                            {tech}
                          </span>
                        ))}
                        {project.tech_stack.length > 4 && (
                          <span className="text-zinc-500 text-[10px] px-2 py-0.5">+{project.tech_stack.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Links */}
                    {(project.live_url || project.github_url) && (
                      <div className="flex gap-2">
                        {project.live_url && (
                          <a href={project.live_url} target="_blank" rel="noopener noreferrer"
                            className={`flex-1 flex items-center justify-center gap-1.5 ${theme.activeBtn} text-white text-xs font-medium py-2 rounded-lg`}>
                            <Globe className="w-3.5 h-3.5" /> Live
                          </a>
                        )}
                        {project.github_url && (
                          <a href={project.github_url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 text-white text-xs font-medium py-2 rounded-lg">
                            <Github className="w-3.5 h-3.5" /> Code
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop layout (original)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Headers - hidden when embedded in OS iframe */}
      {!embedded && (
        <>
          {/* Mobile Header */}
          <div className="md:hidden">
            <MobileHeader title="Projects" />
          </div>
          
          {/* Desktop Header */}
          <div className="hidden md:block bg-slate-950 border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <Link href="/">
                <button className="text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </Link>
              <h1 className="text-2xl font-bold text-white">Projects & Portfolio</h1>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-cyan-600 hover:bg-cyan-700 gap-2"
            >
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>
        </>
      )}

      <div className="p-6 max-w-7xl mx-auto">
        {/* Add Project Form */}
        {showForm && (
          <Card className="bg-slate-800 border-slate-700 p-6 mb-6">
            <h2 className="text-lg font-bold text-white mb-4">Create New Project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project Title
                </label>
                <Input
                  placeholder="My Awesome Project"
                  value={newProject.title}
                  onChange={(e) =>
                    setNewProject({ ...newProject, title: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe your project..."
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({ ...newProject, description: e.target.value })
                  }
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Technologies (comma-separated)
                </label>
                <Input
                  placeholder="React, TypeScript, Node.js"
                  value={newProject.technologies}
                  onChange={(e) =>
                    setNewProject({ ...newProject, technologies: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddProject}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Project
                </Button>
                <Button
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="bg-slate-800 border-b border-slate-700">
            <TabsTrigger value="all" className="text-slate-300">
              All Projects ({projects.length})
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="text-slate-300">
              In Progress ({projects.filter((p) => p.status === "in-progress").length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-slate-300">
              Completed ({projects.filter((p) => p.status === "completed").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className="bg-slate-800 border-slate-700 p-5 hover:border-cyan-500 transition-colors"
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`${getStatusColor(
                        project.status
                      )} text-white text-xs font-bold px-2 py-1 rounded capitalize`}
                    >
                      {project.status}
                    </span>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-white font-bold mb-2 text-lg">
                    {project.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-400">Progress</span>
                      <span className="text-xs text-slate-400">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Technologies */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(Array.isArray(project.technologies) ? project.technologies : []).slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="bg-slate-700 text-cyan-300 text-xs px-2 py-1 rounded"
                      >
                        {tech}
                      </span>
                    ))}
                    {Array.isArray(project.technologies) && project.technologies.length > 3 && (
                      <span className="text-slate-400 text-xs px-2 py-1">
                        +{(project.technologies.length - 3)}
                      </span>
                    )}
                  </div>

                  {/* Links */}
                  <div className="flex gap-2">
                    {project.live_url && (
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded transition-colors"
                      >
                        <Globe className="w-4 h-4" />
                        Live
                      </a>
                    )}
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 rounded transition-colors"
                      >
                        <Github className="w-4 h-4" />
                        Code
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects
                .filter((p) => p.status === "in-progress")
                .map((project) => (
                  <Card
                    key={project.id}
                    className="bg-slate-800 border-slate-700 p-5 hover:border-cyan-500 transition-colors"
                  >
                    <h3 className="text-white font-bold mb-2">{project.title}</h3>
                    <p className="text-slate-400 text-sm mb-4">{project.description}</p>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects
                .filter((p) => p.status === "completed")
                .map((project) => (
                  <Card
                    key={project.id}
                    className="bg-slate-800 border-slate-700 p-5 hover:border-green-500 transition-colors"
                  >
                    <h3 className="text-white font-bold mb-2">{project.title}</h3>
                    <p className="text-slate-400 text-sm mb-4">{project.description}</p>
                    <div className="text-green-400 text-sm font-medium">✓ Completed</div>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
