/**
 * Updates pricing, fuel_types and drivetrain in all src/lib/comparison/data/cars-*.ts files
 * with verified 2026 Swedish market data.
 *
 * Usage: node scripts/patch-frontend-cars-2026.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../src/lib/comparison/data');

// [id, fuel_types[], drivetrain[], new_from_sek, new_to_sek]
const PATCHES = [
  // ALFA ROMEO
  ['alfa_romeo_tonale',   ['el'],                              ['fwd','awd'],  469900,  599900],
  // AUDI
  ['audi_a3',             ['bensin','diesel','laddhybrid'],    ['fwd','awd'],  332200,  754400],
  ['audi_a4',             ['bensin','diesel'],                 ['fwd','awd'],  428500,  621300],
  ['audi_a5',             ['bensin','diesel'],                 ['fwd','awd'],  498700,  798700],
  ['audi_a6',             ['bensin','diesel','laddhybrid'],    ['fwd','awd'],  589000, 1124700],
  ['audi_a6_e_tron',      ['el'],                              ['fwd','awd'],  769900, 1089000],
  ['audi_a7',             ['bensin','diesel'],                 ['awd'],        843700, 1284900],
  ['audi_a8',             ['bensin','diesel'],                 ['awd'],        980700, 1652000],
  ['audi_e_tron_gt',      ['el'],                              ['awd'],       1479900, 1999900],
  ['audi_q2',             ['bensin'],                          ['fwd'],        332200,  422600],
  ['audi_q3',             ['bensin','diesel','laddhybrid'],    ['fwd','awd'],  374700,  621300],
  ['audi_q4_etron',       ['el'],                              ['rwd','awd'],  619900,  879900],
  ['audi_q6_etron',       ['el'],                              ['rwd','awd'],  764400, 1099900],
  ['audi_q5',             ['bensin','diesel','laddhybrid'],    ['awd'],        536500,  893400],
  ['audi_q7',             ['bensin','diesel','laddhybrid'],    ['awd'],        769900, 1232700],
  ['audi_q8',             ['bensin','diesel','laddhybrid'],    ['awd'],        832400, 1368900],
  ['audi_q8_etron',       ['el'],                              ['fwd','awd'],  748400, 1247700],
  // BMW
  ['bmw_1_series',        ['bensin','diesel','mildhybrid','laddhybrid'], ['fwd','awd'], 385000, 675000],
  ['bmw_2_series',        ['bensin','diesel','mildhybrid'],    ['rwd','awd'],  425000,  745000],
  ['bmw_2_active_tourer', ['bensin','diesel','laddhybrid'],    ['fwd','awd'],  428000,  568000],
  ['bmw_3_series',        ['bensin','diesel','mildhybrid','laddhybrid'], ['rwd','awd'], 505000, 825000],
  ['bmw_4_series',        ['bensin','diesel','mildhybrid'],    ['rwd','awd'],  598000,  898000],
  ['bmw_5_series',        ['bensin','diesel','mildhybrid','laddhybrid'], ['rwd','awd'], 645000, 998000],
  ['bmw_7_series',        ['bensin','diesel','mildhybrid','laddhybrid'], ['rwd','awd'], 985000, 1598000],
  ['bmw_i4',              ['el'],                              ['rwd','awd'],  539000,  739000],
  ['bmw_i5',              ['el'],                              ['rwd','awd'],  698000, 1098000],
  ['bmw_i7',              ['el'],                              ['rwd','awd'], 1145000, 1745000],
  ['bmw_ix',              ['el'],                              ['awd'],        895000, 1545000],
  ['bmw_ix1',             ['el'],                              ['fwd','awd'],  499000,  799000],
  ['bmw_ix3',             ['el'],                              ['awd'],        769000, 1169000],
  ['bmw_m2',              ['bensin'],                          ['rwd'],        849900, 1099900],
  ['bmw_m3',              ['bensin'],                          ['rwd','awd'],  895000, 1345000],
  ['bmw_m4',              ['bensin'],                          ['rwd','awd'],  895000, 1345000],
  ['bmw_x1',              ['bensin','diesel','mildhybrid','laddhybrid'], ['fwd','awd'], 549000, 872000],
  ['bmw_x2',              ['bensin','diesel','mildhybrid','laddhybrid'], ['fwd','awd'], 594000, 934000],
  ['bmw_x3',              ['bensin','diesel','mildhybrid','laddhybrid'], ['awd'],       649000, 1042000],
  ['bmw_x4',              ['bensin','diesel','mildhybrid'],    ['awd'],        695000, 1095000],
  ['bmw_x5',              ['bensin','diesel','mildhybrid','laddhybrid'], ['awd'],       798000, 1298000],
  ['bmw_x6',              ['bensin','diesel','mildhybrid'],    ['awd'],        854000, 1398000],
  ['bmw_x7',              ['bensin','diesel','mildhybrid'],    ['awd'],       1098000, 1698000],
  // BYD
  ['byd_atto3',           ['el'],                              ['fwd','awd'],  359900,  499900],
  ['byd_seal',            ['el'],                              ['fwd','awd'],  429900,  579900],
  ['byd_sea_lion_6',      ['el'],                              ['fwd','awd'],  459900,  609900],
  ['byd_dolphin',         ['el'],                              ['fwd'],        299900,  399900],
  ['byd_tang',            ['el'],                              ['fwd','awd'],  499900,  649900],
  // CUPRA
  ['cupra_born',          ['el'],                              ['fwd','awd'],  399900,  599900],
  ['cupra_formentor',     ['bensin','laddhybrid'],             ['fwd','awd'],  349900,  559900],
  ['cupra_leon',          ['bensin','laddhybrid'],             ['fwd','awd'],  309900,  469900],
  ['cupra_tavascan',      ['el'],                              ['fwd','awd'],  449900,  649900],
  // DACIA
  ['dacia_duster',        ['bensin','hybrid'],                 ['fwd','awd'],  199900,  309900],
  ['dacia_sandero',       ['bensin'],                          ['fwd'],        139900,  209900],
  ['dacia_spring',        ['el'],                              ['fwd'],        249900,  329900],
  // FORD
  ['ford_explorer',       ['el'],                              ['rwd','awd'],  599900,  849900],
  ['ford_focus',          ['bensin','laddhybrid'],             ['fwd'],        279900,  449900],
  ['ford_kuga',           ['bensin','diesel','laddhybrid'],    ['fwd','awd'],  389900,  589900],
  ['ford_mustang',        ['bensin'],                          ['rwd'],        469900,  649900],
  ['ford_mustang_mache',  ['el'],                              ['rwd','awd'],  549900,  749900],
  ['ford_puma',           ['bensin','mildhybrid','laddhybrid'],['fwd'],        249900,  409900],
  ['ford_ranger',         ['bensin','diesel','laddhybrid'],    ['awd'],        699900,  949900],
  // GENESIS
  ['genesis_gv60',        ['el'],                              ['rwd','awd'],  649900,  899900],
  ['genesis_gv70',        ['bensin','el'],                     ['awd'],        599900,  899900],
  ['genesis_gv80',        ['bensin','el'],                     ['awd'],        749900, 1099900],
  // HONDA
  ['honda_crv',           ['hybrid','laddhybrid'],             ['fwd','awd'],  449900,  609900],
  ['honda_hrv',           ['hybrid'],                          ['fwd','awd'],  319900,  429900],
  ['honda_jazz',          ['hybrid'],                          ['fwd'],        289900,  389900],
  // HYUNDAI
  ['hyundai_ioniq5',      ['el'],                              ['rwd','awd'],  399900,  579900],
  ['hyundai_ioniq6',      ['el'],                              ['rwd','awd'],  449900,  649900],
  ['hyundai_kona',        ['bensin','mildhybrid'],             ['fwd'],        319900,  449900],
  ['hyundai_kona_electric',['el'],                             ['fwd','awd'],  349900,  499900],
  ['hyundai_santa_fe',    ['bensin','diesel','mildhybrid','laddhybrid','hybrid'], ['fwd','awd'], 439900, 649900],
  ['hyundai_tucson',      ['bensin','diesel','mildhybrid','laddhybrid','hybrid'], ['fwd','awd'], 339900, 529900],
  ['hyundai_i20',         ['bensin','mildhybrid'],             ['fwd'],        239900,  339900],
  ['hyundai_i30',         ['bensin','mildhybrid','laddhybrid'],['fwd','awd'],  279900,  419900],
  // KIA
  ['kia_ev6',             ['el'],                              ['rwd','awd'],  419900,  619900],
  ['kia_ev9',             ['el'],                              ['rwd','awd'],  479900,  699900],
  ['kia_niro',            ['hybrid','laddhybrid'],             ['fwd'],        329900,  469900],
  ['kia_niro_ev',         ['el'],                              ['fwd','awd'],  379900,  529900],
  ['kia_sorento',         ['bensin','mildhybrid','laddhybrid','hybrid'], ['fwd','awd'], 449900, 679900],
  ['kia_sportage',        ['bensin','mildhybrid','laddhybrid','hybrid'], ['fwd','awd'], 349900, 569900],
  // LAND ROVER
  ['land_rover_discovery_sport', ['bensin','diesel','mildhybrid','laddhybrid'], ['awd'], 549900, 949900],
  ['land_rover_range_rover_evoque', ['bensin','diesel','mildhybrid','laddhybrid'], ['awd'], 699900, 1299900],
  ['land_rover_range_rover_sport', ['bensin','diesel','mildhybrid','laddhybrid'], ['awd'], 899900, 1699900],
  ['land_rover_range_rover',       ['bensin','diesel','mildhybrid','laddhybrid'], ['awd'], 1099900, 2199900],
  // LEXUS
  ['lexus_nx',            ['hybrid'],                          ['fwd','awd'],  499900,  699900],
  ['lexus_rx',            ['hybrid','laddhybrid'],             ['fwd','awd'],  599900,  849900],
  ['lexus_ux',            ['hybrid'],                          ['fwd','awd'],  449900,  579900],
  // MAZDA
  ['mazda_cx5',           ['bensin','mildhybrid','diesel'],    ['fwd','awd'],  359900,  549900],
  ['mazda_cx60',          ['bensin','mildhybrid'],             ['fwd','awd'],  399900,  579900],
  ['mazda_3',             ['bensin','mildhybrid','laddhybrid'],['fwd','awd'],  319900,  459900],
  ['mazda_mx5',           ['bensin'],                          ['rwd'],        479900,  649900],
  // MERCEDES-BENZ
  ['mercedes_a_class',    ['bensin','diesel','mildhybrid','laddhybrid'], ['fwd','awd'], 349900, 579900],
  ['mercedes_b_class',    ['bensin','diesel','mildhybrid','laddhybrid'], ['fwd','awd'], 379900, 609900],
  ['mercedes_c_class',    ['bensin','diesel','mildhybrid','laddhybrid'], ['rwd','awd'], 479900, 779900],
  ['mercedes_cla',        ['bensin','diesel','mildhybrid','laddhybrid'], ['fwd','awd'], 419900, 649900],
  ['mercedes_cle',        ['bensin','diesel','mildhybrid'],    ['rwd','awd'],  649900, 1099900],
  ['mercedes_cls',        ['bensin','diesel','mildhybrid'],    ['rwd','awd'],  899900, 1499900],
  ['mercedes_e_class',    ['bensin','diesel','mildhybrid','laddhybrid'], ['rwd','awd'], 649900, 1099900],
  ['mercedes_eqa',        ['el'],                              ['fwd','awd'],  499900,  799900],
  ['mercedes_eqb',        ['el'],                              ['fwd','awd'],  549900,  849900],
  ['mercedes_eqc',        ['el'],                              ['rwd','awd'],  649900, 1099900],
  ['mercedes_eqe',        ['el'],                              ['rwd','awd'],  749900, 1199900],
  ['mercedes_eqe_suv',    ['el'],                              ['rwd','awd'],  849900, 1299900],
  ['mercedes_eqs',        ['el'],                              ['rwd','awd'], 1099900, 1699900],
  ['mercedes_eqs_suv',    ['el'],                              ['awd'],       1199900, 1899900],
  ['mercedes_gla',        ['bensin','diesel','mildhybrid','laddhybrid'], ['fwd','awd'], 489900, 749900],
  ['mercedes_glb',        ['bensin','diesel','mildhybrid','laddhybrid'], ['fwd','awd'], 529900, 829900],
  ['mercedes_glc',        ['bensin','diesel','mildhybrid','laddhybrid'], ['fwd','awd'], 599900, 999900],
  ['mercedes_gle',        ['bensin','diesel','mildhybrid','laddhybrid'], ['awd'],       799900, 1299900],
  ['mercedes_gls',        ['bensin','diesel','mildhybrid'],    ['awd'],       1099900, 1799900],
  ['mercedes_s_class',    ['bensin','diesel','mildhybrid','laddhybrid'], ['rwd','awd'], 899900, 1599900],
  // MG
  ['mg_mg4',              ['el'],                              ['fwd'],        229900,  329900],
  ['mg_zs',               ['bensin','el'],                     ['fwd'],        269900,  369900],
  ['mg_hs',               ['el'],                              ['fwd','awd'],  349900,  499900],
  // MINI
  ['mini_cooper',         ['bensin','el'],                     ['fwd'],        309900,  489900],
  ['mini_countryman',     ['bensin','el'],                     ['fwd','awd'],  369900,  579900],
  // NISSAN
  ['nissan_ariya',        ['el'],                              ['fwd','awd'],  399900,  589900],
  ['nissan_leaf',         ['el'],                              ['fwd'],        329900,  459900],
  ['nissan_qashqai',      ['bensin','mildhybrid','hybrid'],    ['fwd','awd'],  299900,  429900],
  ['nissan_x_trail',      ['bensin','mildhybrid','hybrid'],    ['fwd','awd'],  379900,  539900],
  // OPEL
  ['opel_astra',          ['bensin','el'],                     ['fwd'],        279900,  419900],
  ['opel_corsa',          ['bensin','el'],                     ['fwd'],        239900,  349900],
  ['opel_grandland',      ['bensin','laddhybrid','el'],        ['fwd','awd'],  339900,  509900],
  ['opel_mokka',          ['bensin','laddhybrid','el'],        ['fwd','awd'],  299900,  449900],
  // PEUGEOT
  ['peugeot_208',         ['bensin','el'],                     ['fwd'],        239900,  349900],
  ['peugeot_2008',        ['bensin','laddhybrid','el'],        ['fwd','awd'],  299900,  459900],
  ['peugeot_3008',        ['bensin','laddhybrid','el'],        ['fwd','awd'],  349900,  529900],
  ['peugeot_308',         ['bensin','el'],                     ['fwd'],        339900,  489900],
  ['peugeot_5008',        ['bensin','diesel','laddhybrid'],    ['fwd','awd'],  399900,  609900],
  // POLESTAR
  ['polestar_2',          ['el'],                              ['rwd','awd'],  599900,  849900],
  ['polestar_3',          ['el'],                              ['awd'],        749900, 1049900],
  ['polestar_4',          ['el'],                              ['rwd','awd'],  699900,  949900],
  // PORSCHE
  ['porsche_911',         ['bensin'],                          ['rwd','awd'],  999900, 1999900],
  ['porsche_cayenne',     ['bensin','laddhybrid'],             ['rwd','awd'],  699900, 1199900],
  ['porsche_macan',       ['bensin'],                          ['rwd','awd'],  799900, 1399900],
  ['porsche_macan_electric', ['el'],                           ['rwd','awd'],  849900, 1349900],
  ['porsche_panamera',    ['bensin'],                          ['rwd','awd'],  899900, 1699900],
  ['porsche_taycan',      ['el'],                              ['rwd','awd'], 1099900, 1799900],
  // RENAULT
  ['renault_austral',     ['bensin','mildhybrid','hybrid'],    ['fwd','awd'],  379900,  549900],
  ['renault_captur',      ['bensin','mildhybrid','hybrid','laddhybrid'], ['fwd'], 289900, 439900],
  ['renault_clio',        ['bensin','mildhybrid','hybrid'],    ['fwd'],        259900,  389900],
  ['renault_megane_e',    ['el'],                              ['fwd','awd'],  359900,  519900],
  ['renault_scenic_e',    ['el'],                              ['fwd','awd'],  429900,  619900],
  // SEAT
  ['seat_arona',          ['bensin'],                          ['fwd'],        239900,  329900],
  ['seat_ateca',          ['bensin','laddhybrid'],             ['fwd','awd'],  299900,  459900],
  ['seat_ibiza',          ['bensin'],                          ['fwd'],        219900,  309900],
  ['seat_leon',           ['bensin','laddhybrid'],             ['fwd','awd'],  259900,  419900],
  // SKODA
  ['skoda_enyaq',         ['el'],                              ['rwd','awd'],  389900,  569900],
  ['skoda_fabia',         ['bensin','mildhybrid'],             ['fwd'],        239900,  349900],
  ['skoda_karoq',         ['bensin','mildhybrid','laddhybrid'],['fwd','awd'],  299900,  479900],
  ['skoda_kodiaq',        ['bensin','diesel','mildhybrid','laddhybrid'], ['fwd','awd'], 369900, 579900],
  ['skoda_octavia',       ['bensin','mildhybrid','laddhybrid'],['fwd','awd'],  319900,  499900],
  ['skoda_superb',        ['bensin','mildhybrid','laddhybrid'],['fwd','awd'],  429900,  629900],
  // SMART
  ['smart_1',             ['el'],                              ['rwd','awd'],  299900,  449900],
  // SUZUKI
  ['suzuki_vitara',       ['bensin','mildhybrid'],             ['fwd','awd'],  259900,  379900],
  ['suzuki_swift',        ['bensin','mildhybrid'],             ['fwd','awd'],  219900,  309900],
  // TESLA
  ['tesla_model_3',       ['el'],                              ['rwd','awd'],  449990,  679990],
  ['tesla_model_s',       ['el'],                              ['awd'],        939990, 1329990],
  ['tesla_model_x',       ['el'],                              ['awd'],        989990, 1389990],
  ['tesla_model_y',       ['el'],                              ['rwd','awd'],  499990,  749990],
  // TOYOTA
  ['toyota_aygo',         ['hybrid'],                          ['fwd'],        259900,  379900],
  ['toyota_bz4x',         ['el'],                              ['fwd','awd'],  449900,  649900],
  ['toyota_chr',          ['hybrid','laddhybrid'],             ['fwd','awd'],  329900,  499900],
  ['toyota_corolla',      ['hybrid'],                          ['fwd','awd'],  319900,  469900],
  ['toyota_highlander',   ['hybrid'],                          ['fwd','awd'],  449900,  649900],
  ['toyota_rav4',         ['hybrid','laddhybrid'],             ['fwd','awd'],  389900,  589900],
  ['toyota_yaris',        ['hybrid'],                          ['fwd'],        239900,  319900],
  ['toyota_yaris_cross',  ['hybrid'],                          ['fwd','awd'],  289900,  399900],
  // VOLKSWAGEN
  ['vw_golf',             ['bensin','mildhybrid','laddhybrid'],['fwd','awd'],  299900,  489900],
  ['vw_id3',              ['el'],                              ['rwd','awd'],  419900,  649900],
  ['vw_id4',              ['el'],                              ['rwd','awd'],  449900,  699900],
  ['vw_id5',              ['el'],                              ['rwd','awd'],  479900,  729900],
  ['vw_id7',              ['el'],                              ['fwd','awd'],  529900,  779900],
  ['vw_passat',           ['bensin','mildhybrid','laddhybrid'],['fwd','awd'],  399900,  599900],
  ['vw_polo',             ['bensin','mildhybrid'],             ['fwd'],        249900,  399900],
  ['vw_t_cross',          ['bensin','mildhybrid'],             ['fwd','awd'],  249900,  369900],
  ['vw_tiguan',           ['bensin','mildhybrid','laddhybrid'],['fwd','awd'],  369900,  579900],
  ['vw_touareg',          ['bensin','diesel','mildhybrid','laddhybrid'], ['fwd','awd'], 469900, 729900],
  // VOLVO — XC60/XC40 specifikt med diesel
  ['volvo_c40',           ['el'],                              ['fwd','awd'],  449900,  649900],
  ['volvo_ec40',          ['el'],                              ['fwd','awd'],  515000,  649900],
  ['volvo_ex30',          ['el'],                              ['fwd','awd'],  499900,  699900],
  ['volvo_ex40',          ['el'],                              ['fwd','awd'],  649900,  899900],
  ['volvo_ex90',          ['el'],                              ['fwd','awd'],  749900, 1049900],
  ['volvo_s60',           ['bensin','mildhybrid','laddhybrid'],['fwd','awd'],  399900,  609900],
  ['volvo_s60_recharge',  ['el','laddhybrid'],                 ['fwd','awd'],  549900,  749900],
  ['volvo_s90',           ['bensin','mildhybrid','laddhybrid'],['fwd','awd'],  499900,  749900],
  ['volvo_s90_recharge',  ['el','laddhybrid'],                 ['fwd','awd'],  649900,  849900],
  ['volvo_v60',           ['bensin','mildhybrid','laddhybrid'],['fwd','awd'],  409900,  609900],
  ['volvo_v60_recharge',  ['el','laddhybrid'],                 ['fwd','awd'],  569900,  769900],
  ['volvo_v60_cc',        ['bensin','mildhybrid','laddhybrid'],['awd'],        449900,  649900],
  ['volvo_v90',           ['bensin','mildhybrid','laddhybrid'],['fwd','awd'],  499900,  749900],
  ['volvo_v90_recharge',  ['el','laddhybrid'],                 ['fwd','awd'],  659900,  879900],
  ['volvo_v90_cc',        ['bensin','mildhybrid','diesel'],    ['awd'],        569900,  799900],
  ['volvo_xc40',          ['bensin','mildhybrid','laddhybrid'],['fwd','awd'],  339900,  539900],
  ['volvo_xc40_recharge', ['el'],                              ['fwd','awd'],  449900,  649900],
  ['volvo_xc60',          ['bensin','mildhybrid','diesel','laddhybrid'], ['fwd','awd'], 539900, 739900],
  ['volvo_xc60_recharge', ['el','laddhybrid'],                 ['fwd','awd'],  679900,  899900],
  ['volvo_xc90',          ['bensin','mildhybrid','diesel','laddhybrid'], ['fwd','awd'], 679900, 999900],
  ['volvo_xc90_recharge', ['el','laddhybrid'],                 ['awd'],        899900, 1199900],
];

const patchById = new Map(PATCHES.map(p => [p[0], p]));

function arrLit(items) {
  return `[${items.map(s => `'${s}'`).join(', ')}]`;
}

function patchBlock(src, idStr, fuelTypes, drivetrain, newFrom, newTo) {
  const idPos = src.indexOf(`id: '${idStr}'`);
  if (idPos === -1) return { src, changed: false };

  const windowLen = 1200;
  let block = src.slice(idPos, idPos + windowLen);
  let changed = false;

  // fuel_types
  const ftRe = /fuel_types:\s*\[[^\]]*\]/;
  const ftNew = `fuel_types: ${arrLit(fuelTypes)}`;
  if (ftRe.test(block)) {
    const replaced = block.replace(ftRe, ftNew);
    if (replaced !== block) { block = replaced; changed = true; }
  }

  // drivetrain
  const dtRe = /drivetrain:\s*\[[^\]]*\]/;
  const dtNew = `drivetrain: ${arrLit(drivetrain)}`;
  if (dtRe.test(block)) {
    const replaced = block.replace(dtRe, dtNew);
    if (replaced !== block) { block = replaced; changed = true; }
  }

  // new_from_sek
  const fromRe = /new_from_sek:\s*\d+/;
  const fromNew = `new_from_sek: ${newFrom}`;
  if (fromRe.test(block)) {
    const replaced = block.replace(fromRe, fromNew);
    if (replaced !== block) { block = replaced; changed = true; }
  }

  // new_to_sek
  const toRe = /new_to_sek:\s*\d+/;
  const toNew = `new_to_sek: ${newTo}`;
  if (toRe.test(block)) {
    const replaced = block.replace(toRe, toNew);
    if (replaced !== block) { block = replaced; changed = true; }
  }

  src = src.slice(0, idPos) + block + src.slice(idPos + windowLen);
  return { src, changed };
}

const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('cars-') && f.endsWith('.ts'));
let totalOk = 0, totalSkip = 0;

for (const fname of files) {
  const filePath = path.join(DATA_DIR, fname);
  let src = fs.readFileSync(filePath, 'utf8');
  let fileChanges = 0;

  for (const [id, fuels, drivetrain, fromSek, toSek] of PATCHES) {
    const { src: newSrc, changed } = patchBlock(src, id, fuels, drivetrain, fromSek, toSek);
    if (changed) { src = newSrc; fileChanges++; }
  }

  fs.writeFileSync(filePath, src, 'utf8');
  console.log(`${fname}: ${fileChanges} updated`);
  totalOk += fileChanges;
}

console.log(`\nTotal: ${totalOk} cars updated across ${files.length} files`);
