export const ELBILSPREMIE = {
  monthlyAmount: 1300,
  months: 36,
  totalBase: 46800,
  startTillaegg: 18000,
  totalMax: 64800,
  carPriceMin: 64800,
  carPriceMax: 450000,
  leaseMonthlyMin: 1800,
  leaseMonthlyMax: 4600,
  ownershipMonths: 36,
  applicationStart: '2026-03-18',
  applicationEnd: '2029-06-30',
  budgetHouseholds: 115000,
  futureReductionDate: '2028-07-01',
  futureReductionAmount: 32400,
};

export const INCOME_THRESHOLD_PCT = 80;
export const INCOME_THRESHOLD_LOW_PCT = 50;

export const ELIGIBLE_KOMMUNER: string[] = [
  'Arjeplog','Arvidsjaur','Bjurholm','Boden','Dorotea','Gällivare','Haparanda','Jokkmokk',
  'Kalix','Kiruna','Luleå','Malå','Markaryd','Norsjö','Pajala','Robertsfors','Sorsele',
  'Storuman','Umeå','Vindeln','Vännäs','Åsele','Överkalix','Övertorneå',
  'Åre','Berg','Bräcke','Härjedalen','Krokom','Ragunda','Strömsund','Åre',
  'Eda','Filipstad','Forshaga','Grums','Hagfors','Karlstad','Kil','Kristinehamn',
  'Munkfors','Storfors','Sunne','Säffle','Torsby','Arvika','Årjäng',
  'Aneby','Eksjö','Gislaved','Gnosjö','Hultsfred','Hylte','Jönköping','Mullsjö',
  'Nässjö','Sävsjö','Tranås','Vaggeryd','Vetlanda','Värnamo',
  'Boxholm','Kinda','Linköping','Mjölby','Motala','Ödeshög','Vadstena','Valdemarsvik',
  'Ydre','Åtvidaberg','Ödeshög',
  'Askersund','Degerfors','Hallsberg','Kumla','Laxå','Lekeberg','Lindesberg','Ljusnarsberg',
  'Örebro',
  'Bjuv','Bromölla','Båstad','Helsingborg','Hässleholm','Höganäs','Klippan','Kristianstad',
  'Landskrona','Lomma','Osby','Perstorp','Svalöv','Sjöbo','Skurup','Staffanstorp',
  'Svenljunga','Tomelilla','Åstorp','Ängelholm','Örkelljunge','Östra Göinge',
  'Borgholm','Emmaboda','Hultsfred','Mönsterås','Mörbylånga','Nybro','Oskarshamn',
  'Torsås','Vimmerby','Västervik',
  'Falköping','Gnosjö','Götene','Herrljunga','Hjo','Härryda','Karlsborg','Lerum',
  'Mariestad','Mullsjö','Skara','Skövde','Tibro','Tidaholm','Töreboda','Västra Götaland',
  'Essunga','Grästorp','Karlsborg','Laxå','Skara','Töreboda',
  'Heby','Kungsör','Köping','Norberg','Sala','Skinnskatteberg','Surahammar',
  'Fagersta',
  'Avesta','Borlänge','Falu','Gagnef','Hedemora','Leksand','Ludvika','Malung-Sälen',
  'Mora','Orsa','Rättvik','Smedjebacken','Säter','Vansbro','Älvdalen',
  'Hofors','Ockelbo','Sandviken','Älvkarleby','Östhammar','Gävle','Bollnäs',
  'Hudiksvall','Ljusdal','Nordanstig','Söderhamn',
  'Kramfors','Nordmaling','Sollefteå','Sundsvall','Timrå','Ånge','Örnsköldsvik',
  'Härnösand',
  'Bengtsfors','Dals-Ed','Färgelanda','Lilla Edet','Lysekil','Munkedal','Sotenäs','Strömstad',
  'Tanum','Trollhättan','Vänersborg','Åmål','Stenungsund','Orust','Sotenäs',
  'Mark','Mölndal','Partille','Ale','Alingsås','Bollebygd','Härryda','Lerum',
  'Vårgårda','Herrljunga','Uddevalla',
  'Hylte','Karlshamn','Karlskrona','Olofström','Ronneby','Sölvesborg',
  'Eskilstuna','Flensburg','Katrineholm','Köping','Nyköping','Oxelösund','Strängnäs',
  'Vingåker','Flen','Gnesta','Trosa',
  'Enköping','Heby','Knivsta','Tierp','Uppsala','Älvkarleby',
  'Norrköping','Valdemarsvik','Ödeshög',
  'Tjörn','Orust','Sotenäs','Tanum',
  'Habo','Mullsjö',
  'Knivsta','Heby',
  'Pajala','Övertorneå',
  'Ovanåker','Nordanstig',
  'Åstorp','Bjuv','Billesholm',
  'Höganäs','Båstad',
  'Trosa','Gnesta',
  'Fagersta','Norberg',
  'Smedjebacken','Sävsjö',
  'Vaggeryd','Gnosjö',
  'Mullsjö','Habo',
  'Töreboda','Karlsborg',
  'Essunga','Grästorp',
];

