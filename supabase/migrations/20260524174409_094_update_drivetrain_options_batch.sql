/*
  # Update drivetrain_options for multiple makes

  Updates drivetrain_options column in car_catalog for:
  Renault, Peugeot, Skoda, SEAT, Cupra, Mazda, Nissan,
  Alfa Romeo, BYD, Citroën, Dacia, Fiat, Ford, Genesis,
  Honda, Jeep, Lexus, MG, MINI, NIO, Opel, smart, Suzuki, Xpeng
*/

UPDATE car_catalog SET drivetrain_options = CASE
  -- Renault
  WHEN lower(make)='renault' AND lower(model) IN ('renault 4 e-tech','4 e-tech') THEN 'RWD'
  WHEN lower(make)='renault' AND lower(model) IN ('renault 5 e-tech','5 e-tech') THEN 'RWD'
  WHEN lower(make)='renault' AND lower(model)='arkana' THEN 'FWD'
  WHEN lower(make)='renault' AND lower(model)='austral' THEN 'FWD/AWD'
  WHEN lower(make)='renault' AND lower(model)='captur' THEN 'FWD'
  WHEN lower(make)='renault' AND lower(model)='clio' THEN 'FWD'
  WHEN lower(make)='renault' AND lower(model)='espace' THEN 'FWD/AWD'
  WHEN lower(make)='renault' AND lower(model)='kadjar' THEN 'FWD/AWD'
  WHEN lower(make)='renault' AND lower(model)='kangoo' THEN 'FWD'
  WHEN lower(make)='renault' AND lower(model)='koleos' THEN 'FWD/AWD'
  WHEN lower(make)='renault' AND lower(model) IN ('megane e-tech','mégane e-tech') THEN 'RWD'
  WHEN lower(make)='renault' AND lower(model) IN ('megane rs','mégane rs') THEN 'FWD'
  WHEN lower(make)='renault' AND lower(model) IN ('scenic','scénic') THEN 'RWD'
  WHEN lower(make)='renault' AND lower(model)='twingo' THEN 'RWD'
  WHEN lower(make)='renault' AND lower(model)='zoe' THEN 'FWD'
  -- Peugeot
  WHEN lower(make)='peugeot' AND lower(model)='2008' THEN 'FWD'
  WHEN lower(make)='peugeot' AND lower(model)='208' THEN 'FWD'
  WHEN lower(make)='peugeot' AND lower(model)='3008' THEN 'FWD/AWD'
  WHEN lower(make)='peugeot' AND lower(model)='308' THEN 'FWD'
  WHEN lower(make)='peugeot' AND lower(model)='308 sw' THEN 'FWD'
  WHEN lower(make)='peugeot' AND lower(model)='408' THEN 'FWD'
  WHEN lower(make)='peugeot' AND lower(model)='5008' THEN 'FWD/AWD'
  WHEN lower(make)='peugeot' AND lower(model)='e-2008' THEN 'FWD'
  WHEN lower(make)='peugeot' AND lower(model)='e-208' THEN 'FWD'
  WHEN lower(make)='peugeot' AND lower(model)='e-3008' THEN 'RWD/AWD'
  WHEN lower(make)='peugeot' AND lower(model)='e-308' THEN 'FWD'
  -- Skoda
  WHEN lower(make)='skoda' AND lower(model)='enyaq' THEN 'RWD/AWD'
  WHEN lower(make)='skoda' AND lower(model)='fabia' THEN 'FWD'
  WHEN lower(make)='skoda' AND lower(model)='kamiq' THEN 'FWD'
  WHEN lower(make)='skoda' AND lower(model)='karoq' THEN 'FWD/AWD'
  WHEN lower(make)='skoda' AND lower(model)='kodiaq' THEN 'FWD/AWD'
  WHEN lower(make)='skoda' AND lower(model)='octavia' THEN 'FWD/AWD'
  WHEN lower(make)='skoda' AND lower(model)='octavia combi' THEN 'FWD/AWD'
  WHEN lower(make)='skoda' AND lower(model)='superb' THEN 'FWD/AWD'
  WHEN lower(make)='skoda' AND lower(model)='superb combi' THEN 'FWD/AWD'
  WHEN lower(make)='skoda' AND lower(model)='yeti' THEN 'FWD/AWD'
  -- SEAT
  WHEN lower(make)='seat' AND lower(model)='ateca' THEN 'FWD/AWD'
  WHEN lower(make)='seat' AND lower(model)='ibiza' THEN 'FWD'
  WHEN lower(make)='seat' AND lower(model)='leon' THEN 'FWD/AWD'
  WHEN lower(make)='seat' AND lower(model)='tarraco' THEN 'FWD/AWD'
  -- Cupra
  WHEN lower(make)='cupra' AND lower(model)='ateca' THEN 'FWD/AWD'
  WHEN lower(make)='cupra' AND lower(model)='born' THEN 'RWD'
  WHEN lower(make)='cupra' AND lower(model)='formentor' THEN 'FWD/AWD'
  WHEN lower(make)='cupra' AND lower(model)='leon' THEN 'FWD/AWD'
  WHEN lower(make)='cupra' AND lower(model)='tavascan' THEN 'RWD/AWD'
  WHEN lower(make)='cupra' AND lower(model)='terramar' THEN 'FWD/AWD'
  -- Mazda
  WHEN lower(make)='mazda' AND lower(model)='cx-30' THEN 'FWD/AWD'
  WHEN lower(make)='mazda' AND lower(model)='cx-5' THEN 'FWD/AWD'
  WHEN lower(make)='mazda' AND lower(model)='cx-60' THEN 'RWD/AWD'
  WHEN lower(make)='mazda' AND lower(model) IN ('mazda3','3') THEN 'FWD/AWD'
  WHEN lower(make)='mazda' AND lower(model)='mx-30' THEN 'FWD'
  WHEN lower(make)='mazda' AND lower(model)='mx-5' THEN 'RWD'
  -- Nissan
  WHEN lower(make)='nissan' AND lower(model)='ariya' THEN 'RWD/AWD'
  WHEN lower(make)='nissan' AND lower(model)='juke' THEN 'FWD'
  WHEN lower(make)='nissan' AND lower(model)='leaf' THEN 'FWD'
  WHEN lower(make)='nissan' AND lower(model)='qashqai' THEN 'FWD/AWD'
  WHEN lower(make)='nissan' AND lower(model)='x-trail' THEN 'FWD/AWD'
  -- Alfa Romeo
  WHEN lower(make)='alfa romeo' AND lower(model)='tonale' THEN 'FWD/AWD'
  -- BYD
  WHEN lower(make)='byd' AND lower(model)='atto 3' THEN 'FWD'
  WHEN lower(make)='byd' AND lower(model)='dolphin' THEN 'FWD'
  WHEN lower(make)='byd' AND lower(model)='han' THEN 'AWD'
  WHEN lower(make)='byd' AND lower(model)='seal' THEN 'RWD/AWD'
  WHEN lower(make)='byd' AND lower(model)='seal u' THEN 'FWD/AWD'
  WHEN lower(make)='byd' AND lower(model)='tang' THEN 'AWD'
  WHEN lower(make)='byd' AND lower(model)='yuan plus' THEN 'FWD'
  -- Citroën
  WHEN lower(make) IN ('citroën','citroen') AND lower(model)='c5 aircross' THEN 'FWD'
  WHEN lower(make) IN ('citroën','citroen') AND lower(model)='e-c4' THEN 'FWD'
  -- Dacia
  WHEN lower(make)='dacia' AND lower(model)='sandero' THEN 'FWD'
  WHEN lower(make)='dacia' AND lower(model)='jogger' THEN 'FWD'
  -- Fiat
  WHEN lower(make)='fiat' AND lower(model)='124 spider' THEN 'RWD'
  WHEN lower(make)='fiat' AND lower(model)='500' THEN 'FWD'
  WHEN lower(make)='fiat' AND lower(model)='500e' THEN 'FWD'
  WHEN lower(make)='fiat' AND lower(model)='500l' THEN 'FWD'
  WHEN lower(make)='fiat' AND lower(model)='500x' THEN 'FWD/AWD'
  WHEN lower(make)='fiat' AND lower(model)='600' THEN 'FWD'
  WHEN lower(make)='fiat' AND lower(model)='doblo' THEN 'FWD'
  WHEN lower(make)='fiat' AND lower(model)='ducato' THEN 'FWD'
  WHEN lower(make)='fiat' AND lower(model)='panda' THEN 'FWD/AWD'
  WHEN lower(make)='fiat' AND lower(model)='scudo' THEN 'FWD'
  WHEN lower(make)='fiat' AND lower(model)='tipo cross' THEN 'FWD'
  -- Ford
  WHEN lower(make)='ford' AND lower(model)='explorer' THEN 'RWD/AWD'
  WHEN lower(make)='ford' AND lower(model)='focus' THEN 'FWD'
  WHEN lower(make)='ford' AND lower(model) IN ('focus kombi','focus estate') THEN 'FWD'
  WHEN lower(make)='ford' AND lower(model)='focus rs' THEN 'AWD'
  WHEN lower(make)='ford' AND lower(model)='focus st' THEN 'FWD'
  WHEN lower(make)='ford' AND lower(model)='kuga' THEN 'FWD/AWD'
  WHEN lower(make)='ford' AND lower(model)='mustang' THEN 'RWD'
  -- Genesis
  WHEN lower(make)='genesis' AND lower(model)='gv60' THEN 'RWD/AWD'
  WHEN lower(make)='genesis' AND lower(model)='gv70' THEN 'RWD/AWD'
  -- Honda
  WHEN lower(make)='honda' AND lower(model)='civic' THEN 'FWD'
  WHEN lower(make)='honda' AND lower(model)='civic type r' THEN 'FWD'
  WHEN lower(make)='honda' AND lower(model)='cr-v' THEN 'FWD/AWD'
  WHEN lower(make)='honda' AND lower(model)='e' THEN 'RWD'
  WHEN lower(make)='honda' AND lower(model)='e:ny1' THEN 'FWD'
  WHEN lower(make)='honda' AND lower(model)='hr-v' THEN 'FWD'
  WHEN lower(make)='honda' AND lower(model)='jazz' THEN 'FWD'
  WHEN lower(make)='honda' AND lower(model)='prelude' THEN 'FWD'
  WHEN lower(make)='honda' AND lower(model)='zr-v' THEN 'FWD'
  -- Jeep
  WHEN lower(make)='jeep' AND lower(model)='avenger' THEN 'FWD/AWD'
  -- Lexus
  WHEN lower(make)='lexus' AND lower(model)='ct' THEN 'FWD'
  WHEN lower(make)='lexus' AND lower(model)='es' THEN 'FWD/AWD'
  WHEN lower(make)='lexus' AND lower(model)='gs' THEN 'RWD/AWD'
  WHEN lower(make)='lexus' AND lower(model)='is' THEN 'RWD/AWD'
  WHEN lower(make)='lexus' AND lower(model)='lc' THEN 'RWD/AWD'
  WHEN lower(make)='lexus' AND lower(model)='lm' THEN 'FWD/AWD'
  WHEN lower(make)='lexus' AND lower(model)='ls' THEN 'RWD/AWD'
  WHEN lower(make)='lexus' AND lower(model)='nx' THEN 'FWD/AWD'
  WHEN lower(make)='lexus' AND lower(model)='rc' THEN 'RWD/AWD'
  WHEN lower(make)='lexus' AND lower(model)='rx' THEN 'FWD/AWD'
  WHEN lower(make)='lexus' AND lower(model)='ux' THEN 'FWD/AWD'
  -- MG
  WHEN lower(make)='mg' AND lower(model) IN ('4','mg4') THEN 'RWD/AWD'
  WHEN lower(make)='mg' AND lower(model)='zs ev' THEN 'FWD'
  -- MINI
  WHEN lower(make)='mini' AND lower(model) IN ('5-door','5-dörrars') THEN 'FWD'
  WHEN lower(make)='mini' AND lower(model) IN ('convertible','cabriolet') THEN 'FWD'
  WHEN lower(make)='mini' AND lower(model)='cooper' THEN 'FWD'
  WHEN lower(make)='mini' AND lower(model)='countryman' THEN 'FWD/AWD'
  WHEN lower(make)='mini' AND lower(model)='jcw' THEN 'FWD/AWD'
  -- NIO
  WHEN lower(make)='nio' AND lower(model)='el6' THEN 'AWD'
  -- Opel
  WHEN lower(make)='opel' AND lower(model)='astra' THEN 'FWD'
  WHEN lower(make)='opel' AND lower(model)='corsa' THEN 'FWD'
  WHEN lower(make)='opel' AND lower(model)='crossland' THEN 'FWD'
  WHEN lower(make)='opel' AND lower(model)='grandland' THEN 'FWD/AWD'
  WHEN lower(make)='opel' AND lower(model)='mokka-e' THEN 'FWD'
  -- smart
  WHEN lower(make)='smart' AND lower(model)='#1' THEN 'RWD/AWD'
  -- Suzuki
  WHEN lower(make)='suzuki' AND lower(model)='across' THEN 'AWD'
  WHEN lower(make)='suzuki' AND lower(model)='alto' THEN 'FWD'
  WHEN lower(make)='suzuki' AND lower(model)='baleno' THEN 'FWD'
  WHEN lower(make)='suzuki' AND lower(model)='celerio' THEN 'FWD'
  WHEN lower(make)='suzuki' AND lower(model)='jimny' THEN 'AWD'
  WHEN lower(make)='suzuki' AND lower(model)='s-cross' THEN 'FWD/AWD'
  WHEN lower(make)='suzuki' AND lower(model)='swace' THEN 'FWD'
  WHEN lower(make)='suzuki' AND lower(model)='swift' THEN 'FWD/AWD'
  WHEN lower(make)='suzuki' AND lower(model)='sx4' THEN 'FWD/AWD'
  WHEN lower(make)='suzuki' AND lower(model)='vitara' THEN 'FWD/AWD'
  -- Xpeng
  WHEN lower(make)='xpeng' AND lower(model)='g6' THEN 'RWD/AWD'
  ELSE drivetrain_options
END,
updated_at = now()
WHERE lower(make) IN (
  'renault','peugeot','skoda','seat','cupra','mazda','nissan',
  'alfa romeo','byd','citroën','citroen','dacia','fiat','ford',
  'genesis','honda','jeep','lexus','mg','mini','nio','opel',
  'smart','suzuki','xpeng'
);
