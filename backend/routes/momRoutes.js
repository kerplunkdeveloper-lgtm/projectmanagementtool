const express = require('express');
const {
  getMoms,
  getMom,
  createMom,
  updateMom,
  deleteMom,
} = require('../controllers/momController');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getMoms)
  .post(createMom);

router.route('/:id')
  .get(getMom)
  .put(updateMom)
  .delete(deleteMom);

module.exports = router;
