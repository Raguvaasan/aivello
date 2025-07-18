import React, { useState, useEffect } from 'react';
import { ToolWrapper } from '../components/common/ToolWrapper';
import { FaRuler, FaExchangeAlt, FaCalculator, FaThermometerHalf, FaWeight, FaClock } from 'react-icons/fa';
import { IconWrapper } from '../components/common/IconWrapper';

export default function UnitConverter() {
  const [category, setCategory] = useState('length');
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  const conversionData: {
    [key: string]: {
      name: string;
      icon: any;
      units: {
        [key: string]: { name: string; factor: number };
      };
    };
  } = {
    length: {
      name: 'Length',
      icon: FaRuler,
      units: {
        meter: { name: 'Meter (m)', factor: 1 },
        kilometer: { name: 'Kilometer (km)', factor: 1000 },
        centimeter: { name: 'Centimeter (cm)', factor: 0.01 },
        millimeter: { name: 'Millimeter (mm)', factor: 0.001 },
        inch: { name: 'Inch (in)', factor: 0.0254 },
        foot: { name: 'Foot (ft)', factor: 0.3048 },
        yard: { name: 'Yard (yd)', factor: 0.9144 },
        mile: { name: 'Mile (mi)', factor: 1609.34 },
        nauticalMile: { name: 'Nautical Mile', factor: 1852 }
      }
    },
    weight: {
      name: 'Weight',
      icon: FaWeight,
      units: {
        kilogram: { name: 'Kilogram (kg)', factor: 1 },
        gram: { name: 'Gram (g)', factor: 0.001 },
        pound: { name: 'Pound (lb)', factor: 0.453592 },
        ounce: { name: 'Ounce (oz)', factor: 0.0283495 },
        ton: { name: 'Metric Ton (t)', factor: 1000 },
        stone: { name: 'Stone (st)', factor: 6.35029 },
        carat: { name: 'Carat (ct)', factor: 0.0002 }
      }
    },
    temperature: {
      name: 'Temperature',
      icon: FaThermometerHalf,
      units: {
        celsius: { name: 'Celsius (°C)', factor: 1 },
        fahrenheit: { name: 'Fahrenheit (°F)', factor: 1 },
        kelvin: { name: 'Kelvin (K)', factor: 1 },
        rankine: { name: 'Rankine (°R)', factor: 1 }
      }
    },
    volume: {
      name: 'Volume',
      icon: FaCalculator,
      units: {
        liter: { name: 'Liter (L)', factor: 1 },
        milliliter: { name: 'Milliliter (mL)', factor: 0.001 },
        gallon: { name: 'Gallon (US)', factor: 3.78541 },
        quart: { name: 'Quart (US)', factor: 0.946353 },
        pint: { name: 'Pint (US)', factor: 0.473176 },
        cup: { name: 'Cup (US)', factor: 0.236588 },
        fluidOunce: { name: 'Fluid Ounce (US)', factor: 0.0295735 },
        tablespoon: { name: 'Tablespoon (US)', factor: 0.0147868 },
        teaspoon: { name: 'Teaspoon (US)', factor: 0.00492892 }
      }
    },
    area: {
      name: 'Area',
      icon: FaRuler,
      units: {
        squareMeter: { name: 'Square Meter (m²)', factor: 1 },
        squareKilometer: { name: 'Square Kilometer (km²)', factor: 1000000 },
        squareCentimeter: { name: 'Square Centimeter (cm²)', factor: 0.0001 },
        squareInch: { name: 'Square Inch (in²)', factor: 0.00064516 },
        squareFoot: { name: 'Square Foot (ft²)', factor: 0.092903 },
        squareYard: { name: 'Square Yard (yd²)', factor: 0.836127 },
        acre: { name: 'Acre', factor: 4046.86 },
        hectare: { name: 'Hectare (ha)', factor: 10000 }
      }
    },
    time: {
      name: 'Time',
      icon: FaClock,
      units: {
        second: { name: 'Second (s)', factor: 1 },
        minute: { name: 'Minute (min)', factor: 60 },
        hour: { name: 'Hour (h)', factor: 3600 },
        day: { name: 'Day (d)', factor: 86400 },
        week: { name: 'Week (wk)', factor: 604800 },
        month: { name: 'Month (mo)', factor: 2629746 },
        year: { name: 'Year (yr)', factor: 31556952 },
        millisecond: { name: 'Millisecond (ms)', factor: 0.001 }
      }
    },
    speed: {
      name: 'Speed',
      icon: FaCalculator,
      units: {
        meterPerSecond: { name: 'Meter/Second (m/s)', factor: 1 },
        kilometerPerHour: { name: 'Kilometer/Hour (km/h)', factor: 0.277778 },
        milePerHour: { name: 'Mile/Hour (mph)', factor: 0.44704 },
        footPerSecond: { name: 'Foot/Second (ft/s)', factor: 0.3048 },
        knot: { name: 'Knot (kn)', factor: 0.514444 }
      }
    },
    energy: {
      name: 'Energy',
      icon: FaCalculator,
      units: {
        joule: { name: 'Joule (J)', factor: 1 },
        kilojoule: { name: 'Kilojoule (kJ)', factor: 1000 },
        calorie: { name: 'Calorie (cal)', factor: 4.184 },
        kilocalorie: { name: 'Kilocalorie (kcal)', factor: 4184 },
        wattHour: { name: 'Watt Hour (Wh)', factor: 3600 },
        kilowattHour: { name: 'Kilowatt Hour (kWh)', factor: 3600000 },
        btu: { name: 'British Thermal Unit (BTU)', factor: 1055.06 }
      }
    }
  };

  useEffect(() => {
    const categoryData = conversionData[category];
    if (categoryData) {
      const firstUnit = Object.keys(categoryData.units)[0];
      const secondUnit = Object.keys(categoryData.units)[1];
      setFromUnit(firstUnit);
      setToUnit(secondUnit);
      setFromValue('');
      setToValue('');
    }
  }, [category]);

  const convertValue = (value: string, from: string, to: string) => {
    if (!value || !from || !to) return '';
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';

    const categoryData = conversionData[category];
    
    if (category === 'temperature') {
      return convertTemperature(numValue, from, to).toString();
    }

    const fromFactor = categoryData.units[from]?.factor || 1;
    const toFactor = categoryData.units[to]?.factor || 1;
    
    const result = (numValue * fromFactor) / toFactor;
    return formatNumber(result);
  };

  const convertTemperature = (value: number, from: string, to: string): number => {
    let celsius: number;
    
    // Convert to Celsius first
    switch (from) {
      case 'celsius':
        celsius = value;
        break;
      case 'fahrenheit':
        celsius = (value - 32) * 5/9;
        break;
      case 'kelvin':
        celsius = value - 273.15;
        break;
      case 'rankine':
        celsius = (value - 491.67) * 5/9;
        break;
      default:
        celsius = value;
    }
    
    // Convert from Celsius to target
    switch (to) {
      case 'celsius':
        return celsius;
      case 'fahrenheit':
        return celsius * 9/5 + 32;
      case 'kelvin':
        return celsius + 273.15;
      case 'rankine':
        return (celsius + 273.15) * 9/5;
      default:
        return celsius;
    }
  };

  const formatNumber = (num: number): string => {
    if (num === 0) return '0';
    if (Math.abs(num) >= 1e6) return num.toExponential(6);
    if (Math.abs(num) >= 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
    if (Math.abs(num) >= 1) return num.toString();
    return num.toFixed(8).replace(/\.?0+$/, '');
  };

  const handleFromValueChange = (value: string) => {
    setFromValue(value);
    const converted = convertValue(value, fromUnit, toUnit);
    setToValue(converted);
  };

  const handleToValueChange = (value: string) => {
    setToValue(value);
    const converted = convertValue(value, toUnit, fromUnit);
    setFromValue(converted);
  };

  const swapUnits = () => {
    const tempUnit = fromUnit;
    const tempValue = fromValue;
    setFromUnit(toUnit);
    setToUnit(tempUnit);
    setFromValue(toValue);
    setToValue(tempValue);
  };

  const clearValues = () => {
    setFromValue('');
    setToValue('');
  };

  const currentCategory = conversionData[category];
  const CategoryIcon = currentCategory?.icon || FaCalculator;

  return (
    <ToolWrapper
      toolId="unit-converter"
      toolName="Unit Converter"
      toolDescription="Convert between different units of measurement. Length, weight, temperature, volume, area, time, speed, and energy conversions"
      toolCategory="Utility"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <IconWrapper icon={FaCalculator} className="text-3xl text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Unit Converter
            </h2>
            <IconWrapper icon={CategoryIcon} className="text-2xl text-emerald-600" />
          </div>

          {/* Category Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {Object.entries(conversionData).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    category === key
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-emerald-400'
                  }`}
                >
                  <IconWrapper icon={data.icon} className="text-lg mx-auto mb-1" />
                  <div className="text-xs font-medium">{data.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Conversion Interface */}
          <div className="grid lg:grid-cols-3 gap-6 items-center">
            {/* From Unit */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From
                </label>
                <select
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {currentCategory && Object.entries(currentCategory.units).map(([key, unit]) => (
                    <option key={key} value={key}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                value={fromValue}
                onChange={(e) => handleFromValueChange(e.target.value)}
                placeholder="Enter value..."
                className="w-full p-4 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Swap Button */}
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={swapUnits}
                className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors shadow-lg"
                title="Swap units"
              >
                <IconWrapper icon={FaExchangeAlt} className="text-xl" />
              </button>
              <button
                onClick={clearValues}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Clear
              </button>
            </div>

            {/* To Unit */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To
                </label>
                <select
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {currentCategory && Object.entries(currentCategory.units).map(([key, unit]) => (
                    <option key={key} value={key}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                value={toValue}
                onChange={(e) => handleToValueChange(e.target.value)}
                placeholder="Result..."
                className="w-full p-4 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Conversions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Quick Conversions for {currentCategory?.name || 'Units'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentCategory && Object.entries(currentCategory.units).slice(0, 6).map(([key, unit]) => (
                <button
                  key={key}
                  onClick={() => {
                    setFromUnit(key);
                    setFromValue('1');
                    const converted = convertValue('1', key, toUnit);
                    setToValue(converted);
                  }}
                  className="p-3 bg-emerald-50 dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 dark:hover:bg-gray-600 transition-colors text-left"
                >
                  <div className="font-medium">{unit.name}</div>
                  <div className="text-sm opacity-75">1 {unit.name.split('(')[0].trim()}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-700 dark:to-gray-700 rounded-lg">
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
              🔄 Available Conversion Categories:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-emerald-700 dark:text-emerald-200">
              <div>📏 Length & Distance</div>
              <div>⚖️ Weight & Mass</div>
              <div>🌡️ Temperature</div>
              <div>🫗 Volume & Capacity</div>
              <div>📐 Area</div>
              <div>⏰ Time</div>
              <div>🏃 Speed & Velocity</div>
              <div>⚡ Energy & Power</div>
            </div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
              💡 Tip: Use the swap button to quickly reverse conversions, or click quick conversion buttons to set common base values.
            </p>
          </div>
        </div>
      </div>
    </ToolWrapper>
  );
}
