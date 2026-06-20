import { test } from 'node:test';
import assert from 'node:assert';
import { calculateLogEmissions, EMISSION_FACTORS, getInitialHistoryLogs } from '../data.js';

test('calculateLogEmissions handles an ultra-low carbon footprint day correctly', () => {
  const lowCarbonLog = {
    date: '2026-06-20',
    transport: {
      carDistance: 0,
      carType: 'none' as const,
      transitDistance: 0,
      flightDistance: 0,
      activeDistance: 10,
    },
    energy: {
      electricityKwh: 5,
      naturalGasKwh: 0,
      solarPercentage: 100, // 100% clean solar offsets electricity emissions completely
    },
    food: {
      dietType: 'vegan' as const,
      localFoodPercentage: 100, // 10% local food transport emissions discount
      wasteLevel: 'low' as const,
    },
    shopping: {
      clothingItems: 0,
      electronicsItems: 0,
      otherItems: 0,
    },
  };

  const emissions = calculateLogEmissions(lowCarbonLog);

  // Assert transport: 0km car, 0km transit, 0km flight -> 0kg CO2
  assert.strictEqual(emissions.transport, 0);

  // Assert energy: 5 kWh * (1 - 100/100) * factor = 0 + 0 gas -> 0kg CO2
  assert.strictEqual(emissions.energy, 0);

  // Assert food: Vegan base 2.45 with 100% local discount (10% transport discount) -> 2.45 * 0.9 = 2.205 -> rounded to 2.21
  assert.strictEqual(emissions.food, 2.21);

  // Assert shopping: 0 items bought -> 0
  assert.strictEqual(emissions.shopping, 0);

  // Assert total
  assert.strictEqual(emissions.total, 2.21);
});

test('calculateLogEmissions handles a high carbon footprint day correctly', () => {
  const highCarbonLog = {
    date: '2026-06-20',
    transport: {
      carDistance: 100,
      carType: 'petrol' as const,
      transitDistance: 20,
      flightDistance: 500,
      activeDistance: 0,
    },
    energy: {
      electricityKwh: 30,
      naturalGasKwh: 50,
      solarPercentage: 0, // 0% solar means full grid intensity
    },
    food: {
      dietType: 'heavy-meat' as const,
      localFoodPercentage: 0,
      wasteLevel: 'high' as const,
    },
    shopping: {
      clothingItems: 2,
      electronicsItems: 1,
      otherItems: 5,
    },
  };

  const emissions = calculateLogEmissions(highCarbonLog);

  // Transport calculation:
  // (100 * petrolCarFactor 0.192) + (20 * transitFactor 0.041) + (500 * flightFactor 0.150)
  // = 19.2 + 0.82 + 75 = 95.02 kg CO2
  assert.strictEqual(emissions.transport, 95.02);

  // Energy calculation:
  // (30 * electricityFactor 0.380) + (50 * naturalGasFactor 0.185)
  // = 11.4 + 9.25 = 20.65 kg CO2
  assert.strictEqual(emissions.energy, 20.65);

  // Food calculation:
  // heavy-meat diet factor (7.26) * 1.0 + high waste addition (1.8) = 7.26 + 1.8 = 9.06 kg CO2
  assert.strictEqual(emissions.food, 9.06);

  // Shopping calculation:
  // (2 clothing * 14.2) + (1 electronics * 85) + (5 other * 4.5)
  // = 28.4 + 85 + 22.5 = 135.9 kg CO2
  assert.strictEqual(emissions.shopping, 135.9);

  // Total should equal the sum of those components
  const sum = 95.02 + 20.65 + 9.06 + 135.9; // 260.63
  assert.strictEqual(emissions.total, Number(sum.toFixed(2)));
});

test('calculateLogEmissions handles diesel, hybrid, and electric vehicle types correctly', () => {
  const dieselLog = {
    date: '2026-06-20',
    transport: { carDistance: 50, carType: 'diesel' as const, transitDistance: 0, flightDistance: 0, activeDistance: 0 },
    energy: { electricityKwh: 0, naturalGasKwh: 0, solarPercentage: 0 },
    food: { dietType: 'average' as const, localFoodPercentage: 0, wasteLevel: 'low' as const },
    shopping: { clothingItems: 0, electronicsItems: 0, otherItems: 0 },
  };
  const hybridLog = {
    ...dieselLog,
    transport: { ...dieselLog.transport, carType: 'hybrid' as const },
  };
  const electricLog = {
    ...dieselLog,
    transport: { ...dieselLog.transport, carType: 'electric' as const },
  };

  const dieselEmissions = calculateLogEmissions(dieselLog);
  const hybridEmissions = calculateLogEmissions(hybridLog);
  const electricEmissions = calculateLogEmissions(electricLog);

  // 50km * 0.171 diesel factor = 8.55
  assert.strictEqual(dieselEmissions.transport, 8.55);
  // 50km * 0.109 hybrid factor = 5.45
  assert.strictEqual(hybridEmissions.transport, 5.45);
  // 50km * 0.045 electric factor = 2.25
  assert.strictEqual(electricEmissions.transport, 2.25);
});

test('calculateLogEmissions handles various diet and food options correctly', () => {
  const avgDietLog = {
    date: '2026-06-20',
    transport: { carDistance: 0, carType: 'none' as const, transitDistance: 0, flightDistance: 0, activeDistance: 0 },
    energy: { electricityKwh: 0, naturalGasKwh: 0, solarPercentage: 0 },
    food: { dietType: 'average' as const, localFoodPercentage: 50, wasteLevel: 'medium' as const },
    shopping: { clothingItems: 0, electronicsItems: 0, otherItems: 0 },
  };

  const emissions = calculateLogEmissions(avgDietLog);

  // average diet base = 5.17
  // localFoodPercentage = 50 -> max transport discount * 0.10. So localOffsetFactor = 1 - (50/100)*0.10 = 0.95
  // wasteLevel = medium -> wasteAddition = +0.8
  // foodEmissions = 5.17 * 0.95 + 0.8 = 4.9115 + 0.8 = 5.7115 -> rounded to 5.71
  assert.strictEqual(emissions.food, 5.71);
});

