# Security Policy

## Supported version

The latest release on the `main` branch is supported.

## Reporting a vulnerability

Do not publish an exploitable vulnerability in a public issue. Contact the repository owner privately through the email address or security-reporting method listed on the GitHub profile or repository security page.

Include:

- A description of the vulnerability
- Steps to reproduce it
- Affected browser and extension version
- Potential impact
- A proposed fix, when available

The extension currently has no server-side component and stores its settings in Chrome local storage. Particular attention should be given to page-content parsing, CSV exports, permissions, and any future remote integrations.
