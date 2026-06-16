import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Genvoris Docs',
  tagline: 'Virtual try-on infrastructure for e-commerce',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://docs.genvoris.org',
  baseUrl: '/',

  organizationName: 'devsajjadali',
  projectName: 'genvoris-docs',

  headTags: [
    /* Google Fonts — Inter UI + JetBrains Mono (preconnect for perf) */
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    },
    /* Gold accent bar for branded browser tabs (Chrome Android) */
    {
      tagName: 'meta',
      attributes: {
        name: 'theme-color',
        content: '#f0b429',
      },
    },
  ],

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: 'https://github.com/devsajjadali/genvoris-docs/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Site-wide Open Graph / Twitter card. SVG so it stays crisp on
    // high-DPI thumbnails; LinkedIn / Twitter / Slack scrapers all
    // accept SVG. Replace per-page via frontmatter `image:` if a
    // specific page needs a custom card.
    image: 'img/genvoris-social-card.svg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Genvoris',
      logo: {
        alt: 'Genvoris',
        src: 'img/logo.svg',
        srcDark: 'img/logo-dark.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docs',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/quickstart',
          label: 'Quickstart',
          position: 'left',
        },
        {
          to: '/api/authentication',
          label: 'API',
          position: 'left',
        },
        {
          href: 'https://genvoris.org/sign-in',
          label: 'Dashboard',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Quickstart', to: '/quickstart'},
            {label: 'Concepts', to: '/concepts'},
            {label: 'API reference', to: '/api/authentication'},
            {label: 'Node SDK', to: '/api/sdk-node'},
            {label: 'Errors', to: '/api/errors'},
          ],
        },
        {
          title: 'Integrations',
          items: [
            {label: 'Custom', to: '/integrations/custom'},
            {label: 'Laravel', to: '/integrations/laravel'},
            {label: 'Shopify', to: '/integrations/shopify'},
            {label: 'WordPress', to: '/integrations/wordpress'},
          ],
        },
        {
          title: 'Genvoris',
          items: [
            {label: 'Dashboard', href: 'https://genvoris.org/sign-in'},
            {label: 'Pricing', href: 'https://genvoris.org/pricing'},
            {label: 'Refund Policy', href: 'https://genvoris.org/refund-policy'},
            {label: 'Support', href: 'mailto:support@genvoris.org'},
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Genvoris.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.oneDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

