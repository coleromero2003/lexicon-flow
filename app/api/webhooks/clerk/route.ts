import { headers } from "next/headers";
import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { sendUserAddedEmail } from "@/lib/email/email-service";

export async function POST(req: Request) {
  // Get the webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env"
    );
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred - no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "organizationMembership.created") {
    const { organization, public_user_data } = evt.data;

    if (!organization || !public_user_data) {
      console.error("Missing organization or user data in webhook payload");
      return new Response("Invalid webhook payload", { status: 400 });
    }

    console.log(`User ${public_user_data.user_id} added to organization ${organization.id}`);

    try {
      // Get user details
      const userEmail = public_user_data.identifier;
      const userName =
        public_user_data.first_name && public_user_data.last_name
          ? `${public_user_data.first_name} ${public_user_data.last_name}`
          : userEmail;

      // Get organization name
      const organizationName = organization.name;

      // For the inviter name, we could fetch the user who invited them,
      // but for now we'll use the organization name
      const inviterName = "your administrator";

      // Send welcome email
      const result = await sendUserAddedEmail({
        userEmail,
        userName,
        organizationName,
        inviterName,
      });

      if (!result.success) {
        console.error("Failed to send welcome email:", result.error);
        // Don't fail the webhook, just log the error
      } else {
        console.log(`Welcome email sent to ${userEmail}`);
      }
    } catch (error) {
      console.error("Error sending welcome email:", error);
      // Don't fail the webhook, just log the error
    }
  } else if (eventType === "organization.deleted") {
    const { id: orgId } = evt.data;

    console.log(`Organization deleted: ${orgId}`);

    // Create Supabase service role client to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return new Response("Server configuration error", { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    try {
      // Call the database function to clean up organization data
      const { error } = await supabase.rpc("cleanup_organization_data", {
        target_org_id: orgId,
      });

      if (error) {
        console.error("Error cleaning up organization data:", error);
        return new Response("Error cleaning up data", { status: 500 });
      }

      console.log(`Successfully cleaned up data for organization: ${orgId}`);
    } catch (error) {
      console.error("Error in cleanup process:", error);
      return new Response("Error in cleanup process", { status: 500 });
    }
  }

  return new Response("", { status: 200 });
}
