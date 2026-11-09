import { deletePushToken, savePushToken } from "../models/PushToken.js";
import { isPushToken, sendPushToUser } from "../services/pushService.js";

const PLATFORMS = ["android", "ios"];

const badToken = (res) =>
  res.status(400).json({ message: "A valid Expo push token is required" });

// @route POST /api/push/token  { token, platform }
export const registerToken = async (req, res) => {
  try {
    const { token, platform } = req.body;
    if (!isPushToken(token)) return badToken(res);
    await savePushToken(req.user._id, token, PLATFORMS.includes(platform) ? platform : null);
    res.status(200).json({ message: "Push token saved" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route DELETE /api/push/token  { token }  (called on logout)
export const unregisterToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!isPushToken(token)) return badToken(res);
    await deletePushToken(req.user._id, token);
    res.status(200).json({ message: "Push token removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route POST /api/push/test  (sends a test notification to your own devices)
export const sendTestPush = async (req, res) => {
  try {
    const result = await sendPushToUser(req.user._id, {
      title: "NutriScan",
      body: `Hi ${req.user.name}, push notifications are working!`,
      data: { type: "test" },
    });
    if (result.devices === 0) {
      return res.status(404).json({
        message: "No device registered. Sign in on the development build first.",
      });
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
