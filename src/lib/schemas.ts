import { z } from 'zod';

const httpsUrl = z.url({ protocol: /^https$/ });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'expected YYYY-MM-DD');

export const projectStatus = z.enum(['live', 'building', 'coming-soon']);
export type ProjectStatus = z.infer<typeof projectStatus>;

const projectDetails = z.object({
  statusNote: z.string().min(1),
  overview: z.array(z.string().min(1)).min(1),
  architecture: z
    .object({ summary: z.string().min(1), steps: z.array(z.string().min(1)).min(2) })
    .nullable(),
  decisions: z.array(
    z.object({
      title: z.string().min(1),
      body: z.string().min(1),
      // Optional structure for the trade-offs table.
      chose: z.string().min(1).optional(),
      rejected: z.string().min(1).optional(),
      why: z.string().min(1).optional(),
    }),
  ),
  // Optional headings that state the point of a section instead of labelling it.
  headings: z
    .object({
      how: z.string().min(1).optional(),
      decisions: z.string().min(1).optional(),
      verify: z.string().min(1).optional(),
      next: z.string().min(1).optional(),
    })
    .optional(),
  practices: z.array(z.string().min(1)),
  data: z
    .object({
      source: z.string().min(1),
      licence: z.string().min(1),
      licenceLink: httpsUrl.optional(),
      copyright: z.string().optional(),
      note: z.string().optional(),
    })
    .nullable(),
  roadmap: z.array(z.string().min(1)),
  limitations: z.array(z.string().min(1)),
  willCover: z.array(z.string().min(1)),
});

export const projectSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    name: z.string().min(1),
    status: projectStatus,
    question: z.string().min(1),
    summary: z.string().min(1),
    stack: z.array(z.string().min(1)),
    teaser: z.string().min(1).optional(),
    repo: z
      .string()
      .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/)
      .nullable(),
    live: httpsUrl.nullable(),
    liveLabel: z.string().min(1).optional(),
    receipt: z
      .object({
        label: z.string().min(1),
        value: z.string().min(1),
        source: z.string().min(1),
        checked: isoDate,
        href: httpsUrl,
      })
      .optional(),
    verified: z.object({ date: isoDate, against: z.string().min(1) }),
    details: projectDetails,
  })
  .superRefine((p, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
    if (p.status === 'coming-soon') {
      if (p.repo) issue('a planned project must not link a repository');
      if (p.live) issue('a planned project must not link a live demo');
      if (p.stack.length > 0) issue('a planned project must not list a built stack');
      if (!p.teaser) issue('a planned project needs a teaser for the Next up line');
      if (p.details.willCover.length === 0) issue('a planned project needs willCover items');
    } else {
      if (!p.repo) issue('a project that has started needs a repository');
      if (p.stack.length === 0) issue('a project that has started needs a stack');
    }
    if (p.status === 'live' && !p.live) issue('a live project needs a live URL');
  });
export type Project = z.infer<typeof projectSchema>;

export const profileSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  subheadline: z.string().min(1),
  credentials: z.string().min(1),
  contact: z.object({ heading: z.string().min(1), body: z.string().min(1) }),
  links: z.object({
    email: z.email().nullable(),
    resume: httpsUrl.nullable(),
    linkedin: httpsUrl.nullable(),
    github: httpsUrl.nullable(),
  }),
});
export type Profile = z.infer<typeof profileSchema>;

export const experimentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  stage: z.number().int().min(1).max(3),
  question: z.string().min(1),
  uses: z.string().min(1),
  tags: z.array(z.string().min(1)),
});
export const labSchema = z.object({
  experiments: z.array(experimentSchema).min(1),
  tempting: z.array(z.object({ idea: z.string().min(1) })),
});
export type Experiment = z.infer<typeof experimentSchema>;
export type Lab = z.infer<typeof labSchema>;
