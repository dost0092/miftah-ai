/**
 * Official knowledge library: the only rule text the AI advisor is allowed to answer from.
 *
 * Each document summarises one official rule or procedure and links the authority that
 * publishes it. Paragraphs become retrieval chunks (`knowledge_chunks` table) for the
 * advisor's search. Pure data so `scripts/db-setup.mts` can seed it with Node.
 *
 * STATUS
 *   verified      checked word-for-word against the linked official text (date in `checked`)
 *   needs_review  written from public announcements; must be checked against the official
 *                 text before launch. The UI shows a "Verify with source" label.
 *   guidance      Miftah AI's own practical guidance (not a rule), built on the documents above.
 */

export type KnowledgeStatus = "verified" | "needs_review" | "guidance";
export type KnowledgeCategory = "ownership" | "tax" | "fees" | "process" | "rental" | "offplan" | "residency" | "land" | "market-data";

export interface KnowledgeDoc {
  id: string;
  title: string;
  titleAr: string;
  category: KnowledgeCategory;
  sourceId: string;
  url: string;
  /** date the underlying rule was published / took effect, if known (ISO) */
  effective: string | null;
  /** date a person last checked this summary against the source (ISO), null if never */
  checked: string | null;
  status: KnowledgeStatus;
  summary: string;
  /** extra search terms, including Arabic, so questions in any language find the document */
  keywords: string[];
  paragraphs: string[];
}

export const KNOWLEDGE_AS_OF = "2026-11-18";

