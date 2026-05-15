// controllers/clientController.js

const Client = require("../models/Client");



// ==========================================
// CREATE CLIENT
// ==========================================

exports.createClient = async (
  req,
  res
) => {
  try {
    const {
      companyName,
      industry,
      primaryContact,
      email,
      services,
      healthStatus,
      notes,
    } = req.body;

    if (
      !companyName ||
      !industry ||
      !primaryContact
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please fill all required fields",
      });
    }

    const client =
      await Client.create({
        companyName,
        industry,
        primaryContact,
        email,
        services,
        healthStatus,
        notes,
        createdBy: req.user.id,
      });

    res.status(201).json({
      success: true,
      message:
        "Client created successfully",
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ==========================================
// GET ALL CLIENTS
// ==========================================

exports.getClients = async (
  req,
  res
) => {
  try {
    const clients =
      await Client.find()
        .populate(
          "createdBy",
          "name email"
        )
        .sort({
          createdAt: -1,
        });

    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ==========================================
// GET SINGLE CLIENT
// ==========================================

exports.getClient = async (
  req,
  res
) => {
  try {
    const client =
      await Client.findById(
        req.params.id
      );

    if (!client) {
      return res.status(404).json({
        success: false,
        message:
          "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ==========================================
// UPDATE CLIENT
// ==========================================

exports.updateClient = async (
  req,
  res
) => {
  try {
    const client =
      await Client.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!client) {
      return res.status(404).json({
        success: false,
        message:
          "Client not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Client updated successfully",
      data: client,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



// ==========================================
// DELETE CLIENT
// ==========================================

exports.deleteClient = async (
  req,
  res
) => {
  try {
    const client =
      await Client.findById(
        req.params.id
      );

    if (!client) {
      return res.status(404).json({
        success: false,
        message:
          "Client not found",
      });
    }

    await client.deleteOne();

    res.status(200).json({
      success: true,
      message:
        "Client deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