test('getInitialHistoryLogs generates a valid 7-day log history', () => {
  const logs = getInitialHistoryLogs();
  assert.strictEqual(logs.length, 7);
  
  logs.forEach((log) => {
    assert.ok(log.id.startsWith('seed_'));
    assert.ok(log.date.match(/^\d{4}-\d{2}-\d{2}$/));
    assert.ok(log.calculatedEmissions.total >= 0);
    assert.strictEqual(typeof log.calculatedEmissions.transport, 'number');
    assert.strictEqual(typeof log.calculatedEmissions.energy, 'number');
    assert.strictEqual(typeof log.calculatedEmissions.food, 'number');
    assert.strictEqual(typeof log.calculatedEmissions.shopping, 'number');
  });
});

test('EMISSION_FACTORS values are defined and accurate', () => {
  assert.ok(EMISSION_FACTORS.transport.petrolCar > 0);
  assert.ok(EMISSION_FACTORS.energy.electricity > 0);
  assert.strictEqual(EMISSION_FACTORS.food.diets['vegan'], 2.45);
});

test('calculateLogEmissions handles absolute zero input boundary values', () => {
  const zeroLog = {
    date: '2026-06-21',
    transport: { carDistance: 0, carType: 'none' as const, transitDistance: 0, flightDistance: 0, activeDistance: 0 },
    energy: { electricityKwh: 0, naturalGasKwh: 0, solarPercentage: 0 },
    food: { dietType: 'vegan' as const, localFoodPercentage: 0, wasteLevel: 'low' as const },
    shopping: { clothingItems: 0, electronicsItems: 0, otherItems: 0 },
  };

  const res = calculateLogEmissions(zeroLog);
  assert.strictEqual(res.transport, 0);
  assert.strictEqual(res.energy, 0);
  assert.strictEqual(res.food, 2.45); // vegan base diet
  assert.strictEqual(res.shopping, 0);
  assert.strictEqual(res.total, 2.45);
});

test('calculateLogEmissions computes correct food values for all waste levels', () => {
  const createFoodLog = (wasteLevel: 'low' | 'medium' | 'high') => ({
    date: '2026-06-21',
    transport: { carDistance: 0, carType: 'none' as const, transitDistance: 0, flightDistance: 0, activeDistance: 0 },
    energy: { electricityKwh: 0, naturalGasKwh: 0, solarPercentage: 0 },
    food: { dietType: 'average' as const, localFoodPercentage: 0, wasteLevel },
    shopping: { clothingItems: 0, electronicsItems: 0, otherItems: 0 },
  });

  const lowWaste = calculateLogEmissions(createFoodLog('low'));
  const medWaste = calculateLogEmissions(createFoodLog('medium'));
  const highWaste = calculateLogEmissions(createFoodLog('high'));

  // base average = 5.17
  assert.strictEqual(lowWaste.food, 5.17); // 5.17 + 0.0
  assert.strictEqual(medWaste.food, 5.97); // 5.17 + 0.8
  assert.strictEqual(highWaste.food, 6.97); // 5.17 + 1.8
});

test('calculateLogEmissions applies exact local food discount formulas', () => {
  const logWithLocal = (pct: number) => ({
    date: '2026-06-21',
    transport: { carDistance: 0, carType: 'none' as const, transitDistance: 0, flightDistance: 0, activeDistance: 0 },
    energy: { electricityKwh: 0, naturalGasKwh: 0, solarPercentage: 0 },
    food: { dietType: 'vegan' as const, localFoodPercentage: pct, wasteLevel: 'low' as const },
    shopping: { clothingItems: 0, electronicsItems: 0, otherItems: 0 },
  });

  const res0 = calculateLogEmissions(logWithLocal(0));
  const res50 = calculateLogEmissions(logWithLocal(50));
  const res100 = calculateLogEmissions(logWithLocal(100));

  // 0% local: 2.45 * (1 - 0) = 2.45
  assert.strictEqual(res0.food, 2.45);
  // 50% local: 2.45 * (1 - 0.5 * 0.1) = 2.45 * 0.95 = 2.3275 -> rounded to 2.33
  assert.strictEqual(res50.food, 2.33);
  // 100% local: 2.45 * (1 - 1.0 * 0.1) = 2.45 * 0.90 = 2.205 -> rounded to 2.21
  assert.strictEqual(res100.food, 2.21);
});

test('calculateLogEmissions handles extreme high values smoothly without crashing', () => {
  const hugeLog = {
    date: '2026-06-21',
    transport: { carDistance: 1000000, carType: 'petrol' as const, transitDistance: 500000, flightDistance: 200000, activeDistance: 1000 },
    energy: { electricityKwh: 999999, naturalGasKwh: 888888, solarPercentage: 10 },
    food: { dietType: 'heavy-meat' as const, localFoodPercentage: 10, wasteLevel: 'high' as const },
    shopping: { clothingItems: 9999, electronicsItems: 5555, otherItems: 22222 },
  };

  const res = calculateLogEmissions(hugeLog);
  assert.ok(res.total > 1000000);
  assert.strictEqual(typeof res.total, 'number');
  assert.ok(!Number.isNaN(res.total));
});

