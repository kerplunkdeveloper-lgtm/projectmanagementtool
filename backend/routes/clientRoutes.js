const express = require("express");

const router = express.Router();

const {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
} = require("../controllers/clientController");

const {
  protect,
  authorize,
} = require("../middleware/auth");


// CREATE CLIENT
router.post(
  "/",
  protect,
  authorize("admin", "operationmanager", "team", "socialmediamanager"),
  createClient
);


// GET ALL CLIENTS
router.get(
  "/",
  protect,
  authorize("admin", "operationmanager", "team", "socialmediamanager"),
  getClients
);


// GET SINGLE CLIENT
router.get(
  "/:id",
  protect,
  authorize("admin", "operationmanager", "team", "socialmediamanager"),
  getClient
);


// UPDATE CLIENT
router.put(
  "/:id",
  protect,
  authorize("admin", "operationmanager", "team", "socialmediamanager"),
  updateClient
);


// DELETE CLIENT
router.delete(
  "/:id",
  protect,
  authorize("admin", "operationmanager", "team", "socialmediamanager"),
  deleteClient
);

module.exports = router;