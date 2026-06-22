import { useLocalSearchParams } from "expo-router";
import { RoutePlaceholder } from "../../../components/RoutePlaceholder";

export default function PremiumPaymentEventScreen() {
  const { eventId } = useLocalSearchParams();
  return <RoutePlaceholder title={`Premium Payment ${eventId || ""}`} description="Premium payment route placeholder." />;
}
