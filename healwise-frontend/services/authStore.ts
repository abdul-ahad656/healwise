 class AuthStore {
  private static instance: AuthStore;
  private token: string | null = null;
  private user: any | null = null;

  private constructor() {}

  public static getInstance(): AuthStore {
    if (!AuthStore.instance) {
      AuthStore.instance = new AuthStore();
    }
    return AuthStore.instance;
  }

  public setToken(token: string) {
    this.token = token;
  }

  public getToken(): string | null {
    return this.token;
  }

  public setUser(user: any) {
    this.user = user;
  }

  public getUser(): any | null {
    return this.user;
  }

  public clear() {
    this.token = null;
    this.user = null;
  }
}

export default AuthStore.getInstance();
