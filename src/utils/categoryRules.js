// Function to map transactions to categories
export const mapToCategory = (transaction) => {
  // Get all possible description fields
  const mainDescription = (transaction["Texte comptable"] || '').toLowerCase();
  const description1 = (transaction.Description1 || '').toLowerCase();
  const description2 = (transaction.Description2 || '').toLowerCase();
  const description3 = (transaction.Description3 || '').toLowerCase();
  const sector = (transaction.Secteur || '').toLowerCase();

  // Combine all descriptions for better matching
  const fullDescription = `${mainDescription} ${description1} ${description2} ${description3}`.toLowerCase();

  // Check for specialized categories based on your specific transactions

  // Hospital payments (salary)
  if (fullDescription.includes('hopitaux universitaires') ||
      fullDescription.includes('hôpitaux universitaires') ||
      (fullDescription.includes('geneve') && fullDescription.includes('perret-gentil'))) {
    return {
      name: 'Income',
      sub: 'Salary'
    };
  }

  // Investment platforms
  if (fullDescription.includes('trading 212') ||
      fullDescription.includes('ibkr') ||
      fullDescription.includes('interactive brokers')) {
    return {
      name: 'Investments',
      sub: 'Trading'
    };
  }
  if (fullDescription.includes('retrait au bancomat')) {
    return {
      name: 'ATM withdrawals',
      sub: ''
    };
  }


  // Retirement accounts
  if (fullDescription.includes('frankly') ||
      fullDescription.includes('truewealth') ||
      fullDescription.includes('pillar 3a') ||
      fullDescription.includes('pilier 3a')) {
    return {
      name: 'Retirement',
      sub: 'Pillar 3A'
    };
  }
  if (fullDescription.includes('"david nicolas de ridder",,,,') ||
      description1.includes('david nicolas de ridder') ||
      (transaction.recipient && transaction.recipient.toLowerCase().includes('david nicolas de ridder'))) {
    return {
      name: 'Investments',
      sub: 'Pension fund'
    };
  }
  // Taxes
  if (fullDescription.includes('"etat de genève",,,,,') ||
      description1.includes('"etat de genève",,,,,') ||
      fullDescription.includes('serafe') ||
      description1.includes('serafe') ||
      (transaction.recipient && transaction.recipient.toLowerCase().includes('"etat de genève",,,,,'))) {
    return {
      name: 'Taxes',
      sub: ''
    };
  }

  // Rent payments
  if (fullDescription.includes('bordier schmidhauser') ||
      (fullDescription.includes('loyer') && fullDescription.includes('geneve'))) {
    return {
      name: 'Housing',
      sub: 'Rent'
    };
  }

  // Neon joint account transfer (common home expenses with wife)
  if ((fullDescription.includes('ordre permanent') || fullDescription.includes('recurring payment')) &&
      fullDescription.includes('ch12 0830 7000 6221 4931 8')) {
    return {
      name: 'Home',
      sub: 'Joint Account'
    };
  }

  // Flights and airlines
  if (fullDescription.includes('qatar') ||
      fullDescription.includes('swiss air') ||
      fullDescription.includes('easyjet') ||
      fullDescription.includes('lufthansa') ||
      fullDescription.includes('air france') ||
      fullDescription.includes('skywestair') ||
      fullDescription.includes('british airways') ||
      fullDescription.includes('klm') ||
      fullDescription.includes('emirates')) {
    return {
      name: 'Travel',
      sub: 'Flights'
    };
  }

  // Check for common banking transactions
  if (fullDescription.includes('virement') ||
      fullDescription.includes('transfer') ||
      fullDescription.includes('versement') ||
      fullDescription.includes('credit') ||
      fullDescription.includes('crédit')) {
    // Try to identify source of income

    // Check for salary from hospitals first (highest priority)
    if (fullDescription.includes('hopitaux universitaires de geneve') ||
        fullDescription.includes('hôpitaux') ||
        fullDescription.includes('universite de geneve') ||
        fullDescription.includes('universitaires') ||
        fullDescription.includes('geneve') && fullDescription.includes('perret-gentil')) {
      return {
        name: 'Income',
        sub: 'Salary'
      };
    } else if (fullDescription.includes('salaire') ||
        fullDescription.includes('salary') ||
        fullDescription.includes('paie') ||
        fullDescription.includes('payroll')) {
      return {
        name: 'Income',
        sub: 'Salary'
      };
    } else if (fullDescription.includes('dividend') ||
              fullDescription.includes('dividende') ||
              fullDescription.includes('investment') ||
              fullDescription.includes('investissement')) {
      return {
        name: 'Income',
        sub: 'Investments'
      };
    } else {
      return {
        name: 'Income',
        sub: 'Transfer'
      };
    }
  }

  // Check for banking fees
  if (fullDescription.includes('frais') ||
      fullDescription.includes('fee') ||
      fullDescription.includes('commission') ||
      fullDescription.includes('intérêt') ||
      fullDescription.includes('interest')) {
    return {
      name: 'Banking',
      sub: 'Fees & Interest'
    };
  }

  // Health Insurance specific providers
  if (fullDescription.includes('assura') ||
      fullDescription.includes('groupe mutuel') ||
      fullDescription.includes('mutuel assurance') ||
      fullDescription.includes('css') ||
      fullDescription.includes('helsana') ||
      fullDescription.includes('sanitas') ||
      fullDescription.includes('swica') ||
      fullDescription.includes('concordia') ||
      fullDescription.includes('supra-1846') ||
      fullDescription.includes('visana')) {
    return {
      name: 'Insurance',
      sub: 'Health'
    };
  }

  // General Insurance
  if (fullDescription.includes('insurance') ||
      fullDescription.includes('assurance') ||
      fullDescription.includes('axa') ||
      fullDescription.includes('zurich') ||
      fullDescription.includes('baloise') ||
      fullDescription.includes('allianz') ||
      fullDescription.includes('generali') ||
      fullDescription.includes('helvetia')) {

    if (fullDescription.includes('car') ||
        fullDescription.includes('auto') ||
        fullDescription.includes('voiture') ||
        fullDescription.includes('vehicule')) {
      return {
        name: 'Insurance',
        sub: 'Car'
      };
    } else if (fullDescription.includes('health') ||
              fullDescription.includes('santé') ||
              fullDescription.includes('maladie') ||
              fullDescription.includes('medical')) {
      return {
        name: 'Insurance',
        sub: 'Health'
      };
    } else if (fullDescription.includes('home') ||
              fullDescription.includes('maison') ||
              fullDescription.includes('habitation') ||
              fullDescription.includes('household') ||
              fullDescription.includes('apartment')) {
      return {
        name: 'Insurance',
        sub: 'Home'
      };
    } else {
      return {
        name: 'Insurance',
        sub: 'Other'
      };
    }
  }

  // Subscription category
  if (fullDescription.includes('spotify') ||
      fullDescription.includes('netflix') ||
      fullDescription.includes('apple.com/bill') ||
      fullDescription.includes('amazon prime') ||
      fullDescription.includes('disney+') ||
      fullDescription.includes('hbo') ||
      fullDescription.includes('youtube') ||
      fullDescription.includes('twitch') ||
      fullDescription.includes('crunchyroll') ||
      fullDescription.includes('deezer') ||
      fullDescription.includes('spotify') ||
      fullDescription.includes('pandora') ||
      fullDescription.includes('tidal') ||
      fullDescription.includes('abonnement') ||
      fullDescription.includes('subscription') ||
      sector.includes('médias numériques')) {

    // Determine subscription type
    if (fullDescription.includes('spotify') ||
        fullDescription.includes('apple music') ||
        fullDescription.includes('deezer') ||
        fullDescription.includes('tidal') ||
        fullDescription.includes('pandora')) {
      return {
        name: 'Subscriptions',
        sub: 'Music'
      };
    } else if (fullDescription.includes('netflix') ||
              fullDescription.includes('disney+') ||
              fullDescription.includes('hbo') ||
              fullDescription.includes('amazon prime') ||
              fullDescription.includes('youtube premium') ||
              fullDescription.includes('crunchyroll')) {
      return {
        name: 'Subscriptions',
        sub: 'Video'
      };
    } else if (fullDescription.includes('apple.com')) {
      return {
        name: 'Subscriptions',
        sub: 'Apple Services'
      };
    } else if (fullDescription.includes('microsoft') ||
              fullDescription.includes('office') ||
              fullDescription.includes('adobe') ||
              fullDescription.includes('dropbox') ||
              fullDescription.includes('google')) {
      return {
        name: 'Subscriptions',
        sub: 'Software'
      };
    } else if (fullDescription.includes('claude') ||
              fullDescription.includes('chatgpt')) {
      return {
        name: 'Subscriptions',
        sub: 'AI'
      };
    } else {
      return {
        name: 'Subscriptions',
        sub: 'Other'
      };
    }
  }

  // Food delivery - Check this before general Uber check (for taxis)
  if (fullDescription.includes('uber *eats') ||
      fullDescription.includes('uber eats') ||
      fullDescription.includes('deliveroo') ||
      fullDescription.includes('just eat') ||
      fullDescription.includes('takeaway') ||
      fullDescription.includes('delivery') ||
      fullDescription.includes('livraison repas') ||
      fullDescription.includes('smood') ||
      fullDescription.includes('eat.ch') ||
      // Special check for Uber Eats in various formats
      (fullDescription.includes('uber') && fullDescription.includes('eats'))) {
    return {
      name: 'Food',
      sub: 'Takeaway'
    };
  }

  // Home category
  if (fullDescription.includes('migros') ||
      fullDescription.includes('coop') ||
      fullDescription.includes('denner') ||
      fullDescription.includes('aldi') ||
      fullDescription.includes('lidl') ||
      fullDescription.includes('manor') ||
      fullDescription.includes('globus') ||
      fullDescription.includes('spar') ||
      fullDescription.includes('volg') ||
      fullDescription.includes('carrefour') ||
      fullDescription.includes('casino') ||
      fullDescription.includes('monoprix') ||
      fullDescription.includes('grocery') ||
      fullDescription.includes('supermarket') ||
      fullDescription.includes('supermarché') ||
      sector.includes('alimentation') ||
      sector.includes('magasin d alimentation')) {
    return {
      name: 'Home',
      sub: 'Groceries'
    };
  }

  if (fullDescription.includes('ikea') ||
      fullDescription.includes('conforama') ||
      fullDescription.includes('home depot') ||
      fullDescription.includes('jumbo') ||
      fullDescription.includes('hornbach') ||
      fullDescription.includes('bauhaus') ||
      fullDescription.includes('möbel') ||
      fullDescription.includes('furniture') ||
      fullDescription.includes('meuble')) {
    return {
      name: 'Home',
      sub: 'Furniture'
    };
  }

  if (fullDescription.includes('swisscom') ||
      fullDescription.includes('salt') ||
      fullDescription.includes('sunrise') ||
      fullDescription.includes('internet') ||
      fullDescription.includes('téléphone') ||
      fullDescription.includes('phone bill') ||
      fullDescription.includes('telecommunications')) {
    return {
      name: 'Home',
      sub: 'Phone & TV'
    };
  }

  if (fullDescription.includes('eau') ||
      fullDescription.includes('water') ||
      fullDescription.includes('électricité') ||
      fullDescription.includes('electricity') ||
      fullDescription.includes('gaz') ||
      fullDescription.includes('gas') ||
      fullDescription.includes('service industriel') ||
      fullDescription.includes('utility') ||
      fullDescription.includes('chauffage') ||
      fullDescription.includes('heating')) {
    return {
      name: 'Home',
      sub: 'Utilities'
    };
  }

  // Restaurants & Takeaway
  if (fullDescription.includes('restaurant') ||
      fullDescription.includes('café') ||
      fullDescription.includes('cafe') ||
      fullDescription.includes('bar') ||
      fullDescription.includes('bistro') ||
      fullDescription.includes('brasserie') ||
      fullDescription.includes('mcdonalds') ||
      fullDescription.includes('burger king') ||
      fullDescription.includes('starbucks') ||
      fullDescription.includes('coffeeshop') ||
      sector.includes('restaurant') ||
      sector.includes('restauration')) {
    return {
      name: 'Food',
      sub: 'Restaurant'
    };
  }

  // Transport
  if (fullDescription.includes('cff') ||
      fullDescription.includes('sbb') ||
      fullDescription.includes('sncf') ||
      fullDescription.includes('tpg') ||
      fullDescription.includes('metro') ||
      fullDescription.includes('tram') ||
      fullDescription.includes('bus') ||
      fullDescription.includes('train') ||
      fullDescription.includes('transport public')) {
    return {
      name: 'Transport',
      sub: 'Public Transport'
    };
  }

  // Check for Uber TRIP specifically (for rides)
  if ((fullDescription.includes('uber *trip') ||
       fullDescription.includes('uber trip') ||
       fullDescription.includes('uber *one') ||
       (fullDescription.includes('uber') && !fullDescription.includes('eats') && !fullDescription.includes('eat'))) ||
      fullDescription.includes('taxi') ||
      fullDescription.includes('cabify') ||
      fullDescription.includes('lyft')) {
    return {
      name: 'Transport',
      sub: 'Taxi'
    };
  }

  if (fullDescription.includes('gas station') ||
      fullDescription.includes('essence') ||
      fullDescription.includes('petrol') ||
      fullDescription.includes('carburant') ||
      fullDescription.includes('shell') ||
      fullDescription.includes('bp ') ||
      fullDescription.includes('caltex') ||
      fullDescription.includes('migrol') ||
      fullDescription.includes('tamoil') ||
      fullDescription.includes('avia') ||
      fullDescription.includes('station service')) {
    return {
      name: 'Transport',
      sub: 'Fuel'
    };
  }

  if (fullDescription.includes('parking') ||
      fullDescription.includes('parkmeter') ||
      fullDescription.includes('parkhaus') ||
      fullDescription.includes('stationnement')) {
    return {
      name: 'Transport',
      sub: 'Parking'
    };
  }

  if (fullDescription.includes('mecanique') ||
      fullDescription.includes('garage') ||
      fullDescription.includes('auto repair') ||
      fullDescription.includes('car service') ||
      fullDescription.includes('entretien voiture')) {
    return {
      name: 'Transport',
      sub: 'Car Maintenance'
    };
  }

  // Clothes & Shopping
  if (fullDescription.includes('h&m') ||
      fullDescription.includes('zara') ||
      fullDescription.includes('mango') ||
      fullDescription.includes('c&a') ||
      fullDescription.includes('primark') ||
      fullDescription.includes('esprit') ||
      fullDescription.includes('pull and bear') ||
      fullDescription.includes('bershka') ||
      fullDescription.includes('massimo dutti') ||
      fullDescription.includes('uniqlo') ||
      sector.includes('vêtements') ||
      sector.includes('clothing')) {
    return {
      name: 'Shopping',
      sub: 'Clothes'
    };
  }

  if (fullDescription.includes('amazon') ||
      fullDescription.includes('aliexpress') ||
      fullDescription.includes('ebay') ||
      fullDescription.includes('zalando') ||
      fullDescription.includes('galaxus') ||
      fullDescription.includes('digitec') ||
      fullDescription.includes('online shopping')) {
    return {
      name: 'Shopping',
      sub: 'Online'
    };
  }

  if (fullDescription.includes('fnac') ||
      fullDescription.includes('mediamarkt') ||
      fullDescription.includes('interdiscount') ||
      fullDescription.includes('fust') ||
      fullDescription.includes('microspot') ||
      fullDescription.includes('brack') ||
      fullDescription.includes('electronic') ||
      fullDescription.includes('electronique')) {
    return {
      name: 'Shopping',
      sub: 'Electronics'
    };
  }

  // Health & Wellness
  if (fullDescription.includes('gym') ||
      fullDescription.includes('fitness') ||
      fullDescription.includes('sport') ||
      fullDescription.includes('evo switzerland') ||
      fullDescription.includes('crossfit') ||
      fullDescription.includes('yoga') ||
      fullDescription.includes('pilates') ||
      fullDescription.includes('tennis') ||
      fullDescription.includes('golf') ||
      fullDescription.includes('swimming') ||
      fullDescription.includes('natation')) {
    return {
      name: 'Health & Wellness',
      sub: 'Sport'
    };
  }

  if (fullDescription.includes('medecin') ||
      fullDescription.includes('doctor') ||
      fullDescription.includes('hopital') ||
      fullDescription.includes('hospital') ||
      fullDescription.includes('clinic') ||
      fullDescription.includes('clinique') ||
      fullDescription.includes('dentist') ||
      fullDescription.includes('dentiste') ||
      fullDescription.includes('medical') ||
      fullDescription.includes('médical')) {
    return {
      name: 'Health & Wellness',
      sub: 'Medical'
    };
  }

  if (fullDescription.includes('pharmacy') ||
      fullDescription.includes('pharmacie') ||
      fullDescription.includes('amavita') ||
      fullDescription.includes('sunkstore') ||
      fullDescription.includes('coop vitality') ||
      fullDescription.includes('medication') ||
      fullDescription.includes('médicament')) {
    return {
      name: 'Health & Wellness',
      sub: 'Pharmacy'
    };
  }

  // Housing
  if (fullDescription.includes('loyer') ||
      fullDescription.includes('location') ||
      fullDescription.includes('regies') ||
      fullDescription.includes('property management') ||
      fullDescription.includes('appartement payment')) {
    return {
      name: 'Housing',
      sub: 'Rent'
    };
  }

  if (fullDescription.includes('mortgage') ||
      fullDescription.includes('hypothèque') ||
      fullDescription.includes('hypotheque') ||
      fullDescription.includes('home loan')) {
    return {
      name: 'Housing',
      sub: 'Mortgage'
    };
  }

  // Entertainment
  if (fullDescription.includes('cinema') ||
      fullDescription.includes('movie') ||
      fullDescription.includes('film') ||
      fullDescription.includes('pathé') ||
      fullDescription.includes('arena cinemas')) {
    return {
      name: 'Entertainment',
      sub: 'Cinema'
    };
  }

  if (fullDescription.includes('concert') ||
      fullDescription.includes('festival') ||
      fullDescription.includes('ticket master') ||
      fullDescription.includes('show') ||
      fullDescription.includes('theatre') ||
      fullDescription.includes('théâtre') ||
      fullDescription.includes('opéra') ||
      fullDescription.includes('spectacle')) {
    return {
      name: 'Entertainment',
      sub: 'Events'
    };
  }

  // Travel
  if (fullDescription.includes('hotel') ||
      fullDescription.includes('airbnb') ||
      fullDescription.includes('booking.com') ||
      fullDescription.includes('lodging') ||
      fullDescription.includes('accommodation') ||
      fullDescription.includes('hébergement')) {
    return {
      name: 'Travel',
      sub: 'Accommodation'
    };
  }

  if (fullDescription.includes('airline') ||
      fullDescription.includes('flight') ||
      fullDescription.includes('swiss') ||
      fullDescription.includes('easyjet') ||
      fullDescription.includes('lufthansa') ||
      fullDescription.includes('air france') ||
      fullDescription.includes('british airways') ||
      fullDescription.includes('aérien')) {
    return {
      name: 'Travel',
      sub: 'Flights'
    };
  }

  // Use sector if available for unknown categories
  if (sector) {
    if (sector.includes('restaurant') || sector.includes('fast-food')) {
      return {
        name: 'Food',
        sub: 'Restaurant'
      };
    } else if (sector.includes('alimentation') || sector.includes('supermarché')) {
      return {
        name: 'Home',
        sub: 'Groceries'
      };
    } else if (sector.includes('vêtements') || sector.includes('clothing')) {
      return {
        name: 'Shopping',
        sub: 'Clothes'
      };
    } else if (sector.includes('médias') || sector.includes('musique') || sector.includes('livres')) {
      return {
        name: 'Entertainment',
        sub: 'Media'
      };
    } else if (sector.includes('voyage') || sector.includes('hôtel')) {
      return {
        name: 'Travel',
        sub: 'Accommodation'
      };
    } else {
      return {
        name: 'Miscellaneous',
        sub: sector.charAt(0).toUpperCase() + sector.slice(1)
      };
    }
  }

  // Try to extract info from description if nothing else matched
  if (fullDescription.includes('transfer') || fullDescription.includes('virement')) {
    return {
      name: 'Banking',
      sub: 'Transfer'
    };
  }

  // Default category
  return {
    name: 'Miscellaneous',
    sub: 'Other'
  };
};
