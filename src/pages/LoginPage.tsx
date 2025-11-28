/**
 * Page that renders the existing LoginModal as a modal-only route.
 * - Opens the modal by default.
 * - When the modal is closed, navigates back (navigate(-1)).
 * - When login succeeds, navigates to /quotes.
 */
import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
/**
 * NOTE:
 * The project already includes a LoginModal component. We import it here.
 * The LoginModal is expected to accept:
 *  - open?: boolean
 *  - onOpenChange?: (open: boolean) => void
 *  - onLoginSuccess?: () => void
 *
 * If the actual prop names differ in your project, adjust the prop names accordingly.
 */
import { LoginModal } from "@/components/auth/LoginModal";
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  /**
   * Called when the modal open state changes.
   * When the modal is closed (open === false) we navigate back in history.
   */
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // navigate back to previous route
        try {
          navigate(-1);
        } catch {
          // fallback: go to home if navigate fails for any reason
          navigate("/");
        }
      }
    },
    [navigate]
  );
  /**
   * Called when login succeeds. Navigate to the quotes page.
   */
  const handleLoginSuccess = useCallback(() => {
    navigate("/quotes");
  }, [navigate]);
  return (
    <>
      {/* Render modal-only view. The modal is open by default. */}
      <LoginModal open={true} onOpenChange={handleOpenChange} onLoginSuccess={handleLoginSuccess} />
    </>
  );
};
export default LoginPage;