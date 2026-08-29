import AppShell from '@/components/AppShell';
import Navbar from '@/components/Navbar';

export default function ApplicationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <AppShell>{children}</AppShell>
    </>
  );
}
