export interface ContactLink {
  label: string;
  href: string;
}

export interface TrailSign {
  destination: string;
  time: string;
}

export const site = {
  // TODO: replace with full name and a final one-line developer identity.
  name: 'Timon',
  tagline: 'Developer · AI & ML graduate · Climber',
  description:
    'Developer portfolio, currently under construction: a mountain trail leading to a bouldering cave full of projects.',

  // TODO: fill in real contact links. Entries with an empty href are not rendered.
  contact: [
    { label: 'Email', href: '' },
    { label: 'GitHub', href: '' },
    { label: 'LinkedIn', href: '' },
  ] satisfies ContactLink[],

  closureSign: {
    heading: 'Trail closed',
    body: ['Route still being set.', 'The way up to the cave opens soon.'],
    note: 'Fontainebleau grades pending',
  },

  signpost: {
    location: 'Trailhead',
    signs: [
      { destination: 'About me', time: 'soon' },
      { destination: 'Cave · Projects', time: 'soon' },
    ] satisfies TrailSign[],
  },
} as const;

export const visibleContactLinks = site.contact.filter((link) => link.href !== '');
