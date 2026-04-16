export const dynamic = 'force-dynamic';
import { getWalletSplit } from "../actions";
import WalletClient from "@/components/WalletClient";

export default async function WalletPage() {
  const split = await getWalletSplit();
  return <WalletClient splitConfig={split} />;
}
