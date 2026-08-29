import { Router } from 'express';
import { getDb } from '../db/database';
import { buildKnowledgeGraph } from '../services/knowledgeGraph';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// In-memory maintenance mode flag & system logs
let isMaintenanceMode = false;
let maintenanceReason = '';

const systemLogs: Array<{
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  module: string;
  message: string;
}> = [
  {
    id: 'log-1',
    timestamp: new Date().toISOString(),
    level: 'info',
    module: 'System',
    message: 'Developer Management Portal initialized.',
  },
  {
    id: 'log-2',
    timestamp: new Date().toISOString(),
    level: 'success',
    module: 'Database',
    message: 'SQLite WAL (Write-Ahead Logging) persistent storage verified.',
  },
  {
    id: 'log-3',
    timestamp: new Date().toISOString(),
    level: 'success',
    module: 'GraphRAG',
    message: 'Knowledge Graph entity-relation memory structure ready.',
  },
];

function addLog(level: 'info' | 'warn' | 'error' | 'success', module: string, message: string) {
  systemLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
  });
  if (systemLogs.length > 100) {
    systemLogs.pop();
  }
}

// 1. Server Health & Extended Diagnostics
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  try {
    const db = getDb();
    
    // SQLite Table Counts
    const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any)?.count || 0;
    const deptCount = (db.prepare('SELECT COUNT(*) as count FROM departments').get() as any)?.count || 0;
    const subCount = (db.prepare('SELECT COUNT(*) as count FROM submissions').get() as any)?.count || 0;
    const rulesCount = (db.prepare('SELECT COUNT(*) as count FROM activity_schema').get() as any)?.count || 0;
    const categoriesCount = (db.prepare('SELECT COUNT(*) as count FROM schema_categories').get() as any)?.count || 0;

    // Knowledge Graph Stats
    const kg = await buildKnowledgeGraph();
    const nodeCount = kg.nodes ? kg.nodes.size : 0;

    // Gemini API status
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;

    const responseTime = Date.now() - startTime;

    res.json({
      status: isMaintenanceMode ? 'maintenance' : 'healthy',
      timestamp: new Date().toISOString(),
      latency_ms: responseTime,
      server: {
        uptime_seconds: Math.floor(process.uptime()),
        node_version: process.version,
        platform: process.platform,
        memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development',
      },
      database: {
        type: 'SQLite (node:sqlite WAL mode)',
        status: 'CONNECTED',
        tables: {
          users: userCount,
          departments: deptCount,
          submissions: subCount,
          activity_schema: rulesCount,
          schema_categories: categoriesCount,
        },
      },
      knowledge_graph: {
        status: 'ACTIVE',
        nodes_count: nodeCount,
        entity_types: ['Student', 'Faculty', 'Department', 'Activity', 'Certificate', 'Category', 'Skill', 'Semester', 'Rule'],
      },
      ai_engine: {
        model: 'gemini-3.6-flash',
        key_configured: hasGeminiKey,
        key_masked: hasGeminiKey ? `${process.env.GEMINI_API_KEY?.substring(0, 6)}...` : 'NOT_SET',
      },
      maintenance: {
        active: isMaintenanceMode,
        reason: maintenanceReason,
      },
    });
  } catch (error: any) {
    addLog('error', 'HealthCheck', `Health check error: ${error.message}`);
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// 2. High-Precision Ping Endpoint
router.get('/ping', (req, res) => {
  res.json({
    pong: true,
    timestamp: new Date().toISOString(),
    server_time_ms: Date.now(),
  });
});

// 3. Test Gemini API Latency & Model Output
router.post('/test-gemini', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    addLog('warn', 'GeminiTest', 'Gemini test requested but GEMINI_API_KEY is not configured.');
    return res.status(400).json({
      success: false,
      error: 'GEMINI_API_KEY is not set in environment.',
    });
  }

  const startTime = Date.now();
  try {
    const ai = new GoogleGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [{ role: 'user', parts: [{ text: 'Respond with JSON: {"status": "ok", "message": "Creditz Dev Ping Success"}' }] }],
      config: { responseMimeType: 'application/json' },
    });

    const latency = Date.now() - startTime;
    addLog('success', 'GeminiTest', `Gemini 3.6 Flash ping succeeded in ${latency}ms.`);

    res.json({
      success: true,
      model: 'gemini-3.6-flash',
      latency_ms: latency,
      output: response.text ? JSON.parse(response.text) : null,
    });
  } catch (err: any) {
    const latency = Date.now() - startTime;
    addLog('error', 'GeminiTest', `Gemini test failed (${latency}ms): ${err.message}`);
    res.status(500).json({
      success: false,
      latency_ms: latency,
      error: err.message,
    });
  }
});

