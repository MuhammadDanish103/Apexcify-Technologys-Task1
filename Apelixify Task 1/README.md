
---

## Quick checklist before GitHub upload
1. Put a sample image `demo.jpg` in `backend/uploads/profile/demo.jpg` (or run upload via edit_profile).
2. `backend/schema.sql` contains seeded demo user.
3. `backend/package.json` + `README.md` explain how to run.
4. Test locally: `cd backend` → `npm install` → `npm run initdb` → `npm start`
5. Open: `http://localhost:3000/index.html` — login demo/demo123, create posts, upload images, check feed & modal.

---

If you want, I can:
- Convert the code to use MySQL instead of SQLite (if your internship requires it).
- Add Dockerfile for one-command run.
- Add unit tests or simple CI config for GitHub Actions.

Tell me if you want those additions — otherwise you’re ready to zip & push this repo to GitHub.
