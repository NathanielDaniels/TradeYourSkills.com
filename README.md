# TradeMySkills

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/) [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-blue?logo=tailwind-css)](https://tailwindcss.com/)

**TradeMySkills** is a local skill-swapping platform where users exchange skills instead of money. Connect, trade, and collaborate with people in your area to share your talents.

---

## Demo

> _A sneak peek of TradeMySkills in action!_

![TradeMySkills Demo](./demo/trademyskills-demo.gif)  
_Claim usernames, list skills, and trade with ease!_

---

## Features

- **Secure Authentication:** Google OAuth + Email sign-in via NextAuth.js
- **Profile Management:** Claim a unique username, edit bio & location, upload avatars
- **Skill Listings:** Add, reorder, and showcase your skills
- **Swap Requests:** Trade skills with others seamlessly
- **Messaging:** Negotiate swaps in-app
- **Accessibility Focused:** Fully ARIA-compliant forms & live validation
- **Dark Mode Support:** Works beautifully in light & dark themes

---

## Roadmap (Coming Soon)

Boosted listings & Pro badges

Skill matching & AI-powered suggestions

Scheduling & in-app calendar

Optional escrow for credit-based swaps

## Tech Stack

| Layer          | Tech/Tool                                       |
| -------------- | ----------------------------------------------- |
| Frontend       | Next.js 15 (App Router), React, Tailwind CSS v4 |
| Backend        | Next.js API Routes, Prisma ORM, Neon Postgres   |
| Authentication | NextAuth.js (Google OAuth + Email)              |
| Uploads        | UploadThing                                     |
| Monitoring     | Sentry                                          |
| Deployment     | Vercel                                          |

---

## Project Structure

```text
app/
├── api/
│   ├── auth/                 # NextAuth routes
│   ├── profile/
│   │   ├── avatar/           # Avatar uploads
│   │   ├── skills/           # Skill CRUD
│   │   └── username/claim/   # Username claim
│   └── swap/                 # Swap requests & messaging
├── dashboard/                # Dashboard
├── listings/                 # Public listing pages
└── users/                    # Public user profiles

components/                   # Reusable UI components
hooks/                        # Custom hooks
lib/                          # Prisma client, authOptions, utilities
```
