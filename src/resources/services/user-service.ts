import {HttpClient} from "@aurelia/fetch-client";
import {SelectedObjectService} from "./selected-object";
import {Logger} from "./logger";
import {inject} from "aurelia";
import {jwtDecode} from "jwt-decode";

@inject(HttpClient)
@inject(SelectedObjectService)
@inject(Logger)
export class UserService {
    public currentUser: {
        username: string;
        isAdmin: boolean;
    } = null;
    private baseUrl = process.env.API_URL || "http://localhost:8000/";

    constructor(
        private http: HttpClient,
        private logger: Logger,
    ) {
        this.http.configure((config) =>
            config.withBaseUrl(this.baseUrl).withDefaults({
                credentials: "same-origin",
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "Fetch",
                },
            }),
        );

        // check the local storage for a token and set the current user if it exists
        this.setCurrentUser();
    }

    async login(username: string, password: string): Promise<boolean> {
        try {
            const response = await this.http.fetch("login/signin", {
                method: "POST",
                body: JSON.stringify({username: username, password: password}),
            });

            if (!response.ok) return false;
            this.logger.log(`User ${username} logged in`, "info");
            const data = await response.json();
            // Save the token for future requests
            localStorage.setItem("auth_token", data);
            this.currentUser = {
                username: username,
                isAdmin: this.isAdmin(),
            };
            return true;
        } catch (error) {
            console.error("There was an error logging in:", error);
            throw error;
        }
    }

    async logout() {
        try {
            const token = localStorage.getItem("auth_token");
            await this.http.fetch("login/signout", {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            localStorage.removeItem("auth_token");
            this.currentUser = null;
            this.logger.log("User logged out", "info");

        } catch (error) {
            console.error("There was an error logging out:", error);
            throw error;
        }
    }

    async signup(username: string, password: string): Promise<boolean> {
        try {
            const response = await this.http.fetch("login/signup", {
                method: "POST",
                body: JSON.stringify({username, password}),
            });

            if (!response.ok) return false;
            const data = await response.json();
            // Save the token for future requests, for example:
            localStorage.setItem("auth_token", data);
            return true;
        } catch (error) {
            console.error("There was an error signing up:", error);
            throw error;
        }
    }

    isAuthenticated() {
        return localStorage.getItem("auth_token") !== null;
    }

    isAdmin() {
        if (!this.isAuthenticated()) return false;
        const token = localStorage.getItem("auth_token");
        const decoded = jwtDecode(token);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return decoded.isAdmin === true;
    }

    setCurrentUser() {
        const token = localStorage.getItem("auth_token");
        if (token) {
            this.currentUser = {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                username: jwtDecode(token).username,
                isAdmin: this.isAdmin(),
            };
        }
    }

    isTokenExpired(token: string): boolean {
        const decoded = jwtDecode(token);
        if (!decoded.exp) return true; // If there's no expiration date in the token, consider it expired
        const expDate = new Date(decoded.exp * 1000);
        return expDate < new Date();
    }

    checkTokenAndLogoutIfExpired() {
        const token = localStorage.getItem("auth_token");
        if (token && this.isTokenExpired(token)) {
            this.logout();
            return true;
        }
        return false;
    }
}
