"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";

export default function ApiTester() {
  const [email, setEmail] = useState("francis@madkudu.com");
  const [domain, setDomain] = useState("madkudu.com");
  const [result, setResult] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"formatted" | "raw">("formatted");
  const [resultType, setResultType] = useState<"contact" | "account" | "research" | null>(null);

  // tRPC hooks
  const lookupPersonMutation = api.madkudu.lookupPerson.useMutation();
  const lookupAccountMutation = api.madkudu.lookupAccount.useMutation();
  const getAIResearchMutation = api.madkudu.getAIResearch.useMutation();

  const handleGetContactDetails = async () => {
    if (!email.trim()) return;
    
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await lookupPersonMutation.mutateAsync({ email });
      setResult(response);
      setResultType("contact");
      setActiveTab("formatted"); // Now we default to formatted for contact details
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetAccountDetails = async () => {
    if (!domain.trim()) return;
    
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await lookupAccountMutation.mutateAsync({ domain });
      setResult(response);
      setResultType("account");
      setActiveTab("formatted"); // Now we default to formatted for account details
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetAIResearch = async () => {
    if (!domain.trim()) return;
    
    setIsLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const response = await getAIResearchMutation.mutateAsync({ domain });
      setResult(response);
      setResultType("research");
      setActiveTab("formatted"); // Default to formatted for AI research
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to format markdown links
  const formatMarkdownLinks = (text: string) => {
    // Replace markdown links with HTML links
    // Pattern: [link text](url)
    return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${text}</a>`;
    });
  };

  // Function to render formatted contact details in a LinkedIn-inspired layout
  const renderFormattedContactDetails = () => {
    if (!result) return <p className="text-gray-400">No results yet</p>;
    
    try {
      // Extract contact data from the result
      type ContactDataType = {
        name?: string;
        full_name?: string;
        first_name?: string;
        last_name?: string;
        title?: string;
        company?: string;
        city?: string;
        state?: string;
        country?: string;
        email?: string;
        phone?: string;
        linkedin_handle?: string;
        twitter_handle?: string;
        seniority?: string;
        contactDetails?: string;
        avatar_url?: string;
        [key: string]: unknown;
      };

      const contactData = Array.isArray(result) && result.length > 0 ? 
        result[0] as ContactDataType : null;
      
      const contactDetails = contactData?.contactDetails ? 
        JSON.parse(contactData.contactDetails) as { 
          photo?: string; 
          bio?: string; 
          skills?: string[];
          [key: string]: unknown;
        } : null;
      
      if (!contactData) {
        return <p className="text-gray-400">No contact data available</p>;
      }
      
      // Default image if no photo available
      const defaultImage = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
      // Try different fields for avatar
      const photo = contactData.avatar_url ?? contactDetails?.photo ?? defaultImage;
      
      // Try different name fields that might be available
      const displayName = contactData.full_name ?? 
        contactData.name ?? 
        (contactData.first_name && contactData.last_name 
          ? `${contactData.first_name} ${contactData.last_name}` 
          : null) ?? 
        "Unknown Name";
      
      return (
        <div className="bg-zinc-900 rounded-lg overflow-hidden shadow-xl">
          {/* Header with background cover photo */}
          <div className="h-32 bg-gradient-to-r from-blue-900 to-purple-900"></div>
          
          {/* Profile section */}
          <div className="relative px-6 pb-6 pt-16">
            {/* Profile picture */}
            <div className="absolute -top-24 left-6">
              <img 
                src={photo} 
                alt={displayName}
                className="w-32 h-32 rounded-full border-4 border-zinc-900 bg-zinc-800 object-cover"
              />
            </div>
            
            {/* Info section with margin to accommodate profile picture */}
            <div className="mt-16">
              {/* Name and title */}
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-white">{displayName}</h1>
                <p className="text-blue-400 text-lg">{contactData.title ?? "Unknown Title"}</p>
                {contactData.company && <p className="text-gray-400">{contactData.company}</p>}
              </div>
              
              {/* Location */}
              {(contactData.city || contactData.state || contactData.country) && (
                <div className="flex items-center mb-3 text-gray-300">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{[contactData.city, contactData.state, contactData.country].filter(Boolean).join(", ")}</span>
                </div>
              )}
              
              {/* Contact info */}
              <div className="space-y-2 mb-4">
                {contactData.email && (
                  <div className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>{contactData.email}</span>
                  </div>
                )}
                
                {contactData.phone && (
                  <div className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span>{contactData.phone}</span>
                  </div>
                )}
                
                {contactData.linkedin_handle && (
                  <div className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.338 16.338H13.67V12.16c0-1-.02-2.285-1.39-2.285-1.39 0-1.601 1.087-1.601 2.21v4.253h-2.66V8.315h2.56v1.17h.035c.358-.674 1.228-1.387 2.528-1.387 2.7 0 3.2 1.778 3.2 4.091v4.149h-.004zM7.003 7.142c-.85 0-1.535-.685-1.535-1.53 0-.844.685-1.53 1.535-1.53.85 0 1.535.686 1.535 1.53 0 .845-.685 1.53-1.535 1.53zm1.33 9.196h-2.66V8.315h2.66v8.023z" />
                    </svg>
                    <a 
                      href={`https://linkedin.com/in/${contactData.linkedin_handle}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {contactData.linkedin_handle}
                    </a>
                  </div>
                )}
                
                {contactData.twitter_handle && (
                  <div className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.615 11.615 0 006.29 1.84" />
                    </svg>
                    <a 
                      href={`https://twitter.com/${contactData.twitter_handle}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      @{contactData.twitter_handle}
                    </a>
                  </div>
                )}
              </div>
              
              {/* Additional details */}
              {contactData.seniority && (
                <div className="mb-3">
                  <span className="bg-blue-900 text-blue-200 px-3 py-1 rounded-full text-sm">
                    {contactData.seniority} Seniority
                  </span>
                </div>
              )}
              
              {/* Bio/Summary if available */}
              {contactDetails?.bio && (
                <div className="bg-zinc-800 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-medium text-white mb-2">About</h3>
                  <p className="text-gray-300">{contactDetails.bio}</p>
                </div>
              )}
              
              {/* Skills if available */}
              {contactDetails?.skills && contactDetails.skills.length > 0 && (
                <div className="bg-zinc-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {contactDetails.skills.map((skill: string, index: number) => (
                      <span key={index} className="bg-zinc-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error rendering contact details:", error);
      return <p className="text-red-400">Error rendering contact details</p>;
    }
  };
  
  // Function to render formatted account details in a LinkedIn-inspired layout
  const renderFormattedAccountDetails = () => {
    if (!result) return <p className="text-gray-400">No results yet</p>;
    
    try {
      // Extract account data from the result
      type AccountDataType = {
        name?: string;
        domain?: string;
        industry?: string;
        city?: string;
        state?: string;
        country?: string;
        logo_url?: string; 
        employees_count?: number | string;
        estimated_revenue?: number | string;
        funding?: number | string;
        founded_year?: number | string;
        description?: string;
        tags?: string[];
        accountDetails?: string;
        [key: string]: unknown;
      };

      type ContactType = {
        name?: string;
        title?: string;
        email?: string;
        linkedin_handle?: string;
        seniority?: string;
        [key: string]: unknown;
      };

      const accountData = Array.isArray(result) && result.length > 0 ? 
        result[0] as AccountDataType : null;
        
      const accountDetails = accountData?.accountDetails ? 
        JSON.parse(accountData.accountDetails) as {
          contacts?: ContactType[];
          [key: string]: unknown;
        } : null;
      
      if (!accountData) {
        return <p className="text-gray-400">No account data available</p>;
      }
      
      // Get the company logo or use a default
      const defaultLogo = "https://cdn-icons-png.flaticon.com/512/3281/3281315.png";
      const logo = accountData.logo_url ?? defaultLogo;
      
      return (
        <div className="bg-zinc-900 rounded-lg overflow-hidden shadow-xl">
          {/* Header with background cover photo */}
          <div className="h-32 bg-gradient-to-r from-indigo-900 to-blue-900"></div>
          
          {/* Company profile section */}
          <div className="relative px-6 pb-6 pt-16">
            {/* Company logo */}
            <div className="absolute -top-24 left-6">
              <div className="w-32 h-32 flex items-center justify-center rounded-lg border-4 border-zinc-900 bg-white">
                <img 
                  src={logo} 
                  alt={accountData.name ?? "Company Logo"} 
                  className="max-w-[80%] max-h-[80%] object-contain"
                />
              </div>
            </div>
            
            {/* Info section with margin to accommodate logo */}
            <div className="mt-16">
              {/* Company name and industry */}
              <div className="mb-4">
                <h1 className="text-2xl font-bold text-white">
                  {accountData.name ?? accountData.domain ?? "Unknown Company"}
                </h1>
                {accountData.industry && (
                  <p className="text-blue-400 text-lg">{accountData.industry}</p>
                )}
                {accountData.domain && (
                  <p className="text-gray-400">
                    <a 
                      href={`https://${accountData.domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {accountData.domain}
                    </a>
                  </p>
                )}
              </div>
              
              {/* Location */}
              {(accountData.city || accountData.state || accountData.country) && (
                <div className="flex items-center mb-3 text-gray-300">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>{[accountData.city, accountData.state, accountData.country].filter(Boolean).join(", ")}</span>
                </div>
              )}
              
              {/* Company size and other metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {accountData.employees_count && (
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <h3 className="text-md font-medium text-gray-400 mb-1">Company Size</h3>
                    <p className="text-xl text-white">{accountData.employees_count} employees</p>
                  </div>
                )}
                
                {accountData.estimated_revenue && (
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <h3 className="text-md font-medium text-gray-400 mb-1">Est. Annual Revenue</h3>
                    <p className="text-xl text-white">${accountData.estimated_revenue}</p>
                  </div>
                )}
                
                {accountData.funding && (
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <h3 className="text-md font-medium text-gray-400 mb-1">Total Funding</h3>
                    <p className="text-xl text-white">${accountData.funding}</p>
                  </div>
                )}
                
                {accountData.founded_year && (
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <h3 className="text-md font-medium text-gray-400 mb-1">Founded</h3>
                    <p className="text-xl text-white">{accountData.founded_year}</p>
                  </div>
                )}
              </div>
              
              {/* Company description if available */}
              {accountData.description && (
                <div className="bg-zinc-800 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-medium text-white mb-2">About</h3>
                  <p className="text-gray-300">{accountData.description}</p>
                </div>
              )}
              
              {/* Key contacts section (if contacts are available in accountDetails) */}
              {accountDetails?.contacts && accountDetails.contacts.length > 0 && (
                <div className="bg-zinc-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3">Key Contacts</h3>
                  <div className="space-y-4">
                    {accountDetails.contacts.slice(0, 5).map((contact, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-medium">
                            {contact.name ? contact.name.charAt(0).toUpperCase() : "?"}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{contact.name || "Unknown Name"}</p>
                          <p className="text-gray-400 text-sm">{contact.title || "Unknown Title"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Tags or categories */}
              {accountData.tags && accountData.tags.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {accountData.tags.map((tag, index) => (
                      <span key={index} className="bg-zinc-700 text-gray-300 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error rendering account details:", error);
      return <p className="text-red-400">Error rendering account details</p>;
    }
  };

  // Function to render formatted research
  const renderFormattedResearch = () => {
    if (!result) return <p className="text-gray-400">No results yet</p>;
    
    // If this is a contact details result
    if (resultType === "contact") {
      return renderFormattedContactDetails();
    }
    
    // If this is an account details result
    if (resultType === "account") {
      return renderFormattedAccountDetails();
    }
    
    // For AI research (original implementation)
    // If result is a string, format it with proper paragraphs and headers
    if (typeof result === 'string') {
      const researchText = result;
      
      // Process line by line to ensure each \n becomes a line break
      // This will preserve the structure of the text better
      const lines = researchText
        .replace(/\\n/g, '\n')
        .split('\n');
      
      // Create a container for the formatted content
      const formattedContent: React.ReactNode[] = [];
      let currentParagraph: string[] = [];
      let listItems: string[] = [];
      let isInList = false;
      let key = 0;
      
      // Process line by line
      lines.forEach((line, index) => {
        // Check if this is a header line
        const headerMatch = /^(#{1,3})\s+(.+)$/.exec(line);
        if (headerMatch) {
          // If we have accumulated paragraph text, add it first
          if (currentParagraph.length > 0) {
            const paraText = currentParagraph.join(' ');
            formattedContent.push(
              <p key={key++} className="text-gray-300 mb-3" dangerouslySetInnerHTML={{ __html: formatMarkdownLinks(paraText) }} />
            );
            currentParagraph = [];
          }
          
          // If we were in a list, end it
          if (isInList && listItems.length > 0) {
            formattedContent.push(
              <ul key={key++} className="list-disc pl-5 mb-3">
                {listItems.map((item, i) => (
                  <li key={i} className="text-gray-300 mb-1" dangerouslySetInnerHTML={{ __html: formatMarkdownLinks(item) }} />
                ))}
              </ul>
            );
            listItems = [];
            isInList = false;
          }
          
          // Add the header
          const level = headerMatch[1]!.length;
          const headerText = headerMatch[2]!;
          const formattedText = formatMarkdownLinks(headerText);
          
          switch (level) {
            case 1:
              formattedContent.push(
                <h1 key={key++} className="text-2xl font-bold text-blue-400 mt-6 mb-3" dangerouslySetInnerHTML={{ __html: formattedText }} />
              );
              break;
            case 2:
              formattedContent.push(
                <h2 key={key++} className="text-xl font-bold text-indigo-400 mt-5 mb-3" dangerouslySetInnerHTML={{ __html: formattedText }} />
              );
              break;
            case 3:
              formattedContent.push(
                <h3 key={key++} className="text-lg font-bold text-purple-400 mt-4 mb-2" dangerouslySetInnerHTML={{ __html: formattedText }} />
              );
              break;
          }
          return;
        }
        
        // Check if this is a list item
        if (line.trim().startsWith('- ')) {
          // If we have accumulated paragraph text, add it first
          if (currentParagraph.length > 0) {
            const paraText = currentParagraph.join(' ');
            formattedContent.push(
              <p key={key++} className="text-gray-300 mb-3" dangerouslySetInnerHTML={{ __html: formatMarkdownLinks(paraText) }} />
            );
            currentParagraph = [];
          }
          
          // Add to list items
          isInList = true;
          listItems.push(line.trim().substring(2));
          return;
        }
        
        // If we were in a list and now we're not
        if (isInList && !line.trim().startsWith('- ') && line.trim() !== '') {
          formattedContent.push(
            <ul key={key++} className="list-disc pl-5 mb-3">
              {listItems.map((item, i) => (
                <li key={i} className="text-gray-300 mb-1" dangerouslySetInnerHTML={{ __html: formatMarkdownLinks(item) }} />
              ))}
            </ul>
          );
          listItems = [];
          isInList = false;
        }
        
        // Format special symbols and emojis in this line
        let formattedLine = line;
        
        // Handle common emojis
        const emojiMap = {
          '✨': '<span class="text-yellow-300">✨</span>',
          '💡': '<span class="text-yellow-300">💡</span>',
          '📊': '<span class="text-blue-400">📊</span>',
          '✅': '<span class="text-green-400">✅</span>',
          '⭐': '<span class="text-yellow-300">⭐</span>',
          '🔍': '<span class="text-blue-300">🔍</span>',
          '📈': '<span class="text-green-400">📈</span>',
          '🚀': '<span class="text-purple-400">🚀</span>',
          '🎯': '<span class="text-red-400">🎯</span>',
          '👋': '<span class="text-yellow-200">👋</span>',
          '📝': '<span class="text-gray-300">📝</span>',
          '🤔': '<span class="text-yellow-200">🤔</span>',
          '🔗': '<span class="text-blue-300">🔗</span>',
          '📱': '<span class="text-purple-300">📱</span>',
          '🖥️': '<span class="text-blue-300">🖥️</span>',
          '🏢': '<span class="text-gray-300">🏢</span>',
        };
        
        // Replace emojis with styled span elements
        Object.entries(emojiMap).forEach(([emoji, html]) => {
          formattedLine = formattedLine.replace(new RegExp(emoji, 'g'), html);
        });
        
        // Handle special sections like "💡 Insight" without making them bold
        formattedLine = formattedLine.replace(/(💡\s*Insight|✅\s*Success|⭐\s*Why|🔍\s*Details)/g, (match) => {
          return `<span class="text-yellow-300">${match}</span>`;
        });
        
        // Handle sources with brackets
        formattedLine = formattedLine.replace(/\[Source\]/g, '<span class="text-gray-400">[Source]</span>');
        
        // If line is not empty, add it to the current paragraph
        if (line.trim() !== '') {
          currentParagraph.push(formattedLine);
        } 
        // If line is empty and we have paragraph content, finish the paragraph
        else if (currentParagraph.length > 0) {
          const paraText = currentParagraph.join(' ');
          formattedContent.push(
            <p key={key++} className="text-gray-300 mb-3" dangerouslySetInnerHTML={{ __html: formatMarkdownLinks(paraText) }} />
          );
          currentParagraph = [];
        }
        
        // For an empty line in the input, add an empty paragraph to maintain spacing
        if (line.trim() === '' && !isInList && currentParagraph.length === 0) {
          formattedContent.push(<div key={key++} className="h-3"></div>);
        }
      });
      
      // Add any remaining paragraph content
      if (currentParagraph.length > 0) {
        const paraText = currentParagraph.join(' ');
        formattedContent.push(
          <p key={key++} className="text-gray-300 mb-3" dangerouslySetInnerHTML={{ __html: formatMarkdownLinks(paraText) }} />
        );
      }
      
      // Add any remaining list items
      if (isInList && listItems.length > 0) {
        formattedContent.push(
          <ul key={key++} className="list-disc pl-5 mb-3">
            {listItems.map((item, i) => (
              <li key={i} className="text-gray-300 mb-1" dangerouslySetInnerHTML={{ __html: formatMarkdownLinks(item) }} />
            ))}
          </ul>
        );
      }
      
      return <div className="space-y-0">{formattedContent}</div>;
    }
    
    // If it's not a string and not a recognized type, just render a message
    return <p className="text-gray-400">Results are available in raw format</p>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">MCP API Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Domain</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md py-2 px-3 text-white"
          />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={handleGetContactDetails}
          disabled={isLoading || !email.trim()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Get Contact Details
        </button>
        
        <button
          onClick={handleGetAccountDetails}
          disabled={isLoading || !domain.trim()}
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Get Account Details
        </button>
        
        <button
          onClick={handleGetAIResearch}
          disabled={isLoading || !domain.trim()}
          className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          AI Account Research
        </button>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-md">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
          <p className="text-red-200">{error}</p>
        </div>
      )}
      
      {Boolean(result) && !isLoading && (
        <div className="mb-6">
          <div className="flex border-b border-zinc-700 mb-4">
            <button
              className={`px-4 py-2 ${activeTab === "formatted" ? "border-b-2 border-purple-500 text-white" : "text-zinc-400"}`}
              onClick={() => setActiveTab("formatted")}
            >
              Formatted
            </button>
            <button
              className={`px-4 py-2 ${activeTab === "raw" ? "border-b-2 border-blue-500 text-white" : "text-zinc-400"}`}
              onClick={() => setActiveTab("raw")}
            >
              Raw JSON
            </button>
          </div>
          
          <h2 className="text-xl font-bold mb-4">Results</h2>
          
          <div className="bg-zinc-800 border border-zinc-700 rounded-md p-4 overflow-x-auto">
            {activeTab === "formatted" ? (
              resultType === "contact" ? renderFormattedContactDetails() :
              resultType === "account" ? renderFormattedAccountDetails() :
              resultType === "research" ? renderFormattedResearch() :
              <p className="text-gray-400">No formatted view available</p>
            ) : (
              <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 