import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Keep the adapter deliberately minimal. The application does not need a
// Cloudflare-specific cache, database, or storage binding; readers can add
// those after the deploy button creates a repository in their own account.
export default defineCloudflareConfig();
