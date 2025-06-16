"use client";

import React, { useState } from "react";
import { Wrench, Linkedin, Mail, MapPin, User, Building2, Search, Users, Activity, Crown } from "lucide-react";
import { api } from "~/trpc/react";

// Define the structure for a tool
interface Tool {
  id: 'person-details' | 'account-details' | 'ai-research' | 'discover-persons' | 'person-activities' | 'account-activities' | 'account-top-users';
  name: string;
  description: string;
  inputs: ('email' | 'domain' | 'title' | 'seniority' | 'country')[];
  icon: any;
  category: 'Person' | 'Account';
}

// A list of available tools
const availableTools: Tool[] = [
  {
    id: 'person-details',
    name: 'Get Person Details',
    description: 'Enriched contact info and scoring',
    inputs: ['email'],
    icon: User,
    category: 'Person',
  },
  {
    id: 'account-details',
    name: 'Get Account Details',
    description: 'Company firmographics and scoring',
    inputs: ['domain'],
    icon: Building2,
    category: 'Account',
  },
  {
    id: 'ai-research',
    name: 'AI Account Research',
    description: 'Recent news and insights',
    inputs: ['domain'],
    icon: Search,
    category: 'Account',
  },
  {
    id: 'discover-persons',
    name: 'Discover Persons',
    description: 'Find new prospects by criteria',
    inputs: ['domain', 'title', 'seniority', 'country'],
    icon: Users,
    category: 'Person',
  },
  {
    id: 'person-activities',
    name: 'Get Person Activities',
    description: 'Activity timeline for person',
    inputs: ['email'],
    icon: Activity,
    category: 'Person',
  },
  {
    id: 'account-activities',
    name: 'Get Account Activities',
    description: 'Activity timeline for account',
    inputs: ['domain'],
    icon: Activity,
    category: 'Account',
  },
  {
    id: 'account-top-users',
    name: 'Get Account Top Users',
    description: 'Key contacts at company',
    inputs: ['domain'],
    icon: Crown,
    category: 'Account',
  },
];

