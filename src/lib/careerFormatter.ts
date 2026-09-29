export function formatSalaryLPA(min?: bigint | number | null, max?: bigint | number | null): string {
  if (min == null && max == null) return "Competitive";
  if (min != null && max != null) {
    const minLpa = (Number(min) / 100000).toFixed(1);
    const maxLpa = (Number(max) / 100000).toFixed(1);
    return `₹${minLpa} - ₹${maxLpa} LPA`;
  }
  if (min != null) {
    return `₹${(Number(min) / 100000).toFixed(1)}+ LPA`;
  }
  return `Up to ₹${(Number(max) / 100000).toFixed(1)} LPA`;
}

export function formatCareerDetailResponse(career: any) {
  let skills = (career.career_skills || []).map((s: any) => ({
    id: Number(s.id),
    skillName: s.skill_name,
    skillType: s.skill_type || 'REQUIRED',
    displayOrder: s.display_order ?? 0,
  }));

  if (skills.length === 0) {
    skills = [
      { id: 1, skillName: 'Problem Solving', skillType: 'REQUIRED', displayOrder: 0 },
      { id: 2, skillName: 'Data Structures', skillType: 'REQUIRED', displayOrder: 1 },
      { id: 3, skillName: 'System Architecture', skillType: 'REQUIRED', displayOrder: 2 },
      { id: 4, skillName: 'Version Control', skillType: 'REQUIRED', displayOrder: 3 },
    ];
  }

  const responsibilities = (career.career_responsibilities || []).map((r: any) => ({
    id: Number(r.id),
    responsibility: r.responsibility,
    displayOrder: r.display_order ?? 0,
  }));

  let roadmap = (career.career_roadmaps || []).map((rm: any) => ({
    id: Number(rm.id),
    title: rm.title,
    description: rm.description || '',
    duration: rm.duration || '4 weeks',
    displayOrder: rm.display_order ?? 0,
  }));

  if (roadmap.length === 0) {
    roadmap = [
      { id: 1, title: `Foundations of ${career.title}`, description: 'Core principles, foundational concepts, and industry tooling.', duration: '3 weeks', displayOrder: 0 },
      { id: 2, title: 'Applied Skills & Workflows', description: 'Real-world problem solving, workflow automation, and intermediate frameworks.', duration: '4 weeks', displayOrder: 1 },
      { id: 3, title: 'Enterprise Architecture & Projects', description: 'Scalable system integration, testing, and production deployments.', duration: '4 weeks', displayOrder: 2 },
      { id: 4, title: 'Capstone & Certification Defense', description: 'End-to-end industry portfolio project and credential preparation.', duration: '3 weeks', displayOrder: 3 }
    ];
  }

  const projects = (career.career_projects || []).map((p: any) => ({
    id: Number(p.id),
    title: p.title,
    description: p.description || '',
    difficulty: p.difficulty || 'Intermediate',
    technologies: p.technologies || '',
    displayOrder: p.display_order ?? 0,
  }));

  const courses = (career.career_courses || []).map((cc: any) => {
    const c = cc.courses || {};
    return {
      id: Number(cc.id),
      courseId: Number(cc.course_id),
      courseTitle: c.title || 'Course',
      slug: c.slug || '',
      description: c.description || '',
      thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      duration: c.duration || '40 hours',
      level: c.level || 'Beginner',
      rating: c.rating != null ? Number(c.rating) : 4.8,
      learnersCount: c.learners_count || 1200,
      price: c.price != null ? Number(c.price) : 0,
      originalPrice: c.original_price != null ? Number(c.original_price) : Number(c.price || 0),
      discountPercent: c.discount || 0,
      isFree: Boolean(c.is_free),
      displayOrder: cc.display_order ?? 0,
      requiredForCompletion: Boolean(cc.required_for_completion),
      included: Boolean(cc.included),
    };
  });

  const jobOpportunities = (career.career_opportunities || []).map((o: any) => ({
    id: Number(o.id),
    title: o.title,
    company: o.company || '',
    location: o.location || 'Remote / Hybrid',
    type: o.type || 'Full-time',
    salary: o.salary || '₹6 - ₹12 LPA',
    displayOrder: o.display_order ?? 0,
  }));

  const stats = {
    courseCount: courses.length,
    projectCount: projects.length,
    jobCount: jobOpportunities.length,
    skillCount: skills.length,
  };

  const salaryInfo = {
    min: career.salary_min != null ? Number(career.salary_min) : 0,
    max: career.salary_max != null ? Number(career.salary_max) : 0,
    currency: career.salary_currency || 'INR',
    formatted: formatSalaryLPA(career.salary_min, career.salary_max),
  };

  return {
    id: Number(career.id),
    title: career.title,
    slug: career.slug,
    category: career.category,
    description: career.description,
    shortDescription: career.short_description || career.description?.slice(0, 150) || '',
    level: career.level,
    duration: career.duration,
    salary: salaryInfo,
    imageUrl: career.image_url || 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80',
    icon: career.icon || 'BarChart3',
    price: career.price != null ? Number(career.price) : 0,
    originalPrice: career.original_price != null ? Number(career.original_price) : 0,
    discountPercent: career.discount_percent || 0,
    featured: Boolean(career.featured),
    popular: Boolean(career.popular),
    active: Boolean(career.active),
    displayOrder: career.display_order || 0,
    jobOpenings: career.job_openings || '10,000+',
    modulesCount: career.modules_count || 10,
    certificationName: career.certification_name || `Certified ${career.title} Professional`,
    skills,
    responsibilities,
    roadmap,
    projects,
    courses,
    jobOpportunities,
    stats,
    createdAt: career.created_at,
    updatedAt: career.updated_at,
    // Legacy snake_case compatibility
    salary_min: Number(career.salary_min || 0),
    salary_max: Number(career.salary_max || 0),
    salary_currency: career.salary_currency || 'INR',
    image_url: career.image_url,
    short_description: career.short_description,
    job_openings: career.job_openings,
    modules_count: career.modules_count,
    certification_name: career.certification_name,
    career_skills: skills,
    career_responsibilities: responsibilities,
    career_roadmaps: roadmap,
    career_projects: projects,
    career_courses: courses,
    career_opportunities: jobOpportunities,
  };
}
