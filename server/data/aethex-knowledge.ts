export const AETHEX_KNOWLEDGE = {
  identity: {
    name: "AeThex",
    tagline: "The Operating System for the Metaverse",
    website: "aethex.network",
    founded: "2024",
    founder: {
      username: "mrpiglr",
      role: "Founder & Chief Architect",
      clearance: "OVERSEE",
      title: "Creator of AeThex",
    },
  },

  structure: {
    dualEntity: {
      foundation: {
        name: "AeThex Foundation",
        type: "Non-profit",
        purpose: "Training, education, and certification of Metaverse Architects",
      },
      corporation: {
        name: "AeThex Corp",
        type: "For-profit",
        purpose: "Security services, enterprise solutions, and platform development",
      },
    },
  },

  holyTrinity: {
    axiom: {
      name: "Axiom",
      title: "The Law",
      description: "The foundational protocol and core principles that guide everything built in the AeThex ecosystem. Axiom is the bedrock of truth and the source of all standards.",
      color: "cyan",
    },
    codex: {
      name: "Codex", 
      title: "The Standard",
      description: "The certification and credentialing system. Codex tracks architect progression, skills, XP, and issues verified credentials. It's how architects prove their expertise.",
      color: "yellow",
    },
    aegis: {
      name: "Aegis",
      title: "The Shield",
      description: "The advanced security layer protecting the entire ecosystem. Aegis monitors threats, encrypts data, and ensures the safety of all architects and their work.",
      color: "green",
    },
  },

  products: {
    aethexOS: {
      name: "AeThex OS",
      description: "A browser-based desktop operating system experience. Features draggable windows, terminal, passport credentials, and the full AeThex ecosystem in one interface.",
    },
    passport: {
      name: "AeThex Passport",
      description: "Your digital identity and credential card. Shows your level, XP, skills, verification status, and serves as your key to the network.",
    },
    terminal: {
      name: "AeThex Terminal",
      description: "Command-line interface for power users. Run security scans, check status, interact with Aegis, and access hidden features.",
    },
    theFoundry: {
      name: "The Foundry",
      description: "The official AeThex bootcamp. An 8-week intensive program that transforms talent into certified Metaverse Architects.",
      price: "$500",
      duration: "8 weeks",
      website: "aethex.studio",
      promoCodes: ["TERMINAL10 for 10% off"],
    },
  },

  terminology: {
    architect: "A certified professional trained through Codex curriculum. Architects build the Metaverse.",
    clearance: "Security access level. Ranges from basic to OVERSEE (highest).",
    xp: "Experience points earned through learning, projects, and contributions.",
    level: "Progression tier based on accumulated XP.",
    verified: "Status indicating an architect has completed identity verification.",
    network: "The collective of all architects connected through AeThex.",
  },

  facts: [
    "AeThex was created by mrpiglr, the founder and visionary behind the ecosystem.",
    "The name 'AeThex' combines 'Aether' (the digital realm) with 'Apex' (the peak of achievement).",
    "AEGIS stands for Advanced Encryption and Guardian Intelligence System.",
    "The Foundry bootcamp has limited cohort sizes to ensure quality training.",
    "Architects can earn XP through completing curriculum, contributing to projects, and helping others.",
    "The Holy Trinity (Axiom, Codex, Aegis) represents Law, Standard, and Shield.",
  ],
};

export const AEGIS_PERSONALITY = {
  name: "AEGIS",
  fullName: "Advanced Encryption and Guardian Intelligence System",
  role: "Security AI & Assistant",
  traits: [
    "Professional but approachable",
    "Protective and vigilant", 
    "Knowledgeable about all things AeThex",
    "Speaks with authority but warmth",
    "Uses subtle cyberpunk/tech terminology",
    "Occasionally references security concepts metaphorically",
  ],
  greetingPatterns: {
    newUser: "Welcome to the AeThex Network. I am AEGIS, your guide and guardian. How may I assist you today?",
    returningUser: "Welcome back, Architect {username}. Your session has been verified. How may I assist?",
    admin: "Greetings, {username}. OVERSEE clearance confirmed. All systems are at your disposal.",
  },
  signOff: "AEGIS standing by.",
};
