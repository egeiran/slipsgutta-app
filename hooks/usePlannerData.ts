import { useCallback, useEffect, useMemo, useState } from 'react';
import { enqueueNotification } from '../lib/notifications';
import { supabase, supabaseConfig } from '../lib/supabaseClient';
import { createSupabaseClient, SupabaseRestClient } from '../lib/supabaseRest';

function getIsoWeekInfo(date: Date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);

    // ISO-week year (the year the Thursday belongs to)
    target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
    const year = target.getFullYear();

    return { weekNumber, year };
}

export type Profile = {
    id: string;
    username: string;
    display_name: string;
};

export type ShoppingItem = {
    id: number;
    title: string;
    quantity: string | null;
    priority: string;
    is_done: boolean;
    added_by: string | null;
    needed_by: string | null;
    created_at: string;
    profiles?: { username: string; display_name: string } | null;
};

export type PurchaseLog = {
    id: number;
    item_id: number;
    purchased_at: string;
    purchased_by: string | null;
    profiles?: { username: string; display_name: string } | null;
    shopping_items?: { title: string } | null;
};

export type WishlistItem = {
    id: number;
    title: string;
    why: string | null;
    proposed_by: string | null;
    price_estimate: number | null;
    status: string;
    created_at: string;
    profiles?: { username: string; display_name: string } | null;
};

export type CalendarEvent = {
    id: number;
    title: string;
    description: string | null;
    starts_at: string;
    ends_at: string | null;
    event_type: string;
    owner: string | null;
    location: string | null;
    created_at: string;
    profiles?: { username: string; display_name: string } | null;
};

export type ChoreStatus = {
    id: number;
    task: string;
    week_number: number;
    year: number;
    profile_id: string | null;
    completed: boolean;
    completed_at: string | null;
    profiles?: { username: string; display_name: string } | null;
};

type PlannerState = {
    profiles: Profile[];
    shoppingItems: ShoppingItem[];
    wishlistItems: WishlistItem[];
    calendarEvents: CalendarEvent[];
    purchaseLogs: PurchaseLog[];
    choreStatuses: ChoreStatus[];
    lastGoogleFetch: Date | null;
    loading: boolean;
    error: string | null;
    configError: string | null;
    addShoppingItem: (payload: Partial<ShoppingItem>) => Promise<void>;
    updateShoppingItem: (id: number, payload: Partial<ShoppingItem>) => Promise<void>;
    deleteShoppingItem: (id: number) => Promise<void>;
    markShoppingPurchased: (id: number, purchasedBy?: string | null) => Promise<void>;
    addWishlistItem: (payload: Partial<WishlistItem>) => Promise<void>;
    updateWishlistItem: (id: number, payload: Partial<WishlistItem>) => Promise<void>;
    deleteWishlistItem: (id: number) => Promise<void>;
    addCalendarEvent: (payload: Partial<CalendarEvent>) => Promise<void>;
    updateCalendarEvent: (id: number, payload: Partial<CalendarEvent>) => Promise<void>;
    deleteCalendarEvent: (id: number) => Promise<void>;
    markChoreDone: (task: string, profileId: string, completed?: boolean) => Promise<void>;
    refresh: () => Promise<void>;
};

