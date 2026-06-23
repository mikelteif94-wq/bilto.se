/**
 * Runs directly against Supabase REST API to update car_catalog with
 * 2026 Swedish market prices, fuel types and drivetrains.
 *
 * Usage: node scripts/update-car-catalog-2026.mjs
 */

const SUPABASE_URL = 'https://xvtakmxumfwggnnyfqpy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2dGFrbXh1bWZ3Z2dubnlmcXB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzIzNDcsImV4cCI6MjA5MzQwODM0N30.-7Bpe7kIPy2LVUvCtnpySaRg-GODohHo6DYVxCqWESs';

// Each entry: [make, modelPattern (ILIKE), fuel_types[], drivmedel, drivlina, pris_fran, pris_till]
// modelPattern uses % wildcards for ILIKE. Entries are processed in order — more specific ones first.
const UPDATES = [
  // ── ALFA ROMEO ───────────────────────────────────────────────────────────────
  ['Alfa Romeo', '%Giulia%',   ['bensin'],           'Bensin',                        'RWD/AWD', 349900,  399900],
  ['Alfa Romeo', '%Stelvio%',  ['bensin','el'],       'Bensin / El',                   'FWD/AWD', 419900,  549900],
  ['Alfa Romeo', '%Tonale%',   ['el'],                'El',                            'FWD/AWD', 469900,  599900],
  ['Alfa Romeo', '%Junior%',   ['el'],                'El',                            'FWD/AWD', 599900,  799900],

  // ── AUDI ─────────────────────────────────────────────────────────────────────
  ['Audi', '%A3 Sportback%',   ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'FWD/AWD', 388500, 521400],
  ['Audi', 'A3',               ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'FWD/AWD', 332200, 754400],
  ['Audi', '%A4 Avant%',       ['bensin','diesel'],   'Bensin / Diesel',               'FWD/AWD', 432000,  635400],
  ['Audi', 'A4',               ['bensin','diesel'],   'Bensin / Diesel',               'FWD/AWD', 428500,  621300],
  ['Audi', '%A5 Avant%',       ['bensin','diesel'],   'Bensin / Diesel',               'FWD/AWD', 504200,  812600],
  ['Audi', 'A5',               ['bensin','diesel'],   'Bensin / Diesel',               'FWD/AWD', 498700,  798700],
  ['Audi', '%A6 e-tron%',      ['el'],                'El',                            'FWD/AWD', 769900, 1089000],
  ['Audi', '%A6 Avant%',       ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'FWD/AWD', 617400, 1136200],
  ['Audi', 'A6',               ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'FWD/AWD', 589000, 1124700],
  ['Audi', 'A7',               ['bensin','diesel'],   'Bensin / Diesel',               'AWD',     843700, 1284900],
  ['Audi', 'A8',               ['bensin','diesel'],   'Bensin / Diesel',               'AWD',     980700, 1652000],
  ['Audi', 'Q2',               ['bensin'],            'Bensin',                        'FWD',     332200,  422600],
  ['Audi', '%Q3 Sportback%',   ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'FWD/AWD', 428700, 672300],
  ['Audi', 'Q3',               ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'FWD/AWD', 374700, 621300],
  ['Audi', '%Q4 e-tron Sportback%', ['el'],           'El',                            'FWD/AWD', 644900,  909900],
  ['Audi', '%Q4 e-tron%',      ['el'],                'El',                            'FWD/AWD', 619900,  879900],
  ['Audi', '%Q5 Sportback%',   ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'FWD/AWD', 569800, 934700],
  ['Audi', 'Q5',               ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'FWD/AWD', 536500, 893400],
  ['Audi', 'Q7',               ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'AWD',     769900, 1232700],
  ['Audi', '%Q8 e-tron Sportback%', ['el'],           'El',                            'FWD/AWD', 775200, 1287700],
  ['Audi', '%Q8 e-tron%',      ['el'],                'El',                            'FWD/AWD', 748400, 1247700],
  ['Audi', 'Q8',               ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'AWD',     832400, 1368900],
  ['Audi', '%TT%',             ['bensin'],            'Bensin',                        'AWD',    1048700, 1752700],
  ['Audi', '%e-tron GT%',      ['el'],                'El',                            'AWD',    1479900, 1999900],
  ['Audi', '%RS3%',            ['bensin'],            'Bensin',                        'AWD',    1052700, 1452700],
  ['Audi', '%RS6%',            ['bensin'],            'Bensin',                        'AWD',    1215700, 1415700],

  // ── BMW ──────────────────────────────────────────────────────────────────────
  ['BMW', '%1 Serie%',         ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'RWD/AWD', 385000, 675000],
  ['BMW', '%2 Active Tourer%', ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'FWD/AWD', 428000, 568000],
  ['BMW', '%2 Gran Tourer%',   ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'FWD/AWD', 459000, 609000],
  ['BMW', '%2 Serie%',         ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'RWD/AWD', 425000, 745000],
  ['BMW', '%3 Serie%',         ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'RWD/AWD', 505000, 825000],
  ['BMW', '%4 Serie%',         ['bensin','diesel','mildhybrid'], 'Bensin / Diesel / Mildhybrid', 'RWD/AWD', 598000, 898000],
  ['BMW', '%5 Serie%',         ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'RWD/AWD', 645000, 998000],
  ['BMW', '%6 Serie%',         ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'RWD/AWD', 698000, 1098000],
  ['BMW', '%7 Serie%',         ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'RWD/AWD', 985000, 1598000],
  ['BMW', '%8 Serie%',         ['bensin','diesel','mildhybrid'], 'Bensin / Diesel / Mildhybrid', 'RWD/AWD', 1125000, 1895000],
  ['BMW', '%i4%',              ['el'],                'El',                            'RWD/AWD', 539000,  739000],
  ['BMW', '%i5%',              ['el'],                'El',                            'RWD/AWD', 698000, 1098000],
  ['BMW', '%i7%',              ['el'],                'El',                            'RWD/AWD', 1145000, 1745000],
  ['BMW', '%iX1%',             ['el'],                'El',                            'FWD/AWD', 499000,  799000],
  ['BMW', '%iX2%',             ['el'],                'El',                            'FWD/AWD', 549000,  849000],
  ['BMW', '%iX3%',             ['el'],                'El',                            'AWD',     769000, 1169000],
  ['BMW', '%iX%',              ['el'],                'El',                            'AWD',     895000, 1545000],
  ['BMW', '%X1%',              ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'AWD', 549000, 872000],
  ['BMW', '%X2%',              ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'AWD', 594000, 934000],
  ['BMW', '%X3%',              ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'AWD', 649000, 1042000],
  ['BMW', '%X4%',              ['bensin','diesel','mildhybrid'], 'Bensin / Diesel / Mildhybrid', 'AWD', 695000, 1095000],
  ['BMW', '%X5%',              ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'AWD', 798000, 1298000],
  ['BMW', '%X6%',              ['bensin','diesel','mildhybrid'], 'Bensin / Diesel / Mildhybrid', 'AWD', 854000, 1398000],
  ['BMW', '%X7%',              ['bensin','diesel','mildhybrid'], 'Bensin / Diesel / Mildhybrid', 'AWD', 1098000, 1698000],
  ['BMW', '%M3%',              ['bensin'],            'Bensin',                        'RWD/AWD', 895000, 1345000],
  ['BMW', '%M4%',              ['bensin'],            'Bensin',                        'RWD/AWD', 895000, 1345000],
  ['BMW', '%M5%',              ['bensin'],            'Bensin',                        'RWD/AWD', 895000, 1345000],

  // ── BYD ──────────────────────────────────────────────────────────────────────
  ['BYD', '%Atto 3%',          ['el'],                'El',                            'FWD/AWD', 359900,  499900],
  ['BYD', '%Seal U%',          ['el'],                'El',                            'FWD/AWD', 459900,  609900],
  ['BYD', '%Seal%',            ['el'],                'El',                            'FWD/AWD', 429900,  579900],
  ['BYD', '%Dolphin%',         ['el'],                'El',                            'FWD',     299900,  399900],
  ['BYD', '%Tang%',            ['el'],                'El',                            'FWD/AWD', 499900,  649900],

  // ── CITROËN ──────────────────────────────────────────────────────────────────
  ['Citroën', '%C3 Aircross%', ['bensin','el'],       'Bensin / El',                   'FWD',     249900,  369900],
  ['Citroën', '%C3%',          ['bensin','el'],       'Bensin / El',                   'FWD',     199900,  299900],
  ['Citroën', '%C5 Aircross%', ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'FWD/AWD', 299900, 449900],
  ['Citroën', '%ë-C4%',        ['el'],                'El',                            'FWD',     349900,  479900],
  ['Citroën', '%ë-C5 X%',      ['el'],                'El',                            'FWD/AWD', 399900,  529900],

  // ── CUPRA ────────────────────────────────────────────────────────────────────
  ['Cupra', '%Born%',          ['el'],                'El',                            'FWD/AWD', 399900,  599900],
  ['Cupra', '%Formentor%',     ['bensin','laddhybrid'], 'Bensin / Laddhybrid',         'FWD/AWD', 349900,  559900],
  ['Cupra', '%Leon%',          ['bensin','laddhybrid'], 'Bensin / Laddhybrid',         'FWD/AWD', 309900,  469900],
  ['Cupra', '%Tavascan%',      ['el'],                'El',                            'FWD/AWD', 449900,  649900],

  // ── DACIA ────────────────────────────────────────────────────────────────────
  ['Dacia', '%Bigster%',       ['bensin','hybrid'],   'Bensin / Hybrid',               'FWD',     279900,  379900],
  ['Dacia', '%Duster%',        ['bensin','hybrid'],   'Bensin / Hybrid',               'FWD/AWD', 199900,  309900],
  ['Dacia', '%Jogger%',        ['bensin'],            'Bensin',                        'FWD',     229900,  329900],
  ['Dacia', '%Sandero Stepway%', ['bensin'],          'Bensin',                        'FWD',     169900,  239900],
  ['Dacia', '%Sandero%',       ['bensin'],            'Bensin',                        'FWD',     139900,  209900],
  ['Dacia', '%Spring%',        ['el'],                'El',                            'FWD',     249900,  329900],

  // ── DS ───────────────────────────────────────────────────────────────────────
  ['DS', '%DS 4%',             ['el'],                'El',                            'FWD/AWD', 549900,  749900],
  ['DS', '%DS 7%',             ['bensin','laddhybrid'], 'Bensin / Laddhybrid',         'FWD/AWD', 469900,  649900],
  ['DS', '%DS 9%',             ['el'],                'El',                            'FWD/AWD', 649900,  849900],

  // ── FIAT ─────────────────────────────────────────────────────────────────────
  ['Fiat', '%500X%',           ['bensin'],            'Bensin',                        'FWD',     279900,  369900],
  ['Fiat', '%500%',            ['bensin','el'],       'Bensin / El',                   'FWD',     189900,  279900],
  ['Fiat', '%600%',            ['bensin','laddhybrid'], 'Bensin / Laddhybrid',         'FWD',     299900,  419900],

  // ── FORD ─────────────────────────────────────────────────────────────────────
  ['Ford', '%Explorer%',       ['el'],                'El',                            'RWD/AWD', 599900,  849900],
  ['Ford', '%Focus%',          ['bensin','laddhybrid'], 'Bensin / Laddhybrid',         'FWD',     279900,  449900],
  ['Ford', '%Kuga%',           ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'FWD/AWD', 389900, 589900],
  ['Ford', '%Mustang Mach-E%', ['el'],                'El',                            'RWD/AWD', 549900,  749900],
  ['Ford', '%Mustang%',        ['bensin'],            'Bensin',                        'RWD',     469900,  649900],
  ['Ford', '%Puma%',           ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD', 249900, 409900],
  ['Ford', '%Ranger%',         ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'AWD', 699900, 949900],

  // ── GENESIS ──────────────────────────────────────────────────────────────────
  ['Genesis', '%G80%',         ['bensin','laddhybrid','el'], 'Bensin / Laddhybrid / El', 'RWD/AWD', 549900, 849900],
  ['Genesis', '%GV60%',        ['el'],                'El',                            'RWD/AWD', 649900,  899900],
  ['Genesis', '%GV70%',        ['bensin','el'],       'Bensin / El',                   'AWD',     599900,  899900],
  ['Genesis', '%GV80%',        ['bensin','el'],       'Bensin / El',                   'AWD',     749900, 1099900],

  // ── HONDA ────────────────────────────────────────────────────────────────────
  ['Honda', '%CR-V%',          ['hybrid','laddhybrid'], 'Hybrid / Laddhybrid',         'FWD/AWD', 449900,  609900],
  ['Honda', '%e:Ny1%',         ['el'],                'El',                            'FWD/AWD', 499900,  699900],
  ['Honda', '%HR-V%',          ['hybrid'],            'Hybrid',                        'FWD/AWD', 319900,  429900],
  ['Honda', '%Jazz%',          ['hybrid'],            'Hybrid',                        'FWD',     289900,  389900],
  ['Honda', '%ZR-V%',          ['hybrid'],            'Hybrid',                        'FWD/AWD', 389900,  529900],

  // ── HYUNDAI ──────────────────────────────────────────────────────────────────
  ['Hyundai', '%IONIQ 5%',     ['el'],                'El',                            'RWD/AWD', 399900,  579900],
  ['Hyundai', '%IONIQ 6%',     ['el'],                'El',                            'RWD/AWD', 449900,  649900],
  ['Hyundai', '%IONIQ 7%',     ['el'],                'El',                            'RWD/AWD', 549900,  799900],
  ['Hyundai', '%IONIQ 9%',     ['el'],                'El',                            'RWD/AWD', 649900,  999900],
  ['Hyundai', '%Kona Electric%', ['el'],              'El',                            'FWD/AWD', 349900,  499900],
  ['Hyundai', '%Kona%',        ['bensin','mildhybrid'], 'Bensin / Mildhybrid',         'FWD',     319900,  449900],
  ['Hyundai', '%Santa Fe%',    ['bensin','diesel','mildhybrid','laddhybrid','hybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid / Hybrid', 'FWD/AWD', 439900, 649900],
  ['Hyundai', '%Tucson%',      ['bensin','diesel','mildhybrid','laddhybrid','hybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid / Hybrid', 'FWD/AWD', 339900, 529900],
  ['Hyundai', '%i20%',         ['bensin','mildhybrid'], 'Bensin / Mildhybrid',         'FWD',     239900,  339900],
  ['Hyundai', '%i30%',         ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 279900, 419900],

  // ── JAGUAR ───────────────────────────────────────────────────────────────────
  ['Jaguar', '%F-Pace%',       ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'AWD', 649900, 1099900],
  ['Jaguar', '%I-Pace%',       ['el'],                'El',                            'AWD',     799900, 1099900],
  ['Jaguar', '%Type 00%',      ['el'],                'El',                            'AWD',    1099000, 1799000],

  // ── JEEP ─────────────────────────────────────────────────────────────────────
  ['Jeep', '%Avenger%',        ['el'],                'El',                            'FWD/AWD', 449900,  649900],
  ['Jeep', '%Compass%',        ['bensin','laddhybrid'], 'Bensin / Laddhybrid',         'FWD/AWD', 369900,  549900],
  ['Jeep', '%Grand Cherokee%', ['bensin','laddhybrid'], 'Bensin / Laddhybrid',         'AWD',     599900,  899900],
  ['Jeep', '%Renegade%',       ['bensin','laddhybrid'], 'Bensin / Laddhybrid',         'FWD/AWD', 319900,  469900],
  ['Jeep', '%Wrangler%',       ['bensin','laddhybrid'], 'Bensin / Laddhybrid',         'AWD',     549900,  799900],

  // ── KIA ──────────────────────────────────────────────────────────────────────
  ['Kia', '%Ceed%',            ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD', 299900, 439900],
  ['Kia', '%EV6%',             ['el'],                'El',                            'RWD/AWD', 419900,  619900],
  ['Kia', '%EV9%',             ['el'],                'El',                            'RWD/AWD', 479900,  699900],
  ['Kia', '%Niro Electric%',   ['el'],                'El',                            'FWD/AWD', 379900,  529900],
  ['Kia', '%Niro%',            ['hybrid','laddhybrid'], 'Hybrid / Laddhybrid',         'FWD',     329900,  469900],
  ['Kia', '%ProCeed%',         ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD', 329900, 469900],
  ['Kia', '%Sorento%',         ['bensin','mildhybrid','laddhybrid','hybrid'], 'Bensin / Mildhybrid / Laddhybrid / Hybrid', 'FWD/AWD', 449900, 679900],
  ['Kia', '%Sportage%',        ['bensin','mildhybrid','laddhybrid','hybrid'], 'Bensin / Mildhybrid / Laddhybrid / Hybrid', 'FWD/AWD', 349900, 569900],
  ['Kia', '%Stonic%',          ['bensin','mildhybrid'], 'Bensin / Mildhybrid',         'FWD',     259900,  369900],

  // ── LAMBORGHINI ──────────────────────────────────────────────────────────────
  ['Lamborghini', '%Huracan%', ['bensin'],            'Bensin',                        'AWD',    3499000, 5999000],
  ['Lamborghini', '%Revuelto%', ['bensin'],           'Bensin',                        'AWD',    4999000, 8999000],
  ['Lamborghini', '%Urus%',    ['bensin'],            'Bensin',                        'AWD',    2699000, 3999000],

  // ── LAND ROVER ───────────────────────────────────────────────────────────────
  ['Land Rover', '%Discovery Sport%', ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'AWD', 549900, 949900],
  ['Land Rover', '%Discovery%',       ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'AWD', 649900, 1199900],
  ['Land Rover', '%Freelander%',      ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'AWD', 549900, 999900],
  ['Land Rover', '%Range Rover Evoque%', ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'AWD', 699900, 1299900],
  ['Land Rover', '%Range Rover Velar%',  ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'AWD', 799900, 1499900],
  ['Land Rover', '%Range Rover Sport%',  ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'AWD', 899900, 1699900],
  ['Land Rover', '%Range Rover%',        ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'AWD', 1099900, 2199900],

  // ── LEXUS ────────────────────────────────────────────────────────────────────
  ['Lexus', '%GX%',            ['hybrid'],            'Hybrid',                        'AWD',     799900, 1099900],
  ['Lexus', '%LBX%',           ['el'],                'El',                            'AWD',     649900,  899900],
  ['Lexus', '%LX%',            ['hybrid'],            'Hybrid',                        'AWD',     999900, 1399900],
  ['Lexus', '%NX%',            ['hybrid'],            'Hybrid',                        'FWD/AWD', 499900,  699900],
  ['Lexus', '%RX%',            ['hybrid','laddhybrid'], 'Hybrid / Laddhybrid',         'FWD/AWD', 599900,  849900],
  ['Lexus', '%RZ%',            ['el'],                'El',                            'AWD',     699900,  999900],
  ['Lexus', '%UX%',            ['hybrid'],            'Hybrid',                        'FWD/AWD', 449900,  579900],

  // ── MAZDA ────────────────────────────────────────────────────────────────────
  ['Mazda', '%CX-5%',          ['bensin','mildhybrid','diesel'], 'Bensin / Mildhybrid / Diesel', 'FWD/AWD', 359900, 549900],
  ['Mazda', '%CX-60%',         ['bensin','mildhybrid'], 'Bensin / Mildhybrid',         'FWD/AWD', 399900,  579900],
  ['Mazda', '%CX-80%',         ['bensin','mildhybrid'], 'Bensin / Mildhybrid',         'FWD/AWD', 449900,  629900],
  ['Mazda', '%Mazda2%',        ['bensin','mildhybrid'], 'Bensin / Mildhybrid',         'FWD/AWD', 269900,  379900],
  ['Mazda', '%Mazda3%',        ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 319900, 459900],
  ['Mazda', '%MX-30%',         ['el'],                'El',                            'FWD/AWD', 399900,  549900],
  ['Mazda', '%MX-5%',          ['bensin'],            'Bensin',                        'RWD',     479900,  649900],

  // ── MERCEDES-BENZ ────────────────────────────────────────────────────────────
  ['Mercedes-Benz', '%A-Klass%',       ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'FWD/AWD', 349900, 579900],
  ['Mercedes-Benz', '%AMG GT%',        ['bensin'],    'Bensin',                        'RWD/AWD', 1299900, 1999900],
  ['Mercedes-Benz', '%B-Klass%',       ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'FWD/AWD', 379900, 609900],
  ['Mercedes-Benz', '%C-Klass%',       ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'RWD/AWD', 479900, 779900],
  ['Mercedes-Benz', '%CLA Shooting Brake%', ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'FWD/AWD', 449900, 679900],
  ['Mercedes-Benz', '%CLA%',           ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'FWD/AWD', 419900, 649900],
  ['Mercedes-Benz', '%CLE%',           ['bensin','diesel','mildhybrid'], 'Bensin / Diesel / Mildhybrid', 'RWD/AWD', 649900, 1099900],
  ['Mercedes-Benz', '%CLS%',           ['bensin','diesel','mildhybrid'], 'Bensin / Diesel / Mildhybrid', 'RWD/AWD', 899900, 1499900],
  ['Mercedes-Benz', '%E-Klass%',       ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'RWD/AWD', 649900, 1099900],
  ['Mercedes-Benz', '%EQA%',           ['el'],        'El',                            'FWD/AWD', 499900,  799900],
  ['Mercedes-Benz', '%EQB%',           ['el'],        'El',                            'FWD/AWD', 549900,  849900],
  ['Mercedes-Benz', '%EQC%',           ['el'],        'El',                            'RWD/AWD', 649900, 1099900],
  ['Mercedes-Benz', '%EQE SUV%',       ['el'],        'El',                            'RWD/AWD', 849900, 1299900],
  ['Mercedes-Benz', '%EQE%',           ['el'],        'El',                            'RWD/AWD', 749900, 1199900],
  ['Mercedes-Benz', '%EQS SUV%',       ['el'],        'El',                            'AWD',    1199900, 1899900],
  ['Mercedes-Benz', '%EQS%',           ['el'],        'El',                            'RWD/AWD', 1099900, 1699900],
  ['Mercedes-Benz', '%GLA%',           ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'FWD/AWD', 489900, 749900],
  ['Mercedes-Benz', '%GLB%',           ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'FWD/AWD', 529900, 829900],
  ['Mercedes-Benz', '%GLC Coupe%',     ['bensin','diesel','mildhybrid'], 'Bensin / Diesel / Mildhybrid', 'AWD', 649900, 1099900],
  ['Mercedes-Benz', '%GLC%',           ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'FWD/AWD', 599900, 999900],
  ['Mercedes-Benz', '%GLE Coupe%',     ['bensin','diesel','mildhybrid'], 'Bensin / Diesel / Mildhybrid', 'AWD', 849900, 1349900],
  ['Mercedes-Benz', '%GLE%',           ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'AWD', 799900, 1299900],
  ['Mercedes-Benz', '%GLS%',           ['bensin','diesel','mildhybrid'], 'Bensin / Diesel / Mildhybrid', 'AWD', 1099900, 1799900],
  ['Mercedes-Benz', '%S-Klass%',       ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'RWD/AWD', 899900, 1599900],

  // ── MG ───────────────────────────────────────────────────────────────────────
  ['MG', '%Marvel R%',         ['el'],                'El',                            'FWD/AWD', 419900,  569900],
  ['MG', '%MG4%',              ['el'],                'El',                            'FWD',     229900,  329900],
  ['MG', '%HS%',               ['el'],                'El',                            'FWD/AWD', 349900,  499900],
  ['MG', '%ZS%',               ['bensin','el'],       'Bensin / El',                   'FWD',     269900,  369900],

  // ── MINI ─────────────────────────────────────────────────────────────────────
  ['MINI', '%Aceman%',         ['el'],                'El',                            'FWD',     399900,  569900],
  ['MINI', '%Countryman%',     ['bensin','el'],       'Bensin / El',                   'FWD/AWD', 369900,  579900],
  ['MINI', '%Cooper%',         ['bensin','el'],       'Bensin / El',                   'FWD',     309900,  489900],

  // ── NISSAN ───────────────────────────────────────────────────────────────────
  ['Nissan', '%Ariya%',        ['el'],                'El',                            'FWD/AWD', 399900,  589900],
  ['Nissan', '%Leaf%',         ['el'],                'El',                            'FWD',     329900,  459900],
  ['Nissan', '%Qashqai%',      ['bensin','mildhybrid','hybrid'], 'Bensin / Mildhybrid / Hybrid', 'FWD/AWD', 299900, 429900],
  ['Nissan', '%X-Trail%',      ['bensin','mildhybrid','hybrid'], 'Bensin / Mildhybrid / Hybrid', 'FWD/AWD', 379900, 539900],

  // ── OPEL ─────────────────────────────────────────────────────────────────────
  ['Opel', '%Astra%',          ['bensin','el'],       'Bensin / El',                   'FWD',     279900,  419900],
  ['Opel', '%Corsa%',          ['bensin','el'],       'Bensin / El',                   'FWD',     239900,  349900],
  ['Opel', '%Grandland%',      ['bensin','laddhybrid','el'], 'Bensin / Laddhybrid / El', 'FWD/AWD', 339900, 509900],
  ['Opel', '%Mokka%',          ['bensin','laddhybrid','el'], 'Bensin / Laddhybrid / El', 'FWD/AWD', 299900, 449900],

  // ── PEUGEOT ──────────────────────────────────────────────────────────────────
  ['Peugeot', '%2008%',        ['bensin','laddhybrid','el'], 'Bensin / Laddhybrid / El', 'FWD/AWD', 299900, 459900],
  ['Peugeot', '%208%',         ['bensin','el'],       'Bensin / El',                   'FWD',     239900,  349900],
  ['Peugeot', '%3008%',        ['bensin','laddhybrid','el'], 'Bensin / Laddhybrid / El', 'FWD/AWD', 349900, 529900],
  ['Peugeot', '%308%',         ['bensin','el'],       'Bensin / El',                   'FWD',     339900,  489900],
  ['Peugeot', '%5008%',        ['bensin','diesel','laddhybrid'], 'Bensin / Diesel / Laddhybrid', 'FWD/AWD', 399900, 609900],

  // ── POLESTAR ─────────────────────────────────────────────────────────────────
  ['Polestar', '%Polestar 1%', ['bensin'],            'Bensin',                        'AWD',     899900, 1099900],
  ['Polestar', '%Polestar 2%', ['el'],                'El',                            'RWD/AWD', 599900,  849900],
  ['Polestar', '%Polestar 3%', ['el'],                'El',                            'AWD',     749900, 1049900],
  ['Polestar', '%Polestar 4%', ['el'],                'El',                            'RWD/AWD', 699900,  949900],

  // ── PORSCHE ──────────────────────────────────────────────────────────────────
  ['Porsche', '%911%',         ['bensin'],            'Bensin',                        'RWD/AWD', 999900, 1999900],
  ['Porsche', '%Cayenne%',     ['bensin','laddhybrid'], 'Bensin / Laddhybrid',         'RWD/AWD', 699900, 1199900],
  ['Porsche', '%Macan Electric%', ['el'],             'El',                            'RWD/AWD', 849900, 1349900],
  ['Porsche', '%Macan%',       ['bensin'],            'Bensin',                        'RWD/AWD', 799900, 1399900],
  ['Porsche', '%Panamera%',    ['bensin'],            'Bensin',                        'RWD/AWD', 899900, 1699900],
  ['Porsche', '%Taycan%',      ['el'],                'El',                            'RWD/AWD', 1099900, 1799900],

  // ── RENAULT ──────────────────────────────────────────────────────────────────
  ['Renault', '%5 E-Tech%',    ['el'],                'El',                            'FWD',     269900,  399900],
  ['Renault', '%Austral%',     ['bensin','mildhybrid','hybrid'], 'Bensin / Mildhybrid / Hybrid', 'FWD/AWD', 379900, 549900],
  ['Renault', '%Captur%',      ['bensin','mildhybrid','hybrid'], 'Bensin / Mildhybrid / Hybrid', 'FWD',     289900, 439900],
  ['Renault', '%Clio%',        ['bensin','mildhybrid','hybrid'], 'Bensin / Mildhybrid / Hybrid', 'FWD',     259900, 389900],
  ['Renault', '%Megane E-Tech%', ['el'],              'El',                            'FWD/AWD', 359900,  519900],
  ['Renault', '%Megane%',      ['bensin','mildhybrid','hybrid'], 'Bensin / Mildhybrid / Hybrid', 'FWD',     329900, 489900],
  ['Renault', '%Scenic E-Tech%', ['el'],              'El',                            'FWD/AWD', 429900,  619900],
  ['Renault', '%Zoe%',         ['el'],                'El',                            'FWD',     249900,  379900],

  // ── SEAT ─────────────────────────────────────────────────────────────────────
  ['Seat', '%Ateca%',          ['bensin','laddhybrid'], 'Bensin / Laddhybrid',         'FWD/AWD', 299900,  459900],
  ['Seat', '%Leon%',           ['bensin','laddhybrid'], 'Bensin / Laddhybrid',         'FWD/AWD', 259900,  419900],
  ['Seat', '%Tarraco%',        ['bensin','laddhybrid'], 'Bensin / Laddhybrid',         'FWD/AWD', 359900,  559900],

  // ── SKODA ────────────────────────────────────────────────────────────────────
  ['Skoda', '%Enyaq%',         ['el'],                'El',                            'FWD/AWD', 389900,  569900],
  ['Skoda', '%Fabia%',         ['bensin','mildhybrid'], 'Bensin / Mildhybrid',         'FWD',     239900,  349900],
  ['Skoda', '%Karoq%',         ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 299900, 479900],
  ['Skoda', '%Kodiaq%',        ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'FWD/AWD', 369900, 579900],
  ['Skoda', '%Octavia Combi%', ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 339900, 519900],
  ['Skoda', '%Octavia%',       ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 319900, 499900],
  ['Skoda', '%Scala%',         ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 289900, 449900],
  ['Skoda', '%Superb%',        ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 429900, 629900],

  // ── SMART ────────────────────────────────────────────────────────────────────
  ['smart', '%#1%',            ['el'],                'El',                            'FWD/AWD', 299900,  449900],
  ['smart', '%#3%',            ['el'],                'El',                            'FWD/AWD', 349900,  499900],

  // ── SUZUKI ───────────────────────────────────────────────────────────────────
  ['Suzuki', '%Across%',       ['bensin'],            'Bensin',                        'AWD',     329900,  469900],
  ['Suzuki', '%Jimny%',        ['bensin'],            'Bensin',                        'AWD',     379900,  529900],
  ['Suzuki', '%S-Cross%',      ['bensin','mildhybrid'], 'Bensin / Mildhybrid',         'FWD/AWD', 279900,  399900],
  ['Suzuki', '%Swift%',        ['bensin','mildhybrid'], 'Bensin / Mildhybrid',         'FWD/AWD', 219900,  309900],
  ['Suzuki', '%Vitara%',       ['bensin','mildhybrid'], 'Bensin / Mildhybrid',         'FWD/AWD', 259900,  379900],

  // ── TESLA ────────────────────────────────────────────────────────────────────
  ['Tesla', '%Cybertruck%',    ['el'],                'El',                            'AWD',     799990, 1099990],
  ['Tesla', '%Model 3%',       ['el'],                'El',                            'RWD/AWD', 449990,  679990],
  ['Tesla', '%Model S%',       ['el'],                'El',                            'AWD',     939990, 1329990],
  ['Tesla', '%Model X%',       ['el'],                'El',                            'AWD',     989990, 1389990],
  ['Tesla', '%Model Y%',       ['el'],                'El',                            'RWD/AWD', 499990,  749990],

  // ── TOYOTA ───────────────────────────────────────────────────────────────────
  ['Toyota', '%Aygo%',         ['hybrid'],            'Hybrid',                        'FWD',     259900,  379900],
  ['Toyota', '%bZ3X%',         ['el'],                'El',                            'FWD/AWD', 499900,  749900],
  ['Toyota', '%bZ4X%',         ['el'],                'El',                            'FWD/AWD', 449900,  649900],
  ['Toyota', '%C-HR%',         ['hybrid','laddhybrid'], 'Hybrid / Laddhybrid',         'FWD/AWD', 329900,  499900],
  ['Toyota', '%Corolla Cross%', ['hybrid'],           'Hybrid',                        'FWD/AWD', 359900,  519900],
  ['Toyota', '%Corolla%',      ['hybrid'],            'Hybrid',                        'FWD/AWD', 319900,  469900],
  ['Toyota', '%Crown%',        ['hybrid','laddhybrid'], 'Hybrid / Laddhybrid',         'FWD/AWD', 549900,  849900],
  ['Toyota', '%Highlander%',   ['hybrid'],            'Hybrid',                        'FWD/AWD', 449900,  649900],
  ['Toyota', '%RAV4%',         ['hybrid','laddhybrid'], 'Hybrid / Laddhybrid',         'FWD/AWD', 389900,  589900],
  ['Toyota', '%Venza%',        ['hybrid','laddhybrid'], 'Hybrid / Laddhybrid',         'FWD/AWD', 499900,  749900],
  ['Toyota', '%Yaris Cross%',  ['hybrid'],            'Hybrid',                        'FWD/AWD', 289900,  399900],
  ['Toyota', '%Yaris%',        ['hybrid'],            'Hybrid',                        'FWD',     239900,  319900],

  // ── VOLKSWAGEN ───────────────────────────────────────────────────────────────
  ['Volkswagen', '%Arteon%',        ['bensin'],        'Bensin',                       'RWD',     399900,  549900],
  ['Volkswagen', '%Golf Variant%',  ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 329900, 529900],
  ['Volkswagen', '%Golf%',          ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 299900, 489900],
  ['Volkswagen', '%ID.2%',          ['el'],            'El',                           'FWD',     349900,  499900],
  ['Volkswagen', '%ID.3%',          ['el'],            'El',                           'RWD/AWD', 419900,  649900],
  ['Volkswagen', '%ID.4%',          ['el'],            'El',                           'RWD/AWD', 449900,  699900],
  ['Volkswagen', '%ID.5%',          ['el'],            'El',                           'RWD/AWD', 479900,  729900],
  ['Volkswagen', '%ID.7%',          ['el'],            'El',                           'FWD/AWD', 529900,  779900],
  ['Volkswagen', '%Passat Variant%', ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 429900, 639900],
  ['Volkswagen', '%Passat%',        ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 399900, 599900],
  ['Volkswagen', '%Polo%',          ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 249900, 399900],
  ['Volkswagen', '%T-Roc%',         ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 329900, 519900],
  ['Volkswagen', '%Tiguan Allspace%', ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'FWD/AWD', 449900, 699900],
  ['Volkswagen', '%Tiguan%',        ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 369900, 579900],
  ['Volkswagen', '%Touareg%',       ['bensin','diesel','mildhybrid','laddhybrid'], 'Bensin / Diesel / Mildhybrid / Laddhybrid', 'FWD/AWD', 469900, 729900],

  // ── VOLVO ────────────────────────────────────────────────────────────────────
  ['Volvo', '%EX30%',             ['el'],                  'El',                                  'FWD/AWD',  499900,  699900],
  ['Volvo', '%EX40%',             ['el'],                  'El',                                  'FWD/AWD',  649900,  899900],
  ['Volvo', '%EX90%',             ['el'],                  'El',                                  'FWD/AWD',  749900, 1049900],
  ['Volvo', '%S60 Recharge%',     ['el','laddhybrid'],     'El / Laddhybrid',                     'FWD/AWD',  549900,  749900],
  ['Volvo', '%S60%',              ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 399900, 609900],
  ['Volvo', '%S90 Recharge%',     ['el','laddhybrid'],     'El / Laddhybrid',                     'FWD/AWD',  649900,  849900],
  ['Volvo', '%S90%',              ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 499900, 749900],
  ['Volvo', '%V60 Cross Country%', ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'AWD',    449900, 649900],
  ['Volvo', '%V60 Recharge%',     ['el','laddhybrid'],     'El / Laddhybrid',                     'FWD/AWD',  569900,  769900],
  ['Volvo', '%V60%',              ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 409900, 609900],
  ['Volvo', '%V90 Cross Country%', ['bensin','mildhybrid','diesel'], 'Bensin / Mildhybrid / Diesel', 'AWD',    569900,  799900],
  ['Volvo', '%V90 Recharge%',     ['el','laddhybrid'],     'El / Laddhybrid',                     'FWD/AWD',  659900,  879900],
  ['Volvo', '%V90%',              ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 499900, 749900],
  ['Volvo', '%XC40 Recharge%',    ['el'],                  'El',                                  'FWD/AWD',  449900,  649900],
  ['Volvo', '%XC40%',             ['bensin','mildhybrid','laddhybrid'], 'Bensin / Mildhybrid / Laddhybrid', 'FWD/AWD', 339900, 539900],
  ['Volvo', '%XC60 Recharge%',    ['el','laddhybrid'],     'El / Laddhybrid',                     'FWD/AWD',  679900,  899900],
  ['Volvo', '%XC60%',             ['bensin','mildhybrid','diesel','laddhybrid'], 'Bensin / Mildhybrid / Diesel / Laddhybrid', 'FWD/AWD', 539900, 739900],
  ['Volvo', '%XC90 Recharge%',    ['el','laddhybrid'],     'El / Laddhybrid',                     'AWD',      899900, 1199900],
  ['Volvo', '%XC90%',             ['bensin','mildhybrid','diesel','laddhybrid'], 'Bensin / Mildhybrid / Diesel / Laddhybrid', 'FWD/AWD', 679900, 999900],

  // ── XPENG ────────────────────────────────────────────────────────────────────
  ['Xpeng', '%G6%',            ['el'],                'El',                            'RWD/AWD', 449900,  649900],
  ['Xpeng', '%G9%',            ['el'],                'El',                            'RWD/AWD', 549900,  749900],
  ['Xpeng', '%P7%',            ['el'],                'El',                            'RWD/AWD', 499900,  699900],
];

async function patchRow(make, modelPattern, fuelTypes, drivmedel, drivlina, prisFran, prisTill) {
  // Build filter
  const makeFilter = `make=ilike.${encodeURIComponent(make)}`;
  // For model: if pattern has %, use ilike; if exact (no %), use eq
  const hasWildcard = modelPattern.includes('%');
  const modelFilter = hasWildcard
    ? `model=ilike.${encodeURIComponent(modelPattern)}`
    : `model=eq.${encodeURIComponent(modelPattern)}`;

  const url = `${SUPABASE_URL}/rest/v1/car_catalog?${makeFilter}&${modelFilter}`;

  const body = {
    fuel_types: fuelTypes,
    drivmedel,
    drivlina,
    pris_ny_fran: prisFran,
    pris_ny_till: prisTill,
    price_new_from: prisFran,
    price_new_to: prisTill,
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, make, model: modelPattern, error: text };
  }
  const data = await res.json();
  return { ok: true, make, model: modelPattern, rows: data.length };
}

let ok = 0, failed = 0, skipped = 0;

for (const [make, model, fuelTypes, drivmedel, drivlina, prisFran, prisTill] of UPDATES) {
  const result = await patchRow(make, model, fuelTypes, drivmedel, drivlina, prisFran, prisTill);
  if (!result.ok) {
    console.error(`FAIL  ${make} ${model}: ${result.error}`);
    failed++;
  } else if (result.rows === 0) {
    console.log(`SKIP  ${make} ${model} (no matching rows)`);
    skipped++;
  } else {
    console.log(`OK    ${make} ${model} — ${result.rows} row(s) updated`);
    ok++;
  }
}

console.log(`\nDone: ${ok} updated, ${skipped} skipped, ${failed} failed`);
