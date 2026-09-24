# Tw1sTHub Official - Developer Guide & Next Steps

Welcome back! If you are reading this on a new device, follow the setup instructions below to get the development environment running again.

## 💻 How to setup on a new device

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Tw1sT-Official/Tw1sTHubOfficial.git
   cd Tw1sTHubOfficial
   ```

2. **Install the dependencies:**
   ```bash
   npm install
   ```

3. **Connect the Database (Crucial Step):**
   You need to link your local code to your live Supabase database. Create a new file in the root folder called `.env.local` and paste the following into it:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://lmybwyakuaiqoelvtmyu.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxteWJ3eWFrdWFpcW9lbHZ0bXl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMjE4NzEsImV4cCI6MjEwNTc5Nzg3MX0.3_mqrx9_CqlFwb7ubIPJUP-hkQIOB6DsFXk4mG6foao
   ```

4. **Start the local server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser!

---

## 🚀 Roadmap: What to build next

We have successfully migrated the app to **Next.js**, set up **Tailwind CSS**, and connected it to **Supabase** for real-time chat and authentication. Here is what we should focus on next:

### 1. In-App Admin Dashboard
Currently, you have to go to the Supabase website and manually check the `is_approved` box in the `profiles` table to approve new users.
**Next step:** Build a hidden `/admin` page in the app (only accessible by your specific email) where you can see a list of pending applications and click an "Approve" button to let them in instantly.

### 2. Usernames & Avatars
Currently, the chat room and profile page just display the user's raw email address.
**Next step:** Update the Supabase `profiles` table to store a `username` and an `avatar_url`. Then, build a settings page where users can upload a custom profile picture and change their display name.

### 3. The Minigames (Apps)
The Apps grid has buttons for **RNGod** and **DarkLight**, but they don't go anywhere yet!
**Next step:** Build the actual minigames using React state. We can even hook them up to Supabase to create a global live Leaderboard!

### 4. Chat Upgrades
The community chat is live and working!
**Next step:** Add timestamps to the chat bubbles, let users delete their own messages, and maybe add the ability to send images or GIFs!
