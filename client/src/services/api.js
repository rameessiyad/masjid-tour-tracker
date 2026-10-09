import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 20000, // generous: a sleeping Neon / free host can take a few seconds to wake
});

// Turn any failure into an Error with a readable message (and field errors, if any).
function toError(err) {
  if (axios.isCancel(err)) return err;
  const data = err.response?.data;
  const e = new Error(
    data?.message ||
      (err.code === "ECONNABORTED"
        ? "The server took too long to respond. Please try again."
        : err.response
        ? "Unexpected server response"
        : "Cannot reach the server. Check your connection.")
  );
  e.fieldErrors = data?.errors || null;
  e.canceled = false;
  return e;
}

// Unwrap { success, data } and reject malformed responses.
async function call(promise) {
  try {
    const res = await promise;
    if (!res.data || res.data.success !== true || !("data" in res.data)) {
      throw new Error("Invalid response from server");
    }
    return res.data.data;
  } catch (err) {
    throw toError(err);
  }
}

export const getParticipants = (signal) => call(client.get("/participants", { signal }));
export const getDashboard = (signal) => call(client.get("/dashboard", { signal }));
export const createParticipant = (body) => call(client.post("/participants", body));
export const updateParticipant = (id, body) => call(client.put(`/participants/${id}`, body));
export const deleteParticipant = (id) => call(client.delete(`/participants/${id}`));
