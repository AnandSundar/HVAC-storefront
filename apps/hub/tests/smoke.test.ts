import { describe, it, expect } from 'vitest';
import { projects, findProject, projectSlugs } from '../src/data/projects';
import { profile, skillsByCategory } from '../src/data/profile';
import { cn } from '../src/lib/cn';

describe('smoke – project data', () => {
  it('has exactly 4 projects', () => {
    expect(projects).toHaveLength(4);
  });

  it('contains the four expected slugs', () => {
    expect(projectSlugs).toEqual([
      'storefront',
      'node-api',
      'php-api',
      'about',
    ]);
  });

  it('every project has a unique slug', () => {
    const slugs = projects.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('every project has at least one tech badge', () => {
    for (const project of projects) {
      expect(project.tech.length).toBeGreaterThan(0);
    }
  });

  it('every project has a non-empty primary link with a valid scheme', () => {
    for (const project of projects) {
      expect(project.primaryLink.href).toMatch(/^(https?:\/|\/)/);
      expect(project.primaryLink.label.length).toBeGreaterThan(0);
    }
  });

  it('findProject returns the right project for a known slug', () => {
    expect(findProject('storefront')?.title).toBe('HVAC Parts Storefront');
    expect(findProject('node-api')?.title).toBe('Node.js GraphQL API');
  });

  it('findProject returns undefined for an unknown slug', () => {
    expect(findProject('does-not-exist')).toBeUndefined();
  });
});

describe('smoke – profile data', () => {
  it('has a name and headline', () => {
    expect(profile.name.length).toBeGreaterThan(0);
    expect(profile.headline.length).toBeGreaterThan(0);
  });

  it('has tech stack entries across all 5 categories', () => {
    const grouped = skillsByCategory();
    expect(grouped.size).toBe(5);
    for (const [, skills] of grouped) {
      expect(skills.length).toBeGreaterThan(0);
    }
  });

  it('has at least one expert-level skill', () => {
    const experts = profile.skills.filter((s) => s.proficiency === 'expert');
    expect(experts.length).toBeGreaterThan(0);
  });
});

describe('smoke – cn helper', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    expect(cn('btn', isActive && 'btn-active')).toBe('btn btn-active');
  });

  it('handles undefined and false inputs', () => {
    expect(cn('foo', undefined, false, 'bar')).toBe('foo bar');
  });

  it('deduplicates conflicting tailwind utilities', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
