export interface SkillReq {
  name: string;
  matched: boolean;
}

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'Internship' | 'Full-time' | 'Contract';
  salary: string;
  matchScore: number;
  status: 'applied' | 'eligible' | 'locked';
  employerInterested?: boolean;
  hasInfo?: boolean;
  appliedDate?: string;
  applicationStatus?: string;
  requiredSkills: SkillReq[];
  description: string;
  aboutCompany: string;
  responsibilities: string[];
  qualifications: string[];
  benefits: string[];
  missingSkillsToUnlock?: string[];
  roleTrackId?: string;
}

export const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'Data Analyst Intern',
    company: 'DataCorp Analytics',
    location: 'Remote',
    type: 'Internship',
    salary: '₹4-6 LPA',
    matchScore: 85,
    status: 'applied',
    employerInterested: false,
    appliedDate: 'Jan 25, 2025',
    applicationStatus: 'Under Review',
    requiredSkills: [
      { name: 'SQL', matched: true },
      { name: 'Excel', matched: true },
      { name: 'Python', matched: true }
    ],
    description: 'DataCorp Analytics is seeking a highly motivated Data Analyst Intern to join our business intelligence unit. You will work directly with our engineering and product teams to transform raw event data into actionable operational insights.',
    aboutCompany: 'DataCorp Analytics is a leading data intelligence firm supporting Fortune 500 enterprises with real-time reporting, customer analytics, and ETL pipeline management.',
    responsibilities: [
      'Extract and transform transactional records using PostgreSQL and MySQL queries',
      'Maintain weekly business performance dashboards in Excel and automated Python scripts',
      'Collaborate with product managers to define tracking KPIs for user retention',
      'Assist senior analysts in synthesizing A/B test results into executive summaries'
    ],
    qualifications: [
      'Proficiency in SQL querying (joins, aggregations, CTEs, window functions)',
      'Working knowledge of Python for data manipulation (pandas, numpy)',
      'Advanced spreadsheet modeling skills in MS Excel or Google Sheets',
      'Strong communication and data storytelling aptitude'
    ],
    benefits: [
      'Mentorship from Senior Data Principals',
      'Certificate of Internship Completion & Letter of Recommendation',
      'Full-time PPO (Pre-Placement Offer) conversion based on performance',
      'Flexible remote work hours'
    ],
    roleTrackId: 'data-analyst'
  },
  {
    id: 'opp-2',
    title: 'Junior Data Analyst',
    company: 'Tech Solutions Inc.',
    location: 'Bangalore, India',
    type: 'Full-time',
    salary: '₹6-8 LPA',
    matchScore: 78,
    status: 'eligible',
    employerInterested: true,
    requiredSkills: [
      { name: 'SQL', matched: true },
      { name: 'Python', matched: true },
      { name: 'Tableau', matched: false },
      { name: 'Statistics', matched: false }
    ],
    description: 'Tech Solutions Inc. is looking for an agile Junior Data Analyst to help scale our customer intelligence and marketing attribution platforms. You will query large datasets, build visual reports, and partner across cross-functional squads.',
    aboutCompany: 'Tech Solutions Inc. powers cloud software solutions for thousands of global SaaS companies with cutting-edge telemetry and developer tooling.',
    responsibilities: [
      'Design, build, and maintain production data visual reports and ad-hoc queries',
      'Translate business stakeholder requirements into rigorous technical metrics',
      'Monitor data hygiene, schema updates, and discrepancies in reporting pipelines',
      'Conduct statistical cohort analysis on churn rates and lifetime value (LTV)'
    ],
    qualifications: [
      'Bachelor’s degree in Computer Science, Math, Statistics, or equivalent hands-on certification',
      'Demonstrated competence in SQL joins, indexes, and performance tuning',
      'Basic experience with Tableau or willingness to learn through company sponsorship',
      'Sound grasp of descriptive statistics and hypothesis testing'
    ],
    benefits: [
      'Comprehensive Health & Wellness Insurance',
      'Annual Learning & Certification Allowance (₹50,000/yr)',
      'Hybrid office model with modern campus in Indiranagar, Bangalore',
      'Competitive equity stock options'
    ],
    roleTrackId: 'data-analyst'
  },
  {
    id: 'opp-3',
    title: 'Business Intelligence Analyst',
    company: 'E-commerce Giants',
    location: 'Hyderabad, India',
    type: 'Full-time',
    salary: '₹8-10 LPA',
    matchScore: 72,
    status: 'eligible',
    employerInterested: true,
    requiredSkills: [
      { name: 'SQL', matched: true },
      { name: 'Tableau', matched: false },
      { name: 'Power BI', matched: false },
      { name: 'Excel', matched: true }
    ],
    description: 'Join one of the fastest-growing online marketplaces in Southeast Asia. As a BI Analyst, you will empower category managers with real-time inventory velocity metrics, pricing elasticity models, and vendor fulfillment scorecards.',
    aboutCompany: 'E-commerce Giants connects over 40 million shoppers to verified merchants, delivering lightning-fast order fulfillment and tailored recommendations.',
    responsibilities: [
      'Architect executive KPI dashboards tracking GMV, take-rates, and cart abandonment',
      'Cleanse and model high-throughput telemetry data from web and mobile apps',
      'Partner with supply chain specialists to optimize warehouse replenishment cycles',
      'Automate repetitive SQL extract jobs and schedule alerts for anomalous spikes'
    ],
    qualifications: [
      'Strong foundation in relational database architecture and complex SQL querying',
      'Hands-on experience in Excel modeling (VLOOKUP, INDEX/MATCH, Power Query)',
      'Familiarity with visual dashboard concepts in Power BI or Tableau',
      'Analytical curiosity and comfort working with ambiguous multi-dimensional data'
    ],
    benefits: [
      'Generous employee store discount (25% off all platform purchases)',
      'Catered gourmet meals and transport cab subsidies in HITEC City',
      'Fast-track career advancement reviews every 6 months',
      'Company-matched provident fund & gratuity'
    ],
    roleTrackId: 'business-intelligence-analyst'
  },
  {
    id: 'opp-4',
    title: 'Data Science Intern',
    company: 'AI Research Labs',
    location: 'Pune, India',
    type: 'Internship',
    salary: '₹3-5 LPA',
    matchScore: 68,
    status: 'eligible',
    employerInterested: false,
    requiredSkills: [
      { name: 'Python', matched: true },
      { name: 'SQL', matched: true },
      { name: 'Machine Learning', matched: false },
      { name: 'Statistics', matched: false }
    ],
    description: 'AI Research Labs offers an immersive 6-month internship at the frontier of applied machine learning and data engineering. You will train baseline predictive models, evaluate feature importances, and deploy proof-of-concept inference endpoints.',
    aboutCompany: 'AI Research Labs is an incubation lab focused on generative intelligence, edge-computing computer vision, and NLP applications for healthcare and logistics.',
    responsibilities: [
      'Clean, normalize, and augment multi-source tabular and text datasets',
      'Implement baseline ML algorithms (Random Forests, Gradient Boosting, Logistic Regression)',
      'Track model performance metrics including Precision, Recall, and ROC-AUC curves',
      'Document experimental findings for client engineering presentations'
    ],
    qualifications: [
      'Firm understanding of Python data structures, pandas, and scikit-learn',
      'Solid command of SQL for dataset extraction and preprocessing',
      'Fundamental understanding of linear algebra and probability distributions',
      'Active portfolio of GitHub data science or Kaggle notebook projects'
    ],
    benefits: [
      'Stipend of ₹25,000 - ₹40,000 per month',
      'Access to cloud GPU clusters (A100/H100) for research training',
      'Co-authorship opportunities on whitepapers and conference submissions',
      'Direct mentorship from PhD AI Research Scientists'
    ],
    roleTrackId: 'data-scientist'
  },
  {
    id: 'opp-5',
    title: 'Senior Data Analyst',
    company: 'Finance Plus',
    location: 'Mumbai, India',
    type: 'Full-time',
    salary: '₹12-15 LPA',
    matchScore: 45,
    status: 'locked',
    hasInfo: true,
    employerInterested: false,
    requiredSkills: [
      { name: 'SQL', matched: true },
      { name: 'Python', matched: true },
      { name: 'Tableau', matched: false },
      { name: 'Statistics', matched: false },
      { name: 'Machine Learning', matched: false }
    ],
    description: 'Finance Plus seeks an experienced Senior Data Analyst to lead our credit risk telemetry and anti-fraud surveillance pipeline. Requires mastery of statistical modeling and enterprise Tableau reporting.',
    aboutCompany: 'Finance Plus is a leading fintech non-banking financial company disbursing over ₹10,000 Cr in SME credit across India with digital-first underwriting.',
    responsibilities: [
      'Oversee enterprise data pipelines driving credit underwriting scorecards',
      'Synthesize multi-bureau credit trends and macroeconomic risk indicators',
      'Mentor junior analysts and standardize SQL/Python coding best practices'
    ],
    qualifications: [
      'Minimum 3+ years experience or equivalent advanced master’s track completion',
      'Expertise in Tableau Desktop/Server architecture and complex LOD expressions',
      'Advanced statistical modeling (multivariate regression, survival analysis)'
    ],
    benefits: [
      'Top-of-market base compensation and annual performance bonuses',
      'Executive health checkups and premium family coverage',
      'Relocation assistance to Mumbai BKC tech hub'
    ],
    missingSkillsToUnlock: ['Tableau', 'Statistics', 'Machine Learning'],
    roleTrackId: 'data-analyst'
  },
  {
    id: 'opp-6',
    title: 'Lead Data Analyst',
    company: 'Financial Services Corp',
    location: 'Delhi NCR, India',
    type: 'Full-time',
    salary: '₹15-18 LPA',
    matchScore: 40,
    status: 'locked',
    hasInfo: true,
    employerInterested: false,
    requiredSkills: [
      { name: 'SQL', matched: true },
      { name: 'Python', matched: true },
      { name: 'Machine Learning', matched: false },
      { name: 'Statistics', matched: false },
      { name: 'Leadership', matched: false }
    ],
    description: 'Financial Services Corp is looking for a Lead Data Analyst to spearhead our institutional client analytics practice. You will guide data governance, manage cross-functional analyst squads, and deliver predictive portfolio analytics.',
    aboutCompany: 'Financial Services Corp is a premier wealth management and investment advisory holding company operating across South Asia and the Middle East.',
    responsibilities: [
      'Direct data analytics strategy across retail and institutional trading platforms',
      'Liaise with C-suite executives to present risk exposure and yield optimization models',
      'Implement data governance, role-based access control, and GDPR/RBI compliance'
    ],
    qualifications: [
      'Demonstrated track record leading analytics teams or major enterprise data initiatives',
      'Deep expertise in statistical methods, machine learning pipelines, and SQL optimization',
      'Executive communication skills and strategic project leadership'
    ],
    benefits: [
      'Lucrative incentive bonus scheme and long-term retention grants',
      'Executive mentoring and global leadership summit attendance',
      'Comprehensive family health care and wellness support'
    ],
    missingSkillsToUnlock: ['Machine Learning', 'Statistics', 'Leadership'],
    roleTrackId: 'data-analyst'
  }
];
