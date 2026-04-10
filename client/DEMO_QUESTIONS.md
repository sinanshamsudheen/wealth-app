# Invictus AI Copilot — Demo Questions & Flow

The AI copilot is powered by Claude 4.5 Haiku / GPT-4o / GPT-5 Chat with a real knowledge base spanning 6 modules: CRM, Deals, Risk & Planning, Data Aggregation & Reporting, Insights, and Client Portal. It also has live web search via Tavily for market news and geopolitical context.

---

## Recommended Demo Flow (8-10 min)

### Act 1: Advisor's Morning Brief (Insights Home — 2 min)

Navigate to **Invictus AI > Home** (`/insights`). Walk through the dashboard briefly, then open the copilot.

**Q1 — Morning overview:**
```
What are my priorities today? Give me a summary of alerts, action items, and meetings across all my clients.
```
> Modules: Insights, CRM
> Shows: 4 portfolio alerts (including critical Noor Holdings margin call), 4 action items split by client vs internal, 3 meetings today, 2 personal touches

**Q2 — Drill into alerts:**
```
Tell me about the portfolio alerts. What's critical and what actions should I take?
```
> Modules: Insights, Risk & Planning
> Shows: Noor Holdings margin call at 112% (critical), Al-Rashidi PE drift, Fed rate impact on fixed income, George Smith overallocation

**Q3 — News impact:**
```
What news alerts do we have and which clients are affected?
```
> Modules: Insights
> Shows: Fed rate change (Al-Rashidi & Saqib families — fixed income overweight), Apollo exit delay (Hamdan Trust & Meridian Capital — distribution timelines)

---

### Act 2: Preparing for the Al-Rashidi Meeting (2 min)

Stay on Insights Home. The 09:30 meeting with Al-Rashidi is coming up.

**Q4 — Meeting prep:**
```
Brief me on my 9:30 meeting with Al-Rashidi Family. What should I prepare?
```
> Modules: Insights, CRM, Risk & Planning
> Shows: Quarterly update + KYC discussion, pending tasks (KYC renewal, cash flow), portfolio drift in PE, attendees (RN, AA, SC)

**Q5 — Client deep dive:**
```
Give me a full overview of the Al-Rashidi Family — net worth, portfolio, risk profile, and any pending tasks.
```
> Modules: Client Portal, CRM, Risk & Planning, Data Aggregation
> Shows: $640M net worth, $875M assets, Moderate risk, 80% illiquid, family affiliations, KYC renewal overdue, Sharpe ratio 1.286

**Q6 — Compliance follow-up:**
```
What's the status of the Al-Rashidi KYC renewal? Who's responsible?
```
> Modules: CRM, Insights
> Shows: Missing documentation, assigned to Mathilde Le Floch, due today, compliance escalation, IPS document sent for sign-off

---

### Act 3: Geopolitical & Market Context — Web Search (2 min)

This is where the copilot goes beyond internal data using Tavily web search.

**Q7 — Geopolitical impact:**
```
What is the latest news about Iran and US tensions in the MENA region?
```
> Modules: Web Search
> Shows: Live web results on MENA geopolitics, regional stability news

**Q8 — Client impact analysis (follow-up):**
```
How could this affect or benefit the Al-Rashidi family portfolio?
```
> Modules: Risk & Planning, Data Aggregation, Client Portal (context from previous answer)
> Shows: Cross-references Al-Rashidi's allocation (25.34% RE, 18.83% Infrastructure, Gulf exposure) with geopolitical risk. Discusses impact on GCC investments, infrastructure spend, and currency exposure (75% AED)

**Q9 — Sector research:**
```
What's the latest news on GCC real estate markets? How will it affect Al-Rashidi?
```
> Modules: Web Search + Risk & Planning + Data Aggregation
> Shows: Live GCC RE market data, cross-referenced with Al-Rashidi's 25.34% Real Estate allocation (Opportunistic RE) and the portfolio drift alert

---

### Act 4: Institutional Memory — Jahez Stock Drop (2 min)

Stay on Insights Home. The Jahez news alert is visible on the dashboard.

**Q10 — News alert:**
```
What's the Jahez news alert about? Which clients are affected?
```
> Modules: Insights
> Shows: Jahez (4162) dropped to SAR 11.08, all-time low since IPO at SAR 42.5 (Oct 2021). Al-Rashidi Family holds ~20% of public equity in Jahez — ~74% decline.

**Q11 — Cross-module institutional memory (KEY DEMO MOMENT):**
```
Why is the Al-Rashidi Family over-exposed to Jahez? What was the rationale and when did we make the decision to hold?
```
> Modules: CRM, Data Aggregation, Deals (all three triggered)
> Shows: The copilot synthesizes from:
> - CRM/Engage: Client relationship, meeting history entry for Oct 2022 IC meeting
> - Data Aggregation: Jahez as a holding — 20% of public equity, entry at SAR 42.5, current SAR 11.08, -74% unrealized loss
> - Deals (meeting minutes): IC meeting Oct 15, 2022 — Saqib, Husnayin Muhammed, Ahmed Hassan, Usman Latheef, Raoof. Decision to retain because Al-Rashidi family was founding investor at IPO, personal relationship with Jahez founders, strategic long-term hold. Annual review cadence agreed.

