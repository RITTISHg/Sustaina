import { ActivityLog, Challenge, NationalAverage } from './types';

// Carbon Emission Factors (kg CO2 per unit)
export const EMISSION_FACTORS = {
  transport: {
    petrolCar: 0.192, // per km
    dieselCar: 0.171, // per km
    hybridCar: 0.109, // per km
    electricCar: 0.045, // per km (averages grid load)
    transit: 0.041, // per km (bus/train average)
    flight: 0.150, // per km (average short/long haul mix)
    active: 0, // walk/cycle is 0
  },
  energy: {
    electricity: 0.380, // per kWh (average grid carbon intensity)
    naturalGas: 0.185, // per kWh
  },
  food: {
    diets: {
      'heavy-meat': 7.26, // daily base kg CO2
      'average': 5.17, // daily base kg CO2
      'low-meat': 3.91, // daily base kg CO2
      'vegetarian': 3.22, // daily base kg CO2
      'vegan': 2.45, // daily base kg CO2
    },
    wasteMultiplier: {
      low: 0.0,
      medium: 0.8,
      high: 1.8,
    },
  },
  shopping: {
    clothing: 14.2, // average per garment
    electronics: 85.0, // average device lifecycle
    other: 4.5, // general items average
  }
};

// Calculations Helper
export function calculateLogEmissions(log: Omit<ActivityLog, 'id' | 'calculatedEmissions'>) {
  // 1. Transport
  let carFactor = 0;
  if (log.transport.carType === 'petrol') carFactor = EMISSION_FACTORS.transport.petrolCar;
  else if (log.transport.carType === 'diesel') carFactor = EMISSION_FACTORS.transport.dieselCar;
  else if (log.transport.carType === 'hybrid') carFactor = EMISSION_FACTORS.transport.hybridCar;
  else if (log.transport.carType === 'electric') carFactor = EMISSION_FACTORS.transport.electricCar;

  const transportEmissions = 
    (log.transport.carDistance * carFactor) +
    (log.transport.transitDistance * EMISSION_FACTORS.transport.transit) +
    (log.transport.flightDistance * EMISSION_FACTORS.transport.flight);

  // 2. Energy (electricity is offset by percentage of solar/renewables)
  const effectiveElectricity = log.energy.electricityKwh * (1 - log.energy.solarPercentage / 100);
  const energyEmissions = 
    (effectiveElectricity * EMISSION_FACTORS.energy.electricity) +
    (log.energy.naturalGasKwh * EMISSION_FACTORS.energy.naturalGas);

  // 3. Food (reduces footprint slightly if sourcing local food because of reduced transport)
  const dietBase = EMISSION_FACTORS.food.diets[log.food.dietType];
  const localOffsetFactor = 1 - (log.food.localFoodPercentage / 100) * 0.10; // max 10% transport discount
  const wasteAddition = EMISSION_FACTORS.food.wasteMultiplier[log.food.wasteLevel];
  const foodEmissions = (dietBase * localOffsetFactor) + wasteAddition;

  // 4. Shopping
  const shoppingEmissions = 
    (log.shopping.clothingItems * EMISSION_FACTORS.shopping.clothing) +
    (log.shopping.electronicsItems * EMISSION_FACTORS.shopping.electronics) +
    (log.shopping.otherItems * EMISSION_FACTORS.shopping.other);

  const total = transportEmissions + energyEmissions + foodEmissions + shoppingEmissions;

  return {
    transport: Number(transportEmissions.toFixed(2)),
    energy: Number(energyEmissions.toFixed(2)),
    food: Number(foodEmissions.toFixed(2)),
    shopping: Number(shoppingEmissions.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

// Baseline comparisons
export const COMPARISONS: NationalAverage[] = [
  { region: '🔒 Sustainable 1.5°C Goal', dailyEmissionsKg: 5.0, yearlyEmissionsTonnes: 1.8 },
  { region: '🌐 Global Average', dailyEmissionsKg: 12.0, yearlyEmissionsTonnes: 4.4 },
  { region: '🇪🇺 European Average', dailyEmissionsKg: 21.0, yearlyEmissionsTonnes: 7.6 },
  { region: '🇺🇸 US Average', dailyEmissionsKg: 44.5, yearlyEmissionsTonnes: 16.2 },
];

// Pre-defined static tips for rule-based instant fallback
export const STATIC_TIPS = [
  {
    category: 'transport' as const,
    title: 'Switch to public transport or active travel',
    description: 'Busing, training, or biking to work can reduce your commuting carbon footprint by 60% to 100% instantly.',
    savingEstimate: '5 - 15 kg CO2'
  },
  {
    category: 'transport' as const,
    title: 'Maintain your vehicle properly',
    description: 'Keeping tyres inflated to the proper level and getting regular tune-ups can improve fuel mileage by up to 3%.',
    savingEstimate: '1 - 2 kg CO2'
  },
  {
    category: 'energy' as const,
    title: 'Lower your thermostat by 1°C',
    description: 'Adjusting heating down slightly in winter or AC up slightly in summer can shave up to 10% off your energy costs and carbon footprint.',
    savingEstimate: '2 - 4 kg CO2'
  },
  {
    category: 'energy' as const,
    title: 'Unplug standby electronics',
    description: 'Appliances consume power even in standby mode. Unplugging them or using smart power strips eliminates "vampire" loads.',
    savingEstimate: '0.5 - 1 kg CO2'
  },
  {
    category: 'food' as const,
    title: 'Integrate one vegetarian day per week',
    description: 'Replacing beef and dairy with plant-based alternatives on a single day saves a massive amount of water and methane emissions.',
    savingEstimate: '4 - 7 kg CO2'
  },
  {
    category: 'food' as const,
    title: 'Freeze leftovers and prevent food waste',
    description: 'Over 30% of global food is wasted. Planning meals and storage means fewer landfills emitting greenhouse gases.',
    savingEstimate: '1 - 2 kg CO2'
  },
  {
    category: 'shopping' as const,
    title: 'Embrace second-hand or rentals for fashion',
    description: 'Manufacturing of synthetic clothes is energy-intensive. Renting or buying thrift clothing expands lifespan.',
    savingEstimate: '10 - 25 kg CO2'
  },
  {
    category: 'shopping' as const,
    title: 'Perform "Sleep on It" 48-hour purchasing rules',
    description: 'Avoid impulsive acquisitions of generic household decor or gadgets. Delay actions by 48 hours to minimize wasteful shopping carbon overhead.',
    savingEstimate: '5 - 20 kg CO2'
  }
];

// Eco Challenges seed data
export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: 'Meatless Day',
    description: 'Do not eat any beef, pork, or poultry today.',
    category: 'food',
    co2Savings: 4.8,
    completed: false
  },
  {
    id: 'c2',
    title: 'Active Commute',
    description: 'Walk, cycle, or use public transport for all transit requirements today.',
    category: 'transport',
    co2Savings: 6.2,
    completed: false
  },
  {
    id: 'c3',
    title: 'Vampire Slayer',
    description: 'Turn off standby mode on home appliances, entertainment centers, and laptops.',
    category: 'energy',
    co2Savings: 1.1,
    completed: false
  },
  {
    id: 'c4',
    title: 'Zero Waste Meals',
    description: 'Plan meal sizes properly so there is zero food waste throw-out today.',
    category: 'food',
    co2Savings: 1.5,
    completed: false
  },
  {
    id: 'c5',
    title: 'Buy Nothing Day',
    description: 'Refrain from buying any non-essential grocery or clothing items today.',
    category: 'shopping',
    co2Savings: 14.0,
    completed: false
  },
  {
    id: 'c6',
    title: 'Solar Power hours',
    description: 'Run heavy appliances (laundry/dishwasher) only when solar power is active or green tariff hours apply.',
    category: 'energy',
    co2Savings: 2.5,
    completed: false
  }
];

// Clean mock data for 7-day initial history so dashboard looks instantly fully populated and beautiful!
export function getInitialHistoryLogs(): ActivityLog[] {
  const logs: ActivityLog[] = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() - i);
    const dateStr = dateObj.toISOString().split('T')[0];

    // Seed logs with slight variations to show nice graphs page
    let carDistance = 25 - (i * 3) + Math.sin(i) * 5;
    if (carDistance < 0) carDistance = 0;
    
    const activity: Omit<ActivityLog, 'id' | 'calculatedEmissions'> = {
      date: dateStr,
      transport: {
        carDistance: Number(carDistance.toFixed(1)),
        carType: i % 3 === 0 ? 'hybrid' : 'petrol',
        transitDistance: i % 2 === 0 ? 10 : 0,
        flightDistance: i === 5 ? 0 : 0, // No air transit daily average
        activeDistance: i % 2 === 0 ? 3 : 1.2,
      },
      energy: {
        electricityKwh: Number((12 + Math.sin(i) * 3).toFixed(1)),
        naturalGasKwh: Number((8 + Math.cos(i) * 2).toFixed(1)),
        solarPercentage: i % 2 === 0 ? 25 : 0,
      },
      food: {
        dietType: i % 3 === 0 ? 'vegetarian' : 'average',
        localFoodPercentage: 30 + (i * 5),
        wasteLevel: i % 4 === 0 ? 'low' : 'medium',
      },
      shopping: {
        clothingItems: i === 3 ? 1 : 0,
        electronicsItems: i === 1 ? 1 : 0, // bought a smart monitor
        otherItems: i % 2 === 0 ? 2 : 1,
      }
    };

    const emissions = calculateLogEmissions(activity);
    
    logs.push({
      id: `seed_${i}`,
      ...activity,
      calculatedEmissions: emissions
    });
  }

  return logs;
}