const KOMMUN_PREFIXES: Record<string, string[]> = {
  'Kiruna': ['980','981','980','981','982','983','984','985','986','987','988','989','990','991'],
  'Gällivare': ['980','981','982','983','984','985'],
  'Jokkmokk': ['960','961','962','963','964','965','966','967','968','969'],
  'Arjeplog': ['960','961','962','963','964','965','966','967','968','969'],
  'Arvidsjaur': ['930','931','932','933','934','935','936','937','938','939'],
  'Dorotea': ['910','911','912','913','914','915','916','917','918','919'],
  'Sorsele': ['920','921','922','923','924','925','926','927','928','929'],
  'Storuman': ['920','921','922','923','924','925','926','927','928','929'],
  'Malå': ['930','931','932','933','934','935','936','937','938','939'],
  'Norsjö': ['930','931','932','933','934','935','936','937','938','939'],
  'Boden': ['960','961','962','963','964','965','966','967','968','969'],
  'Luleå': ['970','971','972','973','974','975','976','977','978','979'],
  'Pajala': ['980','981','982','983','984','985','986','987','988','989'],
  'Övertorneå': ['950','951','952','953','954','955','956','957','958','959'],
  'Överkalix': ['950','951','952','953','954','955','956','957','958','959'],
  'Haparanda': ['950','951','952','953','954','955','956','957','958','959'],
  'Kalix': ['950','951','952','953','954','955','956','957','958','959'],
  'Älvdalen': ['780','781','782','783','784','785','786','787','788','789'],
  'Mora': ['790','791','792','793','794','795','796','797','798','799'],
  'Falu': ['790','791','792','793','794','795','796','797','798','799'],
  'Rättvik': ['790','791','792','793','794','795','796','797','798','799'],
  'Leksand': ['790','791','792','793','794','795','796','797','798','799'],
  'Orsa': ['790','791','792','793','794','795','796','797','798','799'],
  'Sävsjö': ['570','571','572','573','574','575','576','577','578','579'],
  'Vetlanda': ['570','571','572','573','574','575','576','577','578','579'],
  'Värnamo': ['570','571','572','573','574','575','576','577','578','579'],
  'Gnosjö': ['570','571','572','573','574','575','576','577','578','579'],
  'Hylte': ['310','311','312','313','314','315','316','317','318','319'],
  'Markaryd': ['280','281','282','283','284','285','286','287','288','289'],
  'Hässleholm': ['280','281','282','283','284','285','286','287','288','289'],
  'Perstorp': ['280','281','282','283','284','285','286','287','288','289'],
  'Östra Göinge': ['280','281','282','283','284','285','286','287','288','289'],
  'Bjuv': ['260','261','262','263','264','265','266','267','268','269'],
  'Svalöv': ['260','261','262','263','264','265','266','267','268','269'],
  'Åstorp': ['260','261','262','263','264','265','266','267','268','269'],
  'Klippan': ['260','261','262','263','264','265','266','267','268','269'],
  'Båstad': ['260','261','262','263','264','265','266','267','268','269'],
  'Höganäs': ['260','261','262','263','264','265','266','267','268','269'],
  'Ängelholm': ['260','261','262','263','264','265','266','267','268','269'],
  'Osby': ['280','281','282','283','284','285','286','287','288','289'],
  'Örkelljunge': ['260','261','262','263','264','265','266','267','268','269'],
  'Torsås': ['380','381','382','383','384','385','386','387','388','389'],
  'Mönsterås': ['380','381','382','383','384','385','386','387','388','389'],
  'Emmaboda': ['380','381','382','383','384','385','386','387','388','389'],
  'Mörbylånga': ['380','381','382','383','384','385','386','387','388','389'],
  'Borgholm': ['380','381','382','383','384','385','386','387','388','389'],
  'Hultsfred': ['570','571','572','573','574','575','576','577','578','579'],
  'Kinda': ['590','591','592','593','594','595','596','597','598','599'],
  'Ydre': ['590','591','592','593','594','595','596','597','598','599'],
  'Boxholm': ['590','591','592','593','594','595','596','597','598','599'],
  'Åtvidaberg': ['590','591','592','593','594','595','596','597','598','599'],
  'Valdemarsvik': ['590','591','592','593','594','595','596','597','598','599'],
  'Fagersta': ['730','731','732','733','734','735','736','737','738','739'],
  'Norberg': ['730','731','732','733','734','735','736','737','738','739'],
  'Skinnskatteberg': ['730','731','732','733','734','735','736','737','738','739'],
  'Surahammar': ['730','731','732','733','734','735','736','737','738','739'],
  'Heby': ['730','731','732','733','734','735','736','737','738','739'],
  'Säffle': ['660','661','662','663','664','665','666','667','668','669'],
  'Åmål': ['660','661','662','663','664','665','666','667','668','669'],
  'Bengtsfors': ['660','661','662','663','664','665','666','667','668','669'],
  'Dals-Ed': ['660','661','662','663','664','665','666','667','668','669'],
  'Färgelanda': ['660','661','662','663','664','665','666','667','668','669'],
  'Munkedal': ['450','451','452','453','454','455','456','457','458','459'],
  'Sotenäs': ['450','451','452','453','454','455','456','457','458','459'],
  'Tanum': ['450','451','452','453','454','455','456','457','458','459'],
  'Strömstad': ['450','451','452','453','454','455','456','457','458','459'],
  'Lysekil': ['450','451','452','453','454','455','456','457','458','459'],
  'Orust': ['470','471','472','473','474','475','476','477','478','479'],
  'Tjörn': ['470','471','472','473','474','475','476','477','478','479'],
  'Essunga': ['530','531','532','533','534','535','536','537','538','539'],
  'Grästorp': ['530','531','532','533','534','535','536','537','538','539'],
  'Vårgårda': ['530','531','532','533','534','535','536','537','538','539'],
  'Herrljunga': ['530','531','532','533','534','535','536','537','538','539'],
  'Vaggeryd': ['330','331','332','333','334','335','336','337','338','339'],
  'Gislaved': ['330','331','332','333','334','335','336','337','338','339'],
  'Aneby': ['570','571','572','573','574','575','576','577','578','579'],
  'Tranås': ['570','571','572','573','574','575','576','577','578','579'],
  'Eksjö': ['570','571','572','573','574','575','576','577','578','579'],
  'Vetlanda': ['570','571','572','573','574','575','576','577','578','579'],
  'Mullsjö': ['560','561','562','563','564','565','566','567','568','569'],
  'Habo': ['560','561','562','563','564','565','566','567','568','569'],
  'Töreboda': ['540','541','542','543','544','545','546','547','548','549'],
  'Karlsborg': ['540','541','542','543','544','545','546','547','548','549'],
  'Hjo': ['540','541','542','543','544','545','546','547','548','549'],
  'Tibro': ['540','541','542','543','544','545','546','547','548','549'],
  'Tidaholm': ['520','521','522','523','524','525','526','527','528','529'],
  'Falköping': ['520','521','522','523','524','525','526','527','528','529'],
  'Laxå': ['690','691','692','693','694','695','696','697','698','699'],
  'Lekeberg': ['690','691','692','693','694','695','696','697','698','699'],
  'Askersund': ['690','691','692','693','694','695','696','697','698','699'],
  'Ljusnarsberg': ['710','711','712','713','714','715','716','717','718','719'],
  'Hedesunda': ['810','811','812','813','814','815','816','817','818','819'],
  'Ockelbo': ['810','811','812','813','814','815','816','817','818','819'],
  'Hofors': ['810','811','812','813','814','815','816','817','818','819'],
  'Östhammar': ['740','741','742','743','744','745','746','747','748','749'],
  'Älvkarleby': ['740','741','742','743','744','745','746','747','748','749'],
  'Knivsta': ['740','741','742','743','744','745','746','747','748','749'],
  'Heby': ['730','731','732','733','734','735','736','737','738','739'],
  'Tierp': ['810','811','812','813','814','815','816','817','818','819'],
  'Nordanstig': ['820','821','822','823','824','825','826','827','828','829'],
  'Hudiksvall': ['820','821','822','823','824','825','826','827','828','829'],
  'Ljusdal': ['840','841','842','843','844','845','846','847','848','849'],
  'Söderhamn': ['820','821','822','823','824','825','826','827','828','829'],
  'Bollnäs': ['820','821','822','823','824','825','826','827','828','829'],
  'Kramfors': ['870','871','872','873','874','875','876','877','878','879'],
  'Sollefteå': ['870','871','872','873','874','875','876','877','878','879'],
  'Nordmaling': ['910','911','912','913','914','915','916','917','918','919'],
  'Robertsfors': ['910','911','912','913','914','915','916','917','918','919'],
  'Vindeln': ['910','911','912','913','914','915','916','917','918','919'],
  'Vännäs': ['910','911','912','913','914','915','916','917','918','919'],
  'Bjurholm': ['910','911','912','913','914','915','916','917','918','919'],
  'Åsele': ['910','911','912','913','914','915','916','917','918','919'],
  'Dorotea': ['910','911','912','913','914','915','916','917','918','919'],
  'Åre': ['830','831','832','833','834','835','836','837','838','839'],
  'Berg': ['840','841','842','843','844','845','846','847','848','849'],
  'Bräcke': ['840','841','842','843','844','845','846','847','848','849'],
  'Härjedalen': ['840','841','842','843','844','845','846','847','848','849'],
  'Krokom': ['830','831','832','833','834','835','836','837','838','839'],
  'Ragunda': ['840','841','842','843','844','845','846','847','848','849'],
  'Strömsund': ['830','831','832','833','834','835','836','837','838','839'],
  'Storum': ['920','921','922','923','924','925','926','927','928','929'],
  'Sorsele': ['920','921','922','923','924','925','926','927','928','929'],
  'Vilhelmina': ['910','911','912','913','914','915','916','917','918','919'],
  'Åsele': ['910','911','912','913','914','915','916','917','918','919'],
  'Degerfors': ['690','691','692','693','694','695','696','697','698','699'],
  'Hallsberg': ['690','691','692','693','694','695','696','697','698','699'],
  'Kumla': ['690','691','692','693','694','695','696','697','698','699'],
  'Lindesberg': ['710','711','712','713','714','715','716','717','718','719'],
  'Ljusnarsberg': ['710','711','712','713','714','715','716','717','718','719'],
};

