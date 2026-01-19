/**
 * Firebase Cloud Functions for Habit Tracker Push Notifications
 * 
 * This function runs every minute and checks for due reminders,
 * then sends push notifications via FCM.
 */

const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin
initializeApp();

const db = getFirestore();
const messaging = getMessaging();

// Set global options
setGlobalOptions({ maxInstances: 10, region: "us-central1" });

/**
 * Scheduled function that runs every minute to check for due reminders
 * and send push notifications
 */
exports.checkReminders = onSchedule("every 1 minutes", async (_event) => {
    logger.info("Checking for due reminders...");

    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMinute = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD format

    try {
        // Query all users' reminders
        const usersSnapshot = await db.collection("users").get();

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const fcmToken = userData.fcmToken;

            if (!fcmToken) {
                logger.info(`User ${userId} has no FCM token, skipping`);
                continue;
            }

            // Get user's task reminders
            const remindersDoc = await db
                .collection("users")
                .doc(userId)
                .collection("settings")
                .doc("reminders")
                .get();

            if (!remindersDoc.exists) continue;

            const remindersData = remindersDoc.data();
            const taskReminders = remindersData.taskReminders || {};
            const firedToday = remindersData.firedToday || { date: "", ids: [] };

            // Reset fired reminders if it's a new day
            if (firedToday.date !== today) {
                await remindersDoc.ref.update({
                    firedToday: { date: today, ids: [] },
                });
                firedToday.date = today;
                firedToday.ids = [];
            }

            // Check each task's reminders
            for (const [_taskId, reminders] of Object.entries(taskReminders)) {
                for (const reminder of reminders) {
                    if (!reminder.enabled) continue;
                    if (firedToday.ids.includes(reminder.id)) continue;

                    // Check if it's time for this reminder
                    if (reminder.time === currentTime) {
                        const taskName = reminder.taskName || "Your task";

                        logger.info(
                            `Sending notification to user ${userId} for task "${taskName}"`
                        );

                        // Send FCM notification
                        try {
                            await messaging.send({
                                token: fcmToken,
                                notification: {
                                    title: `🔔 ${taskName}`,
                                    body: "Time to complete your task!",
                                },
                                webpush: {
                                    notification: {
                                        icon: "/icons/icon-192.png",
                                        badge: "/icons/icon-72.png",
                                        vibrate: [100, 50, 100],
                                        requireInteraction: true,
                                        actions: [
                                            { action: "open", title: "Open App" },
                                            { action: "dismiss", title: "Dismiss" },
                                        ],
                                    },
                                    fcmOptions: {
                                        link: "/",
                                    },
                                },
                            });

                            // Mark as fired
                            firedToday.ids.push(reminder.id);
                            await remindersDoc.ref.update({
                                firedToday: firedToday,
                            });

                            logger.info(`Notification sent successfully`);
                        } catch (sendError) {
                            logger.error(`Failed to send notification: ${sendError.message}`);

                            // If token is invalid, remove it
                            if (
                                sendError.code === "messaging/invalid-registration-token" ||
                                sendError.code === "messaging/registration-token-not-registered"
                            ) {
                                await db.collection("users").doc(userId).update({
                                    fcmToken: null,
                                });
                                logger.info(`Removed invalid FCM token for user ${userId}`);
                            }
                        }
                    }
                }
            }
        }

        logger.info("Reminder check complete");
    } catch (error) {
        logger.error("Error checking reminders:", error);
    }
});

/**
 * HTTP endpoint to test notifications (for debugging)
 */
exports.testNotification = onRequest(async (req, res) => {
    const { fcmToken, title, body } = req.query;

    if (!fcmToken) {
        res.status(400).send("Missing fcmToken parameter");
        return;
    }

    try {
        await messaging.send({
            token: fcmToken,
            notification: {
                title: title || "Test Notification",
                body: body || "This is a test notification from your Habit Tracker!",
            },
            webpush: {
                notification: {
                    icon: "/icons/icon-192.png",
                },
            },
        });

        res.send("Notification sent successfully!");
    } catch (error) {
        logger.error("Test notification error:", error);
        res.status(500).send(`Error: ${error.message}`);
    }
});
