// Additional error-prone patterns for Sentry AI to detect

export class ErrorPatterns {
  // Pattern 1: Promise rejection without catch
  static async fetchWithoutErrorHandling(url: string) {
    // Sentry AI should predict: Promise rejection not handled
    const response = await fetch(url);
    return response.json(); // Could throw if not JSON
  }

  // Pattern 2: Infinite recursion potential
  static processData(data: any, depth = 0): any {
    if (data && typeof data === 'object') {
      // Sentry AI should predict: potential stack overflow
      return this.processData(data.nested, depth + 1); // No base case for recursion
    }
    return data;
  }

  // Pattern 3: Memory leak with event listeners
  static setupEventListener(element: HTMLElement) {
    const handler = () => console.log('clicked');
    element.addEventListener('click', handler);
    // Sentry AI should predict: event listener not removed, potential memory leak
    // Missing: element.removeEventListener('click', handler);
  }

  // Pattern 4: Unsafe JSON parsing
  static parseUserInput(input: string) {
    // Sentry AI should predict: JSON.parse could throw SyntaxError
    return JSON.parse(input); // No try-catch
  }

  // Pattern 5: Array mutation during iteration
  static processItems(items: any[]) {
    // Sentry AI should predict: modifying array while iterating
    for (let i = 0; i < items.length; i++) {
      if (items[i].shouldRemove) {
        items.splice(i, 1); // Modifying array during iteration
      }
    }
  }

  // Pattern 6: Floating point precision issues
  static calculatePrice(basePrice: number, taxRate: number) {
    // Sentry AI should predict: floating point precision issues
    return basePrice + (basePrice * taxRate); // 0.1 + 0.2 !== 0.3
  }

  // Pattern 7: Date constructor with invalid input
  static createDate(dateString: string) {
    // Sentry AI should predict: Invalid Date possible
    const date = new Date(dateString);
    return date.getFullYear(); // Could return NaN
  }

  // Pattern 8: Circular reference in object
  static createCircularReference() {
    const obj1: any = { name: 'obj1' };
    const obj2: any = { name: 'obj2' };
    obj1.ref = obj2;
    obj2.ref = obj1;
    
    // Sentry AI should predict: JSON.stringify will throw on circular reference
    return JSON.stringify(obj1);
  }

  // Pattern 9: parseInt without radix
  static parseNumbers(values: string[]) {
    // Sentry AI should predict: parseInt without radix can cause issues
    return values.map(val => parseInt(val)); // Missing radix parameter
  }

  // Pattern 10: Unsafe regex with user input
  static validateInput(pattern: string, input: string) {
    // Sentry AI should predict: ReDoS (Regular Expression Denial of Service) potential
    const regex = new RegExp(pattern); // User-controlled regex
    return regex.test(input);
  }

  // Pattern 11: Unhandled promise in constructor
  static class AsyncInitializer {
    private data: any;

    constructor(url: string) {
      // Sentry AI should predict: Promise in constructor not handled
      this.loadData(url); // Async method in constructor
    }

    private async loadData(url: string) {
      this.data = await fetch(url).then(r => r.json()); // Could throw
    }
  }

  // Pattern 12: Race condition with async operations
  static async processSequentially(urls: string[]) {
    const results: any[] = [];
    
    // Sentry AI should predict: forEach with async creates race conditions
    urls.forEach(async (url) => {
      const data = await fetch(url).then(r => r.json());
      results.push(data); // Race condition - results might not be in order
    });
    
    return results;
  }

  // Pattern 13: Missing null checks in chained operations
  static processUserData(user: any) {
    // Sentry AI should predict: Multiple potential null pointer exceptions
    return user.profile.preferences.notifications.email.enabled; // Long chain without null checks
  }

  // Pattern 14: Buffer overflow potential (Node.js specific)
  static createBuffer(size: any) {
    // Sentry AI should predict: size could be invalid, causing errors
    return Buffer.allocUnsafe(size); // No validation of size parameter
  }

  // Pattern 15: Timezone-related date issues
  static formatDate(timestamp: number) {
    const date = new Date(timestamp);
    // Sentry AI should predict: timezone issues with date formatting
    return `${date.getMonth()}/${date.getDate()}/${date.getFullYear()}`; // getMonth() is 0-based
  }
}

// Export additional utility functions with error patterns
export function riskyAsyncOperation(callback?: Function) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Sentry AI should predict: callback might not be a function
      callback(); // Could throw if callback is undefined
      resolve('done');
    }, 1000);
  });
}

export function unsafeTypeGuard(value: unknown): value is string {
  // Sentry AI should predict: weak type guard
  return value !== null && value !== undefined; // Doesn't actually check if it's a string
}

export function potentialStackOverflow(n: number): number {
  // Sentry AI should predict: no base case for large numbers
  if (n <= 0) return 1;
  return n * potentialStackOverflow(n - 1); // Factorial without overflow protection
}