export function isPostnummerEligible(postnummer: string): boolean {
  const cleaned = postnummer.replace(/\s/g, '');
  const prefix = cleaned.substring(0, 3);
  for (const kommun of Object.keys(KOMMUN_PREFIXES)) {
    if (KOMMUN_PREFIXES[kommun].includes(prefix)) {
      return true;
    }
  }
  return false;
}

export interface PremieResult {
  eligible: 'yes' | 'no' | 'probably';
  amount: number;
  hasStartTillaegg: boolean;
  kommun: string | null;
  reasons: string[];
}

export function checkElbilspremie(
  postnummer: string,
  income: number,
  hasOwnedEvLast12Months: boolean,
  medianIncome: number = 35000,
): PremieResult {
  const reasons: string[] = [];
  const eligible = isPostnummerEligible(postnummer);

  if (!eligible) {
    reasons.push('Din kommun omfattas inte av elbilspremiens landsbygdsdefinition.');
    return { eligible: 'no', amount: 0, hasStartTillaegg: false, kommun: null, reasons };
  }

  if (hasOwnedEvLast12Months) {
    reasons.push('Någon i hushållet har ägt eller leasat elbil/laddhybrid under de senaste 12 månaderna, vilket utesluter premien.');
    return { eligible: 'no', amount: 0, hasStartTillaegg: false, kommun: null, reasons };
  }

  const incomeThreshold = medianIncome * (INCOME_THRESHOLD_PCT / 100);
  if (income > incomeThreshold) {
    reasons.push(`Hushållets inkomst överstiger 80 % av medelinkomsten (${Math.round(incomeThreshold).toLocaleString('sv-SE')} kr/mån).`);
    return { eligible: 'no', amount: 0, hasStartTillaegg: false, kommun: null, reasons };
  }

  const lowIncomeThreshold = medianIncome * (INCOME_THRESHOLD_LOW_PCT / 100);
  const hasStartTillaegg = income <= lowIncomeThreshold;
  const amount = hasStartTillaegg ? ELBILSPREMIE.totalMax : ELBILSPREMIE.totalBase;

  reasons.push(`Hushållet är bosatt i en berättigad kommun.`);
  reasons.push(`Inkomsten ligger under 80 % av medelinkomsten.`);
  if (hasStartTillaegg) {
    reasons.push(`Inkomsten ligger under 50 % av medelinkomsten — du kan få starttillägget på ${ELBILSPREMIE.startTillaegg.toLocaleString('sv-SE')} kr.`);
  }

  return {
    eligible: 'yes',
    amount,
    hasStartTillaegg,
    kommun: null,
    reasons,
  };
}