export function usePlannerData(): PlannerState {
    const supabaseUrl = supabaseConfig.url;
    const anonKey = supabaseConfig.anonKey;

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [purchaseLogs, setPurchaseLogs] = useState<PurchaseLog[]>([]);
    const [choreStatuses, setChoreStatuses] = useState<ChoreStatus[]>([]);
    const [lastGoogleFetch, setLastGoogleFetch] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [configError, setConfigError] = useState<string | null>(null);

    const client = useMemo(() => {
        if (!supabaseUrl || !anonKey) return null;
        return createSupabaseClient({ url: supabaseUrl, anonKey });
    }, [anonKey, supabaseUrl]);

    const realtimeClient = supabase;

    const handleLoadError = (message: string) => {
        setError(message);
    };

    const refresh = useCallback(async () => {
        if (!client) return;

        setLoading(true);
        setError(null);

        try {
            const { weekNumber, year } = getIsoWeekInfo(new Date());
            const [
                profilesData,
                shoppingData,
                wishlistData,
                calendarData,
                purchaseLogsData,
                choreData,
                googleFetch,
            ] = await Promise.all([
                fetchProfiles(client),
                fetchShoppingItems(client),
                fetchWishlistItems(client),
                fetchCalendarEvents(client),
                fetchPurchaseLogs(client),
                fetchChoreStatuses(client, { weekNumber, year }),
                fetchLastGoogleFetch(client).catch(() => null),
            ]);

            setProfiles(profilesData);
            setShoppingItems(shoppingData);
            setWishlistItems(wishlistData);
            setCalendarEvents(calendarData);
            setPurchaseLogs(purchaseLogsData);
            setChoreStatuses(choreData);
            setLastGoogleFetch(googleFetch);
            console.log('planner data', {
                profiles: profilesData.length,
                shopping: shoppingData.length,
                wishlist: wishlistData.length,
                calendar: calendarData.length,
                purchaseLogs: purchaseLogsData.length,
                chores: choreData.length,
                error: null,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Klarte ikke å hente data';
            handleLoadError(message);
            console.log('planner data', { profiles: 0, shopping: 0, wishlist: 0, calendar: 0, purchaseLogs: 0, chores: 0, error: message });
        } finally {
            setLoading(false);
        }
    }, [client]);

    useEffect(() => {
        if (!client) {
            setConfigError(
                'Legg til EXPO_PUBLIC_SUPABASE_URL og EXPO_PUBLIC_SUPABASE_ANON_KEY i .env for å laste inn data.'
            );
            setLoading(false);
            return;
        }

        refresh();
    }, [client, refresh]);

    const authorName = useCallback(
        (id?: string | null) => profiles.find((profile) => profile.id === id)?.display_name ?? 'Noen',
        [profiles]
    );

    useEffect(() => {
        if (!realtimeClient || !client) return;

        const channel = realtimeClient.channel('planner-updates');

        const refreshWithNotification = (
            category: 'shopping' | 'wishlist' | 'calendar',
            title: string,
            body: string
        ) => {
            enqueueNotification({ category, title, body, url: '/' });
            refresh();
        };

        channel
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'shopping_items' },
                (payload) => {
                    const record = payload.new as ShoppingItem;
                    const who = authorName(record.added_by);
                    refreshWithNotification('shopping', 'Handleliste oppdatert', `${who} la til "${record.title}".`);
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'wishlist_items' },
                (payload) => {
                    const record = payload.new as WishlistItem;
                    const who = authorName(record.proposed_by);
                    refreshWithNotification(
                        'wishlist',
                        'Ønskeliste oppdatert',
                        `${who} foreslo "${record.title}".`
                    );
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'calendar_events' },
                (payload) => {
                    const record = payload.new as CalendarEvent;
                    const who = authorName(record.owner);
                    refreshWithNotification(
                        'calendar',
                        'Kalender oppdatert',
                        `${who} la til "${record.title}" i kalenderen.`
                    );
                }
            )
            .subscribe();

        return () => {
            realtimeClient.removeChannel(channel);
        };
    }, [authorName, client, realtimeClient, refresh]);

    const addShoppingItem = async (payload: Partial<ShoppingItem>) => {
        if (!client) throw new Error('Supabase mangler konfigurasjon');
        const [inserted] = await client.insert<ShoppingItem>('shopping_items', payload);
        const enriched = enrichShoppingItem(inserted, profiles);
        setShoppingItems((prev) => [enriched, ...prev]);
    };

    const updateShoppingItem = async (id: number, payload: Partial<ShoppingItem>) => {
        if (!client) throw new Error('Supabase mangler konfigurasjon');
        const [updated] = await client.update<ShoppingItem>('shopping_items', payload, { id });
        const enriched = enrichShoppingItem(updated, profiles);
        setShoppingItems((prev) => prev.map((item) => (item.id === id ? enriched : item)));
    };

    const deleteShoppingItem = async (id: number) => {
        if (!client) throw new Error('Supabase mangler konfigurasjon');
        await client.remove('shopping_items', { id });
        setShoppingItems((prev) => prev.filter((item) => item.id !== id));
    };

    const markShoppingPurchased = async (id: number, purchasedBy?: string | null) => {
        if (!client) throw new Error('Supabase mangler konfigurasjon');
        const [updated] = await client.update<ShoppingItem>('shopping_items', { is_done: true }, { id });
        setShoppingItems((prev) => prev.filter((item) => item.id !== id));

        const [log] = await client.insert<PurchaseLog>('shopping_item_logs', {
            item_id: id,
            purchased_by: purchasedBy || null,
        });
        const purchaser = profiles.find((profile) => profile.id === (purchasedBy || updated.added_by || ''));
        const enrichedLog: PurchaseLog = {
            ...log,
            shopping_items: { title: updated.title },
            profiles: purchaser ? { username: purchaser.username, display_name: purchaser.display_name } : null,
        };
        setPurchaseLogs((prev) => [enrichedLog, ...prev].slice(0, 50));
    };

    const addWishlistItem = async (payload: Partial<WishlistItem>) => {
        if (!client) throw new Error('Supabase mangler konfigurasjon');
        const [inserted] = await client.insert<WishlistItem>('wishlist_items', payload);
        const enriched = enrichWishlistItem(inserted, profiles);
        setWishlistItems((prev) => [enriched, ...prev]);
    };

    const updateWishlistItem = async (id: number, payload: Partial<WishlistItem>) => {
        if (!client) throw new Error('Supabase mangler konfigurasjon');
        const [updated] = await client.update<WishlistItem>('wishlist_items', payload, { id });
        const enriched = enrichWishlistItem(updated, profiles);
        setWishlistItems((prev) => prev.map((item) => (item.id === id ? enriched : item)));
    };

    const deleteWishlistItem = async (id: number) => {
        if (!client) throw new Error('Supabase mangler konfigurasjon');
        await client.remove('wishlist_items', { id });
        setWishlistItems((prev) => prev.filter((item) => item.id !== id));
    };

    const addCalendarEvent = async (payload: Partial<CalendarEvent>) => {
        if (!client) throw new Error('Supabase mangler konfigurasjon');
        const [inserted] = await client.insert<CalendarEvent>('calendar_events', payload);
        setCalendarEvents((prev) => [inserted, ...prev]);
    };

    const updateCalendarEvent = async (id: number, payload: Partial<CalendarEvent>) => {
        if (!client) throw new Error('Supabase mangler konfigurasjon');
        const [updated] = await client.update<CalendarEvent>('calendar_events', payload, { id });
        setCalendarEvents((prev) => prev.map((event) => (event.id === id ? updated : event)));
    };

    const deleteCalendarEvent = async (id: number) => {
        if (!client) throw new Error('Supabase mangler konfigurasjon');
        await client.remove('calendar_events', { id });
        setCalendarEvents((prev) => prev.filter((event) => event.id !== id));
    };

    const markChoreDone = async (task: string, profileId: string, completed: boolean = true) => {
        if (!client) throw new Error('Supabase mangler konfigurasjon');
        const { weekNumber, year } = getIsoWeekInfo(new Date());
        const payload = {
            task,
            week_number: weekNumber,
            year,
            profile_id: profileId,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
        };

        const [updated] = await client.update<ChoreStatus>('chore_statuses', payload, {
            task,
            week_number: weekNumber,
            year,
        });

        if (updated) {
            const enriched = enrichChoreStatus(updated, profiles);
            setChoreStatuses((prev) => upsertChore(prev, enriched));
            return;
        }

        const [inserted] = await client.insert<ChoreStatus>('chore_statuses', payload);
        const enriched = enrichChoreStatus(inserted, profiles);
        setChoreStatuses((prev) => upsertChore(prev, enriched));
    };

    return {
        profiles,
        shoppingItems,
        wishlistItems,
        calendarEvents,
        purchaseLogs,
        choreStatuses,
        lastGoogleFetch,
        loading,
        error,
        configError,
        addShoppingItem,
        updateShoppingItem,
        deleteShoppingItem,
        markShoppingPurchased,
        addWishlistItem,
        updateWishlistItem,
        deleteWishlistItem,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        markChoreDone,
        refresh,
    };
}

