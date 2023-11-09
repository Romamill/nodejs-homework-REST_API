
const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");
const usersController = require("../../controllers/usersController");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 },
});

router.post("/register", usersController.registerUser);
router.post("/login", usersController.loginUser);
router.post("/logout", authMiddleware, usersController.logoutUser);
router.get("/current", authMiddleware, usersController.getCurrentUser);
router.patch(
  "/avatars",
  authMiddleware,
  upload.single("avatar"),
  usersController.updateUserAvatar
);

module.exports = router;
