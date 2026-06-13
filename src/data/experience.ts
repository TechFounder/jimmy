export type Role = {
  role: string;
  company: string;
  period: string;
  blurb?: string;
  /** Optional highlight pill (e.g. "$190M exit"). */
  tag?: string;
};

// Most recent first.
export const experience: Role[] = [
  {
    role: "Manager, Software Engineering — QA",
    company: "Teladoc Health",
    period: "2021 – 2026",
    blurb:
      "Led a distributed team of 30+ QA engineers — a blend of contractors and full-time staff — across enterprise-scale Ruby/Cucumber test suites, owning quality strategy, process, and tooling.",
    tag: "Leadership",
  },
  {
    role: "Software Engineer Consultant",
    company: "Delsure Health Insurance",
    period: "2018 – 2021",
    blurb:
      "Freelance engineering and team leadership for a health-insurance platform.",
  },
  {
    role: "Technical Co-Founder & COO",
    company: "RaterBee",
    period: "2017 – 2018",
    blurb:
      "Bootstrapped the company with a co-founder. Built prototypes for market testing and ran pilots with our first paying clients — including Bonobos.",
    tag: "Founder",
  },
  {
    role: "Full-Stack Engineering Consultant",
    company: "Peterson Center on Healthcare",
    period: "2017",
    blurb:
      "Embedded with Pivotal Labs in a six-person team building the core of their web app — pair programming, TDD, and Agile throughout. Bill Gates was impressed when given a demo of the platform.",
  },
  {
    role: "Software Engineer — first hire",
    company: "RubiconMD",
    period: "2013 – 2017",
    blurb:
      "The company's first engineer. Built its first application UIs and landing pages, contributed to Rails backend rewrites, and stood up Protractor end-to-end testing. RubiconMD was later acquired by Oak Street Health (now part of CVS Health) for up to $190 million.",
    tag: "$190M exit",
  },
  {
    role: "Principal",
    company: "No Ordinary LLC",
    period: "2013 – 2014",
    blurb:
      "Full-stack web consultancy for startups and small businesses — including the Mrs. Bloom's storefronts.",
  },
  {
    role: "Senior Consultant",
    company: "Slate Technology",
    period: "2011 – 2013",
    blurb:
      "Helped companies and individuals set up, troubleshoot, and enhance their technology and websites.",
  },
  {
    role: "Founder",
    company: "LocFree Network",
    period: "2011 – 2013",
    blurb:
      "Conceived and bootstrapped a location-based platform blending the best of the Groupon and Yelp models; guided the design and development.",
    tag: "Founder",
  },
  {
    role: "Customer Advisory Board Member",
    company: "AARM",
    period: "2010 – 2011",
    blurb:
      "Advised founders and senior management on UI and product features for a SaaS analytics offering for private-equity investors.",
  },
];
