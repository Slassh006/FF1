# TheFreeFireIndia

> **TL;DR:** A fan-made, feature-packed Free Fire India website with dynamic content, an advanced admin panel, and user management — all without Firebase.

---

## 📚 Table of Contents

1. [🚀 Features](#-features)
2. [📋 Pages](#-pages)
3. [🔧 Tech Stack](#-tech-stack)
4. [🛠️ Installation](#️-installation)
5. [📁 Project Structure](#-project-structure)
6. [✅ Utility Example: Local Storage Check](#-utility-example-local-storage-check)
7. [📜 License](#-license)
8. [⚠️ Disclaimer](#-disclaimer)
9. [🙏 Credits](#-credits)

---

## 🚀 Features

- **Modern & Responsive Design**: Built with React, Next.js, and TailwindCSS.

- **Dynamic Content Management**: Blog posts, wallpapers, redeem codes, and craftland maps.

- **Advanced Admin Panel**: Full-featured backend for managing content, users, notifications, and analytics.

  - Secure login
  - Role-based access (Admin, Subscriber): Full CRUD (Create, Read, Update, Delete) support for all content types.
  - Real-time user analytics and activity logs (using open-source tools like Plausible or Umami).
  - WYSIWYG blog editor (Markdown + Rich Text).
  - Image/video/media embed in posts.
  - Draft & publish scheduling.
  - Autosave while writing posts.
  - Revision history for blog edits.
  - Tag/category manager.
  - Post visibility (public/private/unlisted).
  - Bulk delete/archive.
  - Admin notifications and announcements panel.
  - Notification system for users when redeem/craftland codes are updated.
  - Dark/light theme toggle in admin UI.
  - User audit logs and export options (CSV, JSON).
  - Integrations with open-source CMS libraries (e.g., Editor.js, TipTap, UploadThing).
  - Plugin support for extensibility.
  - Dashboard activity feed (recent posts, comments, new users).
  - Real-time comment moderation system.
  - **Smart Comment Filtering**: Profanity and abuse word filter with customizable blacklist.
  - Customizable widgets (quick stats, task reminders, etc.).
  - Admin impersonation (login as user for support/debugging).
  - **Google API Key Manager** in settings to update/manage OAuth credentials easily.
  - **Open Source Analytics Integration**: Easily plug in tools like Plausible, Umami, or PostHog for privacy-friendly usage tracking.
  - **Store Management Backend**:
    - Full control over coin-based store items (redeem codes, digital rewards).
    - Admin UI to create, edit, upload icons/media, set prices, and inventory.
    - Product visibility controls (draft, active, expired).
    - Purchase log viewer, search filter, fraud prevention audit log.
    - Manual reward addition/editing.
    - **Product Categories**: "Redeem Codes" and "Digital Rewards".
      - If **"Redeem Codes"** is selected:
        - Admin uploads product image.
        - Enters redeem code.
        - Sets coin cost.
      - If **"Digital Rewards"** is selected:
        - Admin adds product image, description, inventory, and optional voucher/redeem info (e.g., Amazon, Netflix).
        - Sets coin cost.
      - Store UI auto-categorizes items for user browsing.
    - **Shopping Cart System**:
      - Add/remove items to cart.
      - "My Cart" section in user profile.
      - Checkout with coin deduction logic.
      - "My Orders" shows purchased items — redeem codes or content will only be revealed after the order is completed.

- **User Management**:

  - Registration, login, role-based access, and analytics.
  - Google and email/password login options.
  - Default role for registered users: Subscriber.
  - User profile page with editable info (username, email, avatar, etc.).
  - Password change, reset, and delete account options.
  - Saved wallpapers, favorite craftland codes.
  - Notification preferences (email, in-app, push).
  - Subscribers: Frontend-only access.
  - User blocking/reporting system.
  - Activity timeline (user actions).
  - **User Quiz Profile Stats**.
  - **Store & Rewards**:
    - Users can buy any item from the store using earned coins.
    - Coin balance, purchase confirmation, and fraud-proof claim system.
    - Admin-controlled inventory.
    - **My Orders** section for users to see purchased items — redeem codes or content will only be revealed after the order is completed.
    - **My Cart**: View/edit pending items before checkout.
  - **Referral & Invite System**:
    - Unique referral link for each user.
    - Earn coins per successful referred signup.
    - Smart anti-fraud detection (IP/device/user behavior tracking).
    - Admin dashboard shows invites per user, reward tracking, fraud flags.
    - Profile section: "Invite Friends" tab with stats and link sharing.

- **Community Submissions**:

  - Users can freely submit Craftland codes.
  - Submissions will show in the user's section on the Craftland codes page.
  - **Voting System for Submitted Craftland Codes**:
    - Users can vote on submitted codes as "Working" or "Not Working".
    - Users can also 👍 Like a code; like count shown and used for sorting.
    - Most liked codes appear at the top of the list.
    - Verified codes (admin-posted or auto-promoted by votes) appear before user-submitted ones.
    - If enough verified votes are collected, the code is auto-approved and added to the verified Craftland codes list.
    - Users gain coins for positively verified submissions.
    - Submitted codes include:
      - Region flag icon (for code's region).
      - Contributor name and avatar.
      - Smart filtering system by tags, region, status.
    - **Craftland UI Split**:
      - Admin-verified codes section (trusted).
      - Community-submitted codes section (with voting + like UI).
      - Smart auto-move to trusted list on sufficient positive votes.
  - **Custom Notification System**:
    - Users will receive notifications for the following events:
      - New Craftland code submission.
      - New redeem codes.
      - New store items or updates.
      - If a user's Craftland code is moved to the verified section.
      - Order completion.
      - Coin earning notifications.
    - Users can earn 1 coin per positive interaction (e.g., when their community code is moved to the verified Craftland section).
    - Coins will be deducted for attempts at fraud, tampering, or mass submissions of incorrect Craftland codes.
    - **Fraud & Security Measures**:
      - Smart fraud detection system to prevent misuse.
      - Protection against VPN usage and other anti-cheating mechanisms.
      - Rate-limiting on Craftland code submissions to prevent spam.

- **Quiz Contest Results Page**:

  - Past quiz stats, answers, performance breakdown per user.
  - Coins awarded, rank changes, and visual timeline per contest.
  - 🟡 Partially Covered: Frontend exists, backend ready, UX can be further improved.

- **Push Notification Preferences**:

  - UI for managing device/browser-level notification preferences.
  - Works with Web Push API.
  - 🟡 Partially Covered: Needs device/browser toggle UI polish.

- **Security Enhancements**:

  - All redeem code views protected against scraping and unauthorized access.
  - Anti-tempering backend checks for claims and store purchases.
  - Token expiration, request throttling, and CAPTCHA on sensitive actions.
  - Rate-limiting on invite links.
  - Server-side redeem key masking until confirmed purchase.
  - Purchase audit logging.

## 📋 Pages

Each page has a specific purpose, providing users and admins a full experience:

1. **Home**: Entry point showing trending content and dynamic widgets.
2. **Blogs**: Latest updates, game tips, patch notes with filtering and tags.
3. **Gallery**: High-quality wallpapers users can view or download.
4. **Redeem Codes**: Easily copy latest codes with expiry alerts.
5. **Craftland**: Browse and save custom maps shared by the community.
   - Voting system ("Working" / "Not Working").
   - Like buttons for each code with visible like count.
   - Verified tag for trusted codes.
   - Save to favorites.
   - Filter by tags or categories.
   - Region-based layout with flag icon.
   - Split UI: Admin-posted vs. user-submitted codes.
   - Voting-driven promotion to verified section.
   - Contributor info: name and profile picture shown on each code.
6. **User**: Profile, preferences, and contribution history. Also includes "My Orders", "My Cart", and "Invite Friends" tab with referral analytics.
7. **Submit**: Form for user-generated Craftland code submissions.
8. **Leaderboard**: Highlights top community contributors with time filters and coin stats.
9. **Events**: Calendar of in-game events, reminders, and contests.
10. **Trivia / Quiz Contest**: Participate in weekly Free Fire IQ quizzes. Guess characters, answer FF-related questions, and earn coins. Top scorers are ranked and rewarded weekly.
11. **Admin**: Full control panel for managing the platform (see above).
12. **About Us & Disclaimer**: Legal and contact information.

## 🔧 Tech Stack

- **Frontend**: React, Next.js, TailwindCSS
- **Backend**: Node.js, Express, MongoDB
- **Authentication**: NextAuth.js, JWT
- **Database**: MongoDB with Mongoose ODM
- **Image Storage**: Cloudinary
- **Analytics**: Plausible/Umami/PostHog
- **Deployment**: Vercel/Netlify

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/TheFreeFireIndia.git
   cd TheFreeFireIndia
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   GOOGLE_CLIENT_ID=380561944050-7ug62pe5bprh0p7lchh8ch5jk3q0c5fm.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

