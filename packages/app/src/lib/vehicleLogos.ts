const customSlugs: Record<string, string> = {
  'ABT': 'abt-sportsline',
  'AMC': 'american-motors',
  'Atalanta': 'atalanta-motors',
  'BAIC Motor': 'baic',
  'Chevrolet Corvette': 'corvette',
  'Citroën': 'citroen',
  'DMC': 'delorean',
  'Force Motors': 'force',
  'Hindustan Motors': 'hindustan',
  'IKCO': 'iran-khodro',
  'JMC': 'jiangling',
  'LEVC': 'london-ev-company',
  'Li Auto': 'lixiang',
  'Lynk & Co': 'lynkco',
  'SAIC Motor': 'saic',
  'Tauro': 'tauro-sport-auto',
  'Zarooq Motors': 'zarooq',
  'Zinoro': 'zhinuo',
  'Škoda': 'skoda'
};

export function getVehicleLogoPath(make: string): string {
  const slug = customSlugs[make] || make.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return `/logos/${slug}.png`;
}
