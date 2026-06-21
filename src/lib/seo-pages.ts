export interface SeoCity {
  slug: string;
  name: string;
  county?: string;
  description?: string;
}

export interface SeoBrand {
  slug: string;
  name: string;
  description?: string;
}

export const SEO_CITIES: SeoCity[] = [
  { slug: 'stockholm', name: 'Stockholm', county: 'Stockholms län', description: 'Sveriges folkrikaste stad med ett av landets mest aktiva begagnatbilsmarknader.' },
  { slug: 'goteborg', name: 'Göteborg', county: 'Västra Götalands län', description: 'Västsveriges motor och en av de mest aktiva städerna för bilaffärer i Sverige.' },
  { slug: 'malmo', name: 'Malmö', county: 'Skåne län', description: 'Södra Sveriges största stad med ett starkt och växande bilhandelsutbud.' },
  { slug: 'uppsala', name: 'Uppsala', county: 'Uppsala län', description: 'Universitetsstad med hög efterfrågan på begagnade bilar.' },
  { slug: 'vasteras', name: 'Västerås', county: 'Västmanlands län', description: 'En av Mälardalens viktigaste städer för bilhandel.' },
  { slug: 'orebro', name: 'Örebro', county: 'Örebro län', description: 'Strategiskt belägen i mitten av Sverige med god tillgång till bilhandlare.' },
  { slug: 'linkoping', name: 'Linköping', county: 'Östergötlands län', description: 'Storstad i Östergötland med välmående bilmarknad.' },
  { slug: 'helsingborg', name: 'Helsingborg', county: 'Skåne län', description: 'Dynamisk stad i nordvästra Skåne med stark bilhandel.' },
  { slug: 'jonkoping', name: 'Jönköping', county: 'Jönköpings län', description: 'Handelsstaden vid Vätterns strand med aktiv bilmarknad.' },
  { slug: 'norrkoping', name: 'Norrköping', county: 'Östergötlands län', description: 'Industristad med lång tradition av bilhandel.' },
  { slug: 'lund', name: 'Lund', county: 'Skåne län', description: 'Universitetsstaden Lund med välutbildad och välbetalad befolkning.' },
  { slug: 'umea', name: 'Umeå', county: 'Västernorrlands län', description: 'Norrlands folkrikaste stad med växande bilmarknad.' },
  { slug: 'gavle', name: 'Gävle', county: 'Gävleborgs län', description: 'Porten till Norrland med aktiv begagnatbilsmarknad.' },
  { slug: 'boras', name: 'Borås', county: 'Västra Götalands län', description: 'Textilstaden Borås med välmående bilhandel.' },
  { slug: 'sodertälje', name: 'Södertälje', county: 'Stockholms län', description: 'Industristad söder om Stockholm med god bilmarknad.' },
  { slug: 'eskilstuna', name: 'Eskilstuna', county: 'Södermanlands län', description: 'Stålstaden med aktiv bilhandel och många välmående bilhandlare.' },
  { slug: 'karlstad', name: 'Karlstad', county: 'Värmlands län', description: 'Solstaden vid Vänern med en trygg och aktiv bilmarknad.' },
  { slug: 'taby', name: 'Täby', county: 'Stockholms län', description: 'Välbärgad förort norr om Stockholm med hög omsättning på premiumbilar.' },
  { slug: 'vaxjo', name: 'Växjö', county: 'Kronobergs län', description: 'Glasrikets huvudort med miljömedveten befolkning och god bilmarknad.' },
  { slug: 'halmstad', name: 'Halmstad', county: 'Hallands län', description: 'Kuststad med aktiv bilhandel och välmående näringsliv.' },
  { slug: 'balsta', name: 'Bålsta', county: 'Uppsala län', description: 'Pendlarstad i Uppsala-korridor med stor efterfrågan på begagnade bilar.' },
  { slug: 'avesta', name: 'Avesta', county: 'Dalarnas län', description: 'Industristad i Dalarna med trogen bilkundskrets.' },
  { slug: 'arvika', name: 'Arvika', county: 'Värmlands län', description: 'Vackert belägen stad i Värmland med lokal bilmarknad.' },
  { slug: 'alingsas', name: 'Alingsås', county: 'Västra Götalands län', description: 'Trivsam stad öster om Göteborg med aktiv privatmarknad.' },
  { slug: 'sundsvall', name: 'Sundsvall', county: 'Västernorrlands län', description: 'Stenstaden vid Bottenhavet med väletablerad bilhandel.' },
  { slug: 'lulea', name: 'Luleå', county: 'Norrbottens län', description: 'Norrbottens residensstad med stark industri och välmående bilmarknad.' },
  { slug: 'ostersund', name: 'Östersund', county: 'Jämtlands län', description: 'Norrlandsstad vid Storsjön – bilar är ett måste i denna region.' },
  { slug: 'nacka', name: 'Nacka', county: 'Stockholms län', description: 'Välbärgad Stockholmsförort med hög efterfrågan på premiumbilar.' },
  { slug: 'sodertalje', name: 'Södertälje', county: 'Stockholms län', description: 'Industristad söder om Stockholm med god bilmarknad.' },
  { slug: 'huddinge', name: 'Huddinge', county: 'Stockholms län', description: 'Stor Stockholmsförort söder om stan med aktiv bilmarknad.' },
];

