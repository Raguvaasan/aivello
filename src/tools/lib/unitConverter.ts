/**
 * Unit conversion data and maths.
 *
 * Linear units store `factor` = how many base units one of this unit is (so
 * value_in_base = value * factor). Factors are the exact defined values where one
 * exists (international yard and pound, US customary volume, IT calorie/BTU).
 * Temperature is affine rather than linear, so it is converted through Kelvin
 * with an explicit offset instead of a single factor.
 */

export type CategoryId = 'length' | 'weight' | 'temperature' | 'volume' | 'area' | 'time' | 'speed' | 'energy' | 'data';

export interface UnitDefinition {
  name: string;
  symbol: string;
  /** Base units per one of this unit. Temperature units use `toKelvin`/`fromKelvin` instead. */
  factor: number;
}

export interface CategoryDefinition {
  name: string;
  units: Record<string, UnitDefinition>;
}

const u = (name: string, symbol: string, factor: number): UnitDefinition => ({ name, symbol, factor });

export const CATEGORIES: Record<CategoryId, CategoryDefinition> = {
  length: {
    // base: metre
    name: 'Length',
    units: {
      meter: u('Meter', 'm', 1),
      kilometer: u('Kilometer', 'km', 1000),
      centimeter: u('Centimeter', 'cm', 0.01),
      millimeter: u('Millimeter', 'mm', 0.001),
      micrometer: u('Micrometer', 'µm', 1e-6),
      inch: u('Inch', 'in', 0.0254),
      foot: u('Foot', 'ft', 0.3048),
      yard: u('Yard', 'yd', 0.9144),
      mile: u('Mile', 'mi', 1609.344),
      nauticalMile: u('Nautical Mile', 'nmi', 1852),
    },
  },
  weight: {
    // base: kilogram
    name: 'Weight',
    units: {
      kilogram: u('Kilogram', 'kg', 1),
      gram: u('Gram', 'g', 0.001),
      milligram: u('Milligram', 'mg', 1e-6),
      tonne: u('Metric Ton', 't', 1000),
      pound: u('Pound', 'lb', 0.45359237),
      ounce: u('Ounce', 'oz', 0.45359237 / 16),
      stone: u('Stone', 'st', 0.45359237 * 14),
      shortTon: u('US Ton', 'ton', 0.45359237 * 2000),
      carat: u('Carat', 'ct', 0.0002),
    },
  },
  temperature: {
    // Affine: handled by convertTemperature. Factors are unused.
    name: 'Temperature',
    units: {
      celsius: u('Celsius', '°C', 1),
      fahrenheit: u('Fahrenheit', '°F', 1),
      kelvin: u('Kelvin', 'K', 1),
      rankine: u('Rankine', '°R', 1),
    },
  },
  volume: {
    // base: litre. US customary values derive from the US gallon = 231 in³ exactly.
    name: 'Volume',
    units: {
      liter: u('Liter', 'L', 1),
      milliliter: u('Milliliter', 'mL', 0.001),
      cubicMeter: u('Cubic Meter', 'm³', 1000),
      gallon: u('Gallon (US)', 'gal', 3.785411784),
      quart: u('Quart (US)', 'qt', 3.785411784 / 4),
      pint: u('Pint (US)', 'pt', 3.785411784 / 8),
      cup: u('Cup (US)', 'cup', 3.785411784 / 16),
      fluidOunce: u('Fluid Ounce (US)', 'fl oz', 3.785411784 / 128),
      tablespoon: u('Tablespoon (US)', 'tbsp', 3.785411784 / 256),
      teaspoon: u('Teaspoon (US)', 'tsp', 3.785411784 / 768),
      imperialGallon: u('Gallon (UK)', 'gal (UK)', 4.54609),
    },
  },
  area: {
    // base: square metre
    name: 'Area',
    units: {
      squareMeter: u('Square Meter', 'm²', 1),
      squareKilometer: u('Square Kilometer', 'km²', 1e6),
      squareCentimeter: u('Square Centimeter', 'cm²', 1e-4),
      squareInch: u('Square Inch', 'in²', 0.0254 ** 2),
      squareFoot: u('Square Foot', 'ft²', 0.3048 ** 2),
      squareYard: u('Square Yard', 'yd²', 0.9144 ** 2),
      squareMile: u('Square Mile', 'mi²', 1609.344 ** 2),
      acre: u('Acre', 'ac', 4046.8564224),
      hectare: u('Hectare', 'ha', 10000),
    },
  },
  time: {
    // base: second. Month and year use the mean Gregorian year (365.2425 days).
    name: 'Time',
    units: {
      millisecond: u('Millisecond', 'ms', 0.001),
      second: u('Second', 's', 1),
      minute: u('Minute', 'min', 60),
      hour: u('Hour', 'h', 3600),
      day: u('Day', 'd', 86400),
      week: u('Week', 'wk', 604800),
      month: u('Month (avg)', 'mo', 2629746),
      year: u('Year (avg)', 'yr', 31556952),
    },
  },
  speed: {
    // base: metre per second
    name: 'Speed',
    units: {
      meterPerSecond: u('Meter/Second', 'm/s', 1),
      kilometerPerHour: u('Kilometer/Hour', 'km/h', 1000 / 3600),
      milePerHour: u('Mile/Hour', 'mph', 1609.344 / 3600),
      footPerSecond: u('Foot/Second', 'ft/s', 0.3048),
      knot: u('Knot', 'kn', 1852 / 3600),
    },
  },
  energy: {
    // base: joule. Calorie is the thermochemical calorie; BTU is the International Table BTU.
    name: 'Energy',
    units: {
      joule: u('Joule', 'J', 1),
      kilojoule: u('Kilojoule', 'kJ', 1000),
      calorie: u('Calorie', 'cal', 4.184),
      kilocalorie: u('Kilocalorie', 'kcal', 4184),
      wattHour: u('Watt Hour', 'Wh', 3600),
      kilowattHour: u('Kilowatt Hour', 'kWh', 3.6e6),
      btu: u('British Thermal Unit', 'BTU', 1055.05585262),
    },
  },
  data: {
    // base: byte. Decimal (SI) and binary (IEC) prefixes are listed separately on purpose.
    name: 'Data',
    units: {
      bit: u('Bit', 'b', 1 / 8),
      byte: u('Byte', 'B', 1),
      kilobyte: u('Kilobyte', 'kB', 1e3),
      megabyte: u('Megabyte', 'MB', 1e6),
      gigabyte: u('Gigabyte', 'GB', 1e9),
      terabyte: u('Terabyte', 'TB', 1e12),
      kibibyte: u('Kibibyte', 'KiB', 1024),
      mebibyte: u('Mebibyte', 'MiB', 1024 ** 2),
      gibibyte: u('Gibibyte', 'GiB', 1024 ** 3),
      tebibyte: u('Tebibyte', 'TiB', 1024 ** 4),
    },
  },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES) as CategoryId[];

