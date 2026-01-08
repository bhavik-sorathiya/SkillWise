# 🌐 COMMON PAGES — FINAL & ALIGNED


## 1️⃣ OPPORTUNITY PAGE

**(Full-screen • Single opportunity type • Same view for all roles)**

> Companies post **jobs only**
> Interviewee **and** Interviewer both apply from the same listing
> Role differentiation happens behind the scenes

```
┌──────────────────────────────────────────────────────────┐
│ Logo                     Opportunities            (👤) │
│                                          Profile Avatar │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Opportunities                                          │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Job Title | Company | Location | Type | Action | ▾ │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ Frontend Engineer | ABC Corp | Remote | Full-time  │ │
│  │                          | [ Apply ] | ▾          │ │
│  │ ─────────────────────────────────────────────────  │ │
│  │ Job Description                                    │ │
│  │ • Role overview                                    │ │
│  │ • Responsibilities                                 │ │
│  │ • Required skills                                  │ │
│  │ • Interview process                                 │ │
│  │ • Compensation / Incentives                         │ │
│  │                                                    │ │
│  │ Additional Notes                                   │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ Backend Engineer | XYZ Ltd | Onsite | Full-time   │ │
│  │                          | [ Apply ] | ▾          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 🧠 UX Logic / Advice

* One opportunity type avoids user confusion
* Same listing for all roles = simpler mental model
* Full-screen browsing feels focused and intentional
* Dropdown reveals **all necessary context before applying**
* “Apply” is the only primary action → clarity
* Scales well as listings grow

---

## 2️⃣ PROFILE PAGE

**(For Interviewee, Interviewer, and Company Managers — NOT company entity)**

> Company does **not** have a profile page
> Only **people** have profiles

```
┌──────────────────────────────────────────────────────────┐
│ Logo                                   Profile       (👤)│
│                                          Profile Avatar │
├──────────────────────────────────────────────────────────┤
│ Profile                                                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Profile Picture                                         │
│ ┌──────────────┐  [ Change ]  [ Remove ]               │
│ │              │                                      │
│ │   Avatar     │                                      │
│ │              │                                      │
│ └──────────────┘                                      │
│                                                          │
│ Basic Information                                       │
│ Name | Email | Role                                     │
│                                                          │
│ Detailed Information                                    │
│ • Interviewee → Education, Experience, Skills           │
│ • Interviewer → Expertise, Experience, Availability    │
│ • Company Manager → Designation, Department             │
│                                                          │
│ Account Security                                        │
│ Change Password • Active Sessions                        │
│                                                          │
│ [ Save Changes ]                                        │
└──────────────────────────────────────────────────────────┘
```

### 🧠 UX Logic / Advice

* Profile represents **individual identity**, not organization
* Profile picture adds human trust across interviews
* Role-based sections avoid unnecessary fields
* Company context stays on Company Home, not here
* Central place for personal credibility

---

## 3️⃣ SETTINGS PAGE

**(Relevant, practical, not bloated)**

```
┌──────────────────────────────────────────────────────────┐
│ Logo                                   Settings      (👤)│
│                                          Profile Avatar │
├──────────────────────────────────────────────────────────┤
│ Settings                                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ General Preferences                                     │
│ • Theme (Light / Dark / System)                          │
│ • Language                                              │
│                                                          │
│ Interview Preferences                                   │
│ • Default interview mode (Video/mic - on/off)                 │
│ • Join reminders                                   │
│                                                          │
│ Privacy & Security                                      │
│ • Change password                                       │
│ • Manage active sessions                                │
│                                                          │
│ Communication                                           │
│ • Email notifications (on/off)                          │
│ • Interview reminders (on/off)                          │
│                                                          │
│ [ Update Settings ]                                     │
└──────────────────────────────────────────────────────────┘
```

### 🧠 UX Logic / Advice

* Settings affect **experience**, not data
* Interview preferences save repeated decisions
* Privacy & communication grouped logically
* Keeps support issues low
* Avoids overlap with Profile page

---

## 4️⃣ HELP & SUPPORT PAGE

**(Expandable FAQs, not a static wall of text)**

```
┌──────────────────────────────────────────────────────────┐
│ Help & Support                                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Frequently Asked Questions                              │
│                                                          │
│ ▸ How do I apply for an opportunity?                    │
│ ▾ How do interviews work on this platform?              │
│   • Apply → Schedule → Interview → Review               │
│                                                          │
│ ▸ How can I join a live interview?                      │
│ ▸ Can I reschedule an interview?                        │
│ ▸ How are interview scores calculated?                  │
│                                                          │
│ Need more help?                                         │
│ • Contact support@yourapp.com                            │
│                                                          │
│ Legal                                                   │
│ • Terms of Service                                      │
│ • Privacy Policy                                        │
└──────────────────────────────────────────────────────────┘
```

### 🧠 UX Logic / Advice

* Dropdown FAQs reduce cognitive load
* Answers focus on **flows**, not features
* Progressive disclosure keeps page light
* Contact option is visible but not dominant
* Suitable for MVP → v1.0

---
