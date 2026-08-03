const {onRequest} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {logger} = require("firebase-functions");

initializeApp();
const db = getFirestore();

exports.feedUpdate = onRequest(async (req, res) => {
  logger.info("Headers:", req.headers);
  logger.info("Body:", req.body);
  logger.info("Raw body type:", typeof req.body);
  if (req.method !== "POST") {
    res.status(405).send("Only POST is supported");
    return;
  }

const { feed } = req.body || {};
const rawItems = req.body ? req.body.items : undefined;

let items;
if (Array.isArray(rawItems)) {
  items = rawItems;
} else if (typeof rawItems === "string") {
  items = rawItems.split("\n").map(s => s.trim()).filter(Boolean);
} else {
  items = undefined;
}


  if (!feed || !Array.isArray(items)) {
    res.status(400).send("Body needs a 'feed' name and an 'items' array");
    return;
  }

  try {
    await db.collection("feeds").doc(feed).set({
      items,
      updatedAt: new Date().toISOString(),
    });
    res.status(200).send("OK");
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});