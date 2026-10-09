import { Router } from "express";
import {
  listParticipants,
  getParticipant,
  createParticipant,
  updateParticipant,
  deleteParticipant,
  getDashboard,
  health,
} from "../controllers/participantController.js";

const router = Router();

router.get("/health", health);
router.get("/dashboard", getDashboard);
router.get("/participants", listParticipants);
router.get("/participants/:id", getParticipant);
router.post("/participants", createParticipant);
router.put("/participants/:id", updateParticipant);
router.delete("/participants/:id", deleteParticipant);

export default router;
