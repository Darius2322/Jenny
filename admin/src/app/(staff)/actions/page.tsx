import { requireStaff, MODERATION, ADMINS } from "@/lib/staff";
import { removeContent, userAction, announce } from "@/lib/admin-actions";

export const metadata = { title: "Action center" };

const card = "card space-y-3 p-5";
const sel = "field !min-h-[44px]";

export default async function ActionCenter() {
  const staff = await requireStaff(MODERATION);
  const isAdmin = ADMINS.includes(staff.role);
  return (
    <>
      <h1 className="text-2xl font-extrabold">Action center</h1>
      <p className="mt-1 text-sm text-muted">Do things directly. Every action here is written to the audit log with your name. Paste an ID from the Posts, Gossip or Businesses pages, or the address-bar of an item.</p>

      <form action={removeContent} className={`${card} mt-5`}>
        <h2 className="text-lg font-bold">Delete or take down content</h2>
        <p className="text-sm text-muted">Removes it from the app for everyone. Posts and comments notify their author. Gossip authors are never looked up.</p>
        <select name="kind" className={sel} defaultValue="post">
          <option value="post">Post</option><option value="comment">Comment</option><option value="gossip">Gossip post</option>
          <option value="gossip_group">Gossip group (close)</option><option value="business">Business (suspend)</option><option value="ad">Ad (end)</option>
        </select>
        <input name="id" required placeholder="Item ID (UUID)" className={sel} />
        <input name="note" maxLength={500} placeholder="Reason (kept in the audit log)" className={sel} />
        <button className="btn btn-primary">Take down</button>
      </form>

      <form action={userAction} className={`${card} mt-4`}>
        <h2 className="text-lg font-bold">Act on a user</h2>
        <input name="username" required placeholder="@username" className={sel} />
        <select name="action" className={sel} defaultValue="suspend">
          <option value="suspend">Suspend account</option>
          <option value="clear_dating">Clear dating profile</option>
          {isAdmin && <><option value="reinstate">Reinstate account</option><option value="force_signout">Sign out everywhere</option></>}
        </select>
        <input name="note" maxLength={500} placeholder="Reason" className={sel} />
        <button className="btn btn-primary">Apply</button>
        <p className="text-xs text-muted">Staff accounts and your own account can&apos;t be changed here.</p>
      </form>

      {isAdmin && (
        <form action={announce} className={`${card} mt-4`}>
          <h2 className="text-lg font-bold">Announcement to everyone</h2>
          <p className="text-sm text-muted">Sends a notification to every active member. Use sparingly.</p>
          <input name="message" required minLength={5} maxLength={200} placeholder="Message (max 200 characters)" className={sel} />
          <button className="btn btn-primary">Send to all</button>
        </form>
      )}
    </>
  );
}
