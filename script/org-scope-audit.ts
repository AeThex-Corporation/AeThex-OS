import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tables with organization_id that require scoping
const ORG_SCOPED_TABLES = [
  'aethex_sites',
  'aethex_opportunities',
  'aethex_events',
  'projects',
  'files',
  'marketplace_listings',
  'custom_apps',
  'aethex_projects',
  'aethex_alerts',
];

interface Violation {
  file: string;
  line: number;
  table: string;
  snippet: string;
}

function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      continue;
    }

    // Check for Supabase queries
    if (line.includes('.from(') || line.includes('supabase')) {
      // Extract table name from .from('table_name')
      const fromMatch = line.match(/\.from\(['"](\w+)['"]\)/);
      if (fromMatch) {
        const tableName = fromMatch[1];
        
        // Check if table requires org scoping
        if (ORG_SCOPED_TABLES.includes(tableName)) {
          // Look ahead 10 lines to see if .eq('organization_id', ...) is present
          let hasOrgFilter = false;
          const contextLines = lines.slice(i, Math.min(i + 11, lines.length));
          
          for (const contextLine of contextLines) {
            if (contextLine.includes("organization_id") || 
                contextLine.includes("orgScoped") ||
                contextLine.includes("orgEq(") ||
                // User-owned queries (fallback for projects)
                (tableName === 'projects' && contextLine.includes('owner_user_id')) ||
                // Optional org filter pattern
                contextLine.includes("req.query.org_id") ||
                // Public endpoints with explicit guard
                contextLine.includes("IS_PUBLIC = true")) {
              hasOrgFilter = true;
              break;
            }
          }

          if (!hasOrgFilter) {
            violations.push({
              file: path.relative(path.join(__dirname, '..'), filePath),
              line: i + 1,
              table: tableName,
              snippet: line.trim(),
            });
          }
        }
      }
    }
  }

  return violations;
}

function main() {
  console.log('🔍 Scanning server/routes.ts for org-scoping violations...\n');

  const routesPath = path.join(__dirname, '..', 'server', 'routes.ts');
  
  if (!fs.existsSync(routesPath)) {
    console.error('❌ Error: server/routes.ts not found');
    console.error('Tried:', routesPath);
    process.exit(1);
  }

  const violations = scanFile(routesPath);

  if (violations.length === 0) {
    console.log('✅ No org-scoping violations found!');
    process.exit(0);
  }

  console.log(`❌ Found ${violations.length} potential org-scoping violations:\n`);
  
  violations.forEach((v, idx) => {
    console.log(`${idx + 1}. ${v.file}:${v.line}`);
    console.log(`   Table: ${v.table}`);
    console.log(`   Code: ${v.snippet}`);
    console.log('');
  });

  console.log(`\n❌ Audit failed with ${violations.length} violations`);
  console.log('💡 Add .eq("organization_id", orgId) or use orgScoped() helper\n');
  
  process.exit(1);
}

main();