export const FUEL_PRICES = {
  petrol: 18.5,
  diesel: 19.2,
  electricity: 2.5,
};

export const CO2_PER_LITER = {
  petrol: 2.31,
  diesel: 2.68,
};

export function estimateCarValue(
  regnummer: string,
  annualMileage: number,
  fuelType: 'petrol' | 'diesel' = 'petrol',
): { estimatedValue: number; monthlyCostCurrent: number; monthlyCostEv: number; annualSavings: number; co2Reduction: number } {
  const baseValue = 120000;
  const mileageAdjustment = Math.max(0, 150000 - annualMileage) * 0.4;
  const estimatedValue = Math.round(baseValue + mileageAdjustment);

  const fuelPrice = fuelType === 'diesel' ? FUEL_PRICES.diesel : FUEL_PRICES.petrol;
  const litersPerMil = fuelType === 'diesel' ? 0.55 : 0.65;
  const monthlyFuel = (annualMileage / 12 / 10) * litersPerMil * fuelPrice;
  const monthlyTax = fuelType === 'diesel' ? 350 : 250;
  const monthlyService = 400;
  const monthlyDepreciation = estimatedValue * 0.012;
  const monthlyCostCurrent = Math.round(monthlyFuel + monthlyTax + monthlyService + monthlyDepreciation);

  const evConsumption = 1.8;
  const monthlyEvFuel = (annualMileage / 12 / 10) * evConsumption * FUEL_PRICES.electricity;
  const monthlyEvTax = 70;
  const monthlyEvService = 150;
  const monthlyEvDepreciation = 250000 * 0.013;
  const monthlyCostEv = Math.round(monthlyEvFuel + monthlyEvTax + monthlyEvService + monthlyEvDepreciation);

  const annualSavings = (monthlyCostCurrent - monthlyCostEv) * 12;

  const co2PerYear = (annualMileage / 10) * litersPerMil * (fuelType === 'diesel' ? CO2_PER_LITER.diesel : CO2_PER_LITER.petrol);
  const co2Reduction = Math.round(co2PerYear);

  return { estimatedValue, monthlyCostCurrent, monthlyCostEv, annualSavings, co2Reduction };
}

