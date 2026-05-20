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
  authorize("admin"),
  createClient
);


// GET ALL CLIENTS
router.get(
  "/",
  protect,
  authorize("admin"),
  getClients
);


// GET SINGLE CLIENT
router.get(
  "/:id",
  protect,
  authorize("admin"),
  getClient
);


// UPDATE CLIENT
router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateClient
);


// DELETE CLIENT
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteClient
);

module.exports = router;