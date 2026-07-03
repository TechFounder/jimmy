import type { ImageMetadata } from "astro";

// Project screenshots live in src/assets so Astro optimizes them at build time
// (hashed, resized, served as WebP) instead of shipping the raw PNGs.
import rubiconmd from "../assets/projects/rubiconmd.png";
import stepup from "../assets/projects/stepup.png";
import samSultan from "../assets/projects/sam-sultan.jpg";
import mrsbloomsPopup from "../assets/projects/mrsblooms-popup.png";
import mrsbloomsMobile from "../assets/projects/mrsblooms-mobile.png";
import portfolioOld from "../assets/projects/portfolio-old.png";

export type ProjectLink = {
  href: string;
  label: string;
};

export type Project = {
  title: string;
  year: string;
  blurb: string;
  image: ImageMetadata;
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
      "Before joining full time, I was brought on freelance to build RubiconMD's frontend — an eConsult platform that lets primary-care providers get specialist input in minutes instead of weeks. Deployed on Heroku in those early days, RubiconMD was later acquired by Oak Street Health (now part of CVS Health) for up to $190 million.",
    image: rubiconmd,
    imageAlt: "RubiconMD eConsult platform homepage",
    tags: ["Frontend", "Healthcare", "Rails"],
    accolade: "$190M acquisition",
    live: { href: "https://rubiconmd.com", label: "Visit site" },
  },
  {
    title: "Former Portfolio",
    year: "2014",
    blurb:
      "Where this all started — my first portfolio, built with Rails 4 and Bootstrap 3 and deployed on Heroku. It also shipped its own contact form for sending email straight from the site. Simple, responsive, and very much of its moment. Kept here as a marker of how far the craft has come.",
    image: portfolioOld,
    imageAlt: "Jimmy Chen's first portfolio site from 2014",
    tags: ["Rails", "Bootstrap", "Archive"],
    note: "Archived — the original Heroku host is retired.",
  },
  {
    title: "Mrs. Blooms — Mobile Store",
    year: "2014",
    blurb:
      "A follow-up for the same client's mobile flower truck. A fully responsive storefront delivered, again, on a very limited budget.",
    image: mrsbloomsMobile,
    imageAlt: "Mrs. Blooms mobile flower truck store",
    tags: ["Responsive", "Client work"],
    note: "Retired by the client — no longer live.",
  },
  {
    title: "Mrs. Blooms — Popup Store",
    year: "2014",
    blurb:
      "A Mother's Day popup flower shop for a client on a tight timeline and tighter budget. The brief was simple: stand up a clean store fast and start selling.",
    image: mrsbloomsPopup,
    imageAlt: "Mrs. Blooms popup flower store",
    tags: ["E-commerce", "Client work"],
    note: "Seasonal site — no longer live.",
  },
  {
    title: "Step Up",
    year: "2014",
    blurb:
      "A mentorship web app built end-to-end in a 24-hour hackathon for a non-profit, with a 5-person team. Social + email auth via OAuth (omniauth), keyword search to connect mentors with mentees, in-app messaging, and a full admin panel (active_admin) to run the program, backed by devise, simple_form, paperclip, and the AWS SDK — deployed on Heroku.",
    image: stepup,
    imageAlt: "Step Up mentorship app",
    tags: ["Rails", "OAuth", "Full-stack"],
    repo: { href: "https://github.com/TechFounder/stepup", label: "View source" },
  },
  {
    title: "NYU JavaScript Project",
    year: "2014",
    blurb:
      "My capstone for an NYU JavaScript course. I hand-coded the frontend over a few weeks, wrapped it in a Rails shell, and deployed it to Heroku — jQuery-driven fades and chart animations, CSS3 transitions, client-side form validation, and modal dialogs. A study in vanilla JS interaction before the framework era.",
    image: samSultan,
    imageAlt: "NYU JavaScript course final project",
    tags: ["JavaScript", "Frontend", "Coursework"],
    repo: {
      href: "https://github.com/TechFounder/nyu_javascript",
      label: "View source",
    },
  },
];
