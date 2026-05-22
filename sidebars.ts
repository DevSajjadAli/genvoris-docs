import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  docs: [
    'intro',
    'quickstart',
    'concepts',
    {
      type: 'category',
      label: 'API reference',
      collapsed: false,
      items: [
        'api/authentication',
        'api/plans',
        'api/customers',
        'api/sessions',
        'api/widget',
        'api/webhooks',
        'api/errors',
      ],
    },
    {
      type: 'category',
      label: 'Integrations',
      collapsed: false,
      items: [
        'integrations/custom',
        'integrations/shopify',
        'integrations/wordpress',
      ],
    },
    'security',
  ],
};

export default sidebars;