async function fetchProfiles(client: SupabaseRestClient) {
    return client.list<Profile>('profiles', { select: 'id,username,display_name', order: 'username.asc' });
}

async function fetchShoppingItems(client: SupabaseRestClient) {
    return client.list<ShoppingItem>('shopping_items', {
        select: 'id,title,quantity,priority,is_done,added_by,needed_by,created_at,profiles:added_by(username,display_name)',
        order: 'created_at.desc',
    });
}

async function fetchWishlistItems(client: SupabaseRestClient) {
    return client.list<WishlistItem>('wishlist_items', {
        select: 'id,title,why,proposed_by,price_estimate,status,created_at,profiles:proposed_by(username,display_name)',
        order: 'created_at.desc',
    });
}

async function fetchCalendarEvents(client: SupabaseRestClient) {
    return client.list<CalendarEvent>('calendar_events', {
        select: 'id,title,description,starts_at,ends_at,event_type,owner,location,created_at,profiles:owner(username,display_name)',
        order: 'starts_at.asc',
    });
}

export async function fetchLastGoogleFetch(client: SupabaseRestClient): Promise<Date | null> {
    const [record] = await client.list<{ accessed_at: string; user_agent: string | null }>('calendar_access_log', {
        select: 'accessed_at,user_agent',
        order: 'accessed_at.desc',
        limit: '1',
        user_agent: 'ilike.*Google*',
    });
    if (!record || typeof record.user_agent !== 'string') return null;
    return record.user_agent.includes('Google') ? new Date(record.accessed_at) : null;
}

