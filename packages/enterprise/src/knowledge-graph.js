/**
 * Enterprise Knowledge Graph (Track B).
 * Folders under knowledge/ are the seed store; this module navigates linked nodes.
 * No separate graph DB until OR metrics require it.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function knowledgeRoot(cwd = process.cwd()) {
  const candidates = [
    join(cwd, 'knowledge'),
    join(cwd, '..', '..', 'knowledge'),
    join(cwd, '..', 'knowledge'),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return candidates[0];
}

/**
 * Load graph seed for an industry (or global index).
 */
export function loadKnowledgeGraph(industry, cwd) {
  const root = knowledgeRoot(cwd);
  const path = join(root, 'graph', `${industry}.json`);
  const globalPath = join(root, 'graph', 'index.json');
  let graph = { industry, nodes: [], edges: [] };

  if (existsSync(globalPath)) {
    const g = JSON.parse(readFileSync(globalPath, 'utf8'));
    graph.nodes.push(...(g.nodes || []));
    graph.edges.push(...(g.edges || []));
  }
  if (existsSync(path)) {
    const g = JSON.parse(readFileSync(path, 'utf8'));
    graph.nodes.push(...(g.nodes || []));
    graph.edges.push(...(g.edges || []));
    graph.industry = industry;
    graph.meta = g.meta || {};
  }

  // de-dupe nodes by id
  const byId = new Map();
  for (const n of graph.nodes) {
    if (n?.id) byId.set(n.id, n);
  }
  graph.nodes = [...byId.values()];
  return graph;
}

export function getNode(graph, id) {
  return graph.nodes.find((n) => n.id === id) || null;
}

/**
 * Outgoing neighbors of a node.
 */
export function neighbors(graph, id, edgeType) {
  const edges = (graph.edges || []).filter(
    (e) => e.from === id && (!edgeType || e.type === edgeType),
  );
  return edges
    .map((e) => ({ edge: e, node: getNode(graph, e.to) }))
    .filter((x) => x.node);
}

/**
 * Walk: industry → processes → capabilities → modules (depth-limited BFS).
 */
export function navigateFromIndustry(industry, cwd, { maxDepth = 4 } = {}) {
  const graph = loadKnowledgeGraph(industry, cwd);
  const rootId =
    graph.nodes.find((n) => n.type === 'industry')?.id || `industry:${industry}`;
  const visited = new Set();
  const layers = [];
  let frontier = [rootId];

  for (let d = 0; d < maxDepth && frontier.length; d++) {
    const layer = [];
    const next = [];
    for (const id of frontier) {
      if (visited.has(id)) continue;
      visited.add(id);
      const node = getNode(graph, id);
      if (node) layer.push(node);
      for (const { node: child } of neighbors(graph, id)) {
        if (child && !visited.has(child.id)) next.push(child.id);
      }
    }
    if (layer.length) layers.push({ depth: d, nodes: layer });
    frontier = next;
  }

  return {
    industry,
    root: rootId,
    layers,
    node_count: graph.nodes.length,
    edge_count: graph.edges.length,
    capabilities: graph.nodes.filter((n) => n.type === 'capability'),
    modules: graph.nodes.filter((n) => n.type === 'module'),
    processes: graph.nodes.filter((n) => n.type === 'process'),
  };
}

/**
 * Collect recommended modules / capabilities by walking graph.
 */
export function graphRecommendations(industry, cwd) {
  const nav = navigateFromIndustry(industry, cwd, { maxDepth: 5 });
  return {
    processes: nav.processes.map((n) => n.label || n.id),
    capabilities: nav.capabilities.map((n) => ({
      id: n.id,
      label: n.label,
      class: n.class || 'recommended',
    })),
    modules: nav.modules.map((n) => n.label || n.id.replace(/^module:/, '')),
    path_preview: nav.layers
      .flatMap((l) => l.nodes.map((n) => n.label || n.id))
      .slice(0, 24),
  };
}
