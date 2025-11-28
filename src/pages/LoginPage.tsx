/**
 * Page that renders the existing LoginModal as a modal-only route.
 * - Opens the modal by default.
 * - When the modal is closed, navigates back (navigate(-1)).
 * - When login succeeds, navigates to /quotes or /admin.
 * - If already logged in, redirects immediately.
 */
import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginModal } from "@/components/auth/LoginModal";
import { mockAuth } from "@/lib/auth-utils";
import { toast } from "sonner";
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (mockAuth.isAuthenticated()) {
      const role = mockAuth.getRole();
      toast.info('Already logged in, redirecting...');
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/quotes');
      }
    }
  }, [navigate]);
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        try {
          navigate(-1);
        } catch {
          navigate("/");
        }
      }
    },
    [navigate]
  );
  const handleLoginSuccess = useCallback(() => {
    // The modal now handles redirection, but we can navigate as a fallback.
    const role = mockAuth.getRole();
    if (role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/quotes');
    }
  }, [navigate]);
  return (
    <>
      <LoginModal open={true} onOpenChange={handleOpenChange} onLoginSuccess={handleLoginSuccess} />
    </>
  );
};
export default LoginPage;