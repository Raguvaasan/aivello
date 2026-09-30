export interface Tool {
  id: string;
  path: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  /** Shows a "New" badge on the dashboard. */
  isNew?: boolean;
  // No `component` field by design. Holding a component reference here forces every
  // tool to be statically imported by the registry, which is loaded on the landing
  // page - see the note in src/data/tools.ts. Components are resolved lazily in
  // src/routes/index.tsx instead.
}
