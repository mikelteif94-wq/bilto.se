import { ComparisonCar } from '../types';
import { CARS_ALFA_AUDI } from './cars-alfa-audi';
import { CARS_BMW } from './cars-bmw';
import { CARS_BYD_GENESIS } from './cars-byd-genesis';
import { CARS_FORD } from './cars-ford';
import { CARS_HONDA_KIA } from './cars-honda-kia';
import { CARS_LANDROVER_MERCEDES } from './cars-landrover-mercedes';
import { CARS_MG_PORSCHE } from './cars-mg-porsche';
import { CARS_RENAULT_VOLVO } from './cars-renault-volvo';

export const ALL_COMPARISON_CARS: ComparisonCar[] = [
  ...CARS_ALFA_AUDI,
  ...CARS_BMW,
  ...CARS_BYD_GENESIS,
  ...CARS_FORD,
  ...CARS_HONDA_KIA,
  ...CARS_LANDROVER_MERCEDES,
  ...CARS_MG_PORSCHE,
  ...CARS_RENAULT_VOLVO,
];
