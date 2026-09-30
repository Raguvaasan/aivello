import { describe, expect, it } from 'vitest';
import { categories, tools } from '../data/tools';
import { toolRoutes } from '../routes';

describe('tool registry', () => {
  it('has unique ids and paths', () => {
    const ids = tools.map((t) => t.id);
    const paths = tools.map((t) => t.path);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('uses /app/<id> paths for every tool', () => {
    for (const tool of tools) {
      expect(tool.path).toBe(`/app/${tool.id}`);
    }
  });

  it('has a route for every registry entry and vice versa', () => {
    const routeIds = Object.keys(toolRoutes).sort();
    const registryIds = tools.map((t) => t.id).sort();
    expect(routeIds).toEqual(registryIds);
  });

  it('only uses declared categories', () => {
    const declared = new Set<string>(categories);
    for (const tool of tools) {
      expect(declared.has(tool.category), `${tool.id} uses undeclared category "${tool.category}"`).toBe(true);
    }
  });

  it('gives every tool a name, description and icon', () => {
    for (const tool of tools) {
      expect(tool.name.trim(), tool.id).not.toBe('');
      expect(tool.description.trim().length, tool.id).toBeGreaterThan(10);
      expect(tool.icon.trim(), tool.id).not.toBe('');
    }
  });
});