export default function ApiTester() {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(availableTools[0] ?? null);
  const [email, setEmail] = useState("francis@madkudu.com");
  const [domain, setDomain] = useState("madkudu.com");
  const [title, setTitle] = useState("");
  const [seniority, setSeniority] = useState("");
  const [country, setCountry] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"formatted" | "raw">("formatted");

  // tRPC hooks
  const lookupPersonMutation = api.madkudu.lookupPerson.useMutation();
  const lookupAccountMutation = api.madkudu.lookupAccount.useMutation();
  const getPersonDetailsMutation = api.madkudu.getPersonDetails.useMutation();
  const getAccountDetailsMutation = api.madkudu.getAccountDetails.useMutation();
  const getAIResearchMutation = api.madkudu.getAIResearch.useMutation();
  const discoverPersonsMutation = api.madkudu.discoverPersons.useMutation();
  const getPersonActivitiesMutation = api.madkudu.getPersonActivities.useMutation();
  const getAccountActivitiesMutation = api.madkudu.getAccountActivities.useMutation();
  const getAccountTopUsersMutation = api.madkudu.getAccountTopUsers.useMutation();

  const handleSelectTool = (tool: Tool) => {
    setSelectedTool(tool);
    setResult(null);
    setError(null);
    // Clear discover persons specific fields when switching tools
    if (tool.id !== 'discover-persons') {
      setTitle("");
      setSeniority("");
      setCountry("");
    }
  };

  const handleRunTool = async () => {
    if (!selectedTool) return;

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      let response;
      if (selectedTool.id === 'person-details') {
        response = await getPersonDetailsMutation.mutateAsync({ email });
      } else if (selectedTool.id === 'account-details') {
        response = await getAccountDetailsMutation.mutateAsync({ domain });
      } else if (selectedTool.id === 'ai-research') {
        response = await getAIResearchMutation.mutateAsync({ domain });
      } else if (selectedTool.id === 'discover-persons') {
        // Build parameters object, only including non-empty values
        const params: any = { provider: 'apollo' }; // default provider
        if (domain) params.company_domain = domain;
        if (title) params.title = title;
        if (seniority) params.seniority = seniority;
        if (country) params.country = country;
        
        response = await discoverPersonsMutation.mutateAsync(params);
      } else if (selectedTool.id === 'person-activities') {
        response = await getPersonActivitiesMutation.mutateAsync({ email });
      } else if (selectedTool.id === 'account-activities') {
        response = await getAccountActivitiesMutation.mutateAsync({ domain });
      } else if (selectedTool.id === 'account-top-users') {
        response = await getAccountTopUsersMutation.mutateAsync({ domain });
      }
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Group tools by category
  const toolsByCategory = availableTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category]!.push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  // --- Formatted Result Renderers ---

    const renderFormattedPersonDetails = () => {
    if (!result) return <p className="text-gray-400">No results yet</p>;

    // Handle error responses
    if (result?.error) {
      return (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400 text-lg">⚠️</span>
            <h3 className="text-yellow-400 font-medium text-sm">Person Lookup Issue</h3>
          </div>
          <p className="text-yellow-300 text-xs mb-2">{result.message}</p>
          <p className="text-yellow-200 text-xs">{result.suggestion}</p>
        </div>
      );
    }

    // Handle enriched person data fallback
    let person = result?.person ?? (Array.isArray(result) && result.length > 0 ? result[0] : result) ?? {};
    let showEnrichmentNotice = false;
    
    if (result?.enriched && result?.person) {
      person = result.person;
      showEnrichmentNotice = true;
    }

    if (!person || Object.keys(person).length === 0) {
      return <p className="text-gray-400">Person not found or empty response.</p>;
    }

    // Extract person data from new payload structure
    const displayName = person.name || [person.first_name, person.last_name].filter(Boolean).join(' ') || "Unknown";
    const title = person.title;
    const email = person.email;
    const avatar = person.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
    const companyDomain = person.company_domain;
    const activities = person.activities || 0;
    
    // Location from nested object
    const location = person.location ? 
      [person.location.city, person.location.state, person.location.country].filter(Boolean).join(', ') : '';
    
    // Social links from nested object
    const linkedinHandle = person.socials?.linkedin_handle;
    const twitterHandle = person.socials?.twitter_handle;
    const crunchbaseHandle = person.socials?.crunchbase_handle;
    const website = person.socials?.website;
    
    // Scoring data
    const customerFit = person.customer_fit;
    const likelihoodToBuy = person.likelihood_to_buy;

    return (
      <div className="space-y-4">
        {showEnrichmentNotice && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-400 text-sm">ℹ️</span>
              <h3 className="text-blue-400 font-medium text-xs">Using Person Lookup Data</h3>
            </div>
            <p className="text-blue-300 text-xs">{result.message}</p>
          </div>
        )}
        
        <div className="bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-4 shadow-2xl">
          {/* Header with Avatar */}
          <div className="flex items-center gap-3 mb-4">
            <img 
              src={avatar} 
              alt={displayName}
              className="w-12 h-12 rounded-full border-2 border-zinc-600 bg-zinc-700 object-cover flex-shrink-0"
            />
            
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{displayName}</h2>
              {title && <p className="text-blue-400 text-sm">{title}</p>}
              {companyDomain && (
                <p className="text-zinc-400 text-xs">@{companyDomain}</p>
              )}
            </div>
            
            {/* Social Links as Clickable Logos */}
            <div className="flex items-center gap-2">
              {linkedinHandle && (
                <a 
                  href={`https://linkedin.com/in/${linkedinHandle}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  title="LinkedIn Profile"
                >
                  <Linkedin size={16} />
                </a>
              )}
              {twitterHandle && (
                <a 
                  href={`https://twitter.com/${twitterHandle}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  title="Twitter Profile"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              )}
              {website && (
                <a 
                  href={website}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-zinc-300 transition-colors"
                  title="Website"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="m8 12a8 8 0 0 0 8 0"/>
                    <path d="m8 12a8 8 0 0 1 8 0"/>
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Contact Information - Compact Grid */}
          <div className="grid grid-cols-1 gap-2">
            {email && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
                <Mail size={14} className="text-zinc-400 flex-shrink-0" />
                <span className="text-zinc-300 text-sm truncate">{email}</span>
              </div>
            )}
            
            {location && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
                <MapPin size={14} className="text-zinc-400 flex-shrink-0" />
                <span className="text-zinc-300 text-sm">{location}</span>
              </div>
            )}
            
            {activities > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 flex-shrink-0">
                  <path d="M12 20v-6M6 20V10M18 20V4"/>
                </svg>
                <span className="text-zinc-300 text-sm">{activities.toLocaleString()} activities</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderFormattedAccountDetails = () => {
    if (!result) return <p className="text-gray-400">No results yet</p>;

    // Handle error responses
    if (result?.error) {
      return (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400 text-lg">⚠️</span>
            <h3 className="text-yellow-400 font-medium text-sm">Account Lookup Issue</h3>
          </div>
          <p className="text-yellow-300 text-xs mb-2">{result.message}</p>
          <p className="text-yellow-200 text-xs">{result.suggestion}</p>
        </div>
      );
    }

    // Handle enriched account data fallback
    let account = result?.account ?? result?.company ?? (Array.isArray(result) && result.length > 0 ? result[0] : result) ?? {};
    let showEnrichmentNotice = false;
    
    if (result?.enriched && result?.account) {
      account = result.account;
      showEnrichmentNotice = true;
    }
    
    if (!account || Object.keys(account).length === 0) {
      return <p className="text-gray-400">Account not found or empty response.</p>;
    }
    
    const defaultLogo = "https://cdn-icons-png.flaticon.com/512/3281/3281315.png";
    const logo = account.logo ?? defaultLogo;
    const companyName = account.name ?? "Unknown Company";
    const industry = account.industry ?? "No industry provided";
    const domain = account.domain;
    const location = [account.location?.city, account.location?.state, account.location?.country].filter(Boolean).join(', ');
    const companySize = account.employees_count;
    const founded = account.founded_year;
    const raisedAmount = account.raised_amount;
    const description = account.description;
    
    // Social links
    const linkedinHandle = account.socials?.linkedin_handle;
    const twitterHandle = account.socials?.twitter_handle;
    const crunchbaseHandle = account.socials?.crunchbase_handle;
    const website = account.socials?.website;

    return (
      <div className="space-y-4">
        {showEnrichmentNotice && (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-400 text-sm">ℹ️</span>
              <h3 className="text-blue-400 font-medium text-xs">Using Account Lookup Data</h3>
            </div>
            <p className="text-blue-300 text-xs">{result.message}</p>
          </div>
        )}
        
        <div className="bg-zinc-800/90 backdrop-blur-sm border border-zinc-700/50 rounded-xl p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <img 
            src={logo} 
            alt={`${companyName} logo`}
            className="w-12 h-12 rounded-lg bg-white/10 p-2 object-contain flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">{companyName}</h2>
            <p className="text-blue-400 text-sm">{industry}</p>
            {domain && <p className="text-zinc-400 text-xs">{domain}</p>}
          </div>
          
          {/* Social Links */}
          <div className="flex items-center gap-2">
            {linkedinHandle && (
              <a 
                href={`https://linkedin.com/company/${linkedinHandle}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
                title="LinkedIn Profile"
              >
                <Linkedin size={16} />
              </a>
            )}
            {twitterHandle && (
              <a 
                href={`https://twitter.com/${twitterHandle}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
                title="Twitter Profile"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            )}
                         {website && (
               <a 
                 href={website}
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-zinc-400 hover:text-zinc-300 transition-colors"
                 title="Website"
               >
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                   <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                 </svg>
               </a>
             )}
             {crunchbaseHandle && (
               <a 
                 href={`https://crunchbase.com/${crunchbaseHandle}`}
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-blue-500 hover:text-blue-400 transition-colors"
                 title="Crunchbase Profile"
               >
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M21.6 12c0 5.3-4.3 9.6-9.6 9.6S2.4 17.3 2.4 12 6.7 2.4 12 2.4s9.6 4.3 9.6 9.6zM8.4 8.1v7.8c0 .3.2.5.5.5h1.5c.3 0 .5-.2.5-.5v-3h1.8c2.1 0 3.8-1.7 3.8-3.8S14.8 5.3 12.7 5.3H8.9c-.3 0-.5.2-.5.5v2.3zm3-1.8h1.3c.7 0 1.3.6 1.3 1.3s-.6 1.3-1.3 1.3h-1.3V6.3z"/>
                 </svg>
               </a>
             )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {location && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
              <MapPin size={14} className="text-zinc-400 flex-shrink-0" />
              <span className="text-zinc-300 text-sm truncate">{location}</span>
            </div>
          )}
          
          {companySize && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
              <Users size={14} className="text-zinc-400 flex-shrink-0" />
              <span className="text-zinc-300 text-sm">{companySize} employees</span>
            </div>
          )}
          
          {founded && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
              <Building2 size={14} className="text-zinc-400 flex-shrink-0" />
              <span className="text-zinc-300 text-sm">Founded {founded}</span>
            </div>
          )}
          
          {raisedAmount && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 flex-shrink-0">
                <circle cx="12" cy="12" r="10"/>
                <path d="M16 8l-4 4-4-4"/>
              </svg>
              <span className="text-zinc-300 text-sm">${(raisedAmount / 1000000).toFixed(1)}M raised</span>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-zinc-300 text-sm leading-relaxed line-clamp-3">{description}</p>
          </div>
        )}
        </div>
      </div>
    );
  };

  const renderFormattedResearch = () => {
    if (!result || !Array.isArray(result) || result.length === 0) {
      return <p className="text-gray-400">No research results found.</p>;
    }

    return (
      <div className="space-y-4">
        {result.map((item, index) => (
          <div key={index} className="bg-zinc-900/50 p-4 rounded-lg">
            <h3 className="font-bold text-lg text-white mb-2">{item.title}</h3>
            <p className="text-zinc-300 mb-2">{item.content}</p>
            {item.url && (
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:underline text-sm"
              >
                Read more →
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderFormattedPersonActivities = () => {
    // Handle error responses
    if (result?.error) {
      return (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400 text-lg">⚠️</span>
            <h3 className="text-yellow-400 font-medium text-sm">Endpoint Not Available</h3>
          </div>
          <p className="text-yellow-300 text-xs mb-2">{result.message}</p>
          <p className="text-yellow-200 text-xs">{result.suggestion}</p>
        </div>
      );
    }

    if (!result?.data || !Array.isArray(result.data) || result.data.length === 0) {
      return <p className="text-gray-400">No activities found.</p>;
    }

    // Group activities by date for better organization
    const groupedActivities = result.data.reduce((groups: any, activity: any) => {
      const date = new Date(activity.event_timestamp).toDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(activity);
      return groups;
    }, {});

    const getActivityIcon = (eventType: string) => {
      const type = eventType.toLowerCase();
      if (type.includes('email')) return '📧';
      if (type.includes('click') || type.includes('link')) return '🔗';
      if (type.includes('page') || type.includes('visit')) return '👁️';
      if (type.includes('download')) return '⬇️';
      if (type.includes('form') || type.includes('submit')) return '📝';
      if (type.includes('login') || type.includes('signup')) return '🔐';
      return '📊';
    };

    const getActivityColor = (eventType: string) => {
      const type = eventType.toLowerCase();
      if (type.includes('email')) return 'text-blue-400';
      if (type.includes('click') || type.includes('link')) return 'text-purple-400';
      if (type.includes('page') || type.includes('visit')) return 'text-green-400';
      if (type.includes('download')) return 'text-orange-400';
      if (type.includes('form') || type.includes('submit')) return 'text-yellow-400';
      if (type.includes('login') || type.includes('signup')) return 'text-red-400';
      return 'text-zinc-400';
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium text-sm">
            {result.data.length} activit{result.data.length !== 1 ? 'ies' : 'y'} found
          </h3>
          {result.pagination && (
            <span className="text-white/60 text-xs">
              Page {result.pagination.page || 1}
            </span>
          )}
        </div>

        {Object.entries(groupedActivities).map(([date, activities]: [string, any]) => (
          <div key={date} className="space-y-2">
            <div className="text-white/80 text-xs font-medium uppercase tracking-wide border-b border-white/10 pb-1">
              {date}
            </div>
            {activities.map((activity: any, index: number) => (
              <div key={activity.id || index} className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700/50 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <div className="text-lg flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.event || activity.event_display || '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`font-medium text-sm ${getActivityColor(activity.event || activity.event_display || '')}`}>
                        {activity.event_display || activity.event || 'Unknown Activity'}
                      </h4>
                      <span className="text-white/50 text-xs whitespace-nowrap">
                        {new Date(activity.event_timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {activity.properties && (
                      <div className="space-y-1">
                        {activity.properties.page_url && (
                          <p className="text-white/70 text-xs truncate">
                            <span className="text-white/50">URL:</span> {activity.properties.page_url}
                          </p>
                        )}
                        {activity.properties.page_title && (
                          <p className="text-white/70 text-xs truncate">
                            <span className="text-white/50">Page:</span> {activity.properties.page_title}
                          </p>
                        )}
                        {activity.properties.email_subject && (
                          <p className="text-white/70 text-xs truncate">
                            <span className="text-white/50">Subject:</span> {activity.properties.email_subject}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderFormattedAccountActivities = () => {
    if (!result || !Array.isArray(result) || result.length === 0) {
      return <p className="text-gray-400">No activities found.</p>;
    }

    return (
      <div className="space-y-4">
        {result.map((activity, index) => (
          <div key={index} className="bg-zinc-900/50 p-4 rounded-lg">
            <h3 className="font-bold text-lg text-white">{activity.event_display}</h3>
            <p className="text-zinc-400">{new Date(activity.event_timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderFormattedAccountTopUsers = () => {
    if (!result || !Array.isArray(result) || result.length === 0) {
      return <p className="text-gray-400">No users found.</p>;
    }

    return (
      <div className="space-y-4">
        {result.map((user, index) => (
          <div key={index} className="bg-zinc-900/50 p-4 rounded-lg">
            <h3 className="font-bold text-lg text-white">{user.name}</h3>
            <p className="text-blue-400">{user.title}</p>
            <p className="text-zinc-400">{user.email}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderFormattedDiscoverPersons = () => {
    if (!result?.data || !Array.isArray(result.data) || result.data.length === 0) {
      return <p className="text-gray-400">No prospects found.</p>;
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium text-sm">Found {result.data.length} contact{result.data.length !== 1 ? 's' : ''}</h3>
          {result.pagination && (
            <span className="text-white/60 text-xs">
              Page {result.pagination.page || 1}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2">
          {result.data.map((person: any, index: number) => (
            <div key={person.id || index} className="bg-zinc-800/60 backdrop-blur-sm border border-zinc-700/50 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                  {person.first_name?.[0] || '?'}{person.last_name?.[0] || ''}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white text-sm truncate">
                      {person.first_name} {person.last_name}
                    </h3>
                    {person.linkedin_url && (
                      <a 
                        href={person.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-4 h-4 bg-blue-600/20 rounded flex items-center justify-center hover:bg-blue-600/30 transition-colors"
                      >
                        <Linkedin size={8} className="text-blue-400" />
                      </a>
                    )}
                    <span className="text-blue-400 text-xs">•</span>
                    <p className="text-blue-400 text-xs truncate">{person.title}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-zinc-400 text-xs truncate">
                      {person.company_name} • {person.company_domain}
                    </p>
                    <div className="flex items-center gap-1 ml-2">
                      {person.email && (
                        <div className="w-5 h-5 bg-green-500/20 rounded flex items-center justify-center">
                          <Mail size={10} className="text-green-400" />
                        </div>
                      )}
                      {person.phone && (
                        <div className="w-5 h-5 bg-blue-500/20 rounded flex items-center justify-center text-blue-400 text-xs">
                          📞
                        </div>
                      )}
                      <span className="text-zinc-500 text-xs">
                        Source: {person.provider}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <span className="text-zinc-500 text-xs italic">
              Results limited to 3 for demo
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderFormattedResult = () => {
    if (!selectedTool) return null;

    switch (selectedTool.id) {
      case 'person-details':
        return renderFormattedPersonDetails();
      case 'account-details':
        return renderFormattedAccountDetails();
      case 'ai-research':
        return renderFormattedResearch();
      case 'discover-persons':
        return renderFormattedDiscoverPersons();
      case 'person-activities':
        return renderFormattedPersonActivities();
      case 'account-activities':
        return renderFormattedAccountActivities();
      case 'account-top-users':
        return renderFormattedAccountTopUsers();
      default:
        return (
          <p className="text-gray-400">
            Formatted view is not available for this tool yet.
          </p>
        );
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 h-full max-h-full overflow-hidden">
      {/* Left Sidebar: Tools */}
      <div className="col-span-3 flex flex-col min-h-0">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-2xl flex-1 flex flex-col min-h-0">
                      <h2 className="text-base font-semibold text-white mb-3">Endpoints</h2>
                      <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1">
            {Object.entries(toolsByCategory).map(([category, tools]) => (
              <div key={category}>
                <div className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1 mt-3 first:mt-0">
                  {category}
                </div>
                {tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => handleSelectTool(tool)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all duration-200 group ${
                      selectedTool?.id === tool.id
                        ? 'bg-blue-600/20 border border-blue-500/30 shadow-lg'
                        : 'hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <tool.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        selectedTool?.id === tool.id ? 'text-blue-400' : 'text-white/60 group-hover:text-white/80'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium text-sm truncate ${
                          selectedTool?.id === tool.id ? 'text-white' : 'text-white/90 group-hover:text-white'
                        }`}>
                          {tool.name}
                        </div>
                        <div className="text-xs text-white/50 line-clamp-2 leading-tight">
                          {tool.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="col-span-9 flex flex-col gap-4 min-h-0">
        {/* Input Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-2xl flex-shrink-0">
          <h2 className="text-base font-semibold text-white mb-3">Input</h2>
                     {selectedTool ? (
            <div className={selectedTool.id === 'discover-persons' ? "grid grid-cols-2 gap-3" : "flex gap-4 items-end"}>
              {selectedTool.inputs.includes("email") && (
                <div className="flex-1">
                  <label htmlFor="email" className="block text-xs font-medium text-white/80 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
                    placeholder="francis@madkudu.com"
                  />
                </div>
              )}
              {selectedTool.inputs.includes("domain") && (
                <div className="flex-1">
                  <label htmlFor="domain" className="block text-xs font-medium text-white/80 mb-1.5">
                    Domain
                  </label>
                  <input
                    type="text"
                    id="domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
                    placeholder="madkudu.com"
                  />
                </div>
              )}
              {selectedTool.inputs.includes("title") && (
                <div className="flex-1">
                  <label htmlFor="title" className="block text-xs font-medium text-white/80 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
                    placeholder="CEO, CTO, VP Marketing"
                  />
                </div>
              )}
              {selectedTool.inputs.includes("seniority") && (
                <div className="flex-1">
                  <label htmlFor="seniority" className="block text-xs font-medium text-white/80 mb-1.5">
                    Seniority
                  </label>
                  <select
                    id="seniority"
                    value={seniority}
                    onChange={(e) => setSeniority(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
                  >
                    <option value="">Any</option>
                    <option value="executive">Executive</option>
                    <option value="director">Director</option>
                    <option value="manager">Manager</option>
                    <option value="individual_contributor">Individual Contributor</option>
                  </select>
                </div>
              )}
              {selectedTool.inputs.includes("country") && (
                <div className="flex-1">
                  <label htmlFor="country" className="block text-xs font-medium text-white/80 mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
                    placeholder="United States, France"
                  />
                </div>
              )}
                             <button
                onClick={handleRunTool}
                disabled={isLoading}
                className={`${selectedTool.id === 'discover-persons' ? 'col-span-2 mt-2' : ''} px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg text-sm whitespace-nowrap`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Testing...
                  </div>
                ) : (
                  "Test Tool"
                )}
              </button>
            </div>
          ) : (
            <p className="text-white/60 text-center py-4 text-sm">
              Select a tool to configure input parameters
            </p>
          )}
        </div>

        {/* Results Section */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-2xl flex-1 min-h-0 flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold text-white">Results</h2>
            {result && !error && (
              <div className="flex border border-white/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => setActiveTab("formatted")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === 'formatted' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Formatted
                </button>
                <button
                  onClick={() => setActiveTab("raw")}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-white/20 ${
                    activeTab === 'raw' 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Raw JSON
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mb-3"></div>
                <p className="text-white/60 text-sm">Testing {selectedTool?.name}...</p>
              </div>
            ) : error ? (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 font-medium text-sm">Error</p>
                <p className="text-red-300 text-xs mt-1">{error}</p>
              </div>
            ) : result ? (
              <>
                {activeTab === 'raw' ? (
                  <pre className="whitespace-pre-wrap text-white/90 bg-black/30 p-3 rounded-lg text-xs overflow-auto h-full">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                ) : (
                  <div className="h-full">
                    {renderFormattedResult()}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Wrench className="w-8 h-8 text-white/30 mb-3" />
                <p className="text-white/60 text-sm">Select a tool and click "Test Tool" to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 