export const SEO_BRANDS: SeoBrand[] = [
  { slug: 'volvo', name: 'Volvo', description: 'Det svenska premiummärket – högt efterfrågat bland svenska bilköpare.' },
  { slug: 'bmw', name: 'BMW', description: 'Tyska körmaskiner som håller högt andrahandsvärde på den svenska marknaden.' },
  { slug: 'kia', name: 'Kia', description: 'Koreanskproducerade bilar med lång garanti och starkt rykte för pålitlighet.' },
  { slug: 'audi', name: 'Audi', description: 'Premiumbilar från Ingolstadt med stark efterfrågan i Sverige.' },
  { slug: 'mercedes', name: 'Mercedes', description: 'Lyxbilar från Stuttgart som alltid hittar köpare på den svenska begagnatmarknaden.' },
  { slug: 'volkswagen', name: 'Volkswagen', description: 'Folkets bil – ett av de mest sålda märkena i Sverige med hög efterfrågan.' },
  { slug: 'toyota', name: 'Toyota', description: 'Japansk pålitlighet i världsklass – Toyota behåller värdet bra.' },
  { slug: 'ford', name: 'Ford', description: 'Amerikanskt arv med stark närvaro på den svenska marknaden.' },
  { slug: 'tesla', name: 'Tesla', description: 'Elbilspionjären som dominerar den svenska elbilsmarknaden.' },
  { slug: 'hyundai', name: 'Hyundai', description: 'Koreanskt märke med bred modellflora och bra andrahandsvärde.' },
  { slug: 'skoda', name: 'Skoda', description: 'Tjeckiska bilar med hög kvalitet och attraktivt pris.' },
  { slug: 'peugeot', name: 'Peugeot', description: 'Franska bilar med karaktär – populära hos svenska privatbilister.' },
  { slug: 'renault', name: 'Renault', description: 'Franskt formspråk och prisvärda bilar med trogen kundkrets i Sverige.' },
  { slug: 'nissan', name: 'Nissan', description: 'Japanskt märke känt för pålitliga crossovers och elbilar.' },
  { slug: 'mazda', name: 'Mazda', description: 'Japanskt premiumkänsla till rimligt pris – populärt val i Sverige.' },
  { slug: 'opel', name: 'Opel', description: 'Tyskt massproduktionsmärke med lång tradition på den svenska marknaden.' },
  { slug: 'seat', name: 'Seat', description: 'Spanska bilar med temperament och attraktivt pris.' },
  { slug: 'mini', name: 'Mini', description: 'Ikonisk brittisk design med premiumkänsla och stark efterfrågan i Sverige.' },
  { slug: 'honda', name: 'Honda', description: 'Japanskt kvalitetsmärke med fantastisk driftsäkerhet.' },
  { slug: 'subaru', name: 'Subaru', description: 'Populärt bland aktiva svenskar – Subaru med AWD säljs snabbt.' },
  { slug: 'polestar', name: 'Polestar', description: 'Det svenska elbilsmärket som blivit ett globalt fenomen.' },
  { slug: 'land-rover', name: 'Land Rover', description: 'Brittiska terrängbilar med stark efterfrågan på den svenska premiummarknaden.' },
];

export function slugToCity(slug: string): SeoCity | undefined {
  return SEO_CITIES.find(c => c.slug === slug);
}

export function slugToBrand(slug: string): SeoBrand | undefined {
  return SEO_BRANDS.find(b => b.slug === slug);
}

export function cityToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