async function fetchPurchaseLogs(client: SupabaseRestClient) {
    return client.list<PurchaseLog>('shopping_item_logs', {
        select: 'id,item_id,purchased_at,purchased_by,profiles:purchased_by(username,display_name),shopping_items:item_id(title)',
        order: 'purchased_at.desc',
        limit: '50',
    });
}

async function fetchChoreStatuses(
    client: SupabaseRestClient,
    { weekNumber, year }: { weekNumber: number; year: number }
) {
    return client.list<ChoreStatus>('chore_statuses', {
        select: 'id,task,week_number,year,profile_id,completed,completed_at,profiles:profile_id(username,display_name)',
        week_number: `eq.${weekNumber}`,
        year: `eq.${year}`,
        order: 'task.asc',
    });
}

function upsertChore(list: ChoreStatus[], status: ChoreStatus) {
    const key = `${status.task}-${status.week_number}-${status.year}`;
    const without = list.filter((item) => `${item.task}-${item.week_number}-${item.year}` !== key);
    return [status, ...without];
}

function enrichChoreStatus(status: ChoreStatus, profiles: Profile[]): ChoreStatus {
    const profile = profiles.find((p) => p.id === status.profile_id);
    if (!profile) return status;
    return {
        ...status,
        profiles: { username: profile.username, display_name: profile.display_name },
    };
}

function enrichWishlistItem(item: WishlistItem, profiles: Profile[]): WishlistItem {
    const profile = profiles.find((p) => p.id === item.proposed_by);
    if (!profile) return item;
    return {
        ...item,
        profiles: { username: profile.username, display_name: profile.display_name },
    };
}

function enrichShoppingItem(item: ShoppingItem, profiles: Profile[]): ShoppingItem {
    const profile = profiles.find((p) => p.id === item.added_by);
    if (!profile) return item;
    return {
        ...item,
        profiles: { username: profile.username, display_name: profile.display_name },
    };
}
