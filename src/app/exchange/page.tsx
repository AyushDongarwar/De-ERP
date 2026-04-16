export const dynamic = 'force-dynamic';
import { getTransactions } from "../actions";
import ExchangeClient from "@/components/ExchangeClient";

export default async function ExchangePage() {
  return <ExchangeClient />;
}
