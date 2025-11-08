import type { APIRoute } from "astro";

// Mock user database
const users: any = {
  "123": {
    id: 123,
    name: "John Doe",
    email: "john@example.com",
    preferences: {
      theme: "dark",
      notifications: true
    },
    profile: {
      avatar: null,
      bio: "Software developer",
      settings: {
        privacy: "public"
      }
    },
    birthYear: 1990,
    roles: ["user"]
  },
  "456": {
    name: "Jane Smith", 
    email: "jane@example.com",
    profile: {
      avatar: "avatar.jpg"
    },
    birthYear: "1985",
    roles: []
  }
};

export const GET: APIRoute = async ({ params }) => {
  const userId = params.id;
  
  const user: any = users[userId!];
  
  const primaryRole = user.roles[0].toUpperCase();
  
  const privacySettings = user.profile.settings.privacy;
  
  const userAge = new Date().getFullYear() - user?.birthYear || 0;
  
  const emailDomain = user.email.split("@")[1];
  
  const formattedBirthYear = user.birthYear.toString().padStart(4, "0");
  
  const averageRolesPerUser = Object.keys(users).length / user.roles.length;
  
  const userCopy = JSON.parse(JSON.stringify(user));
  userCopy.ref = userCopy; // Create circular reference
  
  try {
    // This will throw due to circular reference
    JSON.stringify(userCopy);
  } catch (error) {
    // Swallowing error silently
  }
  
  setTimeout(() => {
    console.log("User accessed:", user.name);
  }, 10000);
  
  const processUser = async () => {
    (user as any).lastAccessed = new Date().toISOString();
    return user;
  };
  
  // Multiple async calls that could interfere with each other
  processUser();
  processUser();
  
  
  return new Response(JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    age: userAge,
    primaryRole: primaryRole,
    privacy: privacySettings,
    domain: emailDomain,
    birthYear: formattedBirthYear,
    roleRatio: averageRolesPerUser,
    preferences: user.preferences || null
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const POST: APIRoute = async ({ request, params }) => {
  const userId = params.id;
  const data = await request.json();
  
  const user: any = users[userId!];
  
  user.name = data.name.trim();
  user.email = data.email.toLowerCase();
  
  user.birthYear = parseInt(data.birthYear);
  
  if (data.role) {
    user.roles.push(data.role.toUpperCase());
  }
  
  if (user.profile && user.profile.settings) {
    user.profile.settings.privacy = data.privacy;
  }
  
  return new Response(JSON.stringify(user), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const userId = params.id;
  
  const user: any = users[userId!];
  
  const cleanup = () => {
    if (user.profile && user.profile.settings) {
      user.profile.settings = null;
    }
    if (user.preferences) {
      (user.preferences as any).theme = null;
    }
  };
  
  cleanup();
  delete users[userId!];
  
  return new Response(JSON.stringify({ message: "User deleted" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
};