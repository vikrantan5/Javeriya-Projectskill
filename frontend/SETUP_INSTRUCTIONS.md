# TalentConnect Frontend - Setup Instructions

## 📦 What You Have

This is the complete frontend for **TalentConnect** - an intelligent peer-to-peer learning and academic support platform for students.

## 🎯 Features Included

### Pages:
- ✅ Landing Page (Marketing homepage)
- ✅ Login & Registration
- ✅ Dashboard (Student overview with stats)
- ✅ Skill Marketplace (Add skills, find mentors)
- ✅ Task Marketplace (Create/browse/accept paid tasks)
- ✅ AI Chatbot (Learning assistant powered by Groq AI)
- ✅ Sessions (Book and manage mentorship sessions)
- ✅ Profile (User profile management)
- ✅ Admin Dashboard (User management, analytics)

### Technical Features:
- ✅ React 18 with React Router v7
- ✅ Tailwind CSS for styling
- ✅ Axios for API calls
- ✅ JWT Authentication
- ✅ Protected routes
- ✅ Responsive design
- ✅ Modern UI components

## 🚀 Installation

### Prerequisites
- Node.js 16+ and Yarn installed
- Backend API running (FastAPI with Supabase)

### Steps:

1. **Extract the zip file**
   ```bash
   unzip talentconnect-frontend.zip
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Configure environment variables**
   
   Create or edit `.env` file in the root directory:
   ```env
   REACT_APP_BACKEND_URL=http://localhost:8001
   ```
   
   Replace with your actual backend URL.

4. **Start the development server**
   ```bash
   yarn start
   ```
   
   The app will open at `http://localhost:3000`

5. **Build for production**
   ```bash
   yarn build
   ```
   
   This creates an optimized build in the `build/` folder.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Navbar.js        # Navigation bar
│   │   └── ui/              # UI components library
│   ├── context/             # React contexts
│   │   └── AuthContext.js   # Authentication state
│   ├── pages/               # Page components
│   │   ├── LandingPage.js
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── Dashboard.js
│   │   ├── SkillMarketplace.js
│   │   ├── TaskMarketplace.js
│   │   ├── Chatbot.js
│   │   ├── Profile.js
│   │   ├── SessionBooking.js
│   │   └── AdminDashboard.js
│   ├── services/            # API services
│   │   ├── api.js           # Axios instance
│   │   └── apiService.js    # API functions
│   ├── App.js               # Main app component
│   ├── App.css              # Global styles
│   └── index.js             # Entry point
├── public/
│   └── index.html
├── package.json
├── tailwind.config.js
└── .env
```

## 🔌 Backend Integration

The frontend expects the following backend endpoints:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Skills
- `GET /api/skills` - Get user skills
- `POST /api/skills` - Add new skill
- `GET /api/skills/mentors/:skillName` - Find mentors

### Tasks
- `GET /api/tasks` - Get tasks
- `POST /api/tasks` - Create task
- `POST /api/tasks/:id/accept` - Accept task
- `POST /api/tasks/:id/submit` - Submit task

### Sessions
- `GET /api/sessions` - Get sessions
- `POST /api/sessions/request` - Request session
- `POST /api/sessions/:id/rate` - Rate session

### Chat
- `POST /api/chat` - Send message to AI
- `GET /api/chat/history/:sessionId` - Get chat history

### Admin (requires admin role)
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users/:id/ban` - Ban user
- `GET /api/admin/analytics` - Get platform analytics

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to change the color scheme:
```javascript
theme: {
  extend: {
    colors: {
      // Customize your brand colors
    }
  }
}
```

### API URL
Change the backend URL in `.env`:
```env
REACT_APP_BACKEND_URL=https://your-api-domain.com
```

## 🐛 Troubleshooting

### Issue: "Module not found" errors
**Solution:** Run `yarn install` again

### Issue: API calls failing
**Solution:** Check that:
1. Backend is running
2. `REACT_APP_BACKEND_URL` is correct in `.env`
3. CORS is enabled on backend

### Issue: Login not working
**Solution:** Verify:
1. Backend authentication endpoints are working
2. JWT token is being stored in localStorage
3. Check browser console for errors

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_BACKEND_URL` | Backend API base URL | `http://localhost:8001` |

## 🔐 Authentication Flow

1. User registers/logs in
2. Backend returns JWT token
3. Token stored in localStorage
4. Token sent in Authorization header for protected routes
5. On 401 error, user redirected to login

## 📱 Responsive Design

The app is fully responsive and works on:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1920px+)

## 🚢 Deployment

### Deploy to Netlify
```bash
yarn build
# Deploy the build/ folder
```

### Deploy to Vercel
```bash
vercel --prod
```

### Deploy to GitHub Pages
```bash
yarn build
# Push build/ folder to gh-pages branch
```

## 📚 Technologies Used

- **React 18** - UI library
- **React Router v7** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Context** - State management

## 🤝 Support

For issues or questions:
1. Check backend is running correctly
2. Verify all environment variables
3. Check browser console for errors
4. Ensure Node.js and Yarn are up to date

## 📄 License

This is a custom-built frontend for TalentConnect platform.

---

**Built with ❤️ for peer-to-peer learning**