export const knowledgeDocs: KnowledgeDoc[] = [
  {
    id: "non-saudi-ownership-law-2025",
    title: "Law of Real Estate Ownership by Non-Saudis (2025)",
    titleAr: "نظام تملك غير السعوديين للعقار",
    category: "ownership",
    sourceId: "rega",
    url: "https://rega.gov.sa/en",
    effective: "2026-01",
    checked: null,
    status: "needs_review",
    summary: "Non-Saudi individuals and companies may own real estate in geographic zones designated by the authorities, starting with Riyadh and Jeddah. Makkah and Madinah have special restrictions.",
    keywords: ["foreigner", "foreign", "expat", "non-Saudi", "own", "ownership", "buy", "purchase", "zone", "zones", "designated", "Riyadh", "Jeddah", "تملك", "غير السعوديين", "أجنبي", "النطاق الجغرافي"],
    paragraphs: [
      "The Council of Ministers approved a new Law of Real Estate Ownership by Non-Saudis in July 2025. It replaces the earlier law issued by Royal Decree M/15 of 1421H (2000) and took effect in January 2026, after publication in the Umm Al-Qura Gazette.",
      "Under the new law, non-Saudi individuals, non-Saudi companies and other non-Saudi entities may own real estate, or acquire other real rights over it, inside geographic zones that are designated by the authorities. The first zones are in Riyadh and Jeddah. The Real Estate General Authority (REGA) publishes the zones and the executive regulations.",
      "Ownership inside the boundaries of Makkah and Madinah is subject to special, stricter conditions set out in the law and its regulations. A buyer interested in either city must check the specific conditions with REGA before taking any step.",
      "The law allows a fee to be charged on real estate transactions by non-Saudis, capped at a percentage of the property value; the rate that applies is set in the executive regulations. Buyers should confirm the current rate with REGA before budgeting, in addition to the 5% Real Estate Transaction Tax.",
      "The law sets penalties for violations, including fines that can reach SAR 10 million, and property acquired in breach of the law can be ordered sold. Providing false information to acquire property is also a violation.",
      "Practical reading: being a foreigner is not, by itself, a bar to owning property in Saudi Arabia. What matters is where the property is (inside or outside a designated zone, and whether it is in Makkah or Madinah) and the buyer's status (resident, non-resident, company). Every district should be checked against REGA's published zone list.",
    ],
  },
  {
    id: "non-saudi-ownership-previous-law",
    title: "Previous regime: Non-Saudi ownership law of 2000 (M/15)",
    titleAr: "نظام تملك غير السعوديين للعقار واستثماره (م/15)",
    category: "ownership",
    sourceId: "uqn",
    url: "https://uqn.gov.sa",
    effective: "2000-07",
    checked: null,
    status: "needs_review",
    summary: "Before 2026, foreign residents could own a home for their own residence with a licence, and licensed foreign investors could own property for their business. It was replaced by the 2025 law.",
    keywords: ["old law", "previous", "1421", "M/15", "resident", "licence", "permit", "Interior", "نظام قديم"],
    paragraphs: [
      "From 2000 until the new law took effect, the Law of Ownership and Investment of Real Estate by Non-Saudis (Royal Decree M/15 of 17/4/1421H) applied. Non-Saudi residents could own real estate for their private residence with a permit from the Ministry of Interior, and licensed foreign investors could own real estate needed for their licensed activity.",
      "The previous law excluded ownership inside the boundaries of Makkah and Madinah, except through specific inheritance and endowment cases. It has been replaced by the 2025 law. Older articles and broker material that still describe the 2000 rules should be treated as out of date.",
    ],
  },
  {
    id: "premium-residency-property",
    title: "Premium Residency holders and property ownership",
    titleAr: "حاملو الإقامة المميزة وتملك العقار",
    category: "residency",
    sourceId: "sapr",
    url: "https://sapr.gov.sa/en",
    effective: null,
    checked: null,
    status: "needs_review",
    summary: "Saudi Premium Residency holders may own residential, commercial and industrial real estate, with exceptions for Makkah, Madinah and border areas.",
    keywords: ["premium residency", "green card", "iqama", "residency", "الإقامة المميزة", "إقامة"],
    paragraphs: [
      "Holders of Saudi Premium Residency are granted the right to own residential, commercial and industrial real estate in the Kingdom. Ownership inside Makkah, Madinah and border areas is excluded or restricted under specific rules.",
      "Premium Residency also lets the holder live with family, sponsor relatives and run business activities under the applicable regulations. The Premium Residency Center publishes the current products, fees and eligibility.",
    ],
  },
  {
    id: "rett",
    title: "Real Estate Transaction Tax (RETT) 5%",
    titleAr: "ضريبة التصرفات العقارية 5%",
    category: "tax",
    sourceId: "zatca",
    url: "https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/Real-Estate-Transaction-Tax.aspx",
    effective: "2020-10-04",
    checked: null,
    status: "needs_review",
    summary: "A 5% tax on the value of every real estate disposal (sale, transfer of ownership or usufruct), administered by ZATCA and paid before the title is transferred.",
    keywords: ["tax", "RETT", "5%", "transfer tax", "stamp duty", "ZATCA", "disposal", "ضريبة التصرفات العقارية", "ضريبة"],
    paragraphs: [
      "The Real Estate Transaction Tax (RETT) applies at 5% of the value of a real estate disposal: a sale, a transfer of ownership, or the grant of a long-term usufruct right, whether the property is built or land. It took effect on 4 October 2020 and replaced VAT on sales of real estate.",
      "RETT is administered by the Zakat, Tax and Customs Authority (ZATCA). It must be paid before the transfer of title is registered; the notary or Najiz transfer will not complete without proof of payment. By law the seller is responsible for the tax, but buyer and seller may agree in the contract who bears it.",
      "The tax is calculated on the agreed price or the market value, whichever is higher. The regulations list exempt disposals, for example certain transfers between relatives, inheritance and some transfers to government bodies.",
      "Saudi citizens buying their first home benefit from a state-funded exemption on the first SAR 1,000,000 of the price. This first-home benefit does not apply to non-Saudi buyers.",
    ],
  },
  {
    id: "vat-real-estate",
    title: "VAT and real estate (15%)",
    titleAr: "ضريبة القيمة المضافة والعقار",
    category: "tax",
    sourceId: "zatca",
    url: "https://zatca.gov.sa/en/RulesRegulations/Taxes/Pages/default.aspx",
    effective: "2020-07-01",
    checked: null,
    status: "needs_review",
    summary: "The VAT rate is 15%. Sales of real estate are outside VAT (RETT applies instead), residential rent is VAT-exempt, commercial rent and brokerage services carry 15% VAT.",
    keywords: ["VAT", "value added tax", "15%", "commission", "rent", "ضريبة القيمة المضافة"],
    paragraphs: [
      "The standard VAT rate in Saudi Arabia is 15% since 1 July 2020. Since October 2020 the sale of real estate is subject to RETT instead of VAT.",
      "Residential leases are exempt from VAT. Commercial leases are taxed at the standard 15% rate. Brokerage commission is a service and carries 15% VAT on top of the commission amount.",
    ],
  },
  {
    id: "brokerage-law",
    title: "Real Estate Brokerage Law and FAL licences",
    titleAr: "نظام الوساطة العقارية ورخصة فال",
    category: "fees",
    sourceId: "rega",
    url: "https://rega.gov.sa/en",
    effective: "2022",
    checked: null,
    status: "needs_review",
    summary: "Brokers must hold a REGA FAL licence and sign a written brokerage contract. Unless agreed otherwise, the sales commission is 2.5% of the deal value, plus 15% VAT.",
    keywords: ["broker", "agent", "commission", "brokerage", "FAL", "licence", "2.5%", "advertising", "listing", "وسيط", "الوساطة العقارية", "فال", "عمولة"],
    paragraphs: [
      "Real estate brokerage in Saudi Arabia is regulated by the Real Estate Brokerage Law and its executive regulations, supervised by REGA. Anyone acting as a broker, and any real estate advertisement, must hold a valid FAL licence issued through REGA.",
      "Brokerage must be based on a written brokerage contract between the broker and the client. For sales, the broker's commission is 2.5% of the transaction value unless the parties agree otherwise in writing. VAT at 15% is charged on top of the commission.",
      "Real estate advertisements must display the advertising licence number. Buyers can verify a broker's licence on REGA's platforms before signing anything or paying a deposit. Dealing with an unlicensed broker removes the protections of the brokerage law.",
    ],
  },
  {
    id: "title-deeds-registry",
    title: "Title deeds, Najiz and the Real Estate Registry",
    titleAr: "الصكوك العقارية وناجز والسجل العقاري",
    category: "process",
    sourceId: "moj",
    url: "https://najiz.sa",
    effective: null,
    checked: null,
    status: "needs_review",
    summary: "Ownership is proven by an electronic title deed. Transfers happen before a notary or electronically on Najiz; the Real Estate Registry is gradually giving each property a unique registered record.",
    keywords: ["deed", "title", "sak", "sakk", "transfer", "notary", "Najiz", "registry", "registration", "صك", "إفراغ", "ناجز", "السجل العقاري", "كتابة العدل"],
    paragraphs: [
      "Ownership of real estate is evidenced by a title deed (sakk). Deeds are issued and transferred by the Ministry of Justice through notaries and electronically through the Najiz platform. A transfer of ownership is called an 'ifragh'.",
      "Before buying, check that the seller's deed is valid, electronic, in the seller's name, and free of mortgages, attachments or disputes. The deed number can be verified through Najiz services.",
      "The Real Estate Registry, run under REGA, is registering properties area by area, giving each one a unique number with its legal and physical details. Where a property is in a registered area, the registry record becomes the reference for ownership.",
      "The electronic transfer requires both parties (or their legal agents), the deed, proof that RETT has been paid, and, for foreign buyers, confirmation that the purchase is permitted under the non-Saudi ownership rules for that location.",
    ],
  },
  {
    id: "buying-process-foreigner",
    title: "Step-by-step: buying a home as a foreigner",
    titleAr: "خطوات شراء عقار لغير السعودي",
    category: "process",
    sourceId: "rega",
    url: "https://rega.gov.sa/en",
    effective: null,
    checked: null,
    status: "guidance",
    summary: "A practical sequence built on the official rules: check zone, verify broker and deed, budget fees, sign, pay RETT, transfer on Najiz.",
    keywords: ["steps", "process", "how to buy", "checklist", "due diligence", "خطوات", "شراء"],
    paragraphs: [
      "1. Check eligibility and location: confirm the district is inside a zone where non-Saudis may own under the 2025 law, and check any special conditions for your status. Makkah and Madinah follow stricter rules.",
      "2. Use a licensed broker: verify the broker's FAL licence and the advert's licence number with REGA, and sign a written brokerage contract.",
      "3. Verify the property: check the title deed through Najiz (owner name, area, restrictions), and, if the area is covered, the Real Estate Registry record. For off-plan units, check that the project is licensed under Wafi.",
      "4. Budget the full cost: price + 5% RETT + brokerage (2.5% default) + 15% VAT on the brokerage + any non-Saudi transaction fee set by REGA + financing and valuation costs.",
      "5. Sign and pay: sign the sale contract, pay RETT through ZATCA, then complete the electronic transfer of the deed through Najiz or a notary.",
      "6. After purchase: if you rent the property out, register leases on Ejar; if it is in a building with several owners, the owners' association rules (Mullak) apply.",
    ],
  },
  {
    id: "ejar-leases",
    title: "Ejar: registering lease contracts",
    titleAr: "منصة إيجار وتوثيق عقود الإيجار",
    category: "rental",
    sourceId: "ejar",
    url: "https://www.ejar.sa/en",
    effective: null,
    checked: null,
    status: "needs_review",
    summary: "Residential and commercial leases are registered on the Ejar platform. A registered Ejar contract is an enforceable instrument; rent can be paid through Ejar's channels.",
    keywords: ["rent", "lease", "tenant", "landlord", "Ejar", "tenancy", "إيجار", "عقد إيجار", "مستأجر"],
    paragraphs: [
      "Ejar is the national platform for documenting real estate lease contracts. Residential and commercial leases are registered through licensed real estate brokerage offices on Ejar, using the unified lease contract.",
      "A lease registered on Ejar is treated as an enforceable instrument, so unpaid rent can be claimed directly through the enforcement courts. Unregistered leases do not get this protection.",
    ],
  },
  {
    id: "riyadh-rent-freeze-2025",
    title: "Riyadh rent increase freeze (2025)",
    titleAr: "إيقاف زيادة الإيجارات في الرياض",
    category: "rental",
    sourceId: "rega",
    url: "https://rega.gov.sa/en",
    effective: "2025-09-25",
    checked: null,
    status: "needs_review",
    summary: "In September 2025 the authorities froze annual increases in rent for residential and commercial properties within Riyadh's urban boundary for five years.",
    keywords: ["rent freeze", "rent increase", "Riyadh rent", "landlord", "tenant", "تجميد الإيجار", "زيادة الإيجار"],
    paragraphs: [
      "In September 2025 a directive froze annual increases in the rental value of residential and commercial properties inside the urban boundary of Riyadh for five years. REGA supervises the measure and the related rules for renewing contracts through Ejar.",
      "For investors, this means rental income from an existing Riyadh lease should be modelled as flat during the freeze period. Check REGA's current guidance for vacant units and new contracts.",
    ],
  },
  {
    id: "wafi-off-plan",
    title: "Off-plan sales (Wafi)",
    titleAr: "البيع على الخارطة - وافي",
    category: "offplan",
    sourceId: "rega",
    url: "https://rega.gov.sa/en",
    effective: null,
    checked: null,
    status: "needs_review",
    summary: "Developers selling units before completion must hold an off-plan sales licence (Wafi) and collect buyer payments into an escrow account released against construction progress.",
    keywords: ["off-plan", "off plan", "developer", "escrow", "Wafi", "new project", "under construction", "على الخارطة", "وافي", "حساب الضمان"],
    paragraphs: [
      "Selling residential or commercial units off-plan (before completion) requires a licence from the off-plan sales program, known as Wafi, supervised by REGA.",
      "Licensed developers must place buyer payments in a project escrow account. Money is released to the developer in stages tied to certified construction progress, which protects buyers if a project stalls.",
      "Before paying a deposit on an off-plan unit, ask for the Wafi licence number and check it on REGA's platform.",
    ],
  },
  {
    id: "mullak-owners-associations",
    title: "Owners' associations for shared buildings (Mullak)",
    titleAr: "اتحاد الملاك - منصة ملاك",
    category: "process",
    sourceId: "rega",
    url: "https://rega.gov.sa/en",
    effective: null,
    checked: null,
    status: "needs_review",
    summary: "Buildings with units owned by different people are run by an owners' association registered on REGA's Mullak platform, which collects service charges.",
    keywords: ["apartment", "building", "owners association", "service charge", "HOA", "Mullak", "اتحاد الملاك", "ملاك"],
    paragraphs: [
      "When a building or complex has units owned by different people, the owners form an owners' association under the law on ownership of real estate units. Associations are registered and managed through REGA's Mullak platform.",
      "The association maintains common areas and collects a share of the costs from each owner. Apartment buyers should ask whether the association is registered and whether the unit has unpaid service charges.",
    ],
  },
  {
    id: "white-land-fees",
    title: "White land fees on undeveloped urban land",
    titleAr: "رسوم الأراضي البيضاء",
    category: "land",
    sourceId: "momah",
    url: "https://momah.gov.sa/en",
    effective: "2025",
    checked: null,
    status: "needs_review",
    summary: "An annual fee applies to undeveloped land inside urban boundaries. Amendments in 2025 raised the maximum annual rate and extended it to some vacant buildings.",
    keywords: ["land", "plot", "white land", "undeveloped", "vacant", "fee", "أراضي بيضاء", "رسوم"],
    paragraphs: [
      "The White Land Fees system charges an annual fee on undeveloped land inside the urban boundaries of designated cities, to encourage development. It is administered by the Ministry of Municipalities and Housing.",
      "Amendments approved in 2025 raised the maximum annual fee from 2.5% to up to 10% of the land value, depending on the zone, and extended fees to some vacant buildings. Anyone buying land to hold should check whether the plot falls in a fee zone.",
    ],
  },
  {
    id: "market-data-method",
    title: "How Miftah AI market figures are produced",
    titleAr: "منهجية بيانات السوق",
    category: "market-data",
    sourceId: "moj-srem",
    url: "https://srem.moj.gov.sa",
    effective: null,
    checked: null,
    status: "guidance",
    summary: "District prices come from registered MOJ deed transactions, cleaned and aggregated by quarter, cross-checked with REGA indicators. Figures from fewer than 5 deals are hidden.",
    keywords: ["price", "prices", "median", "per square metre", "sqm", "data", "MOJ", "methodology", "how much", "cost", "سعر", "أسعار", "متوسط"],
    paragraphs: [
      "District price figures are built from registered real estate transactions published by the Ministry of Justice (deed transfers), and cross-checked with REGA's real estate indicators.",
      "Records are cleaned (missing prices or areas removed, extreme outliers dropped per district), grouped by district, quarter and property type, and summarised as median price per square metre with the 25th and 75th percentiles. Groups with fewer than 5 deals are not shown.",
      "Every figure carries a 'data until' date. While the official pipeline is being connected, some district figures in the product are illustrative sample values and are labelled as such.",
    ],
  },
];
