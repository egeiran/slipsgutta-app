import 'react-native-url-polyfill/auto';

export type SupabaseConfig = {
    url?: string;
    anonKey?: string;
};

export class SupabaseRestClient {
    private readonly headers: Record<string, string>;

    constructor(private readonly url: string, private readonly anonKey: string) {
        this.headers = {
            apikey: this.anonKey,
            Authorization: `Bearer ${this.anonKey}`,
        };
    }

    async list<T>(table: string, params: Record<string, string>): Promise<T[]> {
        const query = this.serializeParams(params);
        const requestUrl = `${this.url}/rest/v1/${table}?${query}`;
        const response = await fetch(requestUrl, { headers: this.headers });

        if (!response.ok) {
            const error = await this.extractError(response);
            console.log('supabase error', {
                table,
                query,
                requestUrl,
                responseUrl: response.url,
                status: response.status,
                error,
            });
            throw new Error(error);
        }

        return response.json() as Promise<T[]>;
    }

    async insert<T>(table: string, payload: Record<string, unknown>): Promise<T[]> {
        const response = await fetch(`${this.url}/rest/v1/${table}`, {
            method: "POST",
            headers: {
                ...this.headers,
                "Content-Type": "application/json",
                Prefer: "return=representation",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(await this.extractError(response));
        }

        return response.json() as Promise<T[]>;
    }

    async update<T>(table: string, payload: Record<string, unknown>, filters: Record<string, string | number>) {
        const search = this.buildFilters(filters);
        const response = await fetch(`${this.url}/rest/v1/${table}?${search}`, {
            method: "PATCH",
            headers: {
                ...this.headers,
                "Content-Type": "application/json",
                Prefer: "return=representation",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(await this.extractError(response));
        }

        return response.json() as Promise<T[]>;
    }

    async remove(table: string, filters: Record<string, string | number>) {
        const search = this.buildFilters(filters);
        const response = await fetch(`${this.url}/rest/v1/${table}?${search}`, {
            method: "DELETE",
            headers: this.headers,
        });

        if (!response.ok) {
            throw new Error(await this.extractError(response));
        }
    }

    private buildFilters(filters: Record<string, string | number>) {
        const serialized: Record<string, string> = {};
        for (const [key, value] of Object.entries(filters)) {
            serialized[key] = `eq.${value}`;
        }
        return this.serializeParams(serialized);
    }

    private serializeParams(params: Record<string, string | number | boolean | undefined>): string {
        return Object.entries(params)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join("&");
    }

    private async extractError(response: Response) {
        try {
            const payload = await response.json();
            if (payload?.message) return payload.message as string;
            if (payload?.error) return payload.error as string;
        } catch {
            // Ignore JSON parsing issues and fall back to text.
        }

        const text = await response.text();
        return text || "Ukjent feil fra Supabase";
    }
}

export function createSupabaseClient(config: SupabaseConfig) {
    if (!config.url || !config.anonKey) return null;
    return new SupabaseRestClient(config.url, config.anonKey);
}
