import { authenticatedAccount } from '@/lib/backend';
import { PageHeading } from '@/components/page-heading';
import { AccountSettings } from '@/components/account-settings';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const account = await authenticatedAccount();
  if (!account) return null;

  return (
    <>
      <PageHeading
        title="Your clubhouse settings."
        description="Choose the name your organization uses and keep your organizer account secure."
      />
      <AccountSettings
        email={account.email}
        organizationName={account.organizationName}
      />
    </>
  );
}
