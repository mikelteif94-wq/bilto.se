const BRANDS: { name: string; models: string[] }[] = [
  { name: 'Abarth', models: [] },
  { name: 'Alfa Romeo', models: [] },
  { name: 'Aston Martin', models: ['DB11', 'DB9', 'DBX', 'Rapide', 'Vantage'] },
  { name: 'Audi', models: ['100', '80', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Allroad', 'E-tron models', 'Q2', 'Q3', 'Q5', 'Q7', 'R8', 'RS Models', 'RS 3', 'RS 4', 'RS 5', 'RS 6', 'RS 7', 'RS Q3'] },
  { name: 'Bentley', models: ['Bentayga', 'Continental', 'Flying', 'Spur', 'Mulsanne'] },
  { name: 'BMW', models: ['1 Series', '114i', '116', '116i', '118', '120i', '120', '123', '125', '125i', '128ti', '130', '130i', '135', '140', '2 Series', '216', '216i', '218', '218i', '220', '220i', '225', '225i'] },
  { name: 'BYD', models: ['Atto 3', 'Han', 'Tang'] },
  { name: 'Cadillac', models: ['ATS', 'BLS', 'CTS', 'Escalade', 'SRX', 'Seville', 'XT5'] },
  { name: 'Chevrolet', models: ['Alero', 'Avalanche', 'Aveo', 'Blazer', 'Camaro', 'Captiva', 'Corvette', 'Cruze', 'Epica', 'Evanda', 'Kalos', 'Malibu', 'Matiz', 'Nubira', 'Orlando', 'S10', 'Silverado', 'Suburban', 'Tacuma', 'Tahoe', 'TrailBlazer', 'Trans Sport', 'Trax', 'Uplander'] },
  { name: 'Chrysler', models: ['300 Series', 'Crossfire', 'PT Cruiser', 'Pacifica', 'Sebring', 'Stratus', 'Town & Country', 'Voyager Series'] },
  { name: 'Citroen', models: ['Berlingo', 'C-Crosser', 'C-zero', 'C1', 'C2', 'C3', 'C4', 'C5', 'C5X', 'C6', 'DS3', 'DS4', 'DS5', 'Jumper', 'Jumpy', 'Nemo', 'Xantia', 'Xsara', 'e-Berlingo', 'e-C4', 'e-jumpy', 'Ateca'] },
  { name: 'Cupra', models: ['Born', 'Formentor', 'Leon'] },
  { name: 'Dacia', models: ['Dokker', 'Duster', 'Jogger', 'Lodgy', 'Logan', 'Logan Pick-up', 'Sandero'] },
  { name: 'Dodge', models: ['Caliber', 'Caravan', 'Challenger', 'Charger', 'Durango', 'Grand Caravan', 'Journey', 'Magnum', 'Nitro', 'Ram'] },
  { name: 'Ferrari', models: ['355', '360', '430', '456', '550', '599', '812', 'California', 'F12', 'F8', 'FF', 'LaFerrari', 'Portofino', 'SF90'] },
  { name: 'Fiat', models: ['500', '500L', '500X', '500c', '500e', 'Barchetta', 'Bravo', 'Doblo', 'Ducato', 'E-scudo', 'Fiorino', 'Freemont', 'Fullback', 'Panda', 'Punto', 'Qubo', 'Scudo', 'Sedici', 'Strada', 'Talento', 'Tipo', 'Ulysse'] },
  { name: 'Ford', models: ['B-Max', 'Bronco', 'C-Max', 'Connect', 'Cougar', 'Courier', 'Custom', 'Ecosport', 'Edge', 'Escort', 'Expedition', 'Explorer', 'F150', 'F250', 'F450', 'Fiesta', 'Focus', 'Fusion', 'GT', 'Galaxy', 'Ka', 'Kuga', 'Maverick', 'Mondeo', 'Mustang', 'Puma', 'Ranger', 'S-Max', 'Scorpio', 'Sierra', 'Thunderbird', 'Tourneo', 'Transit', 'Windstar'] },
  { name: 'GMC', models: ['Sierra', 'Yukon'] },
  { name: 'Honda', models: ['Accord', 'CR-V', 'CR-X', 'CR-Z', 'Civic', 'E', 'FR-V', 'HR-V', 'Insight', 'Jazz', 'Odyssey', 'Prelude', 'S2000'] },
  { name: 'Hongqi', models: [] },
  { name: 'Hummer', models: ['H1', 'H2', 'H3'] },
  { name: 'Hyundai', models: ['Accent', 'Atos', 'Bayon', 'Coupé', 'Elantra', 'Getz', 'H-1', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'Kona', 'Matrix', 'Santa Fe', 'Sonata', 'Trajet', 'Tucson', 'Veloster', 'i10', 'i20', 'i30', 'i40', 'ix20', 'ix35'] },
  { name: 'Isuzu', models: [] },
  { name: 'Iveco', models: [] },
  { name: 'Jaguar', models: ['E-Pace', 'F-Pace', 'F-Type', 'I-Pace', 'S-Type', 'X-Type', 'XE', 'XF', 'XJ', 'XK'] },
  { name: 'Jeep', models: ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Patriot', 'Renegade', 'Wrangler'] },
  { name: 'Kia', models: ['Carens', 'Carnival', 'Cee\u2019d', 'Cerato', 'EV3', 'EV6', 'EV9', 'Magentis', 'Niro', 'Opirus', 'Optima', 'Picanto', 'ProCreed', 'Rio', 'Sorento', 'Soul', 'Sportage', 'Stinger', 'Stonic', 'Venga', 'Xceed', 'e-Niro', 'e-Soul'] },
  { name: 'Lamborghini', models: ['Aventador', 'Gallardo', 'Huracan', 'Urus'] },
  { name: 'Land Rover', models: ['Defender', 'Discovery', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'] },
  { name: 'Lexus', models: ['CT', 'ES', 'GS', 'IS', 'LC', 'LS', 'NX', 'RC', 'RX', 'UX'] },
  { name: 'Lynk & Co', models: ['1'] },
  { name: 'MAN', models: ['TGE'] },
  { name: 'Maserati', models: ['Biturbo', 'Coupé', 'Ghibli', 'GranCabrio', 'GranTurismo', 'Levante', 'Quattroporte', 'Spyder'] },
  { name: 'Maxus', models: ['T90', 'Euniq', 'e-Deliver'] },
  { name: 'Mazda', models: ['2', '3', '323', '5', '6', '626', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-7', 'CX-80', 'CX-9', 'Demio', 'MX-30', 'MX-5', 'Premacy', 'RX-8'] },
  { name: 'McLaren', models: ['570GT', '570S', '650S', '675LT', '720S', 'GT'] },
  { name: 'Mercedes-Benz', models: ['A-Class', 'AMG GT', 'AMG models', 'B-Class', 'C-Class', 'CL', 'CLA', 'CLC', 'CLK', 'CLS', 'Citan', 'E-Class', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'EQV', 'G-Class', 'GL', 'GLA', 'GLB', 'GLC', 'GLE', 'GLK', 'GLS', 'ML', 'R-Class', 'S-Class', 'SL', 'SLC', 'SLK', 'Sprinter', 'T', 'V-Class', 'Viano', 'Vito', 'X-Class', 'eVito'] },
  { name: 'MG', models: ['4', '5', 'EHS', 'Marvel R', 'ZS'] },
  { name: 'Mini', models: ['Clubman', 'Cooper', 'Cooper S', 'Countryman', 'One'] },
  { name: 'Mitsubishi', models: ['3000 GT', 'ASX', 'Carisma', 'Colt', 'Eclipse', 'Galant', 'Grandis', 'L200', 'Lancer', 'Outlander', 'Pajero', 'Space Star', 'Space Wagon'] },
  { name: 'NIO', models: ['EL7', 'ET5', 'ET7'] },
  { name: 'Nissan', models: ['200 SX', '300 ZX', '370 Z', 'Almera', 'Ariya', 'GT-R', 'Interstar', 'Juke', 'King Cab/Navara', 'Kubistar', 'Leaf', 'Maxima', 'Micra', 'Murano', 'NV200', 'NV250', 'NV300', 'NV400', 'Note', 'Pathfinder', 'Patrol', 'Primastar', 'Primera', 'Pulsar', 'Qashqai', 'Qashqai+2', 'Sunny', 'Terrano', 'Titan', 'Townstar', 'X-Trail'] },
  { name: 'Opel', models: ['Adam', 'Agila', 'Antara', 'Ascona', 'Astra', 'Combo', 'Corsa', 'Crossland', 'Crossland X', 'Frontera', 'GT', 'Grandland', 'Grandland X', 'Insignia', 'Kadett', 'Karl', 'Meriva', 'Mokka', 'Mokka-E', 'Movano', 'Omega', 'Rekord', 'Speedset', 'Tigra', 'Vectra', 'Vivaro', 'Zafira'] },
  { name: 'Ora', models: [] },
  { name: 'Peugeot', models: ['1007', '106', '107', '108', '2008', '205', '206', '207', '208', '3008', '306', '307', '4007', '4008', '405', '406', '407', '5008', '508', '607', '807', 'Bipper', 'Boxer', 'Expert', 'Partner', 'RCZ', 'Rifter'] },
  { name: 'Polestar', models: ['Polestar 2', 'Polestar 3', 'Polestar 4', 'Polestar 5'] },
  { name: 'Porsche', models: ['356', '718', '911', '924', '928', '944', '968', '991', 'Boxster', 'Cayenne', 'Cayman', 'Macan', 'Panamera', 'Taycan'] },
  { name: 'Ram', models: ['1500', 'HD'] },
  { name: 'Renault', models: ['19', '5', 'Alaskan', 'Arkana', 'Captur', 'Clio', 'Espace', 'Kadjar', 'Kangoo', 'Koleos', 'Laguna', 'Master', 'Modus', 'Mégane', 'Scénic', 'Talisman', 'Trafic', 'Twingo', 'Twizy', 'Zoe'] },
  { name: 'Rolls-Royce', models: ['Ghost', 'Phantom'] },
  { name: 'Rover/BMC', models: [] },
  { name: 'Saab', models: ['9-3', '9-5', '900', '9000'] },
  { name: 'SEAT', models: ['Alhambra', 'Altea', 'Altea XL', 'Arona', 'Arosa', 'Ateca', 'Cordoba', 'Exeo', 'Ibiza', 'Leon', 'Mii', 'Tarraco', 'Toledo'] },
  { name: 'Skoda', models: ['Citigo', 'Enyaq', 'Fabia', 'Felicia', 'Kamiq', 'Karoq', 'Kodiaq', 'Octavia', 'Praktik', 'Rapid', 'Roomster', 'Scala', 'Superb'] },
  { name: 'Smart', models: ['#1', '#3', 'Forfour', 'Fortwo'] },
  { name: 'Ssang Yong', models: ['Actyon', 'Korando', 'Kyron', 'Rexton', 'Tivoli'] },
  { name: 'Subaru', models: ['BRZ', 'Crosstrek', 'Forester', 'Impreza', 'Justy', 'Legacy', 'Outback', 'Levorg', 'Solterra', 'Tribeca', 'WRX', 'XV'] },
  { name: 'Suzuki', models: ['Alto', 'Baleno', 'Ignis', 'Jimny', 'Kizashi', 'Liana', 'S-Cross', 'SX4', 'Splash', 'Swace', 'Swift', 'Vitara', 'Grand Vitara', 'Wagon R+'] },
  { name: 'Tesla', models: ['Model 3', 'Model S', 'Model X', 'Model Y'] },
  { name: 'Toyota', models: ['Auris', 'Avensis', 'Aygo', 'C-HR', 'Camry', 'Carina', 'Celica', 'Corolla', 'GT86', 'Hiace', 'Hilux', 'IQ', 'Land-Cruiser Series', 'MR2', 'Previa', 'Prius', 'Prius+', 'Proace', 'RAV4', 'Starlet', 'Supra', 'Tundra', 'Urban Cruiser', 'Verso', 'Verso-S', 'Yaris', 'bZ4X'] },
  { name: 'Volkswagen', models: ['Amarok', 'Arteon', 'Atlas', 'Beetle', 'Bora', 'CC', 'Caddy', 'California', 'Corrado', 'Crafter', 'Eos', 'Fox', 'Golf', 'ID Buzz', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'Jetta', 'Lupo', 'Passat', 'Phaeton', 'Polo', 'Scirocco', 'Up', 'Vento', 'e-UP', 'Sharan', 'T-Cross', 'T-Roc', 'Taigo', 'Tiguan', 'Touareg', 'Touran', 'Transporter/Caravelle'] },
  { name: 'Volvo', models: ['C30', 'C40', 'C70', 'EC40', 'EX30', 'EX40', 'EX90', 'S40', 'S60', 'S60 Cross Country', 'S70', 'S80', 'S90', 'V40', 'V40 Cross Country', 'V50', 'V60', 'V60 Cross Country', 'V70', 'V90', 'V90 Cross Country', 'XC40', 'XC60', 'XC70', 'XC90'] },
  { name: 'XPENG', models: ['G6', 'G9', 'P7'] },
  { name: 'Zeekr', models: ['H2', 'H3'] },
];

const CITIES = [
  'Alingsås', 'Arvika', 'Avesta', 'Bålsta', 'Boden', 'Bollnäs', 'Borås', 'Borlänge',
  'Bunkeflostrand', 'Enköping', 'Eskilstuna', 'Eslöv', 'Falkenberg', 'Falköping', 'Falun',
  'Gävle', 'Göteborg', 'Gustavsberg', 'Halmstad', 'Härnösand', 'Hässleholm', 'Helsingborg',
  'Höganäs', 'Höllviken och Ljunghusen', 'Hudiksvall', 'Jönköping', 'Kalmar', 'Karlshamn',
  'Karlskoga', 'Karlskrona', 'Karlstad', 'Katrineholm', 'Kinna', 'Kiruna', 'Köping',
  'Kristianstad', 'Kristinehamn', 'Kumla', 'Kungälv', 'Kungsbacka', 'Landskrona', 'Lerum',
  'Lidingö', 'Lidköping', 'Linköping', 'Ljungby', 'Lomma', 'Ludvika', 'Luleå', 'Lund',
  'Malmö', 'Mariestad', 'Märsta', 'Mjölby', 'Mölnlycke', 'Motala', 'Nässjö',
  'Nordöstra Göteborg', 'Norrköping', 'Norrtälje', 'Nyköping', 'Nynäshamn', 'Oskarshamn',
  'Piteå', 'Sala', 'Sandviken', 'Skellefteå', 'Skoghall', 'Skövde', 'Södertälje',
  'Sollentuna', 'Staffanstorp', 'Stenungsund', 'Stockholm', 'Strängnäs', 'Sundsvall',
  'Torslanda', 'Tranås', 'Trelleborg', 'Trollhättan', 'Tumba', 'Uddevalla', 'Umeå',
  'Upplands Väsby', 'Uppsala', 'Vallentuna', 'Vänersborg', 'Varberg', 'Värnamo', 'Västerås',
  'Västerhaninge', 'Västervik', 'Växjö', 'Vetlanda', 'Visby', 'Ystad', 'Åkersberga',
  'Ängelholm', 'Örebro', 'Örnsköldsvik', 'Östersund',
];

export default function SeoCarsSection() {
  return (
    <section className="bg-white md:border-t md:border-slate-100 py-16 sm:py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <h2 className="text-[24px] sm:text-[32px] font-semibold text-slate-900 tracking-tight mb-2">
            De bilar vi förmedlar
          </h2>
          <p className="text-slate-600 text-[15px] mb-10">
            Vi hjälper privatpersoner att sälja bilar av i stort sett alla märken och modeller på den svenska marknaden.
          </p>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-8">
            {BRANDS.map((brand) => (
              <div key={brand.name} className="mb-6 break-inside-avoid">
                <h3 className="text-[15px] font-semibold text-slate-900 mb-2">{brand.name}</h3>
                {brand.models.length > 0 && (
                  <ul className="space-y-1 text-[13px] text-slate-600 leading-tight">
                    {brand.models.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-[24px] sm:text-[32px] font-semibold text-slate-900 tracking-tight mb-2">
            Samtliga orter där våra bilhandlare är verksamma
          </h2>
          <p className="text-slate-600 text-[15px] mb-8">
            Vårt nätverk täcker hela Sverige – från Ystad till Kiruna.
          </p>
          <ul className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-6 text-[14px] text-slate-700 leading-[1.9]">
            {CITIES.map((city) => (
              <li key={city} className="break-inside-avoid">{city}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
