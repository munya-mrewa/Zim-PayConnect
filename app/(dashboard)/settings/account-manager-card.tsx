import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@prisma/client";
import { Mail } from "lucide-react";

export function AccountManagerCard({ manager }: { manager: User }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dedicated Account Manager</CardTitle>
        <CardDescription>
          Your personal point of contact for priority support and account management.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={`https://avatar.vercel.sh/${manager.email}`} alt={manager.fullName || "Manager"} />
          <AvatarFallback>{manager.fullName?.charAt(0) || "M"}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h4 className="text-lg font-semibold">{manager.fullName || "Support Agent"}</h4>
          <div className="flex items-center text-sm text-muted-foreground">
            <Mail className="mr-2 h-4 w-4" />
            <a href={`mailto:${manager.email}`} className="hover:underline">
              {manager.email}
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