const toKelvin = (value: number, unit: string): number => {
  switch (unit) {
    case 'celsius':
      return value + 273.15;
    case 'fahrenheit':
      return ((value - 32) * 5) / 9 + 273.15;
    case 'kelvin':
      return value;
    case 'rankine':
      return (value * 5) / 9;
    default:
      throw new Error(`Unknown temperature unit: ${unit}`);
  }
};

const fromKelvin = (kelvin: number, unit: string): number => {
  switch (unit) {
    case 'celsius':
      return kelvin - 273.15;
    case 'fahrenheit':
      return ((kelvin - 273.15) * 9) / 5 + 32;
    case 'kelvin':
      return kelvin;
    case 'rankine':
      return (kelvin * 9) / 5;
    default:
      throw new Error(`Unknown temperature unit: ${unit}`);
  }
};

export const convertTemperature = (value: number, from: string, to: string): number =>
  from === to ? value : fromKelvin(toKelvin(value, from), to);

/** Kelvin value of a temperature, for the absolute-zero check. */
export const temperatureInKelvin = (value: number, unit: string): number => toKelvin(value, unit);

export const convert = (value: number, category: CategoryId, from: string, to: string): number => {
  if (category === 'temperature') return convertTemperature(value, from, to);
  const units = CATEGORIES[category].units;
  const fromUnit = units[from];
  const toUnit = units[to];
  if (!fromUnit || !toUnit) throw new Error(`Unknown unit for ${category}: ${from} -> ${to}`);
  if (from === to) return value;
  return (value * fromUnit.factor) / toUnit.factor;
};

/**
 * Parses user input into a number, or null when it is not a number.
 * Accepts an optional sign, decimals, exponents, and thousands separators
 * (commas, spaces, underscores are ignored).
 */
export const parseNumericInput = (raw: string): number | null => {
  const cleaned = raw.trim().replace(/[,\s_]/g, '');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
};

/**
 * Formats a result as a plain, locale-independent number string that can be pasted
 * back into the input. Rounds to 12 significant digits to hide float noise
 * (0.1 + 0.2 style artefacts) and switches to exponent notation for extremes.
 */
export const formatResult = (value: number): string => {
  if (!Number.isFinite(value)) return '';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e15 || abs < 1e-9) {
    return value.toExponential(8).replace(/\.?0+e/, 'e');
  }
  return String(Number(value.toPrecision(12)));
};