export interface LaddanalysResult {
  canChargeHome: 'yes' | 'no' | 'maybe';
  description: string;
  estimatedCost?: number;
  afterGreenDeduction?: number;
  nearestPublicCharging?: string;
  publicCostPerMil?: number;
  brfInfo?: string;
}

export function analyzeCharging(
  address: string,
  housingType: 'villa' | 'bostadsratt' | 'hyresratt' | 'gatuparkering',
): LaddanalysResult {
  switch (housingType) {
    case 'villa':
      return {
        canChargeHome: 'yes',
        description: 'Du bor i villa och kan troligen installera en laddbox i din garage eller carport. En standardinstallation kostar oftast 15 000–25 000 kr.',
        estimatedCost: 20000,
        afterGreenDeduction: 10000,
      };
    case 'bostadsratt':
      return {
        canChargeHome: 'maybe',
        description: 'Som bostadsrättshavare behöver styrelsen godkänna installationen. Vi kan hjälpa dig med förslag till styrelsen och koordinera hela processen.',
        brfInfo: 'Grönt avdrag kan inte användas av BRF, men BRF kan få investeringsstöd. Vi hjälper er att navigera detta.',
      };
    case 'hyresratt':
      return {
        canChargeHome: 'no',
        description: 'Som hyresgäst kan du inte själv installera laddning. Vi kartlägger närmaste publika laddstolpar och räknar ut vad det skulle kosta dig per mil.',
        nearestPublicCharging: 'Vi kartlägger närmaste laddstolpe baserat på din adress.',
        publicCostPerMil: 3.5,
      };
    case 'gatuparkering':
      return {
        canChargeHome: 'no',
        description: 'Vid gatuparkering är hemladdning sällan möjlig. Vi hittar närmaste publika laddning och räknar ut din månadskostnad.',
        nearestPublicCharging: 'Vi kartlägger närmaste laddstolpe baserat på din adress.',
        publicCostPerMil: 3.5,
      };
  }
}
