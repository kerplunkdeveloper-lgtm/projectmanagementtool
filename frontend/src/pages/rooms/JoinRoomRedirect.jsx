import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { PENDING_CODE_KEY, effectiveRolePath } from "./roomUtils";

/**
 * Handles invite links: /rooms/join#code=XXXX-XXXX-XXXX
 * The code lives in the URL fragment (never sent to servers). It's kept in
 * sessionStorage for this tab only, then the Rooms page joins with it via the
 * authenticated API. Signed-out users are sent to login first.
 */
const JoinRoomRedirect = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const code = params.get("code");
    // Remove the code from the address bar / history right away
    window.history.replaceState(null, "", window.location.pathname);
    if (code) {
      try {
        sessionStorage.setItem(PENDING_CODE_KEY, code.slice(0, 20));
      } catch {
        /* storage blocked: user can paste the code manually */
      }
    }
    if (user) {
      navigate(`${effectiveRolePath(user)}/rooms`, { replace: true });
    } else {
      toast("Sign in to Sorted to join the room.");
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  return null;
};

export default JoinRoomRedirect;
