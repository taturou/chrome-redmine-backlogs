/**
 * @see {@link https://developer.chrome.com/extensions/manifest}
 */
module.exports = {
  name: 'chrome-redmine-backlogs',
  description: 'A Chrome extension for Redmine with Backlogs',
  author: 'taturou@gmail.com',
  version: '1.0.0',
  icons: {
    '16': 'icons/16.png',
    '128': 'icons/128.png'
  },
  /**
   * @see {@link https://developer.chrome.com/extensions/declare_permissions}
   */
  permissions: [
    '<all_urls>',
    '*://*/*',
    'activeTab',
    'tabs',
    'background',
    'unlimitedStorage',
    'storage',
    'alarms'
  ],
  browser_action: {
    default_title: 'Backlogs',
    default_popup: 'pages/popup.html'
  },
  background: {
    persistent: false,
    page: 'pages/background.html'
  },
  options_page: 'pages/options.html',
  content_scripts: [{
    js: [
      'js/manifest.js',
      'js/vendor.js',
      'js/content.js'
    ],
    run_at: 'document_end',
    matches: [ 'http://*/rb/taskboards/*', 'https://*/rb/taskboards/*' ],
    all_frames: true
  }],
  manifest_version: 2,
  content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self'",
  web_accessible_resources: [
    'js/content.js'
  ]
}
