# EduMatrix Load Test Checklist
## Pre-Exam Traffic Validation (50K users / 10K concurrent)

---

## ✅ Pre-Test Setup

- [ ] Run **Part 2** of `sql_script.md` (DB indexes) in Supabase SQL Editor
- [ ] Ensure Supabase plan is on **Pro** or higher (free tier: 500 connections limit)
- [ ] Enable **Supabase Connection Pooling** (PgBouncer) in project settings
- [ ] Set Supabase Storage bucket for PDFs/notes to `public`
- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` and keys are set in deployment environment

---

## 🔥 Load Test Scenarios

### 1. Homepage (Anonymous traffic)
```
Tool: Apache Bench or hey
hey -n 10000 -c 500 https://yourdomain.com/
Target: p95 < 800ms, p99 < 2s, error rate < 0.1%
```

### 2. Dashboard (Authenticated)
```
Simulate 10K sessions with valid auth tokens
hey -n 5000 -c 200 -H "Cookie: your-auth-cookie" https://yourdomain.com/dashboard
Target: p95 < 1.5s
```

### 3. Courses list with pagination
```
hey -n 3000 -c 100 https://yourdomain.com/dashboard/courses?page=0
Target: p95 < 1s (SWR cache should kick in)
```

### 4. API rate limit validation
```bash
# Should return 429 after 60 requests in 60s from same IP
for i in {1..65}; do curl -s -o /dev/null -w "%{http_code}\n" https://yourdomain.com/api/admin/courses; done
# Expect: 200 x 60, then 429 x 5
```

### 5. Supabase concurrent connections
```
Monitor in Supabase Dashboard → Database → Connections
Should stay below 80% of plan limit during 10K concurrent test
```

---

## 📊 Success Criteria

| Metric | Target |
|---|---|
| Homepage load (cold) | < 1.2s |
| Dashboard load (warm) | < 800ms |
| Courses/Notes/Videos page | < 1s |
| API p95 response time | < 500ms |
| API error rate at 10K concurrent | < 0.5% |
| Rate limit working | 429 after 60 req/min |
| SWR cache hit on back navigation | 0 network requests |
| DB query time (indexed) | < 50ms |

---

## 🗄️ Supabase Dashboard Checks

1. **Performance** → Slow query log: no query > 200ms
2. **Database** → Connection count: < 80% of limit
3. **Storage** → Confirm CDN is serving files (check response headers for `x-cache`)
4. **Auth** → Confirm email rate limits are set (prevent signup spam)

---

## 🛡️ Security Checks Before Launch

- [ ] RLS enabled on all tables (`website_visits`, `courses`, `students`, etc.)
- [ ] Admin routes return 401/307 for unauthenticated requests
- [ ] API rate limit returns `X-RateLimit-Remaining` header
- [ ] No `SELECT *` without `.range()` on large tables
- [ ] Supabase anon key is NOT a service_role key

---

## 🚀 Deployment Pre-Flight

- [ ] `pnpm run build` exits with code 0
- [ ] All 5 list pages show pagination controls
- [ ] Videos page shows real data (not hardcoded)
- [ ] Admin live viewer refreshes every 30s
- [ ] DB indexes applied (check in Supabase → Table Editor → Indexes)
- [ ] Image optimization enabled (Next.js serves WebP/AVIF)