**Q12 — Action recommendation (follow-up):**
```
What should we do about the Jahez position? Should we rebalance?
```
> Modules: Risk & Planning, Data Aggregation, CRM (context from previous)
> Shows: Rebalancing recommendation considering the 74% decline, the sentimental/strategic dimension, upcoming client meeting, and risk profile

---

### Act 5: Deal Intelligence (2 min)

Navigate to the **Meeting Brief** for Al-Rashidi (click "Meeting brief" link on the 09:30 meeting). Open the copilot.

**Q13 — Deal overview:**
```
Tell me about the GreenGrid Energy deal. What are the key metrics?
```
> Modules: Deals
> Shows: $40M round, $20M raised, $1B valuation, 15-20% IRR, 2-3x MOIC, 6-7 year hold, closing April 30

**Q14 — Suitability analysis (follow-up):**
```
Is GreenGrid Energy a good fit for Al-Rashidi given their risk profile and current allocation?
```
> Modules: Deals, Risk & Planning, Client Portal
> Shows: Cross-references deal (renewable energy, infrastructure, Saudi/UAE focus) with Al-Rashidi's Moderate risk profile, 18.83% infrastructure allocation, and regional exposure. Highlights alignment with IPS constraints

**Q15 — Investment pipeline:**
```
What other deals are in the pipeline? What's the commitment status across all opportunities?
```
> Modules: Client Portal
> Shows: 12 pipeline opportunities — 2 Commitment Accepted, 2 Commitment Sent, 5 Under Review, 2 New, 1 Rejected. Upcoming deadlines highlighted

---

### Act 6: Performance & Personal Touch (1 min)

**Q16 — Portfolio performance:**
```
How are Al-Rashidi's returns and distributions performing? How does TWRR compare to benchmark?
```
> Modules: Data Aggregation
> Shows: Total returns $0.85M (+82.35%), TWRR at 26% vs benchmark 10%, 8 exits, $0.55M deployed across 9 investments

**Q17 — Personal touch:**
```
Any client birthdays or anniversaries coming up this week?
```
> Modules: Insights, CRM
> Shows: Ahmed Al-Rashidi birthday tomorrow (personal outreach opportunity), Meridian Capital 3-year anniversary this week

**Q18 — Wrap-up action:**
```
Summarize the key talking points I should cover in my 9:30 Al-Rashidi meeting.
```
> Modules: All (contextual follow-up using full conversation history)
> Shows: Synthesized talking points covering KYC renewal, PE allocation drift, Fed rate impact on fixed income, GreenGrid opportunity, Ahmed's birthday, capital flow review

---

## Additional Demo Questions (by category)

### Client Portal & Net Worth
```
What's the Al-Rashidi net worth breakdown? How much is managed by WATAR vs externally?
```
> Shows: $640M net worth, $375M WATAR-managed, $112M external, $153M unmanaged

```
What's the geographic distribution of Al-Rashidi's assets?
```
> Shows: APAC 40%, EMEA 25%, AMER 20%, Others 15%

### Risk & Allocation
```
What's Al-Rashidi's liquidity profile? How much is illiquid?
```
> Shows: 80% illiquid / 20% liquid (Risk & Planning), 55% liquid / 45% illiquid (Client Portal — different measurement basis)

```
What are the risk metrics — Sharpe ratio, expected return, standard deviation?
```
> Shows: 14.73% expected return, 11.45 std dev, 1.286 Sharpe ratio

### Family & CRM
```
Who are the family members and what are their roles in the Al-Rashidi account?
```
> Shows: Saqib (principal), Naia (wife, Limited POA), Abdulrafay (son, dependent), Fatima (daughter, dependent), Al Rashidi Holding Co. (Trust, 3 owners)

### Data Aggregation
```
What's the capital call status and how much has been distributed this year?
```
> Shows: Capital calls $0.23M (15% above expectation), distributions $0.275M (-18.91%), deployment breakdown (PE 45%, RE 33%, Hedge 22%)

---

## Tips for the Demo

- **Source links are clickable** — point them out in responses. They link back to the actual platform modules (CRM, Deals, Risk & Planning, etc.)
- **Conversation history persists** — follow-up questions use full context, so "How does this affect Al-Rashidi?" works after asking about news
- **Web search activates automatically** — questions about markets, geopolitics, or current events trigger Tavily search (shown as "Searching the web..." tool call)
- **Switch models live** — use the model selector to switch between Claude 4.5 Haiku, Claude Sonnet 4.6, GPT-4o, or GPT-5 Chat mid-conversation
- **Tool calls animate** — each query shows which modules are being fetched (Insights, CRM, Risk & Planning, Web Search, etc.)
