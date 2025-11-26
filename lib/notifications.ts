import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

type NotificationPayload = {
    category: 'shopping' | 'wishlist' | 'calendar';
    title: string;
    body: string;
    url?: string;
};

let notificationQueue: NotificationPayload[] = [];
let isProcessing = false;

export async function requestPermissions() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#5460ff',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

export function enqueueNotification(payload: NotificationPayload) {
    notificationQueue.push(payload);
    processQueue();
}

async function processQueue() {
    if (isProcessing || notificationQueue.length === 0) return;

    isProcessing = true;
    const item = notificationQueue.shift();

    if (item) {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: item.title,
                    body: item.body,
                    data: { category: item.category, url: item.url },
                },
                trigger: null, // Show immediately
            });
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }

    isProcessing = false;

    // Process next item if queue has more
    if (notificationQueue.length > 0) {
        setTimeout(processQueue, 500);
    }
}
