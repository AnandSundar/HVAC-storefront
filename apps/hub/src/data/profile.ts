export interface TechSkill {
  readonly name: string;
  readonly category: SkillCategory;
  readonly proficiency: 'expert' | 'proficient' | 'familiar';
}

export type SkillCategory =
  | 'Frontend'
  | 'Backend'
  | 'Database'
  | 'Tooling'
  | 'Cloud & DevOps';

export interface Profile {
  readonly name: string;
  readonly headline: string;
  readonly pitch: string;
  readonly bio: string;
  readonly location: string;
  readonly email: string;
  readonly githubUrl: string;
  readonly linkedinUrl: string;
  readonly skills: readonly TechSkill[];
}

export const profile: Profile = {
  name: 'Anand Sundar',
  headline: 'Senior Software Engineer – Full Stack Developer',
  pitch:
    'Senior Software Engineer who ships well-architected features end-to-end. I have built production systems across Next.js, Node.js + GraphQL, PHP/Laravel, and TypeScript — comfortable picking the right tool for each layer rather than defaulting to a single stack.',
  bio:
    'Several years of shipping production web applications across multiple stacks — Next.js 15 with React 19 server components and persistent Zustand state on the front end, Node.js 22 with graphql-yoga + Pothos for the GraphQL layer, and Laravel 11 with Eloquent ORM on the PHP side. I default to readable code, predictable deploys, and small enough scope that the system actually fits in your head. This monorepo is the working example: a Next.js storefront and hub, with each layer wired through a shared data package.',
  location: 'Remote',
  email: 'anandsundar96@gmail.com',
  githubUrl: 'https://github.com/AnandSundar',
  linkedinUrl: 'https://www.linkedin.com/in/anandsundar96/',
  skills: [
    { name: 'Next.js (App Router, RSC)', category: 'Frontend', proficiency: 'expert' },
    { name: 'React 19', category: 'Frontend', proficiency: 'expert' },
    { name: 'TypeScript (strict)', category: 'Frontend', proficiency: 'expert' },
    { name: 'Tailwind CSS', category: 'Frontend', proficiency: 'expert' },
    { name: 'TanStack Query', category: 'Frontend', proficiency: 'proficient' },
    { name: 'Zustand', category: 'Frontend', proficiency: 'proficient' },
    { name: 'shadcn-style UI primitives', category: 'Frontend', proficiency: 'expert' },

    { name: 'Node.js 22', category: 'Backend', proficiency: 'expert' },
    { name: 'GraphQL (graphql-yoga + Pothos)', category: 'Backend', proficiency: 'expert' },
    { name: 'Express', category: 'Backend', proficiency: 'expert' },
    { name: 'PHP 8.3', category: 'Backend', proficiency: 'expert' },
    { name: 'Laravel 11', category: 'Backend', proficiency: 'expert' },
    { name: 'Eloquent ORM', category: 'Backend', proficiency: 'proficient' },
    { name: 'REST API design', category: 'Backend', proficiency: 'expert' },
    { name: 'Form Request validation', category: 'Backend', proficiency: 'proficient' },

    { name: 'SQLite', category: 'Database', proficiency: 'proficient' },
    { name: 'PostgreSQL', category: 'Database', proficiency: 'proficient' },
    { name: 'In-memory fixtures', category: 'Database', proficiency: 'expert' },

    { name: 'pnpm workspaces', category: 'Tooling', proficiency: 'expert' },
    { name: 'Turborepo 2.x', category: 'Tooling', proficiency: 'expert' },
    { name: 'Vitest', category: 'Tooling', proficiency: 'expert' },
    { name: 'PHPUnit', category: 'Tooling', proficiency: 'proficient' },
    { name: 'ESLint', category: 'Tooling', proficiency: 'expert' },
    { name: 'Playwright (smoke)', category: 'Tooling', proficiency: 'familiar' },

    { name: 'Vercel', category: 'Cloud & DevOps', proficiency: 'expert' },
    { name: 'Render', category: 'Cloud & DevOps', proficiency: 'proficient' },
    { name: 'Docker', category: 'Cloud & DevOps', proficiency: 'proficient' },
    { name: 'GitHub Actions', category: 'Cloud & DevOps', proficiency: 'proficient' },
  ],
};

export function skillsByCategory(): ReadonlyMap<SkillCategory, readonly TechSkill[]> {
  const map = new Map<SkillCategory, TechSkill[]>();
  for (const skill of profile.skills) {
    const existing = map.get(skill.category) ?? [];
    existing.push(skill);
    map.set(skill.category, existing);
  }
  return map;
}
