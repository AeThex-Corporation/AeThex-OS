import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Trash2, ExternalLink, Github, Globe, Loader2 } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <div className="bg-slate-950 border-b border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
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
