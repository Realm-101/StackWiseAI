import assert from "node:assert/strict";
import { mapToDiscoveryToolSummary, type DiscoveryToolSource } from "../discovery-engine";

const baseTool: Partial<DiscoveryToolSource> = {
  name: "Test Tool",
  description: "A helpful utility for backend developers.",
  category: "backend",
  sourceType: "npm",
  sourceId: "test-tool",
  sourceUrl: "https://www.npmjs.com/package/test-tool",
  repositoryUrl: "https://github.com/example/test-tool",
  documentationUrl: "https://docs.example.com/test-tool",
  homepageUrl: "https://example.com/test-tool",
  languages: ["TypeScript", "JavaScript"],
  frameworks: ["express"],
  tags: ["api", "backend"],
  keywords: ["api", "server"],
  pricingModel: "freemium",
  costCategory: "free",
  estimatedMonthlyCost: "29",
  difficultyLevel: "beginner",
  popularityScore: "75",
  trendingScore: "65",
  qualityScore: "82",
  githubStars: 1200,
  githubForks: 180,
  npmWeeklyDownloads: 5400,
  dockerPulls: null,
  packageDownloads: null,
  lastUpdated: new Date(),
  metrics: null,
  evaluation: {
    id: "eval-1",
    userId: "user-1",
    discoveredToolId: "tool-1",
    rating: 4,
    notes: "Great developer experience",
    status: "approved",
    integrationComplexity: "low",
    estimatedImplementationTime: "2 days",
    compatibilityNotes: "Works with Express",
    decisionReason: "Improves API speed",
    alternativeTools: [],
    evaluatedAt: new Date(),
    updatedAt: new Date(),
  },
};

const summary = mapToDiscoveryToolSummary(baseTool as DiscoveryToolSource);

assert.equal(summary.id, "npm:test-tool");
assert.equal(summary.slug, "test-tool-npm");
assert.equal(summary.provenance.sourceType, "npm");
assert.equal(summary.provenance.sourceId, "test-tool");
assert.equal(summary.badges.pricing, "freemium");
assert.equal(summary.badges.difficulty, "beginner");
assert.ok(summary.badges.isTrendingUp, "expected trending flag to be true");
assert.equal(summary.metrics.githubStars, 1200);
assert.equal(summary.metrics.githubForks, 180);
assert.equal(summary.metrics.weeklyDownloads, 5400);
assert.equal(summary.metrics.trending, 65);
assert.equal(summary.metrics.popularity, 75);
assert.equal(summary.metrics.quality, 82);
assert.equal(summary.metrics.estimatedMonthlyCost, 29);
assert.ok(Array.isArray(summary.tech.languages) && summary.tech.languages.length === 2);
assert.equal(summary.evaluation?.status, "approved");
assert.equal(summary.evaluation?.rating, 4);
assert.equal(summary.evaluation?.notes, "Great developer experience");

const missingSourceIdTool: Partial<DiscoveryToolSource> = {
  name: "Fallback Tool",
  description: "No source id provided",
  category: "devops",
  sourceType: "github",
  languages: [],
  frameworks: [],
  tags: [],
  keywords: [],
};

const fallbackSummary = mapToDiscoveryToolSummary(missingSourceIdTool as DiscoveryToolSource);
assert.ok(fallbackSummary.id.startsWith("github:"));
assert.ok(fallbackSummary.slug.endsWith("-github"));
assert.equal(fallbackSummary.badges.pricing, "unknown");
assert.equal(fallbackSummary.metrics.weeklyDownloads, null);
assert.equal(fallbackSummary.metrics.githubStars, null);
assert.equal(fallbackSummary.metrics.popularity, 0);
assert.equal(fallbackSummary.metrics.trending, 0);
assert.equal(fallbackSummary.metrics.quality, 0);

console.log("mapToDiscoveryToolSummary tests passed");
