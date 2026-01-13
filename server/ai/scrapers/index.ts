// Browserless.io Scrapers Index
// Export all scrapers and their types for easy import

export {
  scrapeLinkedInCompany,
  buildLinkedInCompanyUrl,
  formatLinkedInCompanyData,
  type LinkedInCompanyData,
  type LinkedInCompanyPost,
} from './linkedInCompany.js';

export {
  scrapeLinkedInProfile,
  formatLinkedInProfileData,
  type LinkedInProfileData,
  type LinkedInExperience,
  type LinkedInEducation,
  type LinkedInActivity,
} from './linkedInProfile.js';

export {
  scrapeCompanyJobs,
  formatJobPostingsData,
  type JobPostingsData,
  type JobPosting,
} from './jobPostings.js';

export {
  scrapeCompanyWebsite,
  formatCompanyWebsiteData,
  type CompanyWebsiteData,
  type LeadershipPerson,
} from './companyWebsite.js';
