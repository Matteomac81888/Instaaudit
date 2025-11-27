import { FollowerItem, FollowingRoot, AnalysisResult } from '../types';

/**
 * Validates if the parsed JSON looks like a Followers file.
 * Followers file is typically an array of objects.
 */
export const isValidFollowersFile = (json: any): boolean => {
  return Array.isArray(json);
};

/**
 * Validates if the parsed JSON looks like a Following file.
 * Following file must have the 'relationships_following' key.
 */
export const isValidFollowingFile = (json: any): boolean => {
  return json && typeof json === 'object' && 'relationships_following' in json;
};

/**
 * Extracts a list of usernames from the Followers JSON file.
 */
export const parseFollowers = (json: any): AnalysisResult[] => {
  if (!Array.isArray(json)) {
    throw new Error("Invalid Followers file format. Expected an array.");
  }

  const results: AnalysisResult[] = [];

  json.forEach((item: any) => {
    // Check if it matches the structure: object with string_list_data
    if (item.string_list_data && Array.isArray(item.string_list_data)) {
      const data = item.string_list_data[0];
      if (data && data.value) {
        results.push({
          username: data.value,
          href: data.href,
          timestamp: data.timestamp
        });
      }
    }
  });

  return results;
};

/**
 * Extracts a list of usernames from the Following JSON file.
 */
export const parseFollowing = (json: any): AnalysisResult[] => {
  // Check for the specific root key defined in the prompt
  if (!json.relationships_following || !Array.isArray(json.relationships_following)) {
    throw new Error("Invalid Following file format. Expected key 'relationships_following'.");
  }

  const results: AnalysisResult[] = [];

  json.relationships_following.forEach((item: any) => {
    // In the following JSON, the username is often in the 'title' field
    if (item.title) {
       // Try to get href/timestamp from string_list_data if available, otherwise mock it or leave undefined
       const data = item.string_list_data?.[0];
       results.push({
         username: item.title,
         href: data?.href || `https://www.instagram.com/${item.title}`,
         timestamp: data?.timestamp || 0
       });
    }
  });

  return results;
};