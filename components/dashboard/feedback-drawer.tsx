"use client";

import { useState } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitFeedbackAction } from "@/app/actions/feedback";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function FeedbackDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const pathname = usePathname();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setStatus("idle");

    const formData = new FormData();
    formData.append("message", message);
    formData.append("url", window.location.origin + pathname);

    try {
      const result = await submitFeedbackAction(formData);
      console.log("Feedback result:", result);
      
      if (result.success) {
        setStatus("success");
        setMessage("");
        // Close after a brief delay on success
        setTimeout(() => {
          setIsOpen(false);
          setStatus("idle");
        }, 2000);
      } else {
        setStatus("error");
        alert("Error from server: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Feedback submit error:", err);
      setStatus("error");
      alert("Client-side error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-12 w-12 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center p-0",
          isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-primary hover:bg-primary/90"
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>

      {/* Drawer */}
      <div
        className={cn(
          "absolute bottom-16 right-0 w-[320px] sm:w-[380px] rounded-xl border bg-background p-4 shadow-2xl transition-all duration-300 ease-in-out",
          isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95 pointer-events-none"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Share Feedback</h3>
          <span className="text-xs text-muted-foreground">Directly to Slack</span>
        </div>

        {status === "success" ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="mb-3 rounded-full bg-green-100 p-3 text-green-600">
              <Send className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium">Thank you! Your feedback has been sent.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What can we improve? Encountered a bug?"
                className="min-h-[120px] w-full resize-none rounded-lg border bg-muted/50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={isSubmitting}
                required
              />
            </div>

            {status === "error" && (
              <p className="text-xs text-red-500">Failed to send. Please try again.</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !message.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Feedback
                </>
              )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
              Your message, name, and current page URL will be sent to our support channel.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
