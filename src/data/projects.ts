export type ProjectLink = {
  href: string;
  label: string;
};

export type Project = {
  title: string;
  year: string;
  blurb: string;
  image: string;
  imageAlt: string;
  tags: string[];
  /** Live site, if one still exists. */
  live?: ProjectLink;
  /** Source repository, if public. */
  repo?: ProjectLink;
  /** Shown when there's no live demo to link to. */
  note?: string;
  /** Optional highlighted accolade (e.g. an acquisition). */
  accolade?: string;
};

export const projects: Project[] = [
  {
    title: "RubiconMD",
    year: "2013 – 17",
    blurb:
      "Before joining full time, I was brought on freelance to build RubiconMD's frontend — an eConsult platform that lets primary-care providers get specialist input in minutes instead of weeks. RubiconMD was later acquired by Oak Street Health (now part of CVS Health) for up to $190 million.",
    image: "/images/rubiconmd.png",
    imageAlt: "RubiconMD eConsult platform homepage",
    tags: ["Frontend", "Healthcare", "Rails"],
    accolade: "$190M acquisition",
    live: { href: "https://rubiconmd.com", label: "Visit site" },
  },
  {
    title: "Step Up",
    year: "2014",
    blurb:
      "A mentorship web app built end-to-end in a 24-hour hackathon for a non-profit. Social + email auth via OAuth, keyword search to connect mentors with mentees, in-app messaging, and a full admin panel to run the program.",
    image: "/images/stepup.png",
    imageAlt: "Step Up mentorship app",
    tags: ["Rails", "OAuth", "Full-stack"],
    repo: { href: "https://github.com/TechFounder/stepup", label: "View source" },
  },
  {
    title: "NYU JavaScript Project",
    year: "2014",
    blurb:
      "My capstone for an NYU JavaScript course. I hand-coded the frontend over a few weeks, wrapped it in a Rails shell, and shipped it. A study in vanilla JS interaction before the framework era.",
    image: "/images/sam-sultan.jpg",
    imageAlt: "NYU JavaScript course final project",
    tags: ["JavaScript", "Frontend", "Coursework"],
    repo: {
      href: "https://github.com/TechFounder/nyu_javascript",
      label: "View source",
    },
  },
  {
    title: "Mrs. Blooms — Popup Store",
    year: "2014",
    blurb:
      "A Mother's Day popup flower shop for a client on a tight timeline and tighter budget. The brief was simple: stand up a clean store fast and start selling.",
    image: "/images/mrsblooms-popup.png",
    imageAlt: "Mrs. Blooms popup flower store",
    tags: ["E-commerce", "Client work"],
    note: "Seasonal site — no longer live.",
  },
  {
    title: "Mrs. Blooms — Mobile Store",
    year: "2014",
    blurb:
      "A follow-up for the same client's mobile flower truck. A fully responsive storefront delivered, again, on a very limited budget.",
    image: "/images/mrsblooms-mobile.png",
    imageAlt: "Mrs. Blooms mobile flower truck store",
    tags: ["Responsive", "Client work"],
    note: "Retired by the client — no longer live.",
  },
  {
    title: "Former Portfolio",
    year: "2014",
    blurb:
      "Where this all started — my first portfolio, built with Rails 4 and Bootstrap 3. Simple, responsive, and very much of its moment. Kept here as a marker of how far the craft has come.",
    image: "/images/portfolio-old.png",
    imageAlt: "Jimmy Chen's first portfolio site from 2014",
    tags: ["Rails", "Bootstrap", "Archive"],
    note: "Archived — the original Heroku host is retired.",
  },
];
