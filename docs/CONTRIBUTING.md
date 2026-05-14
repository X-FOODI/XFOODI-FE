# 🤝 Contribution Guidelines

Thank you for deciding to contribute to the FoodX Frontend project. Please study these rules attentively before creating any respective branches and pushing code to the ecosystem.

---

## 📌 Must Follow (Global Rules)

1. **Dual-Theme Support**: Whenever you initiate or edit a **Screen/Component UI**, you unconditionally MUST ensure both **Dark Mode** and **Light Mode** function accurately and remain graphically sharp.
   - ⚠️ *Avoid Hardcoding static hex/rgb values directly* (`#FFFFFF`, `#000000`)
   - ✅ *Tailwind/AntD/MUI Tokens*: Prioritize semantic color palettes so components will seamlessly auto-adjust.
2. **Type Safety & No Any**: Absolutely do not compromise code stability with TypeScript `any`. All function parameters and payloads fetching APIs need to be solidly typed.
3. **Lint Verification**: Execute `npm run check` immediately prior to establishing a Pull Request to organically eradicate all Typescript Warnings.

---

## 1️⃣ Branching Rules

The Branch naming sequence ought to contain the **software engineer's name (username)** targeting convenient team tracking.
**Standard Format Blueprint**: `<type>/<username>/<short-description>`

| Type | Intended Purpose |
|---|---|
| `feature/` | Developing brand new features/Specialized Pages/Layout Screens |
| `bugfix/` | Resolving a validated bug historically logged in the Jira/Bug issue tracker |
| `hotfix/` | Critical urgent live patching targeted directly toward the Production branch |
| `refactor/` | Overhauling or formatting internal structural code without altering logic |
| `chore/` | Updating external config files, upgrading third-party libraries, tracking DevOps tasks |
| `docs/` | Supplementing external Documentations (README files, API mapping definitions) |

---

## 2️⃣ Commit Message Regulations

FoodX aggressively implements the internationally recognized **[Conventional Commits](https://www.conventionalcommits.org/)** structural standard:
`<type>(scope): short description`

| Type | Operational Meaning |
|---|---|
| `feat` | Adding a new feature (specifically aligns safely with feature branches) |
| `fix` | Code bug debugging resolution |
| `refactor` | Implementing safe code restructuring sequences |
| `docs` | Adjustments directly to `.md` documentation markdown files |

---

## 3️⃣ Pull Request (PR) Operational Workflow

1. **1 Branch = 1 Target Goal**: Formulate your PR to directly correspond and rectify the sole problem categorized globally within the branch description.
2. Construct PR titles that distinctively summarize the exact code behavioral modifications.
3. Always implement `rebase` to sequentially fetch the newest commits deployed in `develop` for inspection and to intercept any arising logical conflicts. Smoothly resolve out those conflicting errors securely prior to finally submitting.
4. Each PR definitively requires at smallest **1 Core Head Member to explicitly Approve**.
5. **ABSOLUTELY PROHIBITED: Implementing git push bypass flags or directly sending unreviewed explicit manual commits to the central `develop` alongside the absolute `main/master` branches.**
