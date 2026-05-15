// routes/clientRoutes.js

const express = require("express");

const router = express.Router();

const {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
  toggleClientStatus,
} = require("../controllers/clientController");

const { protect } = require('../middleware/auth');



// CREATE CLIENT
router.post(
  "/create",
  protect,
  createClient
);



// GET ALL CLIENTS
router.get(
  "/all",
  protect,
  getClients
);



// GET SINGLE CLIENT
router.get(
  "/:id",
  protect,
  getClient
);



// UPDATE CLIENT
router.put(
  "/update/:id",
  protect,
  
  updateClient
);



// DELETE CLIENT
router.delete(
  "/delete/:id",
  protect,

  deleteClient
);





module.exports = router;