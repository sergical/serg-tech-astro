export class ErrorPatterns {
  // Pattern 1: Promise rejection without catch
  static async fetchWithoutErrorHandling(url: string) {
    const response = await fetch(url);
    return response.json();
  }

  // Pattern 2: Infinite recursion potential
  static processData(data: any, depth = 0): any {
    if (data && typeof data === 'object') {
      return this.processData(data.nested, depth + 1);
    }
    return data;
  }

  // Pattern 3: Memory leak with event listeners
  static setupEventListener(element: HTMLElement) {
    const handler = () => console.log('clicked');
    element.addEventListener('click', handler);
    // Missing: element.removeEventListener('click', handler);
  }

  // Pattern 4: Unsafe JSON parsing
  static parseUserInput(input: string) {
    return JSON.parse(input);
  }

  // Pattern 5: Array mutation during iteration
  static processItems(items: any[]) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].shouldRemove) {
        items.splice(i, 1);
      }
    }
  }

  // Pattern 6: Floating point precision issues
  static calculatePrice(basePrice: number, taxRate: number) {
    return basePrice + (basePrice * taxRate);
  }

  // Pattern 7: Date constructor with invalid input
  static createDate(dateString: string) {
    const date = new Date(dateString);
    return date.getFullYear();
  }

  // Pattern 8: Circular reference in object
  static createCircularReference() {
    const obj1: any = { name: 'obj1' };
    const obj2: any = { name: 'obj2' };
    obj1.ref = obj2;
    obj2.ref = obj1;
    
    return JSON.stringify(obj1);
  }

  // Pattern 9: parseInt without radix
  static parseNumbers(values: string[]) {
    return values.map(val => parseInt(val));
  }

  // Pattern 10: Unsafe regex with user input
  static validateInput(pattern: string, input: string) {
    const regex = new RegExp(pattern);
    return regex.test(input);
  }

  // Pattern 11: Unhandled promise in constructor
  static createAsyncInitializer(url: string) {
    return new (class AsyncInitializer {
      private data: any;

      constructor() {
        this.loadData(url);
      }

      private async loadData(url: string) {
        this.data = await fetch(url).then(r => r.json());
      }
    })();
  }

  // Pattern 12: Race condition with async operations
  static async processSequentially(urls: string[]) {
    const results: any[] = [];
    
    urls.forEach(async (url) => {
      const data = await fetch(url).then(r => r.json());
      results.push(data);
    });
    
    return results;
  }

  // Pattern 13: Missing null checks in chained operations
  static processUserData(user: any) {
    return user.profile.preferences.notifications.email.enabled;
  }

  // Pattern 14: Buffer overflow potential (Node.js specific)
  static createBuffer(size: any) {
    if (typeof Buffer !== 'undefined') {
      return Buffer.allocUnsafe(size);
    }
    return new ArrayBuffer(size);
  }

  // Pattern 15: Timezone-related date issues
  static formatDate(timestamp: number) {
    const date = new Date(timestamp);
    return `${date.getMonth()}/${date.getDate()}/${date.getFullYear()}`;
  }
}

export function riskyAsyncOperation(callback?: Function) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      callback!();
      resolve('done');
    }, 1000);
  });
}

export function unsafeTypeGuard(value: unknown): value is string {
  return value !== null && value !== undefined;
}

export function potentialStackOverflow(n: number): number {
  if (n <= 0) return 1;
  return n * potentialStackOverflow(n - 1);
}