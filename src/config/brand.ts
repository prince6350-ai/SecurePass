/**
 * SecurePass — Permanent Developer Branding & Configuration
 * 
 * Developer: Prince Kumar
 * Tool Name: SecurePass
 * Profile Image: /prince-kumar.jpg
 * LinkedIn: https://www.linkedin.com/in/prince---kumar
 */

export interface SocialLink {
  name: string;
  url: string;
  placeholderText: string;
  isConfigured: boolean;
  username: string;
}

export interface BrandConfig {
  readonly toolName: string;
  readonly tagline: string;
  readonly developerName: string;
  readonly developerCredit: string;
  readonly developerTitle: string;
  readonly avatarImageUrl: string;
  readonly socials: {
    readonly linkedin: SocialLink;
  };
}

export const BRAND_CONFIG: BrandConfig = {
  toolName: 'SecurePass',
  tagline: 'Deterministic, Zero-Database Password Derivation Engine',
  developerName: 'Prince Kumar',
  developerCredit: 'Developed by Prince Kumar',
  developerTitle: 'Cybersecurity & Software Engineer',
  
  // Permanent profile photo pointing to /prince-kumar.jpg
  avatarImageUrl: '/prince-kumar.jpg',

  socials: {
    linkedin: {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/prince---kumar',
      placeholderText: 'https://www.linkedin.com/in/prince---kumar',
      isConfigured: true,
      username: 'prince---kumar',
    },
  },
};
