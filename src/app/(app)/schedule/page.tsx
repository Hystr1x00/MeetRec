import { redirect } from "next/navigation";

// /schedule now redirects to /bots (Recall.ai flow)
export default function ScheduleRedirect() {
    redirect("/bots");
}
