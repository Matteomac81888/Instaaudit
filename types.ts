// Type definitions based on the provided JSON structure

export interface StringListData {
  href: string;
  value?: string; // Present in followers, sometimes missing in following
  timestamp: number;
}

export interface MediaListData {
  // Structure not strictly defined in prompt, but present as empty array
  [key: string]: any;
}

// Structure for items in followers.json
export interface FollowerItem {
  title: string;
  media_list_data: MediaListData[];
  string_list_data: StringListData[];
}

// Structure for following.json (Root object)
export interface FollowingRoot {
  relationships_following: FollowingItem[];
}

// Structure for items inside relationships_following
export interface FollowingItem {
  title: string; // The username appears here in the following list
  media_list_data: MediaListData[];
  string_list_data: StringListData[];
}

export interface AnalysisResult {
  username: string;
  href: string;
  timestamp: number;
  followerCount?: number;
}