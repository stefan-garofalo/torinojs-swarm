declare module "@upstash/redis" {
  export class Redis {
    static fromEnv(): {
      get<TValue>(key: string): Promise<TValue | null>;
      set(
        key: string,
        value: string,
        options?: {
          ex?: number;
          nx?: boolean;
        },
      ): Promise<unknown>;
      eval<TResult>(script: string, keys: string[], args: string[]): Promise<TResult>;
    };
  }
}
