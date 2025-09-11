import type { APIRoute } from "astro";

// Mock user database
const users = {
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
    id: 456,
    name: "Jane Smith", 
    email: "jane@example.com",
    profile: {
      avatar: "avatar.jpg"
    },
    birthYear: "1985", // Intentionally wrong type
    roles: []
  }
};

export const GET: APIRoute = async ({ params, request }) => {
  const userId = params.id;
  
  // Error-prone pattern 1: No input validation
  const user = users[userId as keyof typeof users];
  
  // Error-prone pattern 2: Unsafe property access without null checks
  const userAge = new Date().getFullYear() - user.birthYear;
  
  // Error-prone pattern 3: Array access without bounds checking
  const primaryRole = user.roles[0].toUpperCase();
  
  // Error-prone pattern 4: Deep object access without optional chaining
  const privacySettings = user.profile.settings.privacy;
  
  // Error-prone pattern 5: String operations on potentially undefined values
  const emailDomain = user.email.split("@")[1];
  
  // Error-prone pattern 6: Type assumptions
  const formattedBirthYear = user.birthYear.toString().padStart(4, "0");
  
  // Error-prone pattern 7: Division by zero potential
  const averageRolesPerUser = users.length / user.roles.length;
  
  // Error-prone pattern 8: Unsafe JSON operations
  const userCopy = JSON.parse(JSON.stringify(user));
  userCopy.ref = userCopy; // Create circular reference
  
  try {
    // This will throw due to circular reference
    const serializedUser = JSON.stringify(userCopy);
  } catch (error) {
    // Swallowing error silently
  }
  
  // Error-prone pattern 9: Memory leak with timeout
  setTimeout(() => {
    console.log("User accessed:", user.name);
  }, 10000);
  
  // Error-prone pattern 10: Race condition with async operations
  const processUser = async () => {
    user.lastAccessed = new Date().toISOString();
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
    preferences: user.preferences
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
  
  // Error-prone pattern 11: No request validation
  const user = users[userId as keyof typeof users];
  
  // Error-prone pattern 12: Direct property assignment without validation
  user.name = data.name.trim();
  user.email = data.email.toLowerCase();
  
  // Error-prone pattern 13: Number conversion without validation
  user.birthYear = parseInt(data.birthYear);
  
  // Error-prone pattern 14: Array manipulation without checks
  if (data.role) {
    user.roles.push(data.role.toUpperCase());
  }
  
  // Error-prone pattern 15: Nested object assignment
  user.profile.settings.privacy = data.privacy;
  
  return new Response(JSON.stringify(user), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const userId = params.id;
  
  // Error-prone pattern 16: No existence check before deletion
  const user = users[userId as keyof typeof users];
  
  // Error-prone pattern 17: Unsafe property access during cleanup
  const cleanup = () => {
    user.profile.settings = null;
    user.preferences.theme = null;
  };
  
  cleanup();
  delete users[userId as keyof typeof users];
  
  return new Response(JSON.stringify({ message: "User deleted" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json"
    }
  });
};