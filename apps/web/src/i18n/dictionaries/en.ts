import type { Dictionary } from './uz';

export const en: Dictionary = {
  meta: {
    title: 'ECWT — Bringing Uzbek Products to the US Market',
    description:
      'E-commerce World Trade: we list Uzbek manufacturers on Amazon, Etsy and other US marketplaces. Account, logistics, sales — we handle all of it.',
  },

  nav: {
    home: 'Home',
    services: 'Services',
    marketplaces: 'Marketplaces',
    howItWorks: 'How it works',
    pricing: 'Pricing',
    about: 'About',
    contact: 'Contact',
    login: 'Sign in',
    register: 'Become a partner',
    dashboard: 'Dashboard',
  },

  hero: {
    badge: 'A direct route to the US market',
    ribbon: 'Our Amazon and Etsy seller accounts are open to Uzbek manufacturers',
    title: 'Get your product selling in America',
    titleLead: 'Get your product',
    titleAccent: 'selling in America',
    subtitle:
      'You manufacture — we sell on Amazon and other US marketplaces. Account, listing, logistics, customer service and payouts are on us.',
    ctaPrimary: 'Become a partner',
    ctaSecondary: 'How it works',
    haveAccount: 'Already have an account?',
    displayOver: 'YOUR PRODUCT',
    displayMain: 'SELLING',
    displayUnder: 'IN AMERICA',
    scroll: 'SCROLL',
    mapFrom: 'Tashkent',
    mapTo: 'New York',
    marketplacesLabel: 'Where your product will sell',
    marketplacesNote: '2 live, the rest connecting',
    stats: {
      marketplaces: 'Marketplaces',
      suppliers: 'Partner manufacturers',
      market: 'US e-commerce market',
    },
  },

  problem: {
    title: 'Why going it alone is hard',
    subtitle: 'What an Uzbek manufacturer runs into on US marketplaces',
    items: [
      {
        title: 'US entity and tax ID',
        body: 'An Amazon Seller account requires a US legal entity, an EIN and a US bank account.',
      },
      {
        title: 'Receiving payments',
        body: 'Marketplaces pay out to a US bank account. Funds do not land directly in Uzbekistan.',
      },
      {
        title: 'Logistics and warehousing',
        body: 'For FBA, goods must first reach a US warehouse — export paperwork, duties, freight.',
      },
      {
        title: 'Language and listing quality',
        body: 'Without English copy, keyword research and professional photography, a listing never surfaces in search.',
      },
    ],
  },

  services: {
    title: 'What we do',
    subtitle: 'Everything except manufacturing',
    items: [
      {
        title: 'Marketplace account',
        body: 'You sell through our US company and established seller accounts — no need to register your own entity.',
      },
      {
        title: 'Listing preparation',
        body: 'English title and description, SEO keywords, competitor-based pricing, professional photography.',
      },
      {
        title: 'Logistics',
        body: 'Export documentation, consolidated freight, delivery to a US warehouse and FBA intake.',
      },
      {
        title: 'Sales management',
        body: 'Customer messages, reviews, returns, advertising campaigns and inventory monitoring.',
      },
      {
        title: 'Transparent reporting',
        body: 'Every order, fee and payout appears in your dashboard in real time.',
      },
      {
        title: 'Payouts to Uzbekistan',
        body: 'Sales revenue is transferred to your account through official channels, with full documentation.',
      },
    ],
  },

  howItWorks: {
    title: 'How it works',
    subtitle: 'From sign-up to first sale',
    steps: [
      {
        title: 'Register',
        body: 'Submit your company details and bank information. Verification usually takes 1–3 business days.',
      },
      {
        title: 'Add your product',
        body: 'Provide the name, description, price, photos and production capacity. We assess market fit.',
      },
      {
        title: 'We publish the listing',
        body: 'We prepare the English listing, calculate pricing and publish it on the marketplace.',
      },
      {
        title: 'Ship your goods',
        body: 'We confirm the agreed batch size and arrange the logistics.',
      },
      {
        title: 'Sales and payouts',
        body: 'The product sells, orders appear in your dashboard, and funds are transferred on the agreed schedule.',
      },
    ],
  },

  marketplaces: {
    title: 'Platforms we work with',
    subtitle: 'Current and planned marketplaces',
    active: 'Active',
    planned: 'Planned',
  },

  pricing: {
    title: 'Partnership terms',
    subtitle: 'No hidden fees — a percentage of revenue',
    note: 'Exact terms depend on product type, volume and logistics. Submit an enquiry for details.',
    plans: [
      {
        name: 'Starter',
        commission: '20%',
        forWho: 'For first-time exporters',
        popular: false,
        features: [
          'One marketplace (Amazon US)',
          'Up to 5 product listings',
          'Listing preparation and translation',
          'Basic sales reporting',
          'Monthly payouts',
        ],
      },
      {
        name: 'Standard',
        commission: '15%',
        forWho: 'For manufacturers with steady volume',
        popular: true,
        features: [
          'Two marketplaces',
          'Up to 25 product listings',
          'Professional photography',
          'Advertising campaigns',
          'Logistics coordination',
          'Payouts every two weeks',
        ],
      },
      {
        name: 'Enterprise',
        commission: 'Custom',
        forWho: 'For high volume and own-brand producers',
        popular: false,
        features: [
          'All marketplaces',
          'Unlimited products',
          'Brand registry enrolment',
          'Dedicated account manager',
          'Custom logistics scheme',
          'Weekly payouts',
        ],
      },
    ],
    cta: 'Submit an enquiry',
  },

  about: {
    title: 'About ECWT',
    body: 'E-commerce World Trade brings Uzbek manufacturers onto the international e-commerce market. We operate seller accounts on US marketplaces and open them up to local producers.',
    mission: {
      title: 'Our goal',
      body: 'For Uzbek products — cotton textiles, carpets, handicrafts, dried fruit — to hold a rightful place on the world market. The barrier here is knowledge and infrastructure, not product quality.',
    },
    values: [
      { title: 'Transparency', body: 'Every order and fee is visible in your dashboard.' },
      { title: 'Fully documented', body: 'All payouts are made through official channels under export regulations.' },
      { title: 'Long term', body: 'We build lasting partnerships, not one-off deals.' },
    ],
  },

  contact: {
    title: 'Get in touch',
    subtitle: 'We will assess your product’s fit for the US market at no cost',
    form: {
      name: 'Full name',
      namePlaceholder: 'Alisher Karimov',
      phone: 'Phone',
      phonePlaceholder: '+998 90 123 45 67',
      email: 'Email (optional)',
      emailPlaceholder: 'you@company.uz',
      company: 'Company name',
      companyPlaceholder: 'Ipak Yo‘li Tekstil LLC',
      category: 'Product type',
      categoryPlaceholder: 'E.g. cotton t-shirts, carpets, dried fruit',
      message: 'Additional details',
      messagePlaceholder: 'Monthly production volume, prior export experience...',
      submit: 'Send enquiry',
      submitting: 'Sending...',
      success: 'Enquiry received. We will be in touch within 1–2 business days.',
      error: 'Something went wrong. Please try again or call us directly.',
      privacy: 'Your details are never shared with third parties.',
    },
    direct: {
      title: 'Direct contact',
      phone: 'Phone',
      email: 'Email',
      telegram: 'Telegram',
      address: 'Address',
      addressValue: 'Tashkent, Uzbekistan',
      hours: 'Business hours',
      hoursValue: 'Monday–Friday, 9:00–18:00',
    },
  },

  cta: {
    title: 'Ready to sell in America?',
    body: 'Request a free assessment — we will tell you what price your product could command on the US market and what demand looks like.',
    button: 'Request an assessment',
  },

  footer: {
    tagline: 'Bringing Uzbek products to the world market',
    company: 'Company',
    services: 'Services',
    legal: 'Legal',
    terms: 'Terms of use',
    privacy: 'Privacy policy',
    offer: 'Public offer',
    rights: 'All rights reserved.',
  },

  common: {
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Try again',
    save: 'Save',
    saving: 'Saving...',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    noData: 'No data',
    required: 'Required field',
  },
};
