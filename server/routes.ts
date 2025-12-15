import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { supabase } from "./supabase";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // API: Explore database schema (temporary - for development)
  app.get("/api/schema", async (req, res) => {
    try {
      // Query information_schema to get all tables
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (error) {
        // Alternative: try querying a known table or use RPC
        // Let's try to get tables via a different approach
        const tablesQuery = await supabase.rpc('get_tables');
        if (tablesQuery.error) {
          return res.json({ 
            error: error.message,
            hint: "Could not query schema. Tables may need to be accessed directly.",
            supabaseConnected: true
          });
        }
        return res.json({ tables: tablesQuery.data });
      }
      
      res.json({ tables: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API: Test specific tables that might exist
  app.get("/api/explore", async (req, res) => {
    const potentialTables = [
      'users', 'architects', 'profiles', 'credentials', 'certificates',
      'skills', 'curriculum', 'courses', 'modules', 'lessons',
      'threats', 'events', 'logs', 'projects', 'teams',
      'organizations', 'members', 'enrollments', 'progress'
    ];
    
    const results: Record<string, any> = {};
    
    for (const table of potentialTables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          results[table] = { exists: true, count };
        }
      } catch (e) {
        // Table doesn't exist, skip
      }
    }
    
    res.json({ 
      foundTables: Object.keys(results),
      details: results,
      supabaseUrl: process.env.SUPABASE_URL ? 'configured' : 'missing'
    });
  });

  // API: Get sample data from a specific table
  app.get("/api/table/:name", async (req, res) => {
    const { name } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    try {
      const { data, error, count } = await supabase
        .from(name)
        .select('*', { count: 'exact' })
        .limit(limit);
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      
      res.json({ table: name, count, sample: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}