// 4. Force Knowledge Graph Synchronization / Re-index
router.post('/sync-graph', async (req, res) => {
  try {
    const kg = await buildKnowledgeGraph();
    const nodeCount = kg.nodes ? kg.nodes.size : 0;
    addLog('info', 'GraphSync', `Knowledge Graph manually re-synchronized. Active nodes: ${nodeCount}.`);
    
    res.json({
      success: true,
      message: 'Knowledge Graph synchronized successfully.',
      timestamp: new Date().toISOString(),
      nodes_count: nodeCount,
    });
  } catch (err: any) {
    addLog('error', 'GraphSync', `Graph sync error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Toggle Maintenance Mode
router.post('/maintenance', (req, res) => {
  const { active, reason } = req.body;
  isMaintenanceMode = !!active;
  maintenanceReason = reason || (isMaintenanceMode ? 'Scheduled system maintenance in progress.' : '');
  
  addLog(
    isMaintenanceMode ? 'warn' : 'info',
    'Maintenance',
    `System maintenance mode set to ${isMaintenanceMode} (${maintenanceReason}).`
  );

  res.json({
    success: true,
    maintenance_mode: isMaintenanceMode,
    reason: maintenanceReason,
  });
});

// 6. Get Maintenance Status
router.get('/maintenance', (req, res) => {
  res.json({
    maintenance_mode: isMaintenanceMode,
    reason: maintenanceReason,
  });
});

// 7. System Audit Logs
router.get('/logs', (req, res) => {
  res.json({
    logs: systemLogs,
  });
});

// 8. Clear System Logs
router.post('/logs/clear', (req, res) => {
  systemLogs.length = 0;
  addLog('info', 'System', 'Developer system logs cleared.');
  res.json({ success: true, message: 'Logs cleared.' });
});

// 9. Full Database Schema & ER Graph Introspection
router.get('/db-schema', (req, res) => {
  try {
    const db = getDb();
    
    // Query sqlite_master for user tables
    const tablesRaw = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as any[];
    
    const tables: any[] = [];
    const relationships: any[] = [];
    let totalRecords = 0;

    for (const t of tablesRaw) {
      const tableName = t.name;
      
      // Get record count safely
      let recordCount = 0;
      try {
        const countRes = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as any;
        recordCount = countRes?.count || 0;
      } catch (e) {
        recordCount = 0;
      }
      totalRecords += recordCount;

      // Get columns info via PRAGMA
      const columnsRaw = db.prepare(`PRAGMA table_info('${tableName}')`).all() as any[];
      const columns = columnsRaw.map((col: any) => ({
        name: col.name,
        type: col.type,
        isPk: col.pk > 0,
        notNull: col.notnull === 1,
        defaultValue: col.dflt_value,
      }));

      // Get foreign keys via PRAGMA
      const fksRaw = db.prepare(`PRAGMA foreign_key_list('${tableName}')`).all() as any[];
      const foreignKeys: any[] = [];

      for (const fk of fksRaw) {
        foreignKeys.push({
          fromColumn: fk.from,
          toTable: fk.table,
          toColumn: fk.to,
        });

        relationships.push({
          id: `rel-${tableName}-${fk.from}-${fk.table}-${fk.to}`,
          sourceTable: tableName,
          sourceColumn: fk.from,
          targetTable: fk.table,
          targetColumn: fk.to,
          cardinality: '1:N',
          label: `${fk.from} → ${fk.table}.${fk.to}`,
        });
      }

      // Determine table category
      let category = 'system';
      if (['users', 'departments'].includes(tableName)) category = 'core_identity';
      else if (['submissions', 'certificates', 'student_marks'].includes(tableName)) category = 'academic_workflow';
      else if (['activity_schema', 'schema_categories'].includes(tableName)) category = 'rules_taxonomy';
      else if (['events', 'knowledge_graph_nodes', 'knowledge_graph_edges'].includes(tableName)) category = 'graph_events';

      tables.push({
        id: tableName,
        name: tableName,
        recordCount,
        category,
        columns,
        foreignKeys,
        primaryKeys: columns.filter((c: any) => c.isPk).map((c: any) => c.name),
      });
    }

    res.json({
      timestamp: new Date().toISOString(),
      database_type: 'SQLite 3 (WAL Mode)',
      table_count: tables.length,
      relationship_count: relationships.length,
      total_records: totalRecords,
      tables,
      relationships,
    });
  } catch (err: any) {
    addLog('error', 'SchemaIntrospect', `DB Schema Introspection Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// 10. Live Record-Level Connection Graph
router.get('/live-graph', (req, res) => {
  try {
    const db = getDb();

    // Fetch live data records
    const users = db.prepare('SELECT id, name, email, role, department_id, mentor_id, cgpa, semester FROM users').all() as any[];
    const depts = db.prepare('SELECT id, name, code FROM departments').all() as any[];
    const submissions = db.prepare('SELECT id, student_id, activity_title as title, category_id, points_awarded as points, status FROM submissions LIMIT 40').all() as any[];
    const categories = db.prepare('SELECT id, name, max_cap_points FROM schema_categories').all() as any[];
    const activities = db.prepare('SELECT id, category_id, activity_name as title, base_points as points FROM activity_schema LIMIT 30').all() as any[];

    const nodes: any[] = [];
    const edges: any[] = [];

    // Dept Nodes
    for (const d of depts) {
      nodes.push({
        id: d.id,
        label: `${d.code} (${d.name})`,
        type: 'Department',
        category: 'department',
        details: { Code: d.code, Name: d.name },
      });
    }

    // User Nodes & Edges
    for (const u of users) {
      nodes.push({
        id: u.id,
        label: `${u.name} (${u.role.toUpperCase()})`,
        type: u.role === 'student' ? 'Student' : u.role === 'mentor' ? 'Mentor' : u.role === 'hod' ? 'HOD' : 'Developer',
        category: u.role,
        details: { Email: u.email, CGPA: u.cgpa || 'N/A', Semester: u.semester || 'N/A' },
      });

      if (u.department_id) {
        edges.push({
          id: `edge-${u.id}-dept-${u.department_id}`,
          source: u.id,
          target: u.department_id,
          relation: 'BELONGS_TO',
          label: 'department_id',
        });
      }

      if (u.mentor_id) {
        edges.push({
          id: `edge-${u.id}-mentor-${u.mentor_id}`,
          source: u.id,
          target: u.mentor_id,
          relation: 'MENTORED_BY',
          label: 'mentor_id',
        });
      }
    }

    // Category Nodes
    for (const c of categories) {
      nodes.push({
        id: c.id,
        label: `Category: ${c.name}`,
        type: 'Category',
        category: 'category',
        details: { ID: c.id, MaxCapPoints: `${c.max_cap_points} pts` },
      });
    }

    // Activity Nodes & Edges
    for (const a of activities) {
      nodes.push({
        id: a.id,
        label: a.title,
        type: 'ActivityRule',
        category: 'activity',
        details: { Points: `${a.points} pts` },
      });

      if (a.category_id) {
        edges.push({
          id: `edge-${a.id}-cat-${a.category_id}`,
          source: a.id,
          target: a.category_id,
          relation: 'CLASSIFIED_UNDER',
          label: 'category_id',
        });
      }
    }

    // Submission Nodes & Edges
    for (const s of submissions) {
      nodes.push({
        id: s.id,
        label: s.title,
        type: 'Submission',
        category: 'submission',
        details: { Points: `${s.points} pts`, Status: s.status },
      });

      if (s.student_id) {
        edges.push({
          id: `edge-sub-${s.id}-std-${s.student_id}`,
          source: s.student_id,
          target: s.id,
          relation: 'SUBMITTED',
          label: 'student_id',
        });
      }

      if (s.category_id) {
        edges.push({
          id: `edge-sub-${s.id}-cat-${s.category_id}`,
          source: s.id,
          target: s.category_id,
          relation: 'CATEGORY',
          label: 'category_id',
        });
      }
    }

    res.json({
      timestamp: new Date().toISOString(),
      nodes,
      edges,
      summary: {
        total_live_nodes: nodes.length,
        total_live_edges: edges.length,
      },
    });
  } catch (err: any) {
    addLog('error', 'LiveGraph', `Live Graph Introspection Error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

export default router;
