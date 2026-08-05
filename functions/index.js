const {onRequest} = require("firebase-functions/v2/https");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {logger} = require("firebase-functions");

initializeApp();
const db = getFirestore();

exports.feedUpdate = onRequest(async (req, res) => {
  logger.info("Body:", req.body);

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

    if (Array.isArray(items)) {
    items = items.map(item => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
          try {
            return JSON.parse(trimmed);
          } catch (e) {
            return item;
          }
        }
      }
      return item;
    });
  }


  if (items) {
    const seen = new Set();
    items = items.filter(item => {
      let key = item;
      if (typeof item === "string") {
        const lastDot = item.lastIndexOf(".");
        key = lastDot !== -1 ? item.slice(0, lastDot).trim() : item;
      }
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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
exports.getFeed = onRequest(async (req, res) => {
  logger.info("Query:", req.query);

  if (req.method !== "GET") {
    res.status(405).send("Only GET is supported");
    return;
  }

  const feed = req.query.feed;

  if (!feed) {
    res.status(400).send("Query needs a 'feed' name, e.g. ?feed=period");
    return;
  }

  try {
    const doc = await db.collection("feeds").doc(feed).get();

    if (!doc.exists) {
      res.status(404).send("No feed found with that name");
      return;
    }

    res.status(200).json(doc.data());
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});
exports.getPendingActions = onRequest(async (req, res) => {
  logger.info("Query:", req.query);

  if (req.method !== "GET") {
    res.status(405).send("Only GET is supported");
    return;
  }

  const collectionName = req.query.collection;

  if (!collectionName) {
    res.status(400).send("Query needs a 'collection' name, e.g. ?collection=reminderActions");
    return;
  }

  try {
    const snapshot = await db.collection(collectionName)
      .where("status", "==", "pending")
      .get();

    const actions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ actions });
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

exports.updateActionStatus = onRequest(async (req, res) => {
  logger.info("Body:", req.body);

  if (req.method !== "POST") {
    res.status(405).send("Only POST is supported");
    return;
  }

  const { collection: collectionName, id, status } = req.body || {};

  if (!collectionName || !id || !status) {
    res.status(400).send("Body needs 'collection', 'id', and 'status'");
    return;
  }

  try {
    await db.collection(collectionName).doc(id).update({ status });
    res.status(200).send("OK");
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});
exports.addAction = onRequest(async (req, res) => {
  logger.info("Body:", req.body);

  if (req.method !== "POST") {
    res.status(405).send("Only POST is supported");
    return;
  }

  const { collection: collectionName, ...data } = req.body || {};

  if (!collectionName || Object.keys(data).length === 0) {
    res.status(400).send("Body needs a 'collection' name plus at least one data field");
    return;
  }

  try {
    const docRef = await db.collection(collectionName).add({
      ...data,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    res.status(200).json({ id: docRef.id });
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

