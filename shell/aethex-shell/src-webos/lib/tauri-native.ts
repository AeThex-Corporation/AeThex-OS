/**
 * Tauri-specific native integrations
 * File system, dialogs, notifications, system tray
 */

import { isDesktop } from './platform';

// Check if Tauri APIs are available
export function isTauriAvailable(): boolean {
  return isDesktop() && typeof window !== 'undefined' && '__TAURI__' in window;
}

// File System Operations
export async function saveFile(filename: string, content: string): Promise<string | null> {
  if (!isTauriAvailable()) {
    console.warn('Tauri not available - file system operations disabled');
    return null;
  }

  try {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');

    const path = await save({
      defaultPath: filename,
      filters: [{
        name: 'All Files',
        extensions: ['*']
      }]
    });

    if (path) {
      await writeTextFile(path, content);
      return path;
    }
    return null;
  } catch (error) {
    console.error('Failed to save file:', error);
    return null;
  }
}

export async function openFile(): Promise<{ path: string; content: string } | null> {
  if (!isTauriAvailable()) {
    console.warn('Tauri not available - file system operations disabled');
    return null;
  }

  try {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const { readTextFile } = await import('@tauri-apps/plugin-fs');

    const selected = await open({
      multiple: false,
      filters: [{
        name: 'All Files',
        extensions: ['*']
      }]
    });

    if (selected && typeof selected === 'string') {
      const content = await readTextFile(selected);
      return { path: selected, content };
    }
    return null;
  } catch (error) {
    console.error('Failed to open file:', error);
    return null;
  }
}

export async function selectFolder(): Promise<string | null> {
  if (!isTauriAvailable()) {
    return null;
  }

  try {
    const { open } = await import('@tauri-apps/plugin-dialog');

    const selected = await open({
      directory: true,
      multiple: false
    });

    return typeof selected === 'string' ? selected : null;
  } catch (error) {
    console.error('Failed to select folder:', error);
    return null;
  }
}

// Notifications
export async function showNotification(title: string, body: string): Promise<void> {
  if (!isTauriAvailable()) {
    // Fallback to browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    return;
  }

  try {
    const { sendNotification, isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification');

    let permission = await isPermissionGranted();
    if (!permission) {
      permission = (await requestPermission()) === 'granted';
    }

    if (permission) {
      await sendNotification({ title, body });
    }
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

// Local Storage for Projects
const PROJECTS_DIR = 'AeThexOS/projects';

export async function saveProject(projectId: string, data: any): Promise<boolean> {
  if (!isTauriAvailable()) {
    // Fallback to localStorage
    localStorage.setItem(`project_${projectId}`, JSON.stringify(data));
    return true;
  }

  try {
    const { writeTextFile, BaseDirectory, createDir } = await import('@tauri-apps/plugin-fs');
    
    // Ensure projects directory exists
    try {
      await createDir(PROJECTS_DIR, { baseDir: BaseDirectory.AppData, recursive: true });
    } catch (e) {
      // Directory might already exist
    }

    await writeTextFile(
      `${PROJECTS_DIR}/${projectId}.json`,
      JSON.stringify(data, null, 2),
      { baseDir: BaseDirectory.AppData }
    );
    return true;
  } catch (error) {
    console.error('Failed to save project:', error);
    return false;
  }
}

export async function loadProject(projectId: string): Promise<any | null> {
  if (!isTauriAvailable()) {
    // Fallback to localStorage
    const data = localStorage.getItem(`project_${projectId}`);
    return data ? JSON.parse(data) : null;
  }

  try {
    const { readTextFile, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    
    const content = await readTextFile(
      `${PROJECTS_DIR}/${projectId}.json`,
      { baseDir: BaseDirectory.AppData }
    );
    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to load project:', error);
    return null;
  }
}

export async function listLocalProjects(): Promise<string[]> {
  if (!isTauriAvailable()) {
    // Fallback to localStorage
    const projects: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('project_')) {
        projects.push(key.replace('project_', ''));
      }
    }
    return projects;
  }

  try {
    const { readDir, BaseDirectory } = await import('@tauri-apps/plugin-fs');
    
    const entries = await readDir(PROJECTS_DIR, { baseDir: BaseDirectory.AppData });
    return entries
      .filter(entry => entry.name?.endsWith('.json'))
      .map(entry => entry.name!.replace('.json', ''));
  } catch (error) {
    console.error('Failed to list projects:', error);
    return [];
  }
